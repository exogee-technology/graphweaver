# Graphweaver CDK Deployment

This package simplifies the deployment of your Graphweaver GraphQL applications on AWS, leveraging the AWS CDK (Cloud Development Kit). It streamlines infrastructure provisioning and configuration for your GraphQL backend and admin UI.

## Features

* AWS CDK Integration: Easily define your infrastructure as code.
* GraphQL Backend: Handles deployment and configuration of your GraphQL API.
* Admin UI: Deploys and secures the Graphweaver admin interface.
* Database: Deploys and secures a Postgres database and connects it to the backend.
* Customizable: Tailor API domain, certificates, environment variables, and more.

## Prerequisites

* AWS Account: You'll need an active AWS account.
* AWS CDK: Ensure the AWS CDK Toolkit is installed and configured.
* Node.js and pnpm: For development and package management.

## Installation

Install the package:

```Bash
pnpm install @exogee/graphweaver-cdk
```

## Usage

Create Your CDK App:

```TypeScript
import { App, Stack } from 'aws-cdk-lib';
import { GraphweaverApp } from '@exogee/graphweaver-cdk';
import { Vpc, SecurityGroup, Port} from 'aws-cdk-lib/aws-ec2';

const app = new App();
const stack = new Stack(app, 'GraphweaverStack');
const vpc = new Vpc(stack, 'GraphweaverVpc'); 

// Create Security Group for the Database
const dbSecurityGroup = new SecurityGroup(this, 'DbSecurityGroup', {
    vpc,
    description: 'Security group for the database',
});

// Security Group for GraphQL Lambda
const graphqlSecurityGroup = new SecurityGroup(this, 'GraphqlSecurityGroup', {
    vpc,
    description: 'Security group for GraphQL Lambda',
});

// Allow inbound traffic only from the GraphQL Lambda
dbSecurityGroup.addIngressRule(
    graphqlSecurityGroup,
    Port.tcp(5432),
    'Allow access from Lambda to RDS instance'
);

// Create Security Group for the Secrets Manager endpoint
const secretManagerSecurityGroup = new SecurityGroup(this, 'SecretsManagerSecurityGroup', {
    vpc: this.vpc,
    description: 'Security group for the Secrets Manager endpoint',
});

// Allow inbound traffic only from the GraphQL Lambda
secretManagerSecurityGroup.addIngressRule(
    this.graphqlSecurityGroup,
    Port.tcp(443),
    'Allow access from Lambda to Secrets Manager endpoint'
);

// Add VPC endpoint for Secrets Manager
this.vpc.addInterfaceEndpoint('vpc-secrets-manager-interface-endpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    privateDnsEnabled: true,
    securityGroups: [secretManagerSecurityGroup],
});


const config: GraphweaverAppConfig = {
  name: 'my-graphweaver-app',
  database: { /* ... your database config ... */ },
  adminUI: { /* ... your admin UI config ... */ },
  api: { /* ... your API config ... */ }
  network: {
    vpc,
    graphqlSecurityGroup,
    dbSecurityGroup
  }
};

new GraphweaverApp(stack, 'GraphweaverApp', config);
```

## Customize Your Configuration

Modify the GraphweaverAppConfig object to match your application's requirements.

Provide database credentials, certificates, domain names, environment variables, and other relevant settings.

## Deploy

```Bash
cdk deploy
```