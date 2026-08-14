import type { Expect } from 'expect';
import type { mock as Mock } from 'node:test';

type HookFn = (...args: any[]) => any;
type Hook = (fn: HookFn, timeoutOrOptions?: number | Record<string, unknown>) => any;
type TestFn = {
	(name: string, fn: HookFn): any;
	(name: string, options: Record<string, unknown>, fn: HookFn): any;
	(name: string, fn: HookFn, timeout: number): any;
};

declare global {
	// Provided by node-test-setup.ts for API / fuzzer tests.
	var describe: typeof import('node:test').describe;
	var it: TestFn;
	var test: TestFn;
	var before: Hook;
	var after: Hook;
	var beforeEach: Hook;
	var afterEach: Hook;
	var beforeAll: Hook;
	var afterAll: Hook;
	var expect: Expect;
	var mock: typeof Mock;
}

export {};
