import { SQSEvent, Context, SQSHandler, SQSRecord } from "aws-lambda";
import DynamoDB = require("aws-sdk/clients/dynamodb");
import { v4 as uuidv4 } from "uuid";

export const functionHandler: SQSHandler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  for (const message of event.Records) {
    await processMessageAsync(message);
  }
  console.info("done");
};

async function processMessageAsync(message: SQSRecord): Promise<any> {
  try {
    console.log(`Processed message ${message.body}`);
    let dynamodb = new DynamoDB();

    let tableName = process.env.DDB_TABLE_NAME || "";
    let item: DynamoDB.PutItemInput = {
      TableName: tableName,
      Item: {
        _PK: { S: uuidv4() },
        _SK: { S: "4" },
        Data: { S: message.body },
      },
    };

    await dynamodb.putItem(item).promise();
  } catch (err) {
    console.error("An error occurred");
    throw err;
  }
}
