import { Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

interface LambdaStackProps extends StackProps {
  stackTable: ITable;
}

export class LambdaStack extends Stack {
  public readonly helloLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const helloLambda = new lambda.Function(this, "MyLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(join(__dirname, "../../services")),
      handler: "hello.main",
      environment: {
        TABLE_NAME: props?.stackTable.tableName,
      },
    });

    this.helloLambdaIntegration = new LambdaIntegration(helloLambda);
  }
}
