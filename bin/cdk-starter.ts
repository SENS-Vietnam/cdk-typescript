#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Ec2CdkStack } from "../lib/ec2-stack";

const app = new cdk.App();
new Ec2CdkStack(app, "Hieu-stack", {
  // new CdkWorkshopStack(app, 'CdkWorkshopStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

//
// import "source-map-support/register";
// import * as cdk from "aws-cdk-lib";
// import { ContextProps } from "../lib/ec2-with-bastion/types";
// import { AwsBastionEc2CdkStack } from "../lib/ec2-with-bastion/ec2-stack";
// import { AwsBastionNetworkCdkStack } from "../lib/ec2-with-bastion/network-stack";

// const app = new cdk.App();

// const environment = app.node.tryGetContext("environment");
// const context: ContextProps = app.node.tryGetContext(environment);
// context.environment = environment;

// const account = app.node.tryGetContext("account");

// new AwsBastionNetworkCdkStack(
//   app,
//   "AwsBastion-NetworkCdkStack",
//   {
//     description: "AwsBastionNetworkCdkStack (qs-1s91omist)",
//   },
//   context
// );

// new AwsBastionEc2CdkStack(
//   app,
//   "AwsBastion-Ec2CdkStack",
//   {
//     env: {
//       account: "053191768052",
//       region: context.region,
//     },
//     description: "AwsBastionEc2CdkStack (qs-1s91omj0d)",
//   },
//   context
// );
