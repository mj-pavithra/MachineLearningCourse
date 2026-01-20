# PayZhe Frontend (Vite)

Modern React + Vite frontend for PayZhe with TypeScript, Chakra UI, and comprehensive feature set.

## Features

- 🏋️ Customer Management (Individual & Group)
- 👨‍🏫 Trainer Management
- 📦 Package Management
- 🏋️ Equipment Management
- 💰 Financial Management (Client Payments & Trainer Salaries)
- 📅 Session & Attendance Tracking
- 🔐 Multi-tenant Security with JWT Authentication
- 📱 Responsive Design (Mobile-first)

## Tech Stack

- **React 18+** with TypeScript
- **Vite 7+** for build tooling
- **Chakra UI v3** for UI components
- **React Router v6** for routing
- **Zustand** for state management
- **Axios** for API calls
- **React Hook Form + Zod** for form validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API base URL
```

### Development

```bash
npm run dev
```

App runs on `http://localhost:3000`

### Build

```bash
npm run build
```

Outputs to `dist/` folder.

### Deployment

```bash
# Build the app
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (route-level)
├── layouts/       # Layout components (AuthLayout, AppLayout)
├── routes/        # React Router configuration
├── contexts/      # React Context providers
├── stores/        # Zustand stores
├── services/      # API services and cache utilities
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: https://api.payzhe.fit/api/v1)
- `VITE_APP_NAME` - Application name
- `VITE_ENABLE_DEV_TOOLS` - Enable development tools

## Authentication

The app uses JWT authentication with access and refresh tokens. Tokens are stored in localStorage and automatically refreshed on 401 errors.

## Multi-Tenancy

All data is isolated by `gymId` extracted from JWT tokens. Cache keys include `gymId` to enforce data separation.

## License

Private


