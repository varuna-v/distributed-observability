import { aws_lambda, Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import {
  DynamoEventSource,
  SqsDlq,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Datadog } from "datadog-cdk-constructs-v2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class DistributedObservabilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    cdk.Tags.of(this).add("project", "distributed-observability-sample");

    const datadogApiKey = StringParameter.fromStringParameterName(
      this,
      "DataDogApiKeyParameter",
      "/datadog/APIKey"
    );
    const datadog = new Datadog(this, "Datadog", {
      addLayers: true,
      apiKey: datadogApiKey.stringValue,
      site: "datadoghq.eu",
      nodeLayerVersion: 106,
      extensionLayerVersion: 55,
      captureLambdaPayload: true,
      service: "sample-app",
      env: "dev",
      version: "0.1",
    });

    const eventBus = new events.EventBus(this, "SampleEventBus");

    const table = new dynamodb.Table(this, "SampleTable", {
      partitionKey: { name: "_PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "_SK", type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "_TTL",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const queueA = new sqs.Queue(this, "sample-queue-a", {
      deadLetterQueue: {
        queue: new sqs.Queue(this, "sample-queue-a-dlq"),
        maxReceiveCount: 3,
      },
    });

    const rule = new events.Rule(this, "SampleQueueARule", {
      eventBus: eventBus,
      eventPattern: { source: ["sample-app"], detailType: ["EventA"] },
      targets: [new targets.SqsQueue(queueA)],
    });

    const lambdaA = new NodejsFunction(this, "SampleLambdaA", {
      functionName: "SampleLambdaA",
      entry: "src/lambda-a.ts",
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      handler: "functionHandler",
      environment: { DDB_TABLE_NAME: table.tableName },
      bundling: {
        externalModules: ["datadog-lambda-js", "dd-trace", "@aws-sdk/*"],
      },
    });
    table.grantReadWriteData(lambdaA);
    lambdaA.addEventSource(new SqsEventSource(queueA));

    const streamListenerLambda = new NodejsFunction(
      this,
      "SampleStreamListenerLambda",
      {
        functionName: "StreamListener",
        entry: "src/streamListener.ts",
        runtime: aws_lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(10),
        handler: "functionHandler",
        environment: {
          DDB_TABLE_NAME: table.tableName,
          EB_BUS_NAME: eventBus.eventBusName,
        },
        bundling: {
          externalModules: ["datadog-lambda-js", "dd-trace", "@aws-sdk/*"],
        },
      }
    );
    table.grantStreamRead(streamListenerLambda);

    var streamFailureDeadLetterQueue = new sqs.Queue(
      this,
      "streamFailureDeadLetterQueue"
    );
    streamListenerLambda.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: aws_lambda.StartingPosition.LATEST,
        onFailure: new SqsDlq(streamFailureDeadLetterQueue),
        retryAttempts: 3,
      })
    );
    eventBus.grantPutEventsTo(streamListenerLambda);

    const queueB = new sqs.Queue(this, "sample-queue-b", {
      deadLetterQueue: {
        queue: new sqs.Queue(this, "sample-queue-b-dlq"),
        maxReceiveCount: 3,
      },
    });

    const ruleB = new events.Rule(this, "SampleQueueBRule", {
      eventBus: eventBus,
      eventPattern: { source: ["sample-app"], detailType: ["EventB"] },
      targets: [new targets.SqsQueue(queueB)],
    });

    const lambdaB = new NodejsFunction(this, "SampleLambdaB", {
      functionName: "SampleLambdaB",
      entry: "src/lambda-b.ts",
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      handler: "functionHandler",
    });
    lambdaB.addEventSource(new SqsEventSource(queueB));

    datadog.addLambdaFunctions([lambdaA, streamListenerLambda, lambdaB]);
  }
}
