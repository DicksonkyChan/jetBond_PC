const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkUserRikke() {
    try {
        const params = {
            TableName: process.env.USERS_TABLE,
            Key: {
                userId: 'user-rikke'
            }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (result.Item) {
            console.log('Found user-rikke:');
            console.log(JSON.stringify(result.Item, null, 2));
        } else {
            console.log('user-rikke not found in DynamoDB');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUserRikke();