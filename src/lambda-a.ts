import { SQSEvent, Context, SQSHandler, SQSRecord } from "aws-lambda";
import DynamoDB = require("aws-sdk/clients/dynamodb");
import { setTag } from "../helpers/observability/spans/set-tag";
import { marshall } from "@aws-sdk/util-dynamodb";
const { getTraceHeaders } = require("datadog-lambda-js");

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

    let body = JSON.parse(message.body);

    let customerId = body.detail.detail.customerId || "";
    if (customerId) {
      setTag({ name: "customerId", value: customerId });
    }
    const keys = {
      _PK: customerId,
      _SK: "4",
    };
    const data = JSON.parse(message.body);

    const traceData = getTraceHeaders();

    const recordToPut = {
      ...keys,
      ...data,
      ddTraceData: traceData,
    };
    var formattedItem = marshall(recordToPut);
    let dynamodb = new DynamoDB();

    let tableName = process.env.DDB_TABLE_NAME || "";
    let item: DynamoDB.PutItemInput = {
      TableName: tableName,
      Item: formattedItem,
    };

    await dynamodb.putItem(item).promise();
  } catch (err) {
    console.error("An error occurred");
    throw err;
  }
}
