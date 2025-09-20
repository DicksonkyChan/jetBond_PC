require('dotenv').config();
const AWS = require('aws-sdk');

console.log('=== DYNAMODB CONNECTION TEST ===');
console.log('Region:', process.env.AWS_REGION);
console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

async function testConnection() {
  try {
    const dynamodb = new AWS.DynamoDB();
    const tables = await dynamodb.listTables().promise();
    console.log('✓ Connected to DynamoDB');
    console.log('Tables:', tables.TableNames);
    
    const usersTable = process.env.USERS_TABLE || 'jetbond-users';
    if (tables.TableNames.includes(usersTable)) {
      console.log(`✓ Table '${usersTable}' exists`);
    } else {
      console.log(`✗ Table '${usersTable}' not found`);
    }
  } catch (error) {
    console.log('✗ DynamoDB connection failed');
    console.log('Error:', error.code, '-', error.message);
  }
}

testConnection();