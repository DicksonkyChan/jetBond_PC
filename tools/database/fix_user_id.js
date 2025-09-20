const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function fixUserId() {
    try {
        // Get the user-rikke record
        const getResult = await dynamodb.get({
            TableName: process.env.USERS_TABLE,
            Key: { userId: 'user-rikke' }
        }).promise();
        
        if (getResult.Item) {
            // Create new record with email as userId
            const userData = { ...getResult.Item };
            userData.userId = 'rikke@jetbond.com';
            
            await dynamodb.put({
                TableName: process.env.USERS_TABLE,
                Item: userData
            }).promise();
            
            // Delete old record
            await dynamodb.delete({
                TableName: process.env.USERS_TABLE,
                Key: { userId: 'user-rikke' }
            }).promise();
            
            console.log('Successfully moved user-rikke to rikke@jetbond.com');
        } else {
            console.log('user-rikke not found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixUserId();