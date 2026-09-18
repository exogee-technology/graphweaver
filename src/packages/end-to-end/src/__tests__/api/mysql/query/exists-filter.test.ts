import { describe } from 'node:test';
import { existsFilterSuite, mysqlOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(mysqlOptions.name, () => existsFilterSuite(mysqlOptions));
