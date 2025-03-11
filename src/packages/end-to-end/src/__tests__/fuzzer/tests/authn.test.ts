import { CHARSET, GraphweaverFuzzClient, loginRequest, request } from "../utils";

// TODO: Use env variable
const fuzzer = new GraphweaverFuzzClient('http://localhost:9001');


describe('In-built authentication operations', () => {

    test('loginPassword', async () => {

        const { authToken } = (await fuzzer.makeRequest<{ loginPassword: {authToken: string}}>(
                    loginRequest, 
                    { variables: { username: '', password: '' } }
                )).loginPassword;

    });


    
})