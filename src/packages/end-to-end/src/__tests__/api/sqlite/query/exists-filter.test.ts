import { describe } from 'node:test';
import { existsFilterSuite, sqliteOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(sqliteOptions.name, () => existsFilterSuite(sqliteOptions));
