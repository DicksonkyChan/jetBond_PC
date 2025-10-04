require('dotenv').config();
const AWS = require('aws-sdk');

async function testBedrockConnection() {
  console.log('🧪 Testing AWS Bedrock connection...');
  
  // Configure AWS
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  // Test IAM permissions first
  const sts = new AWS.STS();
  try {
    const identity = await sts.getCallerIdentity().promise();
    console.log('✅ AWS credentials valid');
    console.log('User ARN:', identity.Arn);
  } catch (error) {
    console.log('❌ AWS credentials invalid:', error.message);
    return;
  }

  const bedrockAgent = new AWS.BedrockAgentRuntime({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  try {
    const params = {
      agentId: 'FYJAJXEBFY',
      agentAliasId: 'TSTALIASID',
      sessionId: 'test-' + Date.now(),
      inputText: 'Hello, can you respond with "Connection successful"?'
    };

    console.log('📡 Calling Bedrock Agent...');
    const response = await bedrockAgent.invokeAgent(params).promise();
    
    console.log('✅ Bedrock Agent connection successful!');
    console.log('Response:', response);
    
  } catch (error) {
    console.log('❌ Bedrock connection failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    
    if (error.code === 'AccessDeniedException') {
      console.log('💡 Solution: Enable Claude model access in AWS Bedrock console');
    }
  }
}

testBedrockConnection();