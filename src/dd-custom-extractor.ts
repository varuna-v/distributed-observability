import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";

export const exportTraceData = (event: any) => {
  console.log("(CE) Received data:", event);

  let newImageRaw = event.Records[0].dynamodb?.NewImage || {};

  const newImage = unmarshall(newImageRaw as { [key: string]: AttributeValue });
  const traceData = newImage.ddTraceData;

  console.log("(CE) Trace data:", traceData);

  const traceID = traceData["x-datadog-trace-id"];

  console.log("Trace ID:", traceID);

  const parentID = traceData["x-datadog-parent-id"];
  const sampledHeader = traceData["x-datadog-sampling-priority"];
  const sampleMode = parseInt(sampledHeader, 10);

  return {
    parentID,
    sampleMode,
    source: "event",
    traceID,
  };
};
