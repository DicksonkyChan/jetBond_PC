const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function listUsers() {
    try {
        const result = await dynamodb.scan({
            TableName: process.env.USERS_TABLE
        }).promise();
        
        console.log(`Found ${result.Items.length} users:`);
        result.Items.forEach(user => {
            console.log(`- ${user.userId} (${user.profiles?.employee?.name || 'No name'})`);
        });
    } catch (error) {
        console.error('Error listing users:', error.message);
    }
}

listUsers();