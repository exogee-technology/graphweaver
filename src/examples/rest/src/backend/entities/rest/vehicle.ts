import { BaseEntity, Field } from '@exogee/graphweaver-rest';
import { foreignKeySerializer } from '../../rest-client';

/*
Example Vehicle from API
  {
    "name": "Snowspeeder",
    "model": "t-47 airspeeder",
    "manufacturer": "Incom corporation",
    "cost_in_credits": "unknown",
    "length": "4.5",
    "max_atmosphering_speed": "650",
    "crew": "2",
    "passengers": "0",
    "cargo_capacity": "10",
    "consumables": "none",
    "vehicle_class": "airspeeder",
    "pilots": [
      "https://swapi.info/api/people/1",
      "https://swapi.info/api/people/18"
    ],
    "films": ["https://swapi.info/api/films/2"],
    "created": "2014-12-15T12:22:12Z",
    "edited": "2014-12-20T21:30:21.672000Z",
    "url": "https://swapi.info/api/vehicles/14"
  },
*/
export class Vehicle extends BaseEntity {
	@Field()
	url!: string;

	@Field()
	name!: string;

	@Field()
	model!: string;

	@Field()
	manufacturer!: string;

	@Field()
	costInCredits!: string;

	@Field()
	length!: string;

	@Field()
	crew!: string;

	@Field()
	passengers!: string;

	@Field({ serializer: foreignKeySerializer })
	pilots!: string[];
}
