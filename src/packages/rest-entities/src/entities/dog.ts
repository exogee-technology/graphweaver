import { BaseEntity } from './base-entity';
import { Field, ManyToOne } from '../decorators';
import { Breeder } from './breeder';

class Reference<T> {
	private entity: any;

	constructor(entity: T) {
		this.entity = entity;
		this.set(entity);
	}

	static create(entity: any) {
		if (Reference.isReference(entity)) {
			return entity;
		}
		return new Reference(entity);
	}
	static isReference(data: any) {
		return data && !!data.__reference;
	}
	static wrapReference(entity: any, prop: { wrappedReference: any }) {
		if (entity && prop.wrappedReference && !Reference.isReference(entity)) {
			return Reference.create(entity);
		}
		return entity;
	}
	static unwrapReference(ref: { unwrap: () => any }) {
		return Reference.isReference(ref) ? ref.unwrap() : ref;
	}
	async load(options: any) {
		const opts = typeof options === 'object' ? options : { prop: options };
		if (!this.isInitialized()) {
			await this.entity.init(undefined, opts?.populate, opts?.lockMode, opts?.connectionType);
		}
		if (opts.prop) {
			return this.entity[opts.prop];
		}
		return this.entity;
	}
	set(entity: T) {
		if (entity instanceof Reference) {
			entity = entity.unwrap();
		}
		this.entity = entity;
	}
	unwrap() {
		return this.entity;
	}
	getEntity() {
		if (!this.isInitialized()) {
			throw new Error(`Reference not initialized`);
		}
		return this.entity;
	}
	getProperty(prop: string | number) {
		return this.getEntity()[prop];
	}
	isInitialized() {
		return this.entity.__initialized;
	}
	populated(populated: any) {
		this.entity.populated(populated);
	}
	toJSON(...args: any) {
		return this.entity.toJSON(...args);
	}
}

export class Dog extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;

	@ManyToOne(() => Breeder)
	breeder!: () => Promise<Breeder | null>;
}
