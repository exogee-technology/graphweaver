import { describe } from 'node:test';
import { deleteSuite, sqliteOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(sqliteOptions.name, () => deleteSuite(sqliteOptions));
