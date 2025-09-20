const http = require('http');

// First rate the employee
const rateData = JSON.stringify({
  rating: 'good',
  raterId: 'dee@jetbond.com',
  ratedUserId: 'rikke@jetbond.com'
});

const rateOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/jobs/dcf60c7e-2323-4ac4-b0bb-920a26b0f6c4/rate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(rateData)
  }
};

console.log('Rating employee...');
const rateReq = http.request(rateOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Rate response:', data);
    
    // Then complete the job
    const completeOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/jobs/dcf60c7e-2323-4ac4-b0bb-920a26b0f6c4/complete',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    };
    
    console.log('Completing job...');
    const completeReq = http.request(completeOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Complete response:', data);
      });
    });
    
    completeReq.on('error', (e) => console.error('Complete error:', e.message));
    completeReq.end();
  });
});

rateReq.on('error', (e) => console.error('Rate error:', e.message));
rateReq.write(rateData);
rateReq.end();