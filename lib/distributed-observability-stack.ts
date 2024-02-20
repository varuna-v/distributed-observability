import { aws_lambda, Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import {
  DynamoEventSource,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class DistributedObservabilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    cdk.Tags.of(this).add("project", "distributed-observability-sample");

    const eventBus = new events.EventBus(this, "SampleEventBus");

    const queueA = new sqs.Queue(this, "sample-queue-a", {
      deadLetterQueue: {
        queue: new sqs.Queue(this, "sample-queue-a-dlq"),
        maxReceiveCount: 3,
      },
    });

    const rule = new events.Rule(this, "SampleQueueARule", {
      eventBus: eventBus,
      eventPattern: { source: ["trigger-a"] },
      targets: [new targets.SqsQueue(queueA)],
    });

    const table = new dynamodb.Table(this, "SampleTable", {
      partitionKey: { name: "_PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "_SK", type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "_TTL",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const lambdaA = new NodejsFunction(this, "SampleLambdaA", {
      entry: "src/lambda-a.ts",
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      handler: "functionHandler",
      environment: { DDB_TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(lambdaA);
    lambdaA.addEventSource(new SqsEventSource(queueA));

    const streamListenerLambda = new NodejsFunction(
      this,
      "SampleStreamListenerLambda",
      {
        entry: "src/streamListener.ts",
        runtime: aws_lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(10),
        handler: "functionHandler",
        environment: { DDB_TABLE_NAME: table.tableName },
      }
    );
    table.grantStreamRead(streamListenerLambda);

    streamListenerLambda.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: aws_lambda.StartingPosition.LATEST,
      })
    );
  }
}
