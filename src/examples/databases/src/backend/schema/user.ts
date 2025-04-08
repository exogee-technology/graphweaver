import {
	Field,
	ID,
	Entity,
	graphweaverMetadata,
	DetailPanelInputComponentOption,
	AdminUIFilterType,
} from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User as OrmUser, UserStatus } from '../entities';
import { pgConnection } from '../database';

graphweaverMetadata.collectEnumInformation({ target: UserStatus, name: 'UserStatus' });

@Entity<User>('User', {
	provider: new MikroBackendProvider(OrmUser, pgConnection),
	adminUIOptions: {
		// TODO: Enum values as default filters don't currently work. This is a known issue
		// defaultFilter: { status: UserStatus.ACTIVE },
		summaryField: 'username',
	},
})
export class User {
	@Field(() => ID)
	id!: string;

	@Field(() => String, {
		adminUIOptions: {
			filterOptions: {
				caseInsensitive: true,
				substringMatch: true,
			},
		},
	})
	username!: string;

	@Field(() => String)
	email!: string;

	@Field(() => UserStatus, { defaultValue: UserStatus.ACTIVE })
	status!: UserStatus;

	@Field(() => Number, {
		nullable: true,
		adminUIOptions: {
			filterType: AdminUIFilterType.NUMERIC_RANGE,
		},
	})
	age?: number;

	@Field(() => String, {
		nullable: true,
		description: 'Formatted text using rich text (saved as HTML)',
		adminUIOptions: {
			detailPanelInputComponent: {
				name: DetailPanelInputComponentOption.RICH_TEXT,
				options: {
					h5: { hide: true },
					h6: { hide: true },
				},
			},
		},
	})
	notes?: string;
}
