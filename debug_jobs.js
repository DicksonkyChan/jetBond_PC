const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/debug',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    const completedJobs = result.jobsList.filter(job => job.status === 'completed');
    
    console.log('Completed jobs:');
    completedJobs.forEach(job => {
      console.log(`- ${job.jobId}: "${job.title}" by ${job.employerId} -> ${job.selectedEmployeeId} (${job.status})`);
    });
    
    const rikkeJobs = completedJobs.filter(job => job.selectedEmployeeId === 'rikke@jetbond.com');
    console.log(`\nRikke's completed jobs: ${rikkeJobs.length}`);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();