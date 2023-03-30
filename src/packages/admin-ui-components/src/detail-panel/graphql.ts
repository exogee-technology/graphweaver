import { gql } from '@apollo/client';

export const generateUpdateEntityMutation = (entityName: string, fields: string[]) => gql`
    mutation updateEntity ($data: ${entityName}CreateOrUpdateInput!){
      update${entityName} (data: $data) {
        id
        ${fields.map(
					(field) => `${field}
        `
				)}
      }
    }
  `;
