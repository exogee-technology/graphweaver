import { Authorized } from 'type-graphql';

const readOnlyFuncs = ['list', 'getOne'];
const writeFuncs = ['createItem', 'update', 'deleteItem', 'updateMany', 'createMany'];

export function AuthorizedBaseFunctions(
	groups?: string | string[],
	enforceAuthorizationOn?: 'all' | 'writeOnly'
) {
	return function (constructor: any): void {
		// TODO: Refactor this logic so that typegraphql metadata is applied within base-resolver.ts
		// using metadata collected by this decorator, rather than being applied after the fact here

		// The Authorized decorator must be applied at the level in the class hierachy
		// where the relevant functions are defined
		const firstLevelPrototype = Object.getPrototypeOf(constructor.prototype);
		let secondLevelPrototype: any = undefined;

		if (firstLevelPrototype.constructor.name === 'WritableBaseResolver') {
			secondLevelPrototype = Object.getPrototypeOf(firstLevelPrototype);
			// Always apply authorisation to write endpoints (if they exist)
			writeFuncs.forEach((funcName) => {
				Authorized(groups)(firstLevelPrototype, funcName);
			});
		}

		// Apply authorisation to read functions if requested
		const prototypeForReadFuncs = secondLevelPrototype ?? firstLevelPrototype;
		if (prototypeForReadFuncs.constructor.name !== 'BaseResolver') {
			throw new Error('Authentication middleware could not be initialised');
		}
		if (!enforceAuthorizationOn || enforceAuthorizationOn === 'all') {
			readOnlyFuncs.forEach((funcName) => {
				Authorized(groups)(prototypeForReadFuncs, funcName);
			});
		}
	};
}