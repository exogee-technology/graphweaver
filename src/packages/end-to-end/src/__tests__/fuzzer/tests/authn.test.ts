import { GraphweaverFuzzClient, loginRequest, RequestError } from "../utils";

// TODO: Use env variable
const fuzzer = new GraphweaverFuzzClient();


describe('In-built authentication operations', () => {

    test('Information leaks in auth errors', async () => {

        // The first two usernames here belong to existing users, the rest don't.
        const usernames = ['luke', 'darth', 'admin', 'alice', 'bob', 'eve'];

        const example = await fuzzer.makeRequest<{ loginPassword: { authToken: string }}>(
            loginRequest, { variables: { username: 'fake', password: 'user' } }
        );

        expect(example.errors?.length).toEqual(1);
        
        // TODO: Learn how to make types work better here?
        const expectedError: RequestError = (example.errors?.[0] as unknown) as RequestError;
        expect(expectedError.locations.length).toEqual(1);

        for (const username of usernames) {

            const { errors, data } = await fuzzer.makeRequest<{ loginPassword: { authToken: string }}>(
                loginRequest, { variables: { username, password: 'password' } }
            );
            const error: RequestError = (errors?.[0] as unknown) as RequestError;

            expect(errors?.length).toEqual(1);
            expect(data.loginPassword).toBeNull();

            expect(error.message).toEqual(expectedError.message);
            expect(error.locations.length).toEqual(expectedError.locations.length);
            expect(error.locations[0]).toMatchObject(expectedError.locations[0]);
            expect(error.extensions).toMatchObject(expectedError.extensions);
            expect(error.path.length).toEqual(expectedError.path.length);
            expect(error.path[0]).toEqual(expectedError.path[0]);
        }
    });
});