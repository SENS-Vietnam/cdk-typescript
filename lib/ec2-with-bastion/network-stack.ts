import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ContextProps } from "./types";

export class AwsBastionNetworkCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps, context: ContextProps) {
    super(scope, id, props);

    const projectPrefix = context.prefix;
    const ssmPrefix = context.vpcConfig?.ssmPrefix;

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.100.0.0/16"),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 20,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    cdk.Tags.of(vpc).add("Name", `${projectPrefix}-vpc-${context.region}`);

    // Adding custom NACL for isolated subnets to only allow to/from private subnets
    const nacl = new ec2.NetworkAcl(this, "NACL", {
      vpc,
      networkAclName: "IsolatedSubnetNACL",
      subnetSelection: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }),
    });

    cdk.Tags.of(nacl).add("Name", `isolated-${context.region}`);

    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    });

    const publicSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    });

    const isolatedSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    });

    privateSubnets.subnets.forEach((subnet, index) => {
      nacl.addEntry(`PrivateSubnet${index}Ingress`, {
        cidr: ec2.AclCidr.ipv4(subnet.ipv4CidrBlock),
        direction: ec2.TrafficDirection.INGRESS,
        ruleNumber: 100 + index,
        traffic: ec2.AclTraffic.allTraffic(),
      });

      nacl.addEntry(`PrivateSubnet${index}Egress`, {
        cidr: ec2.AclCidr.ipv4(subnet.ipv4CidrBlock),
        direction: ec2.TrafficDirection.EGRESS,
        ruleNumber: 100 + index,
        traffic: ec2.AclTraffic.allTraffic(),
      });

      cdk.Tags.of(subnet).add("Name", `private-subnet-${subnet.availabilityZone}`);
    });

    publicSubnets.subnets.forEach((subnet) => {
      cdk.Tags.of(subnet).add("Name", `public-subnet-${subnet.availabilityZone}`);
    });

    isolatedSubnets.subnets.forEach((subnet) => {
      cdk.Tags.of(subnet).add("Name", `isolated-subnet-${subnet.availabilityZone}`);
    });
    // Generating outputs
    new cdk.CfnOutput(this, "VpcId", {
      description: "VPC ID",
      exportName: `${projectPrefix}-vpc-id`,
      value: vpc.vpcId,
    });

    new ssm.StringParameter(this, "ssmVpcId", {
      parameterName: `${ssmPrefix}/vpc/vpc-id`,
      stringValue: vpc.vpcId,
    });

    new cdk.CfnOutput(this, "VpcCidr", {
      description: "VPC CIDR",
      exportName: `${projectPrefix}-vpc-cidr`,
      value: vpc.vpcCidrBlock,
    });

    new ssm.StringParameter(this, "ssmVpcCidr", {
      parameterName: `${ssmPrefix}/vpc/vpc-cidr`,
      stringValue: vpc.vpcCidrBlock,
    });

    privateSubnets.subnets.forEach((subnet, index) => {
      new ssm.StringParameter(this, `ssmPrivateSubnetId-${index}`, {
        parameterName: `${ssmPrefix}/vpc/subnet/private/${subnet.availabilityZone}/id`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });

    publicSubnets.subnets.forEach((subnet, index) => {
      new ssm.StringParameter(this, `ssmPublicSubnetId-${index}`, {
        parameterName: `${ssmPrefix}/vpc/subnet/public/${subnet.availabilityZone}/id`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });

    isolatedSubnets.subnets.forEach((subnet, index) => {
      new ssm.StringParameter(this, `ssmIsolatedSubnetId-${index}`, {
        parameterName: `${ssmPrefix}/vpc/subnet/isolated/${subnet.availabilityZone}/id`,
        stringValue: subnet.subnetId,
        simpleName: false,
      });
    });
  }
}
