const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function scanAllUsers() {
    try {
        const params = {
            TableName: process.env.USERS_TABLE
        };
        
        const result = await dynamodb.scan(params).promise();
        
        console.log(`Found ${result.Items.length} users:`);
        result.Items.forEach((user, index) => {
            console.log(`\n--- User ${index + 1} ---`);
            console.log(JSON.stringify(user, null, 2));
        });
    } catch (error) {
        console.error('Error scanning users:', error.message);
    }
}

scanAllUsers();