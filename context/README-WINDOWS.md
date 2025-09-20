# JetBond Windows Backend

A Windows-native Node.js backend API for the JetBond platform.

## Prerequisites

- Node.js 16+ installed on Windows
- npm (comes with Node.js)

## Quick Setup

1. **Automated Setup**:
   ```cmd
   setup.bat
   ```

2. **Manual Setup**:
   ```cmd
   npm install
   ```

## Running the Server

1. **Start Server**:
   ```cmd
   start.bat
   ```
   Or:
   ```cmd
   npm start
   ```

2. **Development Mode**:
   ```cmd
   npm run dev
   ```

## Testing

- **API Test**: `npm test`
- **Web Interface**: Open `web-test.html` in browser
- **Test Endpoint**: http://localhost:8080/test

## API Endpoints

- `GET /test` - Health check
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `POST /jobs` - Create job
- `GET /jobs` - List jobs
- `POST /jobs/:id/matches` - Find matches
- `POST /jobs/:id/respond` - Respond to job

## Windows-Specific Features

- Batch scripts for easy setup and startup
- Windows path handling
- PowerShell integration support
- Windows service compatibility

## Project Structure

```
jetBond_PC/
├── server.js              # Main server file
├── matching-service.js    # Matching logic
├── deepseek-service.js    # AI service
├── test-api.js           # API tests
├── web-test.html         # Web test interface
├── setup.bat             # Windows setup script
├── start.bat             # Windows start script
└── package.json          # Dependencies
```