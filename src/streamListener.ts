import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { setTag } from "../helpers/observability";

export const functionHandler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
): Promise<void> => {
  console.log("hello from lambda");
  try {
    console.log("Received event details:", JSON.stringify(event, null, 2));
    let newImageRaw = event.Records[0].dynamodb?.NewImage || {};

    const newImage = unmarshall(
      newImageRaw as { [key: string]: AttributeValue }
    );

    console.log("finished unmarshalling:", newImage);

    setTag({ name: "customerId", value: newImage.detail.detail.customerId });

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
  } catch (err) {
    console.error(err);
  }
};
