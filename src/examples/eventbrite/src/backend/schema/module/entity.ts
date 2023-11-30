import { Field, ID, ObjectType } from '@exogee/graphweaver';
import GraphQLJSON from 'graphql-type-json';

interface BodyField {
	text: string;
}

export interface ImageField {
	id: string;
	url: string;
}

interface VideoField {
	url: string;
	embedUrl: string;
}

interface TextModule {
	body: BodyField;
}

interface ImageModule {
	image: ImageField;
}

interface VideoModule {
	video: VideoField;
}

@ObjectType('Module')
export class EventbriteModule {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	type: string;

	@Field(() => GraphQLJSON, { nullable: true })
	data: TextModule | ImageModule | VideoModule;
}
