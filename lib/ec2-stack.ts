import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
// import { KeyPair } from 'cdk-ec2-key-pair';
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { installAwsCli, installDocker, installNode } from "./user-data";

export class Ec2CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create new VPC with 2 Subnets
    const vpc = new ec2.Vpc(this, "VPC", {
      vpcName: "VPC-Ec2CdkStack",
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Allow SSH (TCP Port 22) access from anywhere
    const publicSG = new ec2.SecurityGroup(this, "publicSG", {
      vpc,
      description: "Allow SSH (TCP port 22) in",
      allowAllOutbound: true,
      securityGroupName: "SG-Public-Ec2CdkStack",
    });
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "Allow SSH Access");
    publicSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcpRange(3000, 9999),
      "Allow For web server"
    );
    const privateSG = new ec2.SecurityGroup(this, "privateSG", {
      vpc,
      description: "Allow BASTION",
      allowAllOutbound: true,
      securityGroupName: "SG-Private-Ec2CdkStack",
    });
    privateSG.addIngressRule(publicSG, ec2.Port.tcp(22), "Allow SSH From public SG");
    privateSG.addIngressRule(publicSG, ec2.Port.tcpRange(1000, 30000), "Allow curl from public SG");

    // const _myBucket = new s3.Bucket(this, "ec2-cdk-stack-bucket", {
    //   bucketName: "ec2-cdk-stack-bucket",
    //   versioned: false,
    //   publicReadAccess: false,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    // });

    const role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Use Latest Amazon Linux Image - CPU Type ARM64
    // const machineImage = new ec2.AmazonLinuxImage({
    //   generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
    //   cpuType: ec2.AmazonLinuxCpuType.X86_64,
    // });
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      ...installNode,
      ...installDocker,
      ...installAwsCli,
      "aws s3 cp s3://static-store-playground/server.js .",
      "node server.js"
    );

    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      {
        os: ec2.OperatingSystemType.LINUX,
        userData,
      }
    );

    // Create the instance using the Security Group, AMI, and KeyPair defined in the VPC created
    const ec2Instance = new ec2.Instance(this, "PrivateInstance", {
      vpc,
      // instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage,
      securityGroup: privateSG,
      keyName: "hieu-playground",
      role: role,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
    });
    const bastion = new ec2.Instance(this, "Bastion", {
      vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: ec2.MachineImage.fromSsmParameter(
        "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
        { os: ec2.OperatingSystemType.LINUX }
      ),
      securityGroup: publicSG,
      keyName: "hieu-playground",
      role: role,
    });

    // Create an asset that will be used as part of User Data to run on first load
    // // const asset = new Asset(this, "Asset", { path: path.join(__dirname, "../src/config.sh") });
    // const asset = new Asset(this, "Asset", {
    //   path: path.join(__dirname, "../hieu-playground.pem"),
    // });
    // const localPath = ec2Instance.userData.addS3DownloadCommand({
    //   bucket: asset.bucket,
    //   bucketKey: asset.s3ObjectKey,
    // });

    // bastion.userData.addExecuteFileCommand({
    //   filePath: localPath,
    //   arguments: "--verbose -y",
    // });
    // asset.grantRead(bastion.role);

    const existingBucket = s3.Bucket.fromBucketName(
      this,
      "ExistingBucket",
      "static-store-playground"
    );
    existingBucket.grantReadWrite(role);

    // Create outputs for connecting
    // new cdk.CfnOutput(this, "Bastion IP Address", { value: bastion.instancePublicIp });
    new cdk.CfnOutput(this, "EC2 IP Address", { value: ec2Instance.instancePrivateIp });
    // new cdk.CfnOutput(this, 'Bastion IP ', { value: ec2Instance.instancePrivateIp })
    new cdk.CfnOutput(this, "ssh command", {
      value: "ssh -i cdk-key.pem -o IdentitiesOnly=yes ubuntu@" + bastion.instancePublicIp,
    });
  }
}
