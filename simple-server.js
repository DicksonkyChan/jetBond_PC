const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
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

// Mock data storage
let users = [];
let jobs = [];

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'JetBond API is working!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Users endpoints
app.post('/users', (req, res) => {
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

  users.push(user);
  res.status(201).json({ userId, message: 'User created successfully' });
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.userId === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Jobs endpoints
app.post('/jobs', (req, res) => {
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
    createdAt: new Date().toISOString()
  };

  jobs.push(job);
  res.status(201).json({ jobId, message: 'Job created successfully' });
});

app.get('/jobs', (req, res) => {
  const { district } = req.query;
  let filteredJobs = jobs.filter(job => job.status === 'matching');
  
  if (district) {
    filteredJobs = filteredJobs.filter(job => job.district === district);
  }
  
  res.json(filteredJobs);
});

app.listen(port, () => {
  console.log(`🚀 JetBond API server running on port ${port}`);
  console.log(`📱 Ready for Flutter frontend!`);
  console.log(`🔗 Test: http://localhost:${port}/test`);
});