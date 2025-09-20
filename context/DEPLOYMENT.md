# JetBond Backend Deployment Guide

## Phase 3: Backend Integration Setup

### Prerequisites
- AWS CLI configured with credentials
- Node.js installed in WSL
- Serverless Framework

### 1. Open WSL Terminal

```bash
# Open WSL terminal (not Windows CMD)
# Navigate to project directory
cd /home/dichan/jetBond
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install serverless globally
npm install -g serverless
```

### 3. Configure AWS Credentials (in WSL)

```bash
# Configure AWS CLI (if not done)
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (ap-southeast-1)

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-southeast-1
```

### 4. Deploy Backend (in WSL)

```bash
# Deploy to AWS (creates DynamoDB tables and Lambda functions)
serverless deploy

# Note the API Gateway URL from output
# Example: https://abc123.execute-api.ap-southeast-1.amazonaws.com/dev
```

### 5. Update Frontend Configuration

```bash
# Update JetBondMobile/.env with deployed API URL
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/dev
```

### 6. Test Local Development (in WSL)

```bash
# Test backend functions locally first
node test-api.js

# Run backend locally (optional)
serverless offline

# Start React Native app (in separate WSL terminal)
cd JetBondMobile
npx expo start
```

## API Endpoints

### User Management
- `POST /users` - Create user profile
- `GET /users/{id}` - Get user profile  
- `PUT /users/{id}` - Update user profile

### Job Management
- `POST /jobs` - Create job posting
- `GET /jobs` - List available jobs
- `GET /jobs?district=Central` - Filter jobs by district
- `GET /jobs/{id}` - Get specific job

### Matching System
- `POST /jobs/{id}/matches` - Find employee matches for job
- `POST /jobs/{id}/respond` - Employee respond to job

## Database Tables Created

1. **Users Table**: User profiles (employee/employer)
2. **Jobs Table**: Job postings with district index
3. **Matches Table**: Job responses and selections

## Next Steps

1. Connect frontend forms to backend APIs
2. Implement user authentication
3. Add WebSocket for real-time features
4. Integrate DeepSeek AI for better matching

## Troubleshooting

### Common Issues
- **Permission denied**: Check AWS credentials in WSL
- **Table not found**: Ensure deployment completed successfully
- **CORS errors**: API Gateway CORS is configured in serverless.yml
- **UNC path errors**: Always use WSL terminal, not Windows CMD

### Useful WSL Commands
```bash
# View logs (in WSL)
serverless logs -f createUser

# Remove deployment (in WSL)
serverless remove

# Deploy single function (in WSL)
serverless deploy -f createUser

# Check if running in WSL
echo $WSL_DISTRO_NAME

# Navigate to project (WSL path)
cd /home/dichan/jetBond
```

### WSL vs Windows CMD Issue
- **Problem**: Windows CMD cannot handle UNC paths like `\\wsl.localhost\Ubuntu\home\dichan\jetBond`
- **Solution**: Always use WSL terminal for all backend operations
- **WSL Terminal**: Access via Windows Terminal → Ubuntu tab
- **Project Path**: `/home/dichan/jetBond` (not Windows UNC path)