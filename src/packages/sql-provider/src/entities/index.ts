export * from './audit-change';
export * from './audit-related-entity-change';
import { AuditChange } from './audit-change';
import { AuditRelatedEntityChange } from './audit-related-entity-change';

export const allEntities = () => [AuditChange, AuditRelatedEntityChange];
