import { cognitoUser } from '../cognito';

export const resolvers = [cognitoUser.resolver];
