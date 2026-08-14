import type { Expect } from 'expect';

declare global {
	// Provided by node-test-setup.ts for API / fuzzer tests.
	var expect: Expect;
}

export {};
