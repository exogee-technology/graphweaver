import dotenv from 'dotenv';
import {
	after as nodeAfter,
	afterEach as nodeAfterEach,
	before as nodeBefore,
	beforeEach as nodeBeforeEach,
	describe,
	it as nodeIt,
	mock,
	test as nodeTest,
} from 'node:test';
import { expect } from 'expect';

dotenv.config({
	path: '.env',
	quiet: true,
});

type AnyFn = (...args: any[]) => any;

const toHookOptions = (timeoutOrOptions?: number | Record<string, unknown>) => {
	if (typeof timeoutOrOptions === 'number') return { timeout: timeoutOrOptions };
	return timeoutOrOptions;
};

const wrapHook =
	(hook: AnyFn) => (fn: AnyFn, timeoutOrOptions?: number | Record<string, unknown>) =>
		hook(fn, toHookOptions(timeoutOrOptions));

const wrapTest =
	(testFn: AnyFn): AnyFn =>
	(...args: any[]) => {
		// Jest: test(name, fn, timeout)
		if (args.length >= 3 && typeof args[2] === 'number') {
			const [name, fn, timeout] = args;
			return testFn(name, { timeout }, fn);
		}
		// Node / Jest: test(name, options, fn) or test(name, fn)
		return testFn(...args);
	};

const before = wrapHook(nodeBefore);
const after = wrapHook(nodeAfter);
const beforeEach = wrapHook(nodeBeforeEach);
const afterEach = wrapHook(nodeAfterEach);
const test = wrapTest(nodeTest);
const it = wrapTest(nodeIt);

Object.assign(globalThis, {
	describe,
	it,
	test,
	before,
	after,
	beforeEach,
	afterEach,
	beforeAll: before,
	afterAll: after,
	expect,
	mock,
});
