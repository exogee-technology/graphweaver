import { describe } from 'node:test';
import { basicFilterSuite, postgresOptions } from '../../shared/suites';

// The suite names what it tests, not what ran it, so the dialect goes on the outside.
describe(postgresOptions.name, () => basicFilterSuite(postgresOptions));
