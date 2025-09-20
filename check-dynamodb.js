require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table names
const USERS_TABLE = process.env.USERS_TABLE || 'jetbond-users';
const JOBS_TABLE = process.env.JOBS_TABLE || 'jetbond-jobs';

async function checkDynamoDB() {
  console.log('🔍 Checking DynamoDB Tables...\n');
  
  console.log('Configuration:');
  console.log(`  Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`  Users Table: ${USERS_TABLE}`);
  console.log(`  Jobs Table: ${JOBS_TABLE}`);
  console.log(`  Has Credentials: ${!!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)}\n`);

  try {
    // Check Users Table
    console.log('📋 Checking Users Table...');
    const usersResult = await dynamodb.scan({ 
      TableName: USERS_TABLE,
      Limit: 10 
    }).promise();
    
    console.log(`✅ Users found: ${usersResult.Count}`);
    if (usersResult.Items.length > 0) {
      console.log('Users:');
      usersResult.Items.forEach(user => {
        console.log(`  - ${user.userId} (${user.currentMode})`);
      });
    }
    console.log('');

    // Check Jobs Table
    console.log('💼 Checking Jobs Table...');
    const jobsResult = await dynamodb.scan({ 
      TableName: JOBS_TABLE,
      Limit: 10 
    }).promise();
    
    console.log(`✅ Jobs found: ${jobsResult.Count}`);
    if (jobsResult.Items.length > 0) {
      console.log('Jobs:');
      jobsResult.Items.forEach(job => {
        console.log(`  - ${job.jobId}: "${job.title}" (${job.status}) by ${job.employerId}`);
        if (job.expiredAt) {
          console.log(`    Expired: ${job.expiredAt}`);
        }
      });
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`  Total Users: ${usersResult.Count}`);
    console.log(`  Total Jobs: ${jobsResult.Count}`);
    
    if (jobsResult.Count === 0) {
      console.log('\n⚠️  No jobs found in DynamoDB!');
      console.log('   This explains why job history is empty.');
      console.log('   Jobs might not be saving to DynamoDB properly.');
    }

  } catch (error) {
    console.error('❌ Error accessing DynamoDB:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ResourceNotFoundException') {
      console.error('\n💡 Possible solutions:');
      console.error('   - Create the missing table in DynamoDB console');
      console.error('   - Check table names in environment variables');
    } else if (error.code === 'UnrecognizedClientException') {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check AWS credentials');
      console.error('   - Verify AWS region');
    }
  }
}

// Run the check
checkDynamoDB().then(() => {
  console.log('\n✨ DynamoDB check complete!');
}).catch(error => {
  console.error('💥 Script error:', error.message);
});