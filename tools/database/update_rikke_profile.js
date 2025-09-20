const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateProfile() {
    try {
        const params = {
            TableName: process.env.USERS_TABLE,
            Key: { userId: 'rikke@jetbond.com' },
            UpdateExpression: 'SET profiles.employee.jobDescription = :desc, profiles.employee.preferredDistricts = :districts',
            ExpressionAttributeValues: {
                ':desc': 'I have experience in french restaurant and japanese restaurant',
                ':districts': ['Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Tai Koo', 'Quarry Bay']
            }
        };
        
        await dynamodb.update(params).promise();
        console.log('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error.message);
    }
}

updateProfile();