const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteUser(userId) {
    try {
        await dynamodb.delete({
            TableName: process.env.USERS_TABLE,
            Key: { userId: userId }
        }).promise();
        
        console.log(`User ${userId} deleted successfully`);
    } catch (error) {
        console.error('Error deleting user:', error.message);
    }
}

deleteUser('user-rikke');