import { Field } from "../decorators";
import { BaseEntity } from "./base-entity";

export class Dog extends BaseEntity {
	@Field()
	id!: string;
	
	@Field()
	name!: string;
}
