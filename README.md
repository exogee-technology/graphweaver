<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://docs.graphweaver.com/_next/image?url=https%3A%2F%2Fassets.super.so%2F34623db9-2df1-4511-9266-443aac2d1de3%2Fimages%2F2da1f00d-6bca-4881-8a8c-a3b589f8a191%2FScreenshot_2023-05-11_at_4.12.28_pm.png&w=1920&q=80" alt="Project Logo">
  </a>
</p>

<!-- PROJECT TITLE -->
<h1 align="center">Graphweaver</h1>

<!-- PROJECT DESCRIPTION -->
<p align="center">
  Instant GraphQL over all your data.
</p>

<p align="center">
  Graphweaver speeds up your GraphQL development by securely connecting all your data sources in one place.
</p>

<!-- PROJECT STATUS -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://img.shields.io/badge/status-active-brightgreen.svg" alt="Project Status">
  </a>
  <a href="https://github.com/exogee-technology/graphweaver/issues">
    <img src="https://img.shields.io/github/issues/exogee-technology/graphweaver" alt="GitHub Issues">
  </a>
  <a href="https://github.com/exogee-technology/graphweaver/pulls">
    <img src="https://img.shields.io/github/issues-pr/exogee-technology/graphweaver" alt="Pull Requests">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Why](#why)
- [Features](#features)
- [Security](#security)
- [Documentation](#documentation)
- [Quick Start](#quick-start)
  - [Next Steps](#next-steps)
- [Contributing](#contributing)
  - [Publishing](#publishing)
- [License](#license)

<!-- WHY -->

## Why

We consistently find that everyone has lots of sources of truth. You know, CRM holding customer data, accounting systems handling invoices, and more scattered across different SaaS platforms and databases? It's a real pain to sync it all up!

In the past we used to copy data from everywhere to the DB, but that always breaks at some point.

Well, after years of grappling with this issue, we wanted a way to easily build a single GraphQL API in front of all those sources. An API that allows you to execute queries that even span across datasources (give me DB records where customer in CRM name is "Bob"), and also allows you to administer your data all from one place.

That's why we built Graphweaver. We've been using it on our projects for about a year now and think you'll love it too!

## Features

- **Instant GraphQL API -** Instant CRUD API from any data source
- **Granular Permissions -** Row and column-level security
- **Multiple Data Sources -** Combine multiple data sources (Postgres, Mysql, SQLite, Saas Platforms, REST)
- **Cross Source Filters -** Graphweaver allows you to filter across data sources, from one database by another
- **100% Open Source - A**vailable on GitHub under the MIT license, so you are free to change and deploy as needed.
- **Admin Panel -** Out of the box Admin UI to view and manipulate data
- **Code First -** Maximum flexibility for you to write your own resolvers and UI
- **Code Generator -** Introspect a database and instantly create the Typescript resolvers

## Security

Graphweaver comes pre-built with the following security features:

- **Role Based Access Control -** Define permissions and access rights at a role level and assign those roles to users.
- **Access Control Lists-** Define and apply permissions based on user roles and assign them to Create, Read, Update, Delete operations.
- **Row Level Security -** Implement row level security and define who has access to which rows in the data source.
- **Column Level Security -** Fine-grained control over the fields and columns that users can access or modify.
- **Identity Providers -** Pre-built identity providers for Local Database and Cognito implementations.

For more on security see the [security documentation](https://graphweaver.com/docs/security).

<!-- DOCUMENTATION -->

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://docs.graphweaver.com). It covers installation instructions, detailed API documentation, security implementation and guides to help you get started with Graphweaver.

<!-- QUICK START -->

## Quick Start

https://github.com/exogee-technology/graphweaver/assets/81122022/3c4eb47e-84ff-476c-998f-936994e8064b

Before we start the installer make sure you are running:

- Node `>18.*`
- PNPM `>8.*`

With those two installed you can create a new project with the **Graphweaver CLI**, by running:

`npx graphweaver@latest init`

The prompts will ask you which backends to install for this app.

First you will be asked to name the project:

```
? What would your like to call your new project?
test-project
```

Next, you will be asked to choose your data source. Select your data source and press enter.

```
? Which Graphweaver backends will you need?
◯ MikroORM - PostgreSQL Backend
◯ MikroORM - MySQL Backend
◯ REST Backend
```

Finally, you are asked to confirm that the project is going to be created.

```
? OK, we're ready- I'm going to create a new app in "/Users/test-project" - is that OK?
Yes

All Done!

Make sure you npm install / yarn install / pnpm install, then run the start script to get started
❯
```

Once the new app has been created `cd test-project`. Then run `pnpm install` to install all the required dependencies.

Once installed, you can start the development server by running `pnpm start`.

This will launch the Graphweaver server and Admin UI at http://localhost:9000:

<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://docs.graphweaver.com/_next/image?url=https%3A%2F%2Fassets.super.so%2F34623db9-2df1-4511-9266-443aac2d1de3%2Fimages%2Fc5b8b2bc-a8c5-4851-8e99-bca52c5f3fec%2FScreenshot_2023-07-25_at_10.57.37_am.png&w=1920&q=80" alt="Project Logo">
  </a>
</p>

Very empty! We need to fill the API with data! To do that, we need to connect to a data source and create some entities.

### Next Steps

There are two options to connect a data source:

1. If you have an existing database (Postgres, MySql or Sqlite) then go to the [Importing a Database](https://docs.graphweaver.com/importing-a-database) page. This will guide you through importing your database.
1. If you have a data source but it is currently empty then go to [How to Connect a Data Source](https://docs.graphweaver.com/connect-to-a-data-source) page.

<!-- CONTRIBUTING -->

## Contributing

We welcome contributions from the community! If you're interested in improving Graphweaver, please refer to our Contribution Guidelines for detailed instructions.

### Publishing

To publish the packages in the monorepo first you need to assess the types of changes that occurred. Follow semver and run
the appropriate command for `major`, `minor` or `patch` changes.

```console
$ pnpm version:bump patch
```

Now the versions are bumped, but packages that depend on each other are still referencing the old version. Run this command
to update all the references across the monorepo.

```console
$ pnpm relink:deps
```

Now we're ready to publish. Run:

```console
$ pnpm publish:dry
```

This will show you what would be published if you went ahead and did one.

If you're happy with these and want to publish these changes, run

```console
$ pnpm publish:packages --otp [code from 2FA device]
```

You're done!

<!-- LICENSE -->

## License

Distributed under the MIT License. See LICENSE for more information.

<!-- FOOTER -->
<p align="center">
  Made with ❤️ by Exogee
</p>
