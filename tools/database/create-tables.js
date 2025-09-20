require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB();

async function createTables() {
  try {
    // Create Users table
    await dynamodb.createTable({
      TableName: 'jetbond-users',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }).promise();
    console.log('✓ Created jetbond-users table');

    // Create Jobs table
    await dynamodb.createTable({
      TableName: 'jetbond-jobs',
      KeySchema: [{ AttributeName: 'jobId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'jobId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }).promise();
    console.log('✓ Created jetbond-jobs table');

  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Tables already exist');
    } else {
      console.error('Error:', error.message);
    }
  }
}

createTables();