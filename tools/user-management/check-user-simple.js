require('dotenv').config();
const AWS = require('aws-sdk');

// Try to list tables first to check connection
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new AWS.DynamoDB();

async function checkConnection() {
  try {
    console.log('=== CHECKING AWS CONNECTION ===');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Users Table:', process.env.USERS_TABLE);
    
    const tables = await dynamodb.listTables().promise();
    console.log('Available tables:', tables.TableNames);
    
    if (tables.TableNames.includes(process.env.USERS_TABLE || 'jetbond-users')) {
      console.log('✓ Users table exists');
      
      // Try to scan with limit
      const docClient = new AWS.DynamoDB.DocumentClient();
      const result = await docClient.scan({
        TableName: process.env.USERS_TABLE || 'jetbond-users',
        Limit: 5
      }).promise();
      
      console.log(`Found ${result.Items.length} users in table`);
      result.Items.forEach((user, i) => {
        console.log(`User ${i+1}: ${user.userId} - ${user.profiles?.employee?.name || user.profiles?.employer?.name || 'No name'}`);
      });
    } else {
      console.log('✗ Users table not found');
    }
    
  } catch (error) {
    console.error('Connection error:', error.message);
    console.log('\n=== TROUBLESHOOTING ===');
    console.log('1. Check AWS credentials in .env file');
    console.log('2. Verify AWS region is correct');
    console.log('3. Ensure DynamoDB table exists');
  }
}

checkConnection();