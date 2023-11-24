import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as fs from "fs";
import { Tags } from "aws-cdk-lib";

import { ContextProps } from "./types";

import { ResourceImporter } from "./resource-importer";

export class AwsBastionEc2CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps, context: ContextProps) {
    super(scope, id, props);

    const importer = new ResourceImporter();
    let vpcId: string = "";
    //Get VPC
    if (!context.existingVpcId) {
      const ssmPrefix = context.vpcConfig?.ssmPrefix;

      //Read VPC ID from SSM paramater deployed by "AwsBastion-NetworkCdkStack" stack
      // vpcId= ssm.StringParameter.fromStringParameterAttributes(this, 'vpcId' , {
      //   parameterName: `${ssmPrefix}/vpc/vpc-id`}).stringValue;

      //vpcId= cdk.Fn.importValue(`VpcId`).valueOf()
      vpcId = ssm.StringParameter.valueFromLookup(this, `${ssmPrefix}/vpc/vpc-id`);
    } else {
      vpcId = context.existingVpcId;
    }

    if (!vpcId) return;

    const vpc = importer.getVpc(vpcId, this);
    const subnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS });

    // console.log(`vpc instances\n: ${context.instances}`);
    //Loop all instances
    context.instances.forEach((instanceProps) => {
      const id = instanceProps.instanceId;

      //Create IAM Role that will be attached to current instance
      const role = new iam.Role(this, `${context.prefix}-${id}-Role`, {
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        roleName: `${context.prefix}-${id}-Role`,
      });
      // Add permissions for SSM Agent to IAM Role
      role.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
      );

      //Create SG for current instance (Allow outbound traffice by default, this can be restricted based on security requirements)
      const securityGroup = new ec2.SecurityGroup(this, `${id}-SecurityGroup`, {
        vpc,
        allowAllOutbound: true,
        securityGroupName: `${id}-SecurityGroup`,
      });

      // Inbound traffic can be restricted to specific CIDR
      if (instanceProps.allowConnectionsFromCidr) {
        securityGroup.addIngressRule(
          ec2.Peer.ipv4(instanceProps.allowConnectionsFromCidr),
          ec2.Port.tcp(22),
          "Allows SSH access from CIDR"
        );
      }

      // Create EC2 instance
      let machineImage = ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      });
      const instance = new ec2.Instance(this, `${id}-BastionInstance`, {
        vpc,
        vpcSubnets: subnets,
        role,
        securityGroup,
        instanceName: `${id}-BastionInstanceOnEC2`,
        instanceType: new ec2.InstanceType(instanceProps.instanceType),
        machineImage,
        keyName: "hieu-playground",
      });

      // Add allowed SG
      if (instanceProps.allowedSecurityGroups) {
        instanceProps.allowedSecurityGroups.forEach((sgId) => {
          const SG = sgId ? importer.getSecurityGroup(sgId, this) : null;
          if (SG) instance.addSecurityGroup(SG);
        });
      }

      //Add Tags to instance
      Tags.of(instance).add("Name", id);

      // Inject intial script to instance user data
      let initScriptPath = "lib/ec2-with-bastion/init-script.sh";
      const userData = fs.readFileSync(initScriptPath, "utf8");
      instance.addUserData(userData);

      instance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    });
  }
}
