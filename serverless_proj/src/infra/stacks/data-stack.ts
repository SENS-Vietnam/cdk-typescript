import { Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getStackSuffix } from "../Utils";

export class DataStack extends Stack {
  public readonly stackTable: ITable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const suffix = getStackSuffix(this);

    this.stackTable = new Table(this, "MyFirstTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "MyDataStackTable-" + suffix,
    });
  }
}
