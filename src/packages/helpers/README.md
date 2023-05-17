# Graphweaver Helpers

A package that contains helpers for working with graphweaver schemas.

## Exported Functions

### createResolver

Create a basic graphweaver resolver by providing a name, field configuration and provider.
The provider can either be from `createProvider`, or can be a custom provider.

The aim for field configuration is for it to mainly follow a subset of JSON Schema- it is not quite that yet.

### createProvider

Create a basic provider, takes an async init() method that runs once before the first query or mutation and returns a context that is passed in as the first argument to each of a `create`, `read`, `update` and `remove` method.

## Example

```
import { createResolver, createProvider } from "@exogee/graphweaver-helpers";

import {
  getDatabase,
  readFromDatabase,
  createInDatabase,
  updateInDatabase,
  deleteFromDatabase
} from "./my-database-setup";

const { resolver: UserResolver, entity: UserEntity, provider: UserProvider } = createResolver({

  name: "User",

  fields: [
    { name: "firstName", type: "string" },
    { name: "lastName", type: "string" },
    { name: "fullName", type: "string", resolve: (data) => `${data.firstName} ${data.lastName}` },
    { name: "age", type: "float" },
    { name: "isActive", type: "boolean" }
  ],

  // Default is false- if your provider doesn't implement any of create, update or remove,
  // you should set this true
  readOnly: false,

  provider: createProvider({

    backendId: 'Users',

    init: async() => {
      const database = await getDatabase();
      // The return value from init is stored in `context`
      return { database }
    },

    read: async(context, filters, pagination) => {
      const result = await readFromDatabase(context, filters, pagination);
      // You can return an array or a single item here, either is OK.
      return result;
    },

    create: async(context, data) => {
      const result = await createInDatabase(context, data);
      return result;
    },

    update: async(context, id, data) => {
      const result = await updateInDatabase(context, id, data);
      return result;
    },

    remove: async(context, id) => {
      await deleteFromDatabase(context, id);
    }

  })
});
```
