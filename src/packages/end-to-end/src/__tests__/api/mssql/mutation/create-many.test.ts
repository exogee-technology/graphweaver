import { describe } from 'node:test';
import { createManySuite, mssqlOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(mssqlOptions.name, () => createManySuite(mssqlOptions));
