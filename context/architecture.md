# JetBond Architecture - DeepSeek Powered Matching

## System Overview
Real-time gig marketplace with AI-powered bilingual job matching using DeepSeek embeddings.

## Tech Stack
- **Frontend**: Flutter (Complete UI)
- **Backend**: Node.js + AWS App Runner
- **Database**: DynamoDB
- **AI Matching**: DeepSeek API for embeddings
- **Real-time**: WebSocket API Gateway
- **Notifications**: AWS SNS

## Core Components

### 1. Matching Engine (DeepSeek-powered)
```
Job Posted → Generate Embedding → Find Similar Profiles → Rank & Notify Top 10
```

### 2. Response Window System
```
First Response → Start 5min Timer → Collect Responses → Close at 5 people OR timeout
```

### 3. Data Models

#### User Profile
```json
{
  "userId": "uuid",
  "type": "employee|employer", 
  "name": "string",
  "jobDescription": "餐廳服務員，有咖啡經驗", // Free text, any language
  "preferredDistricts": ["Central", "TST"],
  "hourlyRateRange": {"min": 80, "max": 150},
  "embedding": [0.1, 0.2, ...], // DeepSeek generated
  "ratings": {"good": 15, "neutral": 2, "bad": 0},
  "isActive": true
}
```

#### Job Post
```json
{
  "jobId": "uuid",
  "employerId": "uuid",
  "title": "急需侍應",
  "description": "繁忙餐廳需要有經驗服務員",
  "district": "Central",
  "hourlyRate": 120,
  "embedding": [0.3, 0.1, ...], // DeepSeek generated
  "status": "matching|closed|completed",
  "createdAt": "timestamp",
  "matchingWindow": {
    "isOpen": true,
    "firstResponseAt": null,
    "responses": []
  }
}
```

#### Match Response
```json
{
  "responseId": "uuid",
  "jobId": "uuid", 
  "employeeId": "uuid",
  "respondedAt": "timestamp",
  "status": "pending|selected|rejected"
}
```

## AWS Architecture

### Lambda Functions
- `generateEmbedding` - DeepSeek API calls
- `findMatches` - Similarity calculation
- `handleJobPost` - New job processing
- `handleResponse` - Employee response processing
- `closeMatchingWindow` - Timer-based closure
- `sendNotifications` - Push notifications

### DynamoDB Tables
- `Users` - Employee/Employer profiles
- `Jobs` - Job postings
- `Matches` - Response tracking
- `Embeddings` - Cached embeddings (reduce API calls)

### Real-time Flow
```
Mobile App ↔ WebSocket API ↔ Lambda ↔ DynamoDB
                ↓
            SNS Push Notifications
```

## Matching Algorithm Details

### Similarity Calculation
```javascript
function calculateSimilarity(jobEmbedding, profileEmbedding) {
  // Cosine similarity between DeepSeek embeddings
  return cosineSimilarity(jobEmbedding, profileEmbedding);
}
```

### Scoring System (0-100)
- **Semantic Match** (50 points): DeepSeek embedding similarity
- **District Match** (30 points): Exact district preference
- **Rate Compatibility** (20 points): Job rate within employee range

### Filtering
- Minimum similarity threshold: 0.6
- Rating filter: <30% bad ratings
- Active users only

## API Endpoints

### REST APIs
- `POST /jobs` - Create job posting
- `POST /jobs/{id}/respond` - Employee response
- `GET /jobs/{id}/responses` - Get responses for employer
- `POST /users/profile` - Update profile
- `POST /ratings` - Submit rating

### WebSocket Events
- `job_posted` - New job notification
- `response_received` - Real-time response updates
- `window_closed` - Matching window closure

## DeepSeek Integration

### Embedding Generation
```javascript
async function generateEmbedding(text) {
  const response = await fetch('https://api.deepseek.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-embedding',
      input: text
    })
  });
  return response.data.embedding;
}
```

### Caching Strategy
- Cache embeddings in DynamoDB
- TTL: 30 days for profiles, 7 days for jobs
- Regenerate on profile updates

## Implementation Status

### Phase 1-4: Complete ✅
- [x] Flutter frontend with 8 screens
- [x] Authentication UI (login/register)
- [x] Employee/Employer dashboards
- [x] Job posting and viewing
- [x] Chat interface design
- [x] Profile management
- [x] Bilingual support (English/Chinese)
- [x] App Runner backend deployment
- [x] DynamoDB integration
- [x] Job management API

### Phase 5: Advanced Features 🚧
- [ ] DeepSeek AI matching
- [ ] WebSocket real-time features
- [ ] Push notifications
- [ ] Live location tracking
- [ ] Response window timer

## Deployment Strategy
1. **Infrastructure**: AWS App Runner + DynamoDB
2. **CI/CD**: GitHub → App Runner auto-deploy
3. **Environment**: Production ready
4. **Monitoring**: CloudWatch logs

## Security
- API Gateway rate limiting
- DeepSeek API key in AWS Secrets Manager
- User authentication via AWS Cognito
- Data encryption at rest and in transit