import { BaseEntity } from './base-entity';
import { Field } from '../decorators';
import { Dog } from './dog';
import { OneToMany } from '../decorators/one-to-many';
import { RestLookupProvider } from '../base-resolver';

class Collection<T> {
	readonly provider: any;
	readonly owner: object;
	protected items?: T[];
	protected initialized = false;
	protected _count?: number;
	// constructor(owner: object, items?: T[]);
	// loadCount(): Promise<number>;
	// getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[];
	// contains(item: T | Reference<T>, check?: boolean): boolean;
	// loadItems<P extends string = never>(options?: InitOptions<T, P>): Promise<Loaded<T, P>[]>;

	constructor(owner: object) {
		this.owner = owner;
		this.provider = new RestLookupProvider(Dog);
	}

	public isInitialized = () => {
		return this.initialized;
	};

	public toArray = () => {
		if (this.items) return Array.from(this.items);
		else throw new Error('The collection is not loaded yet');
	};

	public toJSON = () => {
		return JSON.stringify(this.toArray());
	};

	public getItems = () => {
		return this.toArray();
	};

	public async loadItems(): Promise<void> {
		this.items = await this.provider.findAll(); //this.provider.findByRelatedId(Dog, 'breederId', ['1']);
		this._count = this.items?.length;
		this.initialized = true;
	}

	// public getIdentifiers = () => {

	// }

	// public loadCount = () => {

	// }

	// public count() => {
	// 	if (this._count)
	// 	return this._count;
	// 	else throw new Error('The collection is not loaded yet');
	// }
}

export class Breeder extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;

	@OneToMany(() => Dog, {})
	dogs = new Collection<Dog>(this);
}
