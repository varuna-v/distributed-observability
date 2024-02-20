import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

export const functionHandler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
): Promise<void> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const eventBridgeClient = new EventBridgeClient({ region: "eu-west-1" });

  let busName = process.env.EB_BUS_NAME || "";
  const putEventsCommand = new PutEventsCommand({
    Entries: [
      {
        EventBusName: busName,
        Source: "sample-app",
        DetailType: "EventB",
        Detail: JSON.stringify(event.Records[0].dynamodb?.NewImage),
      },
    ],
  });

  await eventBridgeClient.send(putEventsCommand);

  console.info("done");
};
