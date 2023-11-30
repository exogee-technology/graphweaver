import { Field, ID, ObjectType } from '@exogee/graphweaver';
import GraphQLJSON from 'graphql-type-json';
import { ImageField } from '../module';

interface AgendaSlot {
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	hosts: any[];
}

interface AgendaTrack {
	name: string;
	slots: AgendaSlot[];
}

interface FAQ {
	question: string;
	answer: string;
}

interface AgendaModule {
	tabs: AgendaTrack[];
}

interface FaqModule {
	faq: FAQ[];
}

interface FaqsModule {
	faqs: FAQ[];
}

interface HeroCarouselModule {
	slides: ImageField[];
}

@ObjectType('Widget')
export class EventbriteWidget {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	type: string;

	@Field(() => GraphQLJSON, { nullable: true })
	data: AgendaModule | FaqModule | FaqsModule | HeroCarouselModule;
}
