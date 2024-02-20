#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DistributedObservabilityStack } from "../lib/distributed-observability-stack";

const app = new cdk.App();
new DistributedObservabilityStack(app, "DistributedObservabilityStack", {
  env: { account: "280933247747", region: "eu-west-1" },
});
