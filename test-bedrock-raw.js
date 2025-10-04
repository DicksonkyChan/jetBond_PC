require('dotenv').config();
const AWS = require('aws-sdk');

async function testBedrockRawResponse() {
  console.log('🔍 Testing Raw Bedrock Agent Response...');
  
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  const bedrockAgent = new AWS.BedrockAgentRuntime({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  try {
    const params = {
      agentId: 'FYJAJXEBFY',
      agentAliasId: 'TSTALIASID',
      sessionId: 'raw-test-' + Date.now(),
      inputText: 'Please analyze this job matching request and respond with JSON only: Job: Office Cleaning in Central, HK$80/hour. Employees: [{"employeeId": "test1", "skills": ["cleaning"], "location": "Central", "rate": "70-90"}]. Respond with matches array.'
    };

    console.log('📡 Testing structured response from Bedrock Agent...');
    const response = await bedrockAgent.invokeAgent(params).promise();
    
    console.log('\n📦 Raw Response Object:');
    console.log('Type:', typeof response);
    console.log('Keys:', Object.keys(response));
    console.log('ContentType:', response.contentType);
    console.log('SessionId:', response.sessionId);
    console.log('Completion type:', typeof response.completion);
    console.log('Completion constructor:', response.completion.constructor.name);
    
    console.log('\n📊 Streaming Response Data:');
    let chunkCount = 0;
    let totalData = '';
    
    response.completion.on('data', (chunk) => {
      chunkCount++;
      console.log(`\n--- Chunk ${chunkCount} ---`);
      
      try {
        if (chunk) {
          console.log('Chunk type:', typeof chunk);
          console.log('Chunk constructor:', chunk.constructor?.name);
          
          // Extract data from Bedrock Agent response format
          if (chunk.chunk && chunk.chunk.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            console.log('Decoded bytes:', JSON.stringify(text));
            totalData += text;
          } else if (chunk.chunk) {
            console.log('Chunk object:', JSON.stringify(chunk.chunk, null, 2));
          }
          
          console.log('Raw chunk structure:', JSON.stringify(chunk, null, 2));
        } else {
          console.log('Chunk is null/undefined');
        }
      } catch (error) {
        console.log('Error processing chunk:', error.message);
      }
    });
    
    response.completion.on('end', () => {
      console.log('\n✅ Stream ended');
      console.log('Total accumulated data:', JSON.stringify(totalData));
      console.log('Total chunks received:', chunkCount);
    });
    
    response.completion.on('error', (error) => {
      console.log('\n❌ Stream error:', error.message);
    });
    
  } catch (error) {
    console.log('\n❌ Bedrock call failed:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error);
  }
}

testBedrockRawResponse();