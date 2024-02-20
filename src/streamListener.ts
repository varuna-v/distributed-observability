import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";

export const functionHandler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
): Promise<void> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  console.info("done");
};
