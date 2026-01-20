import { Box, VStack, Spinner, Text } from '@chakra-ui/react';

/**
 * Professional loading screen component for initial app load and PWA installation
 * Displays the PAYZHE logo with a smooth loading animation
 */
export default function LoadingScreen() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoadingScreen.tsx:8',message:'LoadingScreen component rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .loading-screen {
          animation: fadeIn 0.5s ease-in;
        }
        .logo-container {
          animation: fadeIn 0.8s ease-in;
        }
        .spinner-container {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
        className="loading-screen"
      >
        <VStack gap={8} align="center">
          {/* Logo */}
          <Box className="logo-container">
            <img
              src="/logo.png"
              alt="PAYZHE Logo"
              style={{
                maxWidth: 'min(300px, 60vw)',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>

          {/* Loading Spinner */}
          <VStack gap={4} align="center" className="spinner-container">
            <Spinner
              size="xl"
              colorPalette="red"
              style={{
                animation: 'spin 1s linear infinite',
                borderWidth: '4px',
              }}
            />
            <Text
              color="gray.600"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="medium"
            >
              Loading...
            </Text>
          </VStack>
        </VStack>
      </Box>
    </>
  );
}
