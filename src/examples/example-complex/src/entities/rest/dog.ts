import { RestLookupProvider, Field, ManyToOne } from '@exogee/graphweaver-rest';
import { BaseEntity } from './base-entity';
import { Breeder } from './breeder';

class Reference<T> {
	readonly provider: any;
	private entity: any;
	private isInitialized = false;
	// static isReference<T extends object>(data: any): data is Reference<T>;
	// static wrapReference<T extends object>(entity: T | Reference<T>, prop: EntityProperty<T>): Reference<T> | T;
	// static unwrapReference<T extends object>(ref: T | Reference<T>): T;
	// load<K extends keyof T = never, P extends string = never>(): Promise<T>;
	// load<K extends keyof T>(prop: K): Promise<T[K]>;
	// unwrap(): T;
	// getProperty<K extends keyof T>(prop: K): T[K];

	constructor(entity: T) {
		this.provider = new RestLookupProvider(Breeder);
	}

	public async load(): Promise<void> {
		this.entity = await this.provider.findOne('1');
		this.isInitialized = true;
	}

	public getEntity(): T {
		return this.entity;
	}
}

export class Dog extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;

	@ManyToOne(() => Breeder)
	breeder!: Reference<Breeder>;
}
