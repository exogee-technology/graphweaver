import { describe } from 'node:test';
import { createSuite, mssqlOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(mssqlOptions.name, () => createSuite(mssqlOptions));
