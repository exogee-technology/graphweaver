import { CHARSET, GraphweaverFuzzClient, request } from "../utils";
import { mathOperations, likeOperations } from "@exogee/graphweaver/src/operations";

interface Task {
    id: string;
    description: string;
}
const FIVE_SECONDS = 5 * 1000;

// TODO: Use env variable
const fuzzer = new GraphweaverFuzzClient('http://localhost:9001');


describe('Read operations (queries)', () => {
    beforeAll(async () => {
        // From the REST with auth example README
        await fuzzer.loginPassword('luke', 'lightsaber123');
    });

    test('Tasks', async () => {
        const query = request`query tasks($filter: TasksListFilter!) { tasks(filter: $filter) { id description } }`

        let { tasks } = await fuzzer.makeRequest<{ tasks: Task[] }>(query, { variables: { filter: {} } });
        const expectedTaskIds = tasks.map((t) => t.id);

        for (const c of CHARSET) {
            let { tasks } = await fuzzer.makeRequest<{ tasks: Task[] }>(query, { 
                variables: { filter: { description_ilike: `%${c}%` } } 
            });
            for (const {id} of tasks) {
                expect(expectedTaskIds).toContain(id);
            }
            expect(expectedTaskIds.length).toBeGreaterThanOrEqual(tasks.length);
        }

    });

    test('Blind MySQLi', async () => {
        const taskQuery = request`query tasks($filter: TasksListFilter!) { tasks(filter: $filter) { id description } }`
        const payload = "'-SLEEP(30); #"

        const stringFields = ['description', 'userId', 'slug'];
        const filters: Record<string, any>[] = [];
        for (const f of stringFields) {
            const or: Record<string, any> = {}
            or[f] = payload;
            for (const op of [...mathOperations, ...likeOperations, 'ne']) {
                or[`${f}_${op}`] = payload;
            } 
            filters.push(or);
        }
        // Use 'or' to have the provider try to evaluate every filter
        const tasksPromise = fuzzer.makeRequest<{ tasks: Task[] }>(taskQuery, { variables: { filter: { _or: filters } } });
        const startTime = Date.now();
        await tasksPromise;
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(FIVE_SECONDS);
        
    });

})