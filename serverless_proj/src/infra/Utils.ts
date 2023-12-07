import * as cdk from "aws-cdk-lib";

export function getStackSuffix(stack: cdk.Stack) {
  const stackId = cdk.Fn.select(2, cdk.Fn.split("/", stack.stackId));
  const stackSuffix = cdk.Fn.select(4, cdk.Fn.split("-", stackId));
  return stackSuffix;
}
