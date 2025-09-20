require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Setup logging to file
const logFile = path.join(__dirname, 'jetbond.log');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
  console.log(message); // Also log to console
}

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 8080;

// DynamoDB table names
const USERS_TABLE = process.env.USERS_TABLE || 'jetbond-users';
const JOBS_TABLE = process.env.JOBS_TABLE || 'jetbond-jobs';

// In-memory storage
const users = new Map();
const jobs = new Map();
const matches = new Map();

// WebSocket connection management
const clients = new Map();

app.use(express.json());

// Comprehensive logging middleware
app.use((req, res, next) => {
  const logMessage = `\n=== API REQUEST ===\n${req.method} ${req.url}\nTime: ${new Date().toISOString()}\nHeaders: ${JSON.stringify(req.headers, null, 2)}${req.body && Object.keys(req.body).length > 0 ? `\nBody: ${JSON.stringify(req.body, null, 2)}` : ''}\n==================\n`;
  logToFile(logMessage);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  logToFile('🧪 TEST ENDPOINT HIT');
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  const allJobs = Array.from(jobs.values());
  const allUsers = Array.from(users.values());
  res.json({ 
    jobs: allJobs.length,
    users: allUsers.length,
    jobsList: allJobs,
    usersList: allUsers.map(u => ({ userId: u.userId, currentMode: u.currentMode }))
  });
});

// DynamoDB check endpoint
app.get('/check-dynamodb', async (req, res) => {
  try {
    logToFile('🔍 Checking DynamoDB directly...');
    
    // Check jobs table
    const jobsResult = await dynamodb.scan({ 
      TableName: JOBS_TABLE,
      Limit: 10
    }).promise();
    
    // Check users table  
    const usersResult = await dynamodb.scan({ 
      TableName: USERS_TABLE,
      Limit: 10
    }).promise();
    
    const result = {
      dynamodb: {
        jobs: {
          count: jobsResult.Count,
          items: jobsResult.Items
        },
        users: {
          count: usersResult.Count,
          items: usersResult.Items.map(u => ({ userId: u.userId, currentMode: u.currentMode }))
        }
      },
      memory: {
        jobs: jobs.size,
        users: users.size
      },
      config: {
        region: process.env.AWS_REGION || 'us-east-1',
        usersTable: USERS_TABLE,
        jobsTable: JOBS_TABLE,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    };
    
    logToFile(`DynamoDB Jobs: ${jobsResult.Count}, Users: ${usersResult.Count}`);
    res.json(result);
  } catch (error) {
    logToFile(`❌ DynamoDB check error: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      config: {
        region: process.env.AWS_REGION || 'us-east-1',
        usersTable: USERS_TABLE,
        jobsTable: JOBS_TABLE,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    });
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  logToFile('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.userId) {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
        logToFile(`🔌 User ${data.userId} connected to WebSocket`);
        ws.send(JSON.stringify({ 
          type: 'auth_success', 
          userId: data.userId,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      logToFile(`WebSocket message error: ${error}`);
    }
  });
  
  ws.on('close', () => {
    if (ws.userId) {
      logToFile(`🔌 User ${ws.userId} disconnected from WebSocket`);
      clients.delete(ws.userId);
    }
  });
});

// Function to send real-time notifications
function sendNotification(userId, notification) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    logToFile(`📢 Sending notification to ${userId}: ${notification.type}`);
    client.send(JSON.stringify(notification));
  } else {
    logToFile(`⚠️ Cannot send notification to ${userId}: client not connected`);
  }
}

// DynamoDB persistence functions
async function saveUserToDynamoDB(user) {
  try {
    logToFile(`💾 Saving user to DynamoDB: ${user.userId}`);
    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user
    }).promise();
    logToFile(`✅ User saved successfully: ${user.userId}`);
  } catch (error) {
    logToFile(`❌ Error saving user to DynamoDB: ${error.message}`);
    logToFile(`   Table: ${USERS_TABLE}`);
    logToFile(`   User: ${JSON.stringify(user, null, 2)}`);
  }
}

async function saveJobToDynamoDB(job) {
  try {
    logToFile(`💾 Saving job to DynamoDB: ${job.jobId}`);
    await dynamodb.put({
      TableName: JOBS_TABLE,
      Item: job
    }).promise();
    logToFile(`✅ Job saved successfully: ${job.jobId}`);
  } catch (error) {
    logToFile(`❌ Error saving job to DynamoDB: ${error.message}`);
    logToFile(`   Table: ${JOBS_TABLE}`);
    logToFile(`   Job: ${JSON.stringify(job, null, 2)}`);
  }
}

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const loginMessage = `\n🔐 USER LOGIN 🔐\nUser ID: ${userId}\nName: ${user.profiles?.employee?.name || user.profiles?.employer?.companyName || 'No name'}\nMode: ${user.currentMode}\nLogin time: ${new Date().toISOString()}\n==================\n`;
    logToFile(loginMessage);

    res.json({ success: true, user });
  } catch (error) {
    logToFile(`Login error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoints
app.post('/users', async (req, res) => {
  try {
    const { profiles, currentMode, userId } = req.body;
    if (!profiles || !currentMode) {
      return res.status(400).json({ error: 'Missing required fields: profiles, currentMode' });
    }

    const finalUserId = userId || uuidv4();
    const user = {
      userId: finalUserId,
      profiles,
      currentMode,
      employeeStatus: 'open_to_work',
      currentJobId: null,
      ratings: { good: 0, neutral: 0, bad: 0 },
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.set(finalUserId, user);
    await saveUserToDynamoDB(user);
    
    const createMessage = `\n🎉 NEW USER CREATED 🎉\nUser ID: ${finalUserId}\nName: ${profiles.employee?.name || profiles.employer?.companyName || 'No name'}\nMode: ${currentMode}\nCreated at: ${user.createdAt}\n========================\n`;
    logToFile(createMessage);

    res.status(201).json({ userId: finalUserId, message: 'User created successfully' });
  } catch (error) {
    logToFile(`Create user error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = users.get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logToFile(`Get user error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { profiles, currentMode } = req.body;
    
    let user = users.get(req.params.id);
    if (!user) {
      // Create new user
      user = {
        userId: req.params.id,
        profiles: profiles || {},
        currentMode: currentMode || 'employee',
        employeeStatus: 'open_to_work',
        ratings: { good: 0, neutral: 0, bad: 0 },
        createdAt: new Date().toISOString()
      };
    } else {
      // Update existing user
      if (profiles) user.profiles = profiles;
      if (currentMode) user.currentMode = currentMode;
      user.updatedAt = new Date().toISOString();
    }
    
    users.set(req.params.id, user);
    await saveUserToDynamoDB(user);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    logToFile(`Update user error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jobs endpoints
app.post('/jobs', async (req, res) => {
  try {
    const { title, description, district, hourlyRate, duration, employerId, expirationMinutes } = req.body;
    if (!title || !description || !district || !hourlyRate || !duration || !employerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate expiration minutes (max 180 minutes = 3 hours)
    const expMinutes = Math.min(expirationMinutes || 5, 180);
    const expiresAt = new Date(Date.now() + expMinutes * 60 * 1000).toISOString();

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
      expiresAt,
      expiredAt: null,
      matchingWindow: {
        isOpen: false,
        firstResponseAt: null,
        responses: []
      }
    };

    jobs.set(jobId, job);
    await saveJobToDynamoDB(job);
    res.status(201).json({ jobId, message: 'Job created successfully', expiresAt });
  } catch (error) {
    logToFile(`Create job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check and expire jobs
function checkExpiredJobs() {
  const now = new Date();
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'matching' && new Date(job.expiresAt) <= now && !job.expiredAt) {
      job.status = 'expired';
      job.expiredAt = now.toISOString();
      saveJobToDynamoDB(job);
      logToFile(`Job ${jobId} expired at ${job.expiredAt}`);
      
      // Set all applicants back to open_to_work
      resetApplicantsStatus(job, 'Job expired');
    }
  }
}

// Reset applicants status to open_to_work when job expires or is cancelled
async function resetApplicantsStatus(job, reason = 'Job no longer available') {
  const responses = job.matchingWindow?.responses || [];
  for (const response of responses) {
    const employee = users.get(response.employeeId);
    if (employee && employee.employeeStatus !== 'open_to_work') {
      employee.employeeStatus = 'open_to_work';
      employee.currentJobId = null;
      await saveUserToDynamoDB(employee);
      logToFile(`Reset employee ${response.employeeId} status to open_to_work: ${reason}`);
      
      // Notify employee
      sendNotification(response.employeeId, {
        type: 'status_reset',
        jobId: job.jobId,
        jobTitle: job.title,
        message: `Your status has been reset to "Open to work". Reason: ${reason}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

app.get('/jobs', async (req, res) => {
  try {
    checkExpiredJobs();
    
    const { district, employerId } = req.query;
    let jobList;
    
    if (employerId) {
      // For employers: show all their jobs with status info
      jobList = Array.from(jobs.values()).filter(job => job.employerId === employerId);
    } else {
      // For employees: only show active matching jobs
      jobList = Array.from(jobs.values()).filter(job => job.status === 'matching');
    }
    
    if (district) {
      jobList = jobList.filter(job => job.district === district);
    }
    
    res.json(jobList);
  } catch (error) {
    logToFile(`Get jobs error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple matching endpoint
app.post('/jobs/:id/matches', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Simple matching - find available employees
    const availableEmployees = Array.from(users.values())
      .filter(user => user.currentMode === 'employee' && user.employeeStatus === 'available');

    const matches = availableEmployees.map(employee => {
      // Simple scoring based on district match and rate compatibility
      let score = 60; // Base score
      const profile = employee.profiles?.employee;
      
      if (profile) {
        // District match bonus
        if (profile.preferredDistricts?.includes(job.district)) {
          score += 30;
        }
        
        // Rate compatibility bonus
        const minRate = profile.hourlyRateRange?.min || 0;
        const maxRate = profile.hourlyRateRange?.max || 999;
        if (job.hourlyRate >= minRate && job.hourlyRate <= maxRate) {
          score += 20;
        }
      }
      
      return {
        employeeId: employee.userId,
        matchScore: Math.min(score, 100),
        matchedAt: new Date().toISOString()
      };
    }).slice(0, 10);

    // Send notifications
    for (const match of matches) {
      sendNotification(match.employeeId, {
        type: 'job_match',
        jobId: req.params.id,
        jobTitle: job.title,
        district: job.district,
        hourlyRate: job.hourlyRate,
        matchScore: match.matchScore,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ matches, count: matches.length });
  } catch (error) {
    logToFile(`Matching error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee work history endpoint
app.get('/employee/:id/work-history', async (req, res) => {
  try {
    const employeeId = req.params.id;
    logToFile(`Looking for work history for employee: ${employeeId}`);
    
    const allJobs = Array.from(jobs.values());
    const completedJobs = allJobs.filter(job => job.status === 'completed');
    const employeeJobs = completedJobs.filter(job => job.selectedEmployeeId === employeeId);
    
    logToFile(`Total jobs: ${allJobs.length}, Completed jobs: ${completedJobs.length}, Employee jobs: ${employeeJobs.length}`);
    logToFile(`Completed jobs with selectedEmployeeId: ${completedJobs.map(j => `${j.jobId}:${j.selectedEmployeeId}`).join(', ')}`);
    
    const sortedJobs = employeeJobs.sort((a, b) => new Date(b.completedAt || b.selectedAt) - new Date(a.completedAt || a.selectedAt));
    
    res.json({ jobs: sortedJobs, count: sortedJobs.length });
  } catch (error) {
    logToFile(`Get work history error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee current job endpoint
app.get('/employee/:id/current-job', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const currentJob = Array.from(jobs.values())
      .find(job => job.selectedEmployeeId === employeeId && job.status === 'assigned');
    
    if (currentJob) {
      res.json({ job: currentJob });
    } else {
      res.json({ job: null });
    }
  } catch (error) {
    logToFile(`Get current job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job applicants endpoint
app.get('/jobs/:id/applicants', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const responses = job.matchingWindow?.responses || [];
    const applicants = [];

    for (const response of responses) {
      const employee = users.get(response.employeeId);
      if (employee) {
        applicants.push({
          employeeId: response.employeeId,
          name: employee.profiles?.employee?.name || 'Unknown',
          respondedAt: response.respondedAt,
          profile: employee.profiles?.employee || {}
        });
      }
    }

    res.json({ applicants, count: applicants.length });
  } catch (error) {
    logToFile(`Get applicants error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job response endpoint
app.post('/jobs/:id/respond', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Missing employeeId' });
    }

    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const employee = users.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee already responded
    const alreadyResponded = job.matchingWindow.responses.some(r => r.employeeId === employeeId);
    if (alreadyResponded) {
      return res.json({ success: false, message: 'Already applied to this job' });
    }

    // Set employee status to busy when applying
    employee.employeeStatus = 'busy';
    employee.currentJobId = req.params.id;
    await saveUserToDynamoDB(employee);

    // Add response
    job.matchingWindow.responses.push({
      employeeId,
      respondedAt: new Date().toISOString()
    });
    await saveJobToDynamoDB(job);

    logToFile(`Employee ${employeeId} applied to job ${req.params.id}, status set to busy`);

    // Notify employer
    sendNotification(job.employerId, {
      type: 'job_response',
      jobId: req.params.id,
      employeeId,
      responseCount: job.matchingWindow.responses.length,
      windowOpen: true,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      responseCount: job.matchingWindow.responses.length,
      windowOpen: true
    });
  } catch (error) {
    logToFile(`Response error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Select employee endpoint
app.post('/jobs/:id/select', async (req, res) => {
  try {
    const { selectedEmployeeId } = req.body;
    if (!selectedEmployeeId) {
      return res.status(400).json({ error: 'Missing selectedEmployeeId' });
    }

    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.status = 'assigned';
    job.selectedEmployeeId = selectedEmployeeId;
    job.selectedAt = new Date().toISOString();
    await saveJobToDynamoDB(job);

    // Set selected employee to busy
    const selectedEmployee = users.get(selectedEmployeeId);
    if (selectedEmployee) {
      selectedEmployee.employeeStatus = 'busy';
      selectedEmployee.currentJobId = req.params.id;
      await saveUserToDynamoDB(selectedEmployee);
    }

    // Release all other applicants back to open_to_work
    for (const response of job.matchingWindow.responses) {
      const isSelected = response.employeeId === selectedEmployeeId;
      
      if (!isSelected) {
        const employee = users.get(response.employeeId);
        if (employee && employee.employeeStatus !== 'open_to_work') {
          employee.employeeStatus = 'open_to_work';
          employee.currentJobId = null;
          await saveUserToDynamoDB(employee);
          logToFile(`Released employee ${response.employeeId} back to open_to_work (not selected)`);
        }
      }

      // Notify all candidates
      sendNotification(response.employeeId, {
        type: 'selection_result',
        jobId: req.params.id,
        selected: isSelected,
        message: isSelected ? 'Congratulations! You got the job' : 'You were not selected. Your status has been reset to "Open to work"',
        timestamp: new Date().toISOString()
      });
    }

    logToFile(`Employee ${selectedEmployeeId} selected for job ${req.params.id}. Other applicants released.`);
    res.json({ success: true, message: 'Employee selected successfully' });
  } catch (error) {
    logToFile(`Selection error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rating endpoint (for standalone rating after job completion)
app.post('/jobs/:id/rate', async (req, res) => {
  try {
    const { rating, raterId, ratedUserId } = req.body;
    if (!rating || !raterId || !ratedUserId || !['good', 'neutral', 'bad'].includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating data' });
    }

    const job = jobs.get(req.params.id);
    const user = users.get(ratedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update job rating if not already set
    if (job && !job.rating) {
      job.rating = rating;
      await saveJobToDynamoDB(job);
    }

    user.ratings[rating]++;
    await saveUserToDynamoDB(user);
    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    logToFile(`Rating error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel job endpoint
app.put('/jobs/:id/cancel', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status to cancelled
    job.status = 'cancelled';
    job.cancelledAt = new Date().toISOString();
    await saveJobToDynamoDB(job);

    // Notify all applicants that job was cancelled
    const responses = job.matchingWindow?.responses || [];
    for (const response of responses) {
      sendNotification(response.employeeId, {
        type: 'job_cancelled',
        jobId: req.params.id,
        jobTitle: job.title,
        message: 'Job has been cancelled by employer',
        timestamp: new Date().toISOString()
      });
    }

    // Set all applicants back to open_to_work
    await resetApplicantsStatus(job, 'Job cancelled by employer');

    res.json({ success: true, message: 'Job cancelled successfully' });
  } catch (error) {
    logToFile(`Cancel job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete job endpoint
app.put('/jobs/:id/complete', async (req, res) => {
  try {
    const { rating } = req.body;
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'assigned') {
      logToFile(`Job ${req.params.id} has status: ${job.status}, expected: assigned`);
      return res.status(400).json({ error: `Job is not in assigned status. Current status: ${job.status}` });
    }

    // Update job status to completed
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    
    // Store rating if provided
    if (rating && ['good', 'neutral', 'bad'].includes(rating)) {
      job.rating = rating;
      
      // Also update employee's overall rating
      if (job.selectedEmployeeId) {
        const employee = users.get(job.selectedEmployeeId);
        if (employee) {
          employee.ratings[rating]++;
          await saveUserToDynamoDB(employee);
        }
      }
    }
    
    await saveJobToDynamoDB(job);

    // Notify employee that job is completed
    if (job.selectedEmployeeId) {
      const employee = users.get(job.selectedEmployeeId);
      if (employee) {
        employee.employeeStatus = 'open_to_work';
        employee.currentJobId = null;
        await saveUserToDynamoDB(employee);
      }

      sendNotification(job.selectedEmployeeId, {
        type: 'job_completed',
        jobId: req.params.id,
        jobTitle: job.title,
        rating: rating,
        message: `Job completed${rating ? ` with ${rating} rating` : ''}`,
        timestamp: new Date().toISOString()
      });
    }

    logToFile(`Job ${req.params.id} completed by employer ${job.employerId}${rating ? ` with ${rating} rating` : ''}`);
    res.json({ success: true, message: 'Job completed successfully' });
  } catch (error) {
    logToFile(`Complete job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load data from DynamoDB
async function loadDataFromDynamoDB() {
  try {
    logToFile('📥 Loading data from DynamoDB...');
    
    // Load users
    const usersResult = await dynamodb.scan({ TableName: USERS_TABLE }).promise();
    usersResult.Items.forEach(user => {
      users.set(user.userId, user);
    });
    
    // Load jobs
    const jobsResult = await dynamodb.scan({ TableName: JOBS_TABLE }).promise();
    jobsResult.Items.forEach(job => {
      jobs.set(job.jobId, job);
      logToFile(`Loaded job: ${job.jobId} - "${job.title}" (${job.status}) by ${job.employerId}`);
    });
    
    logToFile(`✅ Loaded ${usersResult.Items.length} users and ${jobsResult.Items.length} jobs from DynamoDB`);
    logToFile(`Jobs in memory: ${jobs.size}`);
    
    // Log jobs for dee@jetbond.com specifically
    const deeJobs = Array.from(jobs.values()).filter(job => job.employerId === 'dee@jetbond.com');
    logToFile(`Jobs for dee@jetbond.com: ${deeJobs.length}`);
  } catch (error) {
    logToFile(`❌ Error loading from DynamoDB: ${error.message}`);
    logToFile('Continuing with empty in-memory storage...');
  }
}

// Start expiration check interval
setInterval(checkExpiredJobs, 60000); // Check every minute

server.listen(port, async () => {
  logToFile(`JetBond API server with WebSocket running on port ${port}`);
  logToFile(`DynamoDB Configuration:`);
  logToFile(`  Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  logToFile(`  Users Table: ${USERS_TABLE}`);
  logToFile(`  Jobs Table: ${JOBS_TABLE}`);
  logToFile(`  Access Key: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
  logToFile(`  Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
  logToFile('Loading data from DynamoDB...');
  logToFile(`Logging to file: ${logFile}`);
  await loadDataFromDynamoDB();
  logToFile('Job expiration checker started (1-minute intervals)');
  logToFile('Ready to receive login requests!');
});