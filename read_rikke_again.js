const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function readRikkeProfile() {
    try {
        const params = {
            TableName: process.env.USERS_TABLE,
            Key: {
                userId: 'rikke@jetbond.com'
            }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (result.Item) {
            console.log('Profile for rikke@jetbond.com:');
            console.log(JSON.stringify(result.Item, null, 2));
        } else {
            console.log('Profile not found for rikke@jetbond.com');
        }
    } catch (error) {
        console.error('Error reading profile:', error.message);
    }
}

readRikkeProfile();