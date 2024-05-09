# Graphweaver connecting to AWS Cognito

This example documents how to connect Graphweaver to AWS Cognito.

## Getting Stared

For testing locally it can be good to have a local Cognito Pool. To do that run:

`npx cognito-local`

Cognito Local will now be listening on `http://localhost:9229`.

You can then create the user pool using the command:

`aws --endpoint http://localhost:9229 cognito-idp create-user-pool --pool-name MyUserPool`

Note: If you don't have aws cli installed run `brew install awscli`.

Next, copy the env var file, make sure that the region matches with your aws cli configuration.

`cp .env.example .env`

Finally, to start the server:

`pnpm start`
