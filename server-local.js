require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const JobStateMachine = require('./job-state-machine');
const AIMatchingService = require('./ai-matching-service');

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

// Initialize state machine and AI matching
const stateMachine = new JobStateMachine();
const aiMatcher = new AIMatchingService();

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
  const connectedClients = Array.from(clients.keys());
  res.json({ 
    jobs: allJobs.length,
    users: allUsers.length,
    connectedClients: connectedClients.length,
    jobsList: allJobs,
    usersList: allUsers.map(u => ({ userId: u.userId, currentMode: u.currentMode })),
    clientsList: connectedClients
  });
});

// WebSocket debug endpoint
app.get('/debug/websockets', (req, res) => {
  const connectedClients = Array.from(clients.entries()).map(([userId, ws]) => ({
    userId,
    readyState: ws.readyState,
    readyStateText: ws.readyState === WebSocket.OPEN ? 'OPEN' : 
                   ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                   ws.readyState === WebSocket.CLOSING ? 'CLOSING' : 'CLOSED'
  }));
  
  res.json({
    totalConnections: clients.size,
    connections: connectedClients
  });
});

// Test notification endpoint
app.post('/debug/test-notification', (req, res) => {
  const { userId, type, message } = req.body;
  if (!userId || !type) {
    return res.status(400).json({ error: 'Missing userId or type' });
  }
  
  const success = sendNotification(userId, {
    type,
    message: message || 'Test notification',
    timestamp: new Date().toISOString()
  });
  
  res.json({ success, sent: success });
});

// Admin endpoint to get all data
app.get('/admin/data', (req, res) => {
  try {
    const allJobs = Array.from(jobs.values());
    const allUsers = Array.from(users.values());
    res.json({
      users: allUsers,
      jobs: allJobs,
      stats: {
        totalUsers: allUsers.length,
        totalJobs: allJobs.length,
        activeJobs: allJobs.filter(j => j.status === 'matching').length,
        completedJobs: allJobs.filter(j => j.status === 'completed').length
      }
    });
  } catch (error) {
    logToFile(`Admin data error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
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
    logToFile(`📢 Sending notification to ${userId}: ${notification.type} - ${notification.message || 'No message'}`);
    client.send(JSON.stringify(notification));
    return true;
  } else {
    logToFile(`⚠️ Cannot send notification to ${userId}: client not connected (readyState: ${client?.readyState || 'no client'})`);
    return false;
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
      employeeRatings: { good: 0, neutral: 0, bad: 0 },
      employerRatings: { good: 0, neutral: 0, bad: 0 },
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
    let user = users.get(req.params.id);
    if (!user) {
      // Create default user if not found
      user = {
        userId: req.params.id,
        profiles: {},
        currentMode: 'employee',
        employeeStatus: 'open_to_work',
        employeeRatings: { good: 0, neutral: 0, bad: 0 },
        employerRatings: { good: 0, neutral: 0, bad: 0 },
        createdAt: new Date().toISOString()
      };
      users.set(req.params.id, user);
      await saveUserToDynamoDB(user);
      logToFile(`Created default user: ${req.params.id}`);
    }
    
    // Ensure rating fields exist
    if (!user.employeeRatings) {
      user.employeeRatings = { good: 0, neutral: 0, bad: 0 };
    }
    if (!user.employerRatings) {
      user.employerRatings = { good: 0, neutral: 0, bad: 0 };
    }
    
    logToFile(`User ${req.params.id} ratings - Employee: ${JSON.stringify(user.employeeRatings)}, Employer: ${JSON.stringify(user.employerRatings)}`);
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
        employeeRatings: { good: 0, neutral: 0, bad: 0 },
        employerRatings: { good: 0, neutral: 0, bad: 0 },
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
    
    logToFile(`📝 Job created: ${jobId} by ${employerId}`);
    
    // Notify employer that job was posted
    sendNotification(employerId, {
      type: 'job_posted',
      jobId,
      jobTitle: title,
      message: `Job "${title}" posted successfully`,
      timestamp: new Date().toISOString()
    });
    
    // Find qualified employees (basic location and rate filtering)
    try {
      const availableEmployees = Array.from(users.values())
        .filter(user => user.currentMode === 'employee' && user.employeeStatus === 'open_to_work');

      const qualifiedEmployees = availableEmployees.filter(employee => {
        const profile = employee.profiles?.employee;
        if (!profile) return false;
        
        // Location match
        const locationMatch = profile.preferredDistricts?.includes(district) || false;
        
        // Rate compatibility
        const minRate = profile.hourlyRateRange?.min || 0;
        const maxRate = profile.hourlyRateRange?.max || 999;
        const rateMatch = hourlyRate >= minRate && hourlyRate <= maxRate;
        
        return locationMatch && rateMatch;
      });

      // Send job_match notifications to qualified employees
      logToFile(`📝 Found ${qualifiedEmployees.length} qualified employees for job ${jobId}`);
      for (const employee of qualifiedEmployees) {
        sendNotification(employee.userId, {
          type: 'job_match',
          jobId,
          jobTitle: title,
          district,
          hourlyRate,
          matchScore: 75, // Basic qualification score
          message: `New job match: "${title}" in ${district}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (matchError) {
      logToFile(`⚠️ Error finding qualified employees for job ${jobId}: ${matchError}`);
    }
    
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
    if (stateMachine.canTransition(job.status, 'expired', 'system') && 
        new Date(job.expiresAt) <= now && !job.expiredAt) {
      job.status = 'expired';
      job.expiredAt = now.toISOString();
      saveJobToDynamoDB(job);
      logToFile(`Job ${jobId} expired at ${job.expiredAt}`);
      
      // Notify employer that job expired
      sendNotification(job.employerId, {
        type: 'job_expired',
        jobId: job.jobId,
        jobTitle: job.title,
        message: `Job "${job.title}" has expired`,
        timestamp: new Date().toISOString()
      });
      
      // Set all applicants back to open_to_work
      resetApplicantsStatus(job, 'Job expired');
    }
  }
}

// Reset applicants status to open_to_work when job expires or is cancelled
async function resetApplicantsStatus(job, reason = 'Job no longer available') {
  const responses = job.matchingWindow?.responses || [];
  const trigger = reason.includes('cancelled') ? 'job_cancelled' : 'job_completed';
  
  for (const response of responses) {
    const employee = users.get(response.employeeId);
    if (employee && stateMachine.canEmployeeTransition(employee.employeeStatus, 'open_to_work')) {
      try {
        stateMachine.validateEmployeeTransition(employee, 'open_to_work', trigger);
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
      } catch (error) {
        logToFile(`Failed to reset employee ${response.employeeId} status: ${error.message}`);
      }
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
      // For employees: only show jobs in matching status
      jobList = Array.from(jobs.values()).filter(job => 
        stateMachine.canTransition(job.status, 'assigned', 'employer') || job.status === 'matching'
      );
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

// AI-powered matching endpoint
app.post('/jobs/:id/matches', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // AI matching - find available employees
    const availableEmployees = Array.from(users.values())
      .filter(user => user.currentMode === 'employee' && user.employeeStatus === 'open_to_work');

    // Get employer's language preference
    const employer = users.get(job.employerId);
    const employerLanguage = employer?.profiles?.employer?.preferredLanguage || 'English';
    
    const matches = await aiMatcher.findMatches(job, availableEmployees, employerLanguage);

    // Send notifications to matched employees
    logToFile(`🤖 AI matching found ${matches.length} employees for job ${req.params.id}`);
    for (const match of matches) {
      const notification = {
        type: 'job_match',
        jobId: req.params.id,
        jobTitle: job.title,
        district: job.district,
        hourlyRate: job.hourlyRate,
        matchScore: match.matchScore,
        message: `New job match: "${job.title}" in ${job.district} (${match.matchScore}% match)`,
        timestamp: new Date().toISOString()
      };
      
      // Add AI-specific data if available
      if (match.reasoning) notification.reasoning = match.reasoning;
      if (match.strengths) notification.strengths = match.strengths;
      if (match.languageMatch) notification.languageMatch = match.languageMatch;
      
      sendNotification(match.employeeId, notification);
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

// AI job recommendations endpoint
app.get('/employee/:id/recommendations', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const availableJobs = Array.from(jobs.values())
      .filter(job => job.status === 'matching');
    
    const recommendations = await aiMatcher.getJobRecommendations(employeeId, availableJobs, users);
    
    logToFile(`🤖 Generated ${recommendations.length} job recommendations for employee ${employeeId}`);
    res.json({ recommendations, count: recommendations.length });
  } catch (error) {
    logToFile(`Get recommendations error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI applicant ranking endpoint for employers
app.post('/jobs/:id/ai-rank-applicants', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const responses = job.matchingWindow?.responses || [];
    const applicantEmployees = [];

    // Get employee profiles for all applicants
    for (const response of responses) {
      const employee = users.get(response.employeeId);
      if (employee) {
        applicantEmployees.push({
          ...employee,
          appliedAt: response.respondedAt
        });
      }
    }

    if (applicantEmployees.length === 0) {
      return res.json({ rankedApplicants: [], count: 0 });
    }

    // Get employer's language preference
    const employer = users.get(job.employerId);
    const employerLanguage = employer?.profiles?.employer?.preferredLanguage || 'English';
    
    // Use AI to rank the applicants
    const aiRanking = await aiMatcher.findMatches(job, applicantEmployees, employerLanguage);
    
    // Combine AI ranking with application data
    const rankedApplicants = aiRanking.map(match => {
      const employee = applicantEmployees.find(emp => emp.userId === match.employeeId);
      const profile = employee?.profiles?.employee || {};
      
      return {
        employeeId: match.employeeId,
        name: profile.name || employee?.userId.split('@')[0] || 'Unknown',
        appliedAt: employee?.appliedAt,
        matchScore: match.matchScore,
        reasoning: match.reasoning,
        strengths: match.strengths || [],
        concerns: match.concerns || [],
        profile: profile,
        ratings: employee?.employeeRatings || { good: 0, neutral: 0, bad: 0 }
      };
    });

    logToFile(`🤖 AI ranked ${rankedApplicants.length} applicants for job ${req.params.id}`);
    res.json({ rankedApplicants, count: rankedApplicants.length });
  } catch (error) {
    logToFile(`AI ranking error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job applicants endpoint (first-come-first-served)
app.get('/jobs/:id/applicants', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const responses = job.matchingWindow?.responses || [];
    const applicants = [];

    // Sort by application time (first-come-first-served)
    const sortedResponses = responses.sort((a, b) => 
      new Date(a.respondedAt) - new Date(b.respondedAt)
    );

    for (const response of sortedResponses) {
      const employee = users.get(response.employeeId);
      if (employee) {
        const profile = employee.profiles?.employee || {};
        applicants.push({
          employeeId: response.employeeId,
          name: profile.name || employee.userId.split('@')[0] || 'Unknown',
          respondedAt: response.respondedAt,
          profile: profile,
          ratings: employee.employeeRatings || { good: 0, neutral: 0, bad: 0 },
          isQualified: isEmployeeQualified(employee, job)
        });
      }
    }

    res.json({ applicants, count: applicants.length });
  } catch (error) {
    logToFile(`Get applicants error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check if employee is qualified
function isEmployeeQualified(employee, job) {
  const profile = employee.profiles?.employee;
  if (!profile) return false;
  
  // Location match
  const locationMatch = profile.preferredDistricts?.includes(job.district) || false;
  
  // Rate compatibility
  const minRate = profile.hourlyRateRange?.min || 0;
  const maxRate = profile.hourlyRateRange?.max || 999;
  const rateMatch = job.hourlyRate >= minRate && job.hourlyRate <= maxRate;
  
  return locationMatch && rateMatch;
}

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

    // Check if employee has canceled application before
    const hasCanceled = job.canceledApplications && job.canceledApplications.some(c => c.employeeId === employeeId);
    if (hasCanceled) {
      return res.json({ success: false, message: 'Cannot reapply after canceling application' });
    }

    // Use state machine to validate employee status transition
    try {
      stateMachine.validateEmployeeTransition(employee, 'busy', 'apply_to_job');
    } catch (error) {
      return res.status(400).json({ error: error.message });
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

    // Notify employer about new application
    logToFile(`📢 Sending job_response notification to employer ${job.employerId}`);
    sendNotification(job.employerId, {
      type: 'job_response',
      jobId: req.params.id,
      jobTitle: job.title,
      employeeId,
      responseCount: job.matchingWindow.responses.length,
      windowOpen: true,
      message: `New application received for "${job.title}"`,
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
    const { selectedEmployeeId, employerId } = req.body;
    if (!selectedEmployeeId) {
      return res.status(400).json({ error: 'Missing selectedEmployeeId' });
    }

    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Use state machine validation
    try {
      stateMachine.validateTransition(job, 'assigned', employerId || job.employerId, 'employer');
    } catch (error) {
      return res.status(400).json({ error: error.message });
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
        if (employee && stateMachine.canEmployeeTransition(employee.employeeStatus, 'open_to_work')) {
          try {
            stateMachine.validateEmployeeTransition(employee, 'open_to_work', 'not_selected');
            employee.employeeStatus = 'open_to_work';
            employee.currentJobId = null;
            await saveUserToDynamoDB(employee);
            logToFile(`Released employee ${response.employeeId} back to open_to_work (not selected)`);
          } catch (error) {
            logToFile(`Failed to release employee ${response.employeeId}: ${error.message}`);
          }
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

    // Determine if rating is for employee or employer role
    const rater = users.get(raterId);
    if (rater && rater.currentMode === 'employer') {
      user.employeeRatings[rating]++;
    } else {
      user.employerRatings[rating]++;
    }
    await saveUserToDynamoDB(user);
    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    logToFile(`Rating error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel application endpoint
app.post('/jobs/:id/cancel-application', async (req, res) => {
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

    // Initialize canceledApplications if not exists
    if (!job.canceledApplications) {
      job.canceledApplications = [];
    }

    // Add to canceled applications list
    job.canceledApplications.push({
      employeeId,
      canceledAt: new Date().toISOString()
    });

    // Remove employee from job responses
    if (job.matchingWindow && job.matchingWindow.responses) {
      job.matchingWindow.responses = job.matchingWindow.responses.filter(
        response => response.employeeId !== employeeId
      );
    }
    
    await saveJobToDynamoDB(job);

    // Reset employee status
    employee.employeeStatus = 'open_to_work';
    employee.currentJobId = null;
    await saveUserToDynamoDB(employee);

    logToFile(`Employee ${employeeId} cancelled application for job ${req.params.id}`);
    res.json({ success: true, message: 'Application cancelled successfully' });
  } catch (error) {
    logToFile(`Cancel application error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel job endpoint
app.put('/jobs/:id/cancel', async (req, res) => {
  try {
    const { employerId } = req.body;
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Use state machine validation
    try {
      stateMachine.validateTransition(job, 'cancelled', employerId || job.employerId, 'employer');
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update job status to cancelled
    job.status = 'cancelled';
    job.cancelledAt = new Date().toISOString();
    await saveJobToDynamoDB(job);

    // Notify all applicants that job was cancelled
    const responses = job.matchingWindow?.responses || [];
    logToFile(`📢 Sending job_cancelled notifications to ${responses.length} applicants`);
    for (const response of responses) {
      sendNotification(response.employeeId, {
        type: 'job_cancelled',
        jobId: req.params.id,
        jobTitle: job.title,
        message: `Job "${job.title}" has been cancelled by employer`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Also notify all employees who would have been eligible for this job
    const availableEmployees = Array.from(users.values())
      .filter(user => user.currentMode === 'employee' && user.employeeStatus === 'open_to_work');
    
    logToFile(`📢 Sending job_cancelled notifications to ${availableEmployees.length} available employees`);
    for (const employee of availableEmployees) {
      // Don't send duplicate notifications to employees who already applied
      const alreadyNotified = responses.some(r => r.employeeId === employee.userId);
      if (!alreadyNotified) {
        sendNotification(employee.userId, {
          type: 'job_cancelled',
          jobId: req.params.id,
          jobTitle: job.title,
          message: `Job "${job.title}" has been cancelled by employer`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Set all applicants back to open_to_work
    await resetApplicantsStatus(job, 'Job cancelled by employer');

    res.json({ success: true, message: 'Job cancelled successfully' });
  } catch (error) {
    logToFile(`Cancel job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee complete job endpoint (sets to pending)
app.put('/jobs/:id/employee-complete', async (req, res) => {
  try {
    const { rating, employeeId } = req.body;
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Use state machine validation
    try {
      stateMachine.validateTransition(job, 'pending', employeeId, 'employee');
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Set job to pending employer completion
    job.status = 'pending';
    job.employeeCompletedAt = new Date().toISOString();
    
    // Store employee's rating of employer
    if (rating && ['good', 'neutral', 'bad'].includes(rating)) {
      job.employeeRating = rating;
      
      // Update employer's overall rating
      const employer = users.get(job.employerId);
      if (employer) {
        employer.employerRatings[rating]++;
        await saveUserToDynamoDB(employer);
      }
    }
    
    await saveJobToDynamoDB(job);

    // Reset employee status to open_to_work using state machine
    const employee = users.get(employeeId);
    if (employee && stateMachine.canEmployeeTransition(employee.employeeStatus, 'open_to_work')) {
      employee.employeeStatus = 'open_to_work';
      employee.currentJobId = null;
      await saveUserToDynamoDB(employee);
    }

    // Notify employer that job is pending their completion
    sendNotification(job.employerId, {
      type: 'job_pending',
      jobId: req.params.id,
      jobTitle: job.title,
      message: `Job "${job.title}" completed by employee. Please review and complete.`,
      timestamp: new Date().toISOString()
    });

    logToFile(`Job ${req.params.id} marked as pending by employee ${employeeId}`);
    res.json({ success: true, message: 'Job marked as pending employer completion' });
  } catch (error) {
    logToFile(`Employee complete job error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employer complete job endpoint (final completion)
app.put('/jobs/:id/complete', async (req, res) => {
  try {
    const { rating, employerId } = req.body;
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Use state machine validation - allow completion from both assigned and pending
    const canComplete = stateMachine.canTransition(job.status, 'completed', 'employer');
    if (!canComplete) {
      return res.status(400).json({ error: `Cannot complete job from ${job.status} status` });
    }
    
    if (job.employerId !== (employerId || job.employerId)) {
      return res.status(400).json({ error: 'Only job employer can complete job' });
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
          employee.employeeRatings[rating]++;
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