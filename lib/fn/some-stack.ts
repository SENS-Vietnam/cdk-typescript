import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as s3 from "aws-cdk-lib/aws-s3";

export class SomeStack extends cdk.Stack {
  private stackSuffix: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.initSuffix();

    new s3.Bucket(this, "Bucket", {
      bucketName: `bucket-${this.stackSuffix}`,
    });
  }

  private initSuffix() {
    const stackId = cdk.Fn.select(2, cdk.Fn.split("/", this.stackId));
    this.stackSuffix = cdk.Fn.select(4, cdk.Fn.split("-", stackId));
  }
}
