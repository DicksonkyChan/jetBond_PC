# JetBond Data Storage Decisions

## Database Choice: AWS DynamoDB

### Selected Technology
- **Primary Database**: AWS DynamoDB (NoSQL)
- **Architecture**: Serverless, auto-scaling
- **Integration**: Native AWS ecosystem compatibility

### Rationale for DynamoDB

#### ✅ Advantages
- **Serverless**: No database management overhead
- **Auto-scaling**: Handles traffic spikes automatically
- **AWS Integration**: Works seamlessly with Lambda, SNS, API Gateway
- **JSON Structure**: Flexible schema for rapid development
- **Performance**: Low latency for real-time matching
- **Cost-effective**: Pay-per-use model suitable for startup

#### ❌ Limitations
- **No SQL**: Cannot run complex analytical queries
- **Limited Aggregation**: No GROUP BY, JOIN operations
- **Export Required**: Need to move data elsewhere for deep analysis

## Data Models

### Users Table
```json
{
  "userId": "uuid",
  "profiles": {
    "employee": {
      "name": "John Doe",
      "jobDescription": "餐廳服務員，有咖啡經驗",
      "preferredDistricts": ["Central", "TST"],
      "hourlyRateRange": {"min": 80, "max": 150},
      "durationPreferences": {
        "minHours": 2,
        "maxHours": 8,
        "preferredHours": 4
      },
      "embedding": [0.1, 0.2, ...],
      "ratings": {"good": 15, "neutral": 2, "bad": 0},
      "isComplete": true
    },
    "employer": {
      "companyName": "ABC Restaurant",
      "contactPerson": "John Doe",
      "businessType": "Restaurant",
      "operatingDistricts": ["Central"],
      "isComplete": false
    }
  },
  "currentMode": "employee|employer",
  "employeeStatus": "available|busy|inactive",
  "currentJobId": "uuid|null",
  "isActive": true
}
```

### Jobs Table
```json
{
  "jobId": "uuid",
  "employerId": "uuid",
  "title": "急需侍應",
  "description": "繁忙餐廳需要有經驗服務員",
  "district": "Central",
  "hourlyRate": 120,
  "duration": {
    "hours": 4,
    "startTime": "18:00",
    "endTime": "22:00"
  },
  "embedding": [0.3, 0.1, ...],
  "status": "matching|closed|completed",
  "createdAt": "timestamp",
  "matchingWindow": {
    "isOpen": true,
    "firstResponseAt": null,
    "responses": []
  }
}
```

### Matches Table
```json
{
  "responseId": "uuid",
  "jobId": "uuid",
  "employeeId": "uuid",
  "respondedAt": "timestamp",
  "status": "pending|selected|rejected"
}
```

### Embeddings Table (Cache)
```json
{
  "textHash": "md5_hash",
  "embedding": [0.1, 0.2, ...],
  "ttl": "timestamp",
  "type": "profile|job"
}
```

## Caching Strategy

### Embedding Cache
- **Purpose**: Reduce DeepSeek API calls and costs
- **TTL**: 30 days for profiles, 7 days for jobs
- **Regeneration**: On profile updates or job modifications
- **Key**: MD5 hash of text content

### Benefits
- **Cost Reduction**: Avoid repeated API calls for same content
- **Performance**: Faster matching with cached embeddings
- **Reliability**: Fallback if DeepSeek API is unavailable

## Data Security

### Encryption
- **At Rest**: DynamoDB encryption enabled
- **In Transit**: HTTPS/TLS for all API calls
- **API Keys**: Stored in AWS Secrets Manager

### Access Control
- **Authentication**: AWS Cognito for user management
- **Authorization**: IAM roles for service access
- **Rate Limiting**: API Gateway throttling

## Future Analytics Considerations

### Current Limitations for AI Analysis
- **No SQL Queries**: Cannot run complex analytical queries
- **Limited Aggregation**: No built-in analytics capabilities
- **Export Required**: Need to move data for deep analysis

### Recommended Future Architecture

#### Option 1: Hybrid Approach (Recommended)
```
DynamoDB (operational) → S3 Data Lake → AI Analysis
```
- Keep DynamoDB for app operations
- Export to S3 for AI analysis
- Use AWS Glue for ETL processes

#### Option 2: Add Analytics Database
```
DynamoDB → DynamoDB Streams → Amazon Redshift/Athena
```
- Real-time sync to analytical database
- Best of both worlds approach

#### Option 3: Direct AI Integration
```python
# AWS Bedrock can query DynamoDB directly
import boto3

dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime')

# Get job data
jobs = dynamodb.Table('Jobs').scan()
# Analyze with AI
response = bedrock.invoke_model(
    modelId='anthropic.claude-v2',
    body=json.dumps({
        'prompt': f'Analyze job trends: {jobs}',
        'max_tokens': 1000
    })
)
```

## Matching Algorithm Data Flow

### Similarity Calculation
```javascript
function calculateSimilarity(jobEmbedding, profileEmbedding) {
  // Cosine similarity between DeepSeek embeddings
  return cosineSimilarity(jobEmbedding, profileEmbedding);
}
```

### Scoring System (0-100 points)
- **Semantic Match** (50 points): DeepSeek embedding similarity
- **District Match** (30 points): Exact district preference match
- **Rate Compatibility** (20 points): Job rate within employee range

### Rate Compatibility Logic
```javascript
function calculateRateScore(jobRate, employeeRange) {
  if (jobRate < employeeRange.min) {
    return 0; // No match if below minimum
  }
  if (jobRate >= employeeRange.max) {
    return 20; // Full points if at/above preferred
  }
  // Partial points between min and preferred
  return (jobRate - employeeRange.min) / 
         (employeeRange.max - employeeRange.min) * 20;
}
```

### Filtering Criteria
- **Minimum similarity threshold**: 0.6
- **Rating filter**: Exclude users with >30% bad ratings
- **Active users only**: Must be logged in within 7 days
- **Employee availability**: Status must be "available"
- **Rate compatibility**: Job rate must meet employee minimum

## Data Backup and Recovery

### Automated Backups
- **DynamoDB Backups**: Point-in-time recovery enabled
- **Frequency**: Continuous backups with 35-day retention
- **Cross-Region**: Backup replication for disaster recovery

### Data Retention Policies
- **User Profiles**: Retained until account deletion
- **Job Posts**: 90 days after completion
- **Messages**: 1 year retention
- **Embeddings**: TTL-based automatic cleanup

## Performance Considerations

### Read/Write Patterns
- **High Read**: Job matching queries, profile lookups
- **Burst Writes**: Job posting, response submissions
- **Real-time**: WebSocket updates, notifications

### Optimization Strategies
- **Global Secondary Indexes**: For efficient querying
- **Partition Key Design**: Distribute load evenly
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Reuse database connections

## Cost Optimization

### DynamoDB Pricing Factors
- **Read/Write Capacity**: On-demand vs provisioned
- **Storage**: Data size and backup costs
- **Data Transfer**: Cross-region replication

### Cost Control Measures
- **On-Demand Billing**: Pay only for actual usage
- **TTL**: Automatic cleanup of expired data
- **Compression**: Minimize storage footprint
- **Monitoring**: CloudWatch alerts for cost spikes

## Migration Strategy

### Phase 1: MVP (Current)
- Single DynamoDB setup
- Basic CRUD operations
- Simple matching algorithm

### Phase 2: Scale
- Add caching layer (Redis)
- Implement data archiving
- Optimize query patterns

### Phase 3: Analytics
- Add S3 data lake
- Implement ETL pipelines
- Enable advanced analytics

This data storage strategy provides a solid foundation for the JetBond MVP while maintaining flexibility for future growth and analytics needs.