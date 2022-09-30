import { BaseEntity } from "./base-entity";
import { Field } from "../decorators";

export class Dog extends BaseEntity {
	@Field()
	id!: string;
	
	@Field()
	name!: string;
}
