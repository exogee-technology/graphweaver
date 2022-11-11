import { BaseEntity } from './base-entity';
import { Field, ManyToOne } from '../decorators';
import { Breeder } from './breeder';

export class Dog extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;

	@ManyToOne(() => Breeder)
	breeder?: Breeder;

	@Field()
	breederId?: string;
}
