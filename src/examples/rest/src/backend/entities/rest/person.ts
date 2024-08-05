import { BaseEntity, Field } from '@exogee/graphweaver-rest';

/*
Example Person from API
{
        "name": "Luke Skywalker",
        "height": "172",
        "mass": "77",
        "hair_color": "blond",
        "skin_color": "fair",
        "eye_color": "blue",
        "birth_year": "19BBY",
        "gender": "male",
        "homeworld": "https://swapi.info/api/planets/1",
        "films": [
            "https://swapi.info/api/films/1",
            "https://swapi.info/api/films/2",
            "https://swapi.info/api/films/3",
            "https://swapi.info/api/films/6"
        ],
        "species": [],
        "vehicles": [
            "https://swapi.info/api/vehicles/14",
            "https://swapi.info/api/vehicles/30"
        ],
        "starships": [
            "https://swapi.info/api/starships/12",
            "https://swapi.info/api/starships/22"
        ],
        "created": "2014-12-09T13:50:51.644000Z",
        "edited": "2014-12-20T21:17:56.891000Z",
        "url": "https://swapi.info/api/people/1"
    },
*/
export class Person extends BaseEntity {
	@Field()
	name!: string;

	@Field()
	height!: string;

	@Field()
	mass!: string;

	@Field()
	hair_color!: string;

	@Field()
	birth_year!: string;

	@Field()
	url!: string;
}
