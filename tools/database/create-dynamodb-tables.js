const AWS = require('aws-sdk');

AWS.config.update({ region: 'ap-southeast-1' });
const dynamodb = new AWS.DynamoDB();

async function createTables() {
  const tables = [
    {
      TableName: 'jetbond-users',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    },
    {
      TableName: 'jetbond-jobs',
      KeySchema: [{ AttributeName: 'jobId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'jobId', AttributeType: 'S' },
        { AttributeName: 'district', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'DistrictIndex',
        KeySchema: [{ AttributeName: 'district', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }],
      BillingMode: 'PAY_PER_REQUEST'
    },
    {
      TableName: 'jetbond-matches',
      KeySchema: [
        { AttributeName: 'jobId', KeyType: 'HASH' },
        { AttributeName: 'employeeId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'jobId', AttributeType: 'S' },
        { AttributeName: 'employeeId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  ];

  for (const table of tables) {
    try {
      console.log(`Creating table: ${table.TableName}`);
      await dynamodb.createTable(table).promise();
      console.log(`✅ Created: ${table.TableName}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`⚠️  Table ${table.TableName} already exists`);
      } else {
        console.error(`❌ Error creating ${table.TableName}:`, error.message);
      }
    }
  }
}

createTables();