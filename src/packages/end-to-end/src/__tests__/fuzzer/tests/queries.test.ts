import { CHARSET, GraphweaverFuzzClient, request } from '../utils';
import { mathOperations, likeOperations } from '@exogee/graphweaver/src/operations';

interface Task {
	id: string;
	description: string;
}
const FIVE_SECONDS = 5 * 1000;

// TODO: Use env variable
const fuzzer = new GraphweaverFuzzClient();

describe('Read operations (queries)', () => {
	beforeAll(async () => {
		// From the REST with auth example README
		await fuzzer.loginPassword('luke', 'lightsaber123');
	});

	test('Tasks', async () => {
		const query = request`query tasks($filter: TasksListFilter!) { tasks(filter: $filter) { id description } }`;

		const { data } = await fuzzer.makeRequest<{ tasks: Task[] }>(query, {
			variables: { filter: {} },
		});
		const expectedTaskIds = data.tasks.map((t) => t.id);

		for (const c of CHARSET) {
			const { tasks } = (
				await fuzzer.makeRequest<{ tasks: Task[] }>(query, {
					variables: { filter: { description_ilike: `%${c}%` } },
				})
			).data;
			for (const { id } of tasks) {
				expect(expectedTaskIds).toContain(id);
			}
			expect(expectedTaskIds.length).toBeGreaterThanOrEqual(tasks.length);
		}
	}, 10_000);

	test('Blind MySQLi', async () => {
		const taskQuery = request`query tasks($filter: TasksListFilter!) { tasks(filter: $filter) { id description } }`;
		const payload = "'-SLEEP(30); #";

		const stringFields = ['description', 'userId', 'slug'];
		const filters: Record<string, any>[] = [];
		for (const f of stringFields) {
			const or: Record<string, any> = {};
			or[f] = payload;
			for (const op of [...mathOperations, ...likeOperations, 'ne']) {
				or[`${f}_${op}`] = payload;
			}
			filters.push(or);
		}
		// Use 'or' to have the provider try to evaluate every filter
		const tasksPromise = fuzzer.makeRequest<{ tasks: Task[] }>(taskQuery, {
			variables: { filter: { _or: filters } },
		});
		const startTime = Date.now();
		await tasksPromise;
		const endTime = Date.now();
		expect(endTime - startTime).toBeLessThan(FIVE_SECONDS);
	}, 10_000);
});
