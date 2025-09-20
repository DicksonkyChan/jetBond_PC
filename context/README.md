# JetBond Windows Backend

A Windows-native Node.js backend API for the JetBond gig marketplace platform.

## Overview

This is the Windows backend server for JetBond, providing REST APIs for the Flutter mobile app frontend. Handles job matching, user management, and real-time features.

## Features

- **REST API**: Complete job and user management
- **AI Matching**: DeepSeek integration with semantic similarity
- **Real-time Updates**: WebSocket support with live notifications
- **Response Window**: 5-minute timer system for job responses
- **Bilingual Support**: Chinese-English cross-language matching
- **Rating System**: 3-tier mutual rating system
- **Windows Native**: Optimized for Windows development
- **Easy Setup**: Batch scripts for quick deployment

## Tech Stack

### Backend (This Project)
- **Node.js** with Express.js
- **AWS SDK** for cloud integration
- **DynamoDB** for data storage
- **Windows Batch Scripts** for automation

### Frontend
- **Flutter** mobile app (separate project)
- **REST API** integration
- **Cross-platform** (iOS/Android)

## Quick Start

### Prerequisites
- Node.js 16+ installed on Windows
- npm (comes with Node.js)

### Setup & Run

1. **Quick Setup**:
   ```cmd
   setup.bat
   ```

2. **Start Server**:
   ```cmd
   start.bat
   ```

3. **Test API**:
   - Open http://localhost:8080/test
   - Or open `web-test.html` in browser

## Project Structure

```
jetBond_PC/
├── server.js              # Main API server
├── matching-service.js    # Job matching logic
├── deepseek-service.js    # AI integration
├── test-api.js           # API testing
├── web-test.html         # Web test interface
├── setup.bat             # Windows setup
├── start.bat             # Windows startup
└── package.json          # Dependencies
```

## API Endpoints

### Core Endpoints
- `GET /test` - Health check
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `POST /jobs` - Create new job
- `GET /jobs` - List available jobs

### Enhanced Matching
- `POST /jobs/:id/matches` - AI-powered job matching
- `POST /jobs/:id/respond` - Respond to job (starts response window)
- `POST /jobs/:id/select` - Select employee from responses
- `POST /jobs/:id/rate` - Submit mutual ratings

### WebSocket Events
- `job_match` - New job match notification
- `job_response` - Employee response notification
- `selection_result` - Job selection outcome

## Development

- **Start**: `npm start` or `start.bat`
- **Dev Mode**: `npm run dev`
- **Test**: `npm test`
- **Enhanced Test**: `node test-enhanced-api.js`

## Configuration

1. Copy `.env.example` to `.env`
2. Add your AWS credentials
3. Add DeepSeek API key for AI matching
4. Configure DynamoDB table names

## Enhanced Features

See `ENHANCED_FEATURES.md` for detailed documentation on:
- AI-powered matching with DeepSeek
- Real-time WebSocket communication
- Response window system
- Push notifications
- Rating system

## Windows Scripts

- `setup.bat` - Install dependencies
- `start.bat` - Start the server
- Windows-optimized paths and commands

See `README-WINDOWS.md` for detailed Windows setup instructions.