<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://graphweaver.com/docs/_next/image?url=https%3A%2F%2Fassets.super.so%2F34623db9-2df1-4511-9266-443aac2d1de3%2Fimages%2F2da1f00d-6bca-4881-8a8c-a3b589f8a191%2FScreenshot_2023-05-11_at_4.12.28_pm.png&w=1920&q=80" alt="Project Logo">
  </a>
</p>

<!-- PROJECT TITLE -->
<h1 align="center">Graphweaver</h1>

<!-- PROJECT DESCRIPTION -->
<p align="center">
  Data Everywhere - Instant GraphQL
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
- [Pre-requisite](#pre-requisite)
- [Graphweaver CLI `graphweaver`](#graphweaver-cli-graphweaver)
  - [Installing](#installing)
  - [Commands](#commands)
    - [graphweaver help](#graphweaver-help)
    - [graphweaver init](#graphweaver-init)
    - [graphweaver import \[source\]](#graphweaver-import-source)
    - [graphweaver analyse \[target\]](#graphweaver-analyse-target)
    - [graphweaver build \[environment\]](#graphweaver-build-environment)
    - [graphweaver start \[environment\]](#graphweaver-start-environment)
    - [graphweaver watch \[environment\]](#graphweaver-watch-environment)
- [Contributing](#contributing)
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
- **Access Control Lists-** Define and apply permissions based on user roles and assign them to Create, Read, Update, and Delete operations.
- **Row Level Security -** Implement row-level security and define who has access to which rows in the data source.
- **Column Level Security -** Fine-grained control over which fields and columns a user can access and modify.
- **Identity Providers -** Pre-built identity providers for Local Database and Amazon Cognito.

For more on security see the [security documentation](https://graphweaver.com/docs/security).

<!-- DOCUMENTATION -->

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs). It covers installation instructions, detailed API documentation, security implementation and guides to help you get started with Graphweaver.

## Pre-requisite

Before we start the installer make sure you are running:

- Node `>18.*`
- PNPM `>8.*`

## Graphweaver CLI `graphweaver`

The Graphweaver Command Line Interface (CLI) tool enables you to set up and manage Graphweaver using commands in your command-line shell.

### Installing

```shell
npm install -g graphweaver
```

### Commands

    * graphweaver init
    * graphweaver import [source]
    * graphweaver analyse [target]
    * graphweaver build [environment]
    * graphweaver start [environment]
    * graphweaver watch [environment]

#### graphweaver help

Display help for graphweaver

```
USAGE
    $ graphweaver help

DESCRIPTION
    Shows a list of available commands in graphweaver
```

#### graphweaver init

Step by step helper to create a graphweaver project in various ways.

```
USAGE
    $ graphweaver init [--name <value>] [--backend <value>] [--useVersion <value>] [--host <value>] [--port <value>][--password <value>] [--user <value>]

FLAGS
    --database <value>
    Name of this project

    --backend <value>
    Data source type. Select a choice from these options: `postgres`, `mysql`, `rest`, `sqlite`.

    --useVersion <value>
    Specify a version of Graphweaver to use

    --database <value>
    Name of database to import

    --host <value>
    Database server host name

    --port <value>
    Database server port

    --password <value>
    Database server password

    --user <value>
    Database server user name
```

#### graphweaver import [source]

Inspect the schema of an external data source or an API endpoint and then import its entities into your GraphQL API.

```
USAGE
    $ graphweaver import [SOURCE] [--database <value>] [--host <value>] [--port <value>] [--password <value>] [--user <value>]

ARGUMENTS
    SOURCE  Data source for e.g. rest api, xero, sqlite, mysql, postgresql

FLAGS
    --database <value>
    Name of database to import

    --host <value>
    Database server host name

    --port <value>
    Database server port

    --password <value>
    Database server password

    --user <value>
    Database server user name
```

#### graphweaver analyse [target]

Instruments your graphweaver project in various ways.

```
USAGE
    $ graphweaver analyse [TARGET]

ARGUMENTS
    TARGET  Available choices are `bundle`. When `bundle` is selected, it returns the build result.
```

#### graphweaver build [environment]

Builds your graphweaver project for deployment

```
USAGE
    $ graphweaver build [ENVIRONMENT] [--adminUiBase <value>]

ARGUMENTS
    ENVIRONMENT  Available choices are `backend`, `frontend`, `all`.

FLAGS
    --adminUiBase <value>
    Specify the base path for the Admin UI
```

#### graphweaver start [environment]

Runs a development version of the project locally.

```
USAGE
    $ graphweaver start [ENVIRONMENT] [--host <value>] [--port <value>]

ARGUMENTS
    ENVIRONMENT  Available choices are `backend`, `frontend`, `all`.

FLAGS
    --host <value>
    Specify a host to listen on e.g. `graphweaver start --host 0.0.0.0`

    --port <value>
    Specify a base port to listen on. Frontend will start on this port, and backend will start on port+1
```

#### graphweaver watch [environment]

Runs a development version of the project locally and watches files for changes.

```
USAGE
    $ graphweaver start [ENVIRONMENT] [--host <value>] [--port <value>]

ARGUMENTS
    ENVIRONMENT  Available choices are `backend`, `frontend`, `all`.

FLAGS
    --host <value>
    Specify a host to listen on e.g. `graphweaver start --host 0.0.0.0`

    --port <value>
    Specify a base port to listen on. Frontend will start on this port, and backend will start on port+1
```

<!-- CONTRIBUTING -->

## Contributing

We welcome contributions from the community! If you're interested in improving Graphweaver, please refer to our Contribution Guidelines for detailed instructions.

<!-- LICENSE -->

## License

Distributed under the MIT License. See LICENSE for more information.

<!-- FOOTER -->
<p align="center">
  Made with ❤️ by <a href="https://exogee.com">Exogee</a>
</p>
