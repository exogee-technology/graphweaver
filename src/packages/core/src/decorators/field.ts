import { graphweaverMetadata } from '../metadata';
import { AdminUIFilterType, Complexity, GetTypeFunction } from '../types';

export enum DetailPanelInputComponentOption {
	TEXT = 'TEXT',
	RICH_TEXT = 'RICH_TEXT',
	MARKDOWN = 'MARKDOWN',
}

/**
 * Interface representing the input component for a detail panel.
 */
export interface DetailPanelInputComponent {
	/**
	 * The name of the detail panel input component option.
	 */
	name: DetailPanelInputComponentOption;
	/**
	 * Optional configuration for various text formatting options.
	 */
	options?: {
		/**
		 * Allow text to be bolded. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		bold?: { hide?: boolean };
		/**
		 * Allow text to be italicized. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		italic?: { hide?: boolean };
		/**
		 * Allow text to be struck through. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		strike?: { hide?: boolean };
		/**
		 * Allow text to be formatted as code. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		code?: { hide?: boolean };
		/**
		 * Allow selected text to be converted to h1 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h1?: { hide?: boolean };
		/**
		 * Allow selected text to be converted to h2 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h2?: { hide?: boolean };
		/**
		 * Allow selected text to be converted to h3 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h3?: { hide?: boolean };
		/**
		 * Allow selected text to be converted to h4 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h4?: { hide?: boolean };
		/**
		 * Allow selected text to be converted to h5 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h5?: { hide: boolean };
		/**
		 * Allow selected text to be converted to h6 title. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		h6?: { hide: boolean };
		/**
		 * Allow text to be converted to a hyperlink. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		link?: { hide?: boolean };
		/**
		 * Allow text to be formatted as a bullet list. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		bulletList?: { hide?: boolean };
		/**
		 * Allow text to be formatted as an ordered list. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		orderedList?: { hide?: boolean };
		/**
		 * Allow text to be formatted as a code block. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		codeBlock?: { hide?: boolean };
		/**
		 * Allow text to be formatted as a blockquote. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		blockquote?: { hide?: boolean };
		/**
		 * Allow a horizontal rule to be inserted. By default, this option is shown. Set `hide` to true to hide this option.
		 */
		horizontalRule?: { hide?: boolean };
	};
}

export type DateTimeFormat =
	| 'DATETIME_FULL'
	| 'DATETIME_FULL_WITH_SECONDS'
	| 'DATETIME_HUGE'
	| 'DATETIME_HUGE_WITH_SECONDS'
	| 'DATETIME_MED'
	| 'DATETIME_MED_WITH_SECONDS'
	| 'DATETIME_MED_WITH_WEEKDAY'
	| 'DATETIME_SHORT'
	| 'DATETIME_SHORT_WITH_SECONDS'
	| 'DATE_FULL'
	| 'DATE_HUGE'
	| 'DATE_MED'
	| 'DATE_MED_WITH_WEEKDAY'
	| 'DATE_SHORT'
	| 'TIME_24_SIMPLE'
	| 'TIME_24_WITH_LONG_OFFSET'
	| 'TIME_24_WITH_SHORT_OFFSET'
	| 'TIME_24_WITH_SECONDS'
	| 'TIME_WITH_LONG_OFFSET'
	| 'TIME_WITH_SHORT_OFFSET'
	| 'TIME_SIMPLE'
	| 'TIME_WITH_SECONDS';

export type CellFormatOptions =
	| {
			type: 'date';
			timezone?: 'UTC' | 'local' | string;
			format?: DateTimeFormat;
	  }
	| {
			type: 'currency';
			variant: 'AUD' | 'GBP' | 'USD' | 'JPY' | 'EUR' | 'CHF' | 'THB' | 'IDR' | string;
	  };

export interface FieldOptions {
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;
	primaryKeyField?: boolean;

	// This marks the field as read only in both the API and the admin UI.
	// This will supersede any other read only settings.
	readonly?: boolean;
	adminUIOptions?: {
		filterType?: AdminUIFilterType;
		filterOptions?: Record<string, unknown>;
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		hideInDetailForm?: boolean;
		readonly?: boolean;
		summaryField?: boolean;
		fieldForDetailPanelNavigationId?: boolean;
		format?: CellFormatOptions;

		/**
		 * Specifies a component to be utilized as input in the detail panel for this field.
		 * By default, a simple text input is used if the field is of type text.
		 */
		detailPanelInputComponent?: DetailPanelInputComponentOption | DetailPanelInputComponent;
	};
	apiOptions?: {
		// This marks the field as read only in the API.
		excludeFromBuiltInWriteOperations?: boolean;
		// This marks the field as required for update in the API.
		requiredForUpdate?: boolean;
	};

	// This can be used by any plugin to store additional information
	// namespace your key to avoid conflicts
	// See the `@MediaField` decorator for an example
	additionalInformation?: Record<string, unknown>;

	// Add custom field directives to this field
	directives?: Record<string, any>;
}

export function Field(getType: GetTypeFunction, options?: FieldOptions) {
	// Fields can be used on both Entities and InputObjects. When used on input objects we can't actually assert they're
	// on an entity, hence why Field's target is typed as `any`. It's actually G | any, but that's the same as just any.
	return (target: any, fieldName: string) => {
		graphweaverMetadata.collectFieldInformation({
			getType,
			target,
			name: fieldName,
			...options,
		});
	};
}
