import { describe, it, expect, beforeAll } from 'vitest';
import { extractInitialQuerySegment, getDidResolveOperationItemsToLog } from './utils';
import { Kind, parse, Token } from 'graphql';
import { graphweaverMetadata } from '@exogee/graphweaver';

describe('getFirstPartOfQuery', () => {
	it('should return the first part of a simple mutation query with a name', () => {
		const query1 = `
		mutation myMutation {
			loginPassword(username: "this user", password: "thingToHide") {
				authToken
			}
		}`;
		expect(extractInitialQuerySegment(query1)).toBe(
			'mutation myMutation{loginPassword(username...'
		);
	});

	it('should return the first part of a mutation query with variables', () => {
		const query2 = `
		mutation myMutation($username: String!, $userPrivateThing: String!) {
			loginPassword(username: $username, password: $userPrivateThing) {
				authToken
			}
		}`;
		expect(extractInitialQuerySegment(query2)).toBe('mutation myMutation($username...');
	});

	it('should return the first part of a query with multiple operations', () => {
		const query3 = `
		query getUser {
			user(id: "1") {
				name
			}
		}
		mutation updateUser {
			updateUser(id: "1", name: "newName") {
				id
			}
		}`;
		expect(extractInitialQuerySegment(query3)).toBe('query getUser{user(id...');
	});

	it('should return the first part of a subscription query with a name', () => {
		const query4 = `
		subscription onUserAdded {
			userAdded {
				id
				name
			}
		}`;
		expect(extractInitialQuerySegment(query4)).toBe('subscription onUserAdded{userAdded{id name}}');
	});

	it('should return an empty string for an empty query', () => {
		const query5 = ``;
		expect(extractInitialQuerySegment(query5)).toBe('');
	});

	it('should return the first part of a query without a name', () => {
		const query6 = `
		query {
			user(id: "1") {
				name
			}
		}`;
		expect(extractInitialQuerySegment(query6)).toBe('query{user(id...');
	});
});

beforeAll(() => {
	graphweaverMetadata.addMutation({
		name: 'loginPassword',
		args: {
			username: () => String,
			password: () => String,
		},
		getType: () => Token,
		resolver: async () => {
			console.log('loginPassword resolver called');
		},
		logOnDidResolveOperation: (params) => {
			// Notice, in real life this function would be in charge of obfuscating sensitive data.
			return {
				query: `custom query called with ${JSON.stringify(params.query)}`,
				variables: params.variables,
			};
		},
	});
});

describe('getDidResolveOperationItemsToLog', () => {
	it('Should call custom logger for simple custom mutation', () => {
		const query = `
			mutation test1($foo: String!) {
				loginPassword(username: "testUser", password: $foo) {
					authToken
				}
			}
		`;

		const ast = parse(query);

		const operationDefinitionNode = ast.definitions.find(
			(definition) => definition.kind === Kind.OPERATION_DEFINITION
		);

		if (!operationDefinitionNode) {
			throw new Error('No operation definition node found');
		}

		const result = getDidResolveOperationItemsToLog(operationDefinitionNode, {
			foo: 'bar',
		});

		expect(result).toEqual([
			{
				queryLog:
					'custom query called with "mutation test1($foo: String!) {\\n  loginPassword(username: \\"testUser\\", password: $foo) {\\n    authToken\\n  }\\n}"',
				variablesLog: '{"foo":"bar"}',
			},
		]);
	});

	it('Should call custom logger twice for two mutations in one call', () => {
		const query = `
			mutation test1($foo: String!) {
				loginPassword(username: "testUser", password: $foo) {
					authToken
				}
				loginPassword(username: "calledTwice", password: "asdf") {
					authToken
				}
			}
		`;

		const ast = parse(query);

		const operationDefinitionNode = ast.definitions.find(
			(definition) => definition.kind === Kind.OPERATION_DEFINITION
		);

		if (!operationDefinitionNode) {
			throw new Error('No operation definition node found');
		}

		const result = getDidResolveOperationItemsToLog(operationDefinitionNode, {
			foo: 'bar',
		});

		expect(result).toEqual([
			{
				queryLog:
					'custom query called with "mutation test1($foo: String!) {\\n  loginPassword(username: \\"testUser\\", password: $foo) {\\n    authToken\\n  }\\n}"',
				variablesLog: '{"foo":"bar"}',
			},
			{
				// TODO: $foo variable is not really needed here, we should remove it just like we did with the variable. However, we are not leaking sensitive data, just variable names.
				queryLog:
					'custom query called with "mutation test1($foo: String!) {\\n  loginPassword(username: \\"calledTwice\\", password: \\"asdf\\") {\\n    authToken\\n  }\\n}"',
				// Notice that the variable stays with the query it belongs to (the first query).
				variablesLog: '{}',
			},
		]);
	});
});
