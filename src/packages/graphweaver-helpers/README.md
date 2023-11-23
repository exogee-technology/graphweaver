# Graphweaver Helpers

A package that contains helpers for working with graphweaver schemas.

## Resolver

### createResolver

A simple wrapper around graphweaver's createBaseResolver that returns a
graphweaver-helper bundle type.

### Example

```
import { createResolver } from '@exogee/graphweaver-helpers';

const { resolver, entity, provider } = createResolver<Entity, DataEntity>({
  name: 'User',
  provider,
  entity
});

```

## Entity

### createEntity

Will create a new graphql entity with the options provided.
If provided with a templateEntity, will populate an existing entity with the provided fields.

`createEntity(entityName: string, options?: CreateEntityOptions);`

#### CreateEntityOptions

`fields` - An array of FieldOptions

`readOnly` - Boolean, set true if the entire entity should be read only

`templateEntity` - Work with an existing supplied GraphQL entity, instead of creating a new one.

#### FieldOptions

`name` - The name of the field

`type` - Either the name of a type 'id', 'string', 'float', 'boolean', or a function returning a GraphQL type (e.g. () => GraphQLJSON)

`resolve` - A function that takes in the data entity returned from the provider, and returns the final value of the type above.

`optional` - If true, the value is nullable

`summary` - Boolean, set true if the field is the summary field.

`metadata` - Not used by graphweaver but can be referenced by other plugins.

`excludeFromInputTypes` - Boolean, set true if the field should not be an input

`excludeFromFilterType` - Boolean, set true if the field cannot be filtered on.

### createFieldOnEntity

Given an entity, add one new field using the same field options as createEntity.

### createRelationshipFieldOnEntity

Given an entity, create a new relationship field. // TODO more

### applyDecoratorToEntity

Apply any decorator to the entire entity, these two are equivalent:

```
/* Using Decorators Directly */
@ReadOnly()
@ObjectType('MyEntity')
class MyEntity {}

/* Using `applyDecoratorToEntity` */
class MyEntity {};
applyDecoratorToEntity(MyEntity, ObjectType('MyEntity'));
applyDecoratorToEntity(MyEntity, ReadOnly());
```

There are some convenience functions for common decorators:

- `setEntityAsReadOnly(MyEntity)`

### applyDecoratorToField

Apply any decorator to a specific entity field- these two are equvalent:

```
/* Using Decorators Directly */
@ObjectType('MyEntity')
class MyEntity {
  @SummaryField()
  @Field(() => String)
  title!: string;
}

/* Using `applyDecoratorToField` */
@ObjectType('MyEntity')
class MyEntity {
  title!: string;
}
applyDecoratorToField(MyEntity, Field(() => String));
applyDecoratorToField(MyEntity, SummaryField());
```

There are some convenience functions for common decorators:

- `setFieldAsSummaryField(MyEntity)`
- `setFieldAsExcludeFromInputTypes(MyEntity)`
- `setFieldAsExcludeFromFilterType(MyEntity)`

### Example

TODO

## Provider

### createProvider

Create a basic provider, takes an async init() method that runs once before the first query or mutation and returns a context that is passed in as the first argument to each of a `create`, `read`, `update` and `remove` method.

### Example

```
import { createResolver, createProvider } from "@exogee/graphweaver-helpers";

import { connectToDatabase() } from "./my-database-setup";

const provider = createProvider({

    backendId: 'Users',

    init: async() => {
      return { database: await connectToDatabase() }
    },

    read: async({ database }, filters, pagination) => {
      const result = await database.query(filters, pagination);
      // You can return an array or a single item here, either is OK.
      return result;
    },

    create: async(context, data) => {
      const result = await database.create(data);
      return result;
    },

    update: async(context, id, data) => {
      const result = await database.update(id, data);
      return result;
    },

    remove: async(database, id) => {
      await database.delete(id);
    }

  })
});
```
