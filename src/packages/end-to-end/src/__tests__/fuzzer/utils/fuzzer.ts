import { loginRequest } from ".";
import { config } from "../../../config";

const getOpname = /(query|mutation) ?([\w\d-_]+)? ?\(.*?\)? \{/;

interface GraphQLRequest {
	query: string;
	variables?: unknown;
	operationName?: string;
    headers?: Record<string, string>;

}
export type RawRequest = ReturnType<typeof request>;
export type RequestArgs = Omit<GraphQLRequest, "query" | "operationName">;
export interface RequestError { 
    message: string, 
    path: (string | number)[], 
    extensions: any, 
    locations: {line: number, column: number}[]
}

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

    /**
     * Allows extra headers to be specified
     */
	return async <T>(request: RequestArgs) => {
		const fetchResult = await fetch(config.baseUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
                ...request.headers
			},
			body: queryFunction(request.variables),
		});
		return (await fetchResult.json()) as { 
            data: T, 
            errors?: Error[]
        };
	};
};

export class GraphweaverFuzzClient {
    private defaultHeaders: Record<string, string>;

    public constructor() {
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
     * Not for fuzzing the loginPassword mutation.
     * @param username 
     * @param password 
     */
    public async loginPassword(username: string, password: string) {
        const { authToken } = (await this.makeRequest<{ loginPassword: {authToken: string}}>(
            loginRequest, 
            { variables: { username, password } }
        )).data.loginPassword;

        this.setHeader('Authorization', authToken);
    }
    

}

