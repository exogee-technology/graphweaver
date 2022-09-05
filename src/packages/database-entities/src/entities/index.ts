export * from './audit-change';
export * from './audit-related-entity-change';
export * from './session';
export * from './user';
export * from './hobby';
export * from './skill';

import { AuditChange } from './audit-change';
import { AuditRelatedEntityChange } from './audit-related-entity-change';
import { Session } from './session';
import { User } from './user';
import { Hobby } from './hobby';
import { Skill } from './skill';

export const allEntities = () => [
	AuditChange,
	AuditRelatedEntityChange,
	Session,
	User,
	Hobby,
	Skill,
];
