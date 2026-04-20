# Frontend

This folder contains the Vite + React frontend for the Iffy Collections application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project structure

- `src/main.jsx` - app entry point
- `src/App.jsx` - main app component
- `src/pages/` - page views
- `src/components/` - reusable UI components
- `src/context/` - auth context provider
- `src/utils/` - API and helper utilities

## Notes

- Configure environment variables in `.env` if required.
- The frontend expects the backend API to be available for auth, inventory, and sales features.
