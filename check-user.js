require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkUser() {
  try {
    // Scan for user with email rikke@jetbond.com
    const result = await dynamodb.scan({
      TableName: process.env.USERS_TABLE || 'jetbond-users',
      FilterExpression: 'contains(profiles.employee.#name, :email) OR contains(profiles.employer.#name, :email)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':email': 'rikke@jetbond.com'
      }
    }).promise();

    console.log('=== SEARCH RESULTS ===');
    console.log(`Found ${result.Items.length} users matching 'rikke@jetbond.com'`);
    
    if (result.Items.length > 0) {
      result.Items.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log('User ID:', user.userId);
        console.log('Current Mode:', user.currentMode);
        console.log('Employee Profile:', JSON.stringify(user.profiles?.employee, null, 2));
        console.log('Employer Profile:', JSON.stringify(user.profiles?.employer, null, 2));
        console.log('Created At:', user.createdAt);
        console.log('Updated At:', user.updatedAt);
      });
    } else {
      console.log('No users found with email rikke@jetbond.com');
    }

  } catch (error) {
    console.error('Error checking user:', error.message);
  }
}

checkUser();