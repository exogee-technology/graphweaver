# `@exogee/graphweaver-mikroorm`

MikroORM adapter package for Graphweaver

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell. Check the `graphweaver` npm package [here.](https://www.npmjs.com/package/graphweaver)

## Environment Variables

To configure a single database it is possible to use env vars. There are two options:

1. Specify a single AWS Secrets Manager ARN that contains a JSON object of the connection details

```
DATABASE_SECRET_ARN='<AWS SECRET ARN>'
```

2. Specify all the parameters as separate env vars

```
DATABASE_HOST='localhost'
DATABASE_NAME='no_acls'
DATABASE_PORT='5432'
DATABASE_USERNAME='postgres'
DATABASE_PASSWORD='postgres'
```

If you have multiple databases connected to graphweaver then you will need to pass in the configuration settings in your own code.

```

const connection = {
    connectionManagerId: 'postgresql',
    entities,
    driver: PostgreSqlDriver,
    mikroOrmConfig: {
        host: process.env.DATABASE_HOST || 'localhost',
        dbName: process.env.DATABASE_NAME || 'no_acls',
        port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
        user: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
    }
}
@Entity('Tag', {
	provider: new MikroBackendProvider(OrmTag, connection),
})
```

You can also pass a different ARN per connection:

```
const connection = {
    connectionManagerId: 'postgresql',
    entities,
    driver: PostgreSqlDriver,
    secretArn: process.env.DATABASE_ONE_SECRET_ARN
}
@Entity('Tag', {
	provider: new MikroBackendProvider(OrmTag, connection),
})
```
