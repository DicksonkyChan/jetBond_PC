require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const WebSocket = require('ws');
const http = require('http');
const MatchingService = require('./matching-service');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 8080;

// WebSocket connection management
const clients = new Map(); // userId -> WebSocket

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Source-Screen, X-Source-Button');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  const sourceScreen = req.headers['x-source-screen'] || 'Unknown Screen';
  const sourceButton = req.headers['x-source-button'] || 'Unknown Button';
  console.log(`\n=== API CALL ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Source Screen: ${sourceScreen}`);
  console.log(`Source Button: ${sourceButton}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

AWS.config.update({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const matchingService = new MatchingService(dynamodb);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.userId) {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
        ws.send(JSON.stringify({ type: 'auth_success', userId: data.userId }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

// Function to send real-time notifications
function sendNotification(userId, notification) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(notification));
  }
}

// Users endpoints
app.post('/users', async (req, res) => {
  try {
    const { profiles, currentMode } = req.body;
    if (!profiles || !currentMode) {
      return res.status(400).json({ error: 'Missing required fields: profiles, currentMode' });
    }

    const userId = uuidv4();
    const user = {
      userId,
      profiles,
      currentMode,
      employeeStatus: 'available',
      currentJobId: null,
      ratings: { good: 0, neutral: 0, bad: 0 },
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: process.env.USERS_TABLE,
      Item: user
    }).promise();

    console.log(`\n🎉 NEW USER CREATED 🎉`);
    console.log(`User ID: ${userId}`);
    console.log(`Name: ${profiles.employee?.name || profiles.employer?.name || 'No name'}`);
    console.log(`Mode: ${currentMode}`);
    console.log(`Created at: ${user.createdAt}`);
    console.log(`========================\n`);

    res.status(201).json({ userId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const result = await dynamodb.get({
      TableName: process.env.USERS_TABLE,
      Key: { userId: req.params.id }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.Item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { profiles, currentMode } = req.body;
    if (!profiles || !currentMode) {
      return res.status(400).json({ error: 'Missing required fields: profiles, currentMode' });
    }

    console.log(`\n=== SAVING PROFILE ===`);
    console.log(`User ID: ${req.params.id}`);
    console.log(`Profile data: ${JSON.stringify({ profiles, currentMode })}`);

    await dynamodb.update({
      TableName: process.env.USERS_TABLE,
      Key: { userId: req.params.id },
      UpdateExpression: 'SET profiles = :profiles, currentMode = :currentMode, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':profiles': profiles,
        ':currentMode': currentMode,
        ':updatedAt': new Date().toISOString()
      }
    }).promise();

    console.log(`Save response: 200`);
    console.log(`Save body: ${JSON.stringify({ success: true, message: 'Profile updated successfully' })}`);
    console.log(`Profile save completed\n`);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jobs endpoints
app.post('/jobs', async (req, res) => {
  try {
    const { title, description, district, hourlyRate, duration, employerId } = req.body;
    if (!title || !description || !district || !hourlyRate || !duration || !employerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobId = uuidv4();
    const job = {
      jobId,
      title,
      description,
      district,
      hourlyRate,
      duration,
      employerId,
      status: 'matching',
      createdAt: new Date().toISOString(),
      matchingWindow: {
        isOpen: false,
        firstResponseAt: null,
        responses: []
      }
    };

    await dynamodb.put({
      TableName: process.env.JOBS_TABLE,
      Item: job
    }).promise();

    res.status(201).json({ jobId, message: 'Job created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/jobs', async (req, res) => {
  try {
    const { district } = req.query;
    
    let result;
    if (district) {
      result = await dynamodb.query({
        TableName: process.env.JOBS_TABLE,
        IndexName: 'DistrictIndex',
        KeyConditionExpression: 'district = :district',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'matching', ':district': district }
      }).promise();
    } else {
      result = await dynamodb.scan({
        TableName: process.env.JOBS_TABLE,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'matching' }
      }).promise();
    }

    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Matching endpoints
app.post('/jobs/:id/matches', async (req, res) => {
  try {
    const jobResult = await dynamodb.get({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId: req.params.id }
    }).promise();

    if (!jobResult.Item) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const matches = await matchingService.findMatches(req.params.id, jobResult.Item);
    
    // Send push notifications to matched employees (REQ-036)
    for (const match of matches) {
      sendNotification(match.employeeId, {
        type: 'job_match',
        jobId: req.params.id,
        jobTitle: jobResult.Item.title,
        district: jobResult.Item.district,
        hourlyRate: jobResult.Item.hourlyRate,
        matchScore: match.matchScore,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ matches, count: matches.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/jobs/:id/respond', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Missing employeeId' });
    }

    const result = await matchingService.respondToJob(req.params.id, employeeId);
    
    if (result.success) {
      // Get job details for employer notification
      const jobResult = await dynamodb.get({
        TableName: process.env.JOBS_TABLE,
        Key: { jobId: req.params.id }
      }).promise();
      
      if (jobResult.Item) {
        // Notify employer of response (REQ-037)
        sendNotification(jobResult.Item.employerId, {
          type: 'job_response',
          jobId: req.params.id,
          employeeId,
          responseCount: result.responseCount,
          windowOpen: result.windowOpen,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rating system endpoints
app.post('/jobs/:id/select', async (req, res) => {
  try {
    const { selectedEmployeeId } = req.body;
    if (!selectedEmployeeId) {
      return res.status(400).json({ error: 'Missing selectedEmployeeId' });
    }

    // Update job status
    await dynamodb.update({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId: req.params.id },
      UpdateExpression: 'SET #status = :status, selectedEmployeeId = :employeeId, selectedAt = :selectedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'assigned',
        ':employeeId': selectedEmployeeId,
        ':selectedAt': new Date().toISOString()
      }
    }).promise();

    // Get all responses to notify candidates (REQ-038)
    const jobResult = await dynamodb.get({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId: req.params.id }
    }).promise();

    if (jobResult.Item?.matchingWindow?.responses) {
      for (const response of jobResult.Item.matchingWindow.responses) {
        const isSelected = response.employeeId === selectedEmployeeId;
        sendNotification(response.employeeId, {
          type: 'selection_result',
          jobId: req.params.id,
          selected: isSelected,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({ success: true, message: 'Employee selected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/jobs/:id/rate', async (req, res) => {
  try {
    const { rating, raterId, ratedUserId } = req.body;
    if (!rating || !raterId || !ratedUserId || !['good', 'neutral', 'bad'].includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating data' });
    }

    // Update user ratings (REQ-033)
    await dynamodb.update({
      TableName: process.env.USERS_TABLE,
      Key: { userId: ratedUserId },
      UpdateExpression: `ADD ratings.#rating :inc`,
      ExpressionAttributeNames: { '#rating': rating },
      ExpressionAttributeValues: { ':inc': 1 }
    }).promise();

    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`JetBond API server with WebSocket running on port ${port}`);
});