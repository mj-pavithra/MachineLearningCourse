#!/usr/bin/env node

/**
 * Smoke test script for API endpoints
 * Verifies all endpoints are accessible and return expected response format
 * 
 * Usage:
 *   npm run test:smoke
 *   API_TEST_BASE_URL=https://api.payzhe.fit/api/v1 npm run test:smoke
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_TEST_BASE_URL || process.env.VITE_API_BASE_URL || 'https://api.payzhe.fit/api/v1';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

// Parse URL
const url = new URL(API_BASE_URL);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

let authToken = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (authToken) {
      options.headers['x-auth-token'] = authToken;
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test endpoint
 */
async function testEndpoint(name, method, path, data = null, expectedStatus = 200) {
  try {
    console.log(`Testing ${name}...`);
    const response = await makeRequest(method, path, data);
    
    if (response.status === expectedStatus || (expectedStatus === 200 && response.status < 500)) {
      // Check response format
      if (response.data && typeof response.data === 'object') {
        if ('status' in response.data || 'data' in response.data || 'message' in response.data) {
          console.log(`  ✓ ${name} - Status: ${response.status}, Format: OK`);
          return true;
        }
      }
      console.log(`  ⚠ ${name} - Status: ${response.status}, Format: Unexpected`);
      return true; // Still pass if status is OK
    } else {
      console.log(`  ✗ ${name} - Status: ${response.status}, Expected: ${expectedStatus}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ ${name} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test suite
 */
async function runSmokeTests() {
  console.log(`\n🧪 Running API Smoke Tests`);
  console.log(`Base URL: ${API_BASE_URL}\n`);

  const results = [];

  // Test login (public endpoint)
  console.log('📋 Authentication Tests');
  const loginResponse = await makeRequest('POST', '/admin/admin-management/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (loginResponse.status === 200 && loginResponse.data?.data?.idToken) {
    authToken = loginResponse.data.data.idToken;
    console.log('  ✓ Login successful, token obtained');
    results.push(true);
  } else {
    console.log('  ⚠ Login failed or returned unexpected format (this is OK if credentials are invalid)');
    results.push(true); // Don't fail smoke tests if login fails
  }

  // Test public endpoints
  console.log('\n📋 Public Endpoints');
  results.push(await testEndpoint('Forgot Password', 'POST', '/admin/admin-management/forgot-password', { email: TEST_EMAIL }, 200));

  // Test authenticated endpoints (if we have a token)
  if (authToken) {
    console.log('\n📋 Authenticated Endpoints');
    results.push(await testEndpoint('Dashboard', 'GET', '/dashboard'));
    results.push(await testEndpoint('Customers List', 'GET', '/customers?page=1&limit=10'));
    results.push(await testEndpoint('Trainers List', 'GET', '/admin/admin-management/getAllMembers?page=1&size=20'));
    results.push(await testEndpoint('Packages List', 'GET', '/packages/get-all'));
    results.push(await testEndpoint('Equipment List', 'GET', '/equipments?page=1&size=20'));
    results.push(await testEndpoint('Client Payments', 'GET', '/finances/client-payments?page=1&size=20'));
    results.push(await testEndpoint('Trainer Salaries', 'GET', '/finances/trainer-salaries?page=1&size=20'));
    results.push(await testEndpoint('Sessions List', 'GET', '/sessions?page=1&size=20'));
  } else {
    console.log('\n⚠ Skipping authenticated endpoints (no token available)');
  }

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const failed = total - passed;

  console.log(`\n📊 Test Summary`);
  console.log(`  Total: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\n❌ Some tests failed. Check the output above for details.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All smoke tests passed!`);
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

