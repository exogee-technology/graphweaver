import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { DetailPanelInputComponentOption, Entity, Field } from '../decorators';
import { graphweaverMetadata } from '../metadata';
import { AdminUiFieldAttributeMetadata } from './field-attribute';
import { AdminUiFieldExtensionsMetadata } from './field-extensions';
import { AdminUiFieldFormatMetadata } from './field-format';
import { AdminUiFilterMetadata } from './filter';

graphweaverMetadata.collectEnumInformation({
	name: 'DetailPanelInputComponentOption',
	target: DetailPanelInputComponentOption,
});

@Entity('DetailPanelInputComponent', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
class DetailPanelInputComponent {
	@Field(() => DetailPanelInputComponentOption)
	name!: string;

	@Field(() => GraphQLJSON, { nullable: true })
	options?: Record<string, unknown>;
}

@Entity('AdminUiFieldMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFieldMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	type!: string;

	@Field(() => String, { nullable: true })
	relationshipType?: string;

	@Field(() => String, { nullable: true })
	relatedEntity?: string;

	@Field(() => AdminUiFilterMetadata, { nullable: true })
	filter?: AdminUiFilterMetadata;

	@Field(() => AdminUiFieldFormatMetadata, { nullable: true })
	format?: AdminUiFieldFormatMetadata;

	@Field(() => AdminUiFieldAttributeMetadata, { nullable: true })
	attributes?: AdminUiFieldAttributeMetadata;

	@Field(() => AdminUiFieldExtensionsMetadata, { nullable: true })
	extensions?: AdminUiFieldExtensionsMetadata;

	@Field(() => Boolean, { nullable: true })
	isArray?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInTable?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInFilterBar?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInDetailForm?: boolean;

	@Field(() => DetailPanelInputComponent, { nullable: true })
	detailPanelInputComponent?: DetailPanelInputComponent;
}
