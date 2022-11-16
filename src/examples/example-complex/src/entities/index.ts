export * from './mikroorm';
export * from './rest';
import { User, Skill, Hobby, Session, Migration } from './mikroorm';

export const mikroOrmEntities = [User, Skill, Hobby, Session, Migration];
