import { request } from ".";

// Taken from https://github.com/swisskyrepo/GraphQLmap
export const CHARSET = '!$%\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';

export const loginRequest = request`
    mutation loginPassword($username: String, $password: String) {
        loginPassword(username: $username, password: $password) {
            authToken
        }
    }
`;