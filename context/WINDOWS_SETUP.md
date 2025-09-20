# JetBond Windows Setup Guide

Complete setup instructions for running JetBond backend on Windows.

## Prerequisites

1. **Node.js 16+**
   - Download from https://nodejs.org/
   - Choose LTS version
   - Ensure "Add to PATH" is checked during installation

2. **Git** (optional)
   - Download from https://git-scm.com/
   - For version control

## Installation

### Option 1: Automated Setup
```cmd
cd C:\Users\dicks\source\repo\jetBond_PC
setup.bat
```

### Option 2: Manual Setup
```cmd
cd C:\Users\dicks\source\repo\jetBond_PC
npm install
```

## Running the Server

### Start Server
```cmd
start.bat
```
Or:
```cmd
npm start
```

### Development Mode (with auto-restart)
```cmd
npm run dev
```

## Testing

1. **API Health Check**:
   - Open browser: http://localhost:8080/test

2. **Web Test Interface**:
   - Open `web-test.html` in browser

3. **Command Line Test**:
   ```cmd
   npm test
   ```

## Configuration

### Environment Variables (optional)
Create `.env` file:
```
PORT=8080
DYNAMODB_USERS_TABLE=jetbond-users
DYNAMODB_JOBS_TABLE=jetbond-jobs
AWS_REGION=ap-southeast-1
```

### AWS Configuration (for production)
```cmd
aws configure
```

## Troubleshooting

### Node.js Not Found
- Reinstall Node.js with "Add to PATH" checked
- Restart Command Prompt

### Port Already in Use
- Change PORT in `.env` file
- Or kill process using port 8080

### Dependencies Failed
- Delete `node_modules` folder
- Run `npm install` again

## Windows-Specific Features

- Batch scripts for easy operation
- Windows path handling
- PowerShell integration ready
- Windows service compatibility

## Development Tools

Recommended VS Code extensions:
- Node.js Extension Pack
- REST Client
- Thunder Client (API testing)

## Next Steps

1. Configure AWS credentials for production
2. Set up DynamoDB tables
3. Deploy to AWS App Runner
4. Connect frontend client