import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class ResourceImporter {
  getVpc(vpcId: string, scope: Construct): ec2.IVpc {
    const vpc = ec2.Vpc.fromLookup(scope, "ImportedVPC", {
      vpcId,
    });
    return vpc;
  }

  getSecurityGroup(sgId: string, scope: Construct): ec2.ISecurityGroup {
    const sg = ec2.SecurityGroup.fromLookupById(scope, `ImportedSg-${sgId}`, sgId);
    return sg;
  }
}
