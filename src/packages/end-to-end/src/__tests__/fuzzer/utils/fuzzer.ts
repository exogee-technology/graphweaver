const getOpname = /(query|mutation) ?([\w\d-_]+)? ?\(.*?\)? \{/;

interface GraphQLRequest {
	query: string;
	variables?: unknown;
	operationName?: string;
    headers?: Record<string, string>;

}
type RawRequest = ReturnType<typeof request>;
type RequestArgs = Omit<GraphQLRequest, "query" | "operationName">;

export const GRAPHQL_ENDPOINT = 'http://localhost:9001';

export const gql = (input: TemplateStringsArray) => {
	const str = Array.isArray(input) ? input.join('') : String(input);
	const name = getOpname.exec(str);

	return function (variables: GraphQLRequest['variables']) {
		const request: GraphQLRequest = { query: str };
		if (variables) request.variables = variables;
		if (name?.length) {
			const operationName = name[2];
			if (operationName) request.operationName = operationName;
		}
		return JSON.stringify(request);
	};
};

export const request = (query: TemplateStringsArray) => {
	const queryFunction = gql(query);

	return async <T>(request: RequestArgs) => {
		const fetchResult = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
                ...request.headers
			},
			body: queryFunction(request.variables),
		});
		return (await fetchResult.json()).data as T;
	};
};

export class GraphweaverFuzzClient {
    private url: string;
    private defaultHeaders: Record<string, string>;

    public constructor(url: string) {
        this.url = url;
        this.defaultHeaders = { 
            'Accept': 'application/json',
			'Content-Type': 'application/json',
        };
    }

    public get headers() : Record<string, string> {
        return this.defaultHeaders;
    }

    public setHeader(header: string, value: string) {
        this.defaultHeaders[header] = value;
    }

    public makeRequest<T>(rawRequest: RawRequest, requestArgs: RequestArgs) {
        const { headers, variables } = requestArgs;
        const requestHeaders = { ...this.defaultHeaders, ...headers }
        return rawRequest<T>({ variables, headers: requestHeaders });
    }
    
    /**
     * Utility to get a token to make subsequent requests with.
     * Not for fuzzing the loginPassword mutation
     * @param username 
     * @param password 
     */
    public async loginPassword(username: string, password: string) {
        const { loginPassword } = await this.makeRequest<{ loginPassword: {authToken: string}}>(request`
            mutation loginPassword($username: String, $password: String) {
                loginPassword(username: $username, password: $password) {
                    authToken
                }
            }
        `, { variables: { username, password }});

        this.setHeader('Authorization', loginPassword.authToken);

    }

}

