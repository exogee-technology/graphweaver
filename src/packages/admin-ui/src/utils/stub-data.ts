import { Entity } from './use-schema';

export const schema: Entity[] = [
	{ name: 'Breeder', backendId: 'mikro-orm', fields: [{ name: 'id', type: 'ID!' }] },
	{
		name: 'Dog',
		backendId: 'rest',
		summaryField: 'name',
		fields: [
			{ name: 'id', type: 'ID!' },
			{ name: 'name', type: 'String!' },
			{ name: 'breeder', type: 'Breeder', relationshipType: 'm:1' },
		],
	},
	{ name: 'Hobby', backendId: 'mikro-orm', fields: [{ name: 'id', type: 'ID!' }] },
	{
		name: 'User',
		backendId: 'mikro-orm',
		summaryField: 'name',
		fields: [
			{ name: 'id', type: 'ID!' },
			{ name: 'name', type: 'string' },
			{ name: 'hobbies', type: 'Hobby[]', relationshipType: 'm:n' },
			{ name: 'skills', type: 'Skill[]', relationshipType: 'm:n' },
			{ name: 'userDogs', type: 'UserDog[]', relationshipType: 'm:n' },
		],
	},
	{
		name: 'UserDog',
		backendId: 'mikro-orm',
		summaryField: 'id',
		fields: [
			{ name: 'id', type: 'ID!' },
			{ name: 'dogs', type: 'Dog[]', relationshipType: '1:n' },
		],
	},
];
