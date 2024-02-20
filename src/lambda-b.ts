import { SQSEvent, Context, SQSHandler } from "aws-lambda";

export const functionHandler: SQSHandler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  console.log("Entered");
  for (const message of event.Records) {
    console.log("Received event:", JSON.stringify(message.body, null, 2));
  }
  console.info("done");
};
