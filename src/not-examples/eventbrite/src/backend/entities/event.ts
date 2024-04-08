import { BaseDataEntity } from '@exogee/graphweaver';

// @todo fill me in completely
export class EventbriteEventDataEntity implements BaseDataEntity {
	id!: string;

	[key: string]: any;

	name: {
		text: string;
		html: string;
	};

	start: {
		timezone: string;
		local: string;
		utc: string;
	};

	end: {
		timezone: string;
		local: string;
		utc: string;
	};

	capacity: number;
	capacity_is_custom: boolean;
	organization_id: string;
	is_series: boolean;
	is_series_parent: boolean;
	is_reserved_seating: boolean;
	is_free: boolean;

	isCollection() {
		return false;
	}
	isReference() {
		return false;
	}
}
