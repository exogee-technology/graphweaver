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
  Welcome to Graphweaver! This open source project allows you to seamlessly weave together complex graph structures, unlocking powerful data visualization and analysis capabilities.
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
- [About](#about)
- [Documentation](#documentation)
- [Quick Start](#quick-start)
- [Contributing](#contributing)
  - [Publishing](#publishing)
- [License](#license)

<!-- ABOUT -->

## About

Graphweaver allows you to build modern applications which accept that they are not the source of truth for all data in the application. Seamlessly join multiple backend services including REST APIs, databases, and SaaS platforms into a single GraphQL API, then administer the data in all of those places.

Never replicate your data again.

<!-- DOCUMENTATION -->

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://docs.graphweaver.com). It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

<!-- QUICK START -->

## Quick Start

Before we start the installer make sure you are running:

- Node `>18.*`
- PNPM `>8.*`

With those two installed you can create a new project with the **Graphweaver CLI**, by running:

`npx graphweaver@latest init`

The prompts will ask you which backends to install, and create a scaffold project with schema folders ready to create a schema.

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

Once the dependencies have been installed, you can start the development server by running `pnpm start`.

This will launch the Graphweaver development server at http://localhost:9000, which will look something like this:

<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://docs.graphweaver.com/_next/image?url=https%3A%2F%2Fassets.super.so%2F34623db9-2df1-4511-9266-443aac2d1de3%2Fimages%2Fc5b8b2bc-a8c5-4851-8e99-bca52c5f3fec%2FScreenshot_2023-07-25_at_10.57.37_am.png&w=1920&q=80" alt="Project Logo">
  </a>
</p>

Very empty! We need to fill the API with data! To do that, we need to connect to a data source and create some entities.

There are two options to do that:

- If you have an existing database (Postgres, MySql or Sqlite) with a schema and/or data then go to the [Importing a Database](https://docs.graphweaver.com/importing-a-database) page which will automatically import your database.
- If you have a data source but it is currently empty then go to [How to Connect a Data Source](https://docs.graphweaver.com/connect-to-a-data-source) page.

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
  Made with ❤️ by Exogee Technology
</p>
