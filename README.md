<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/exogee-technology/graphweaver">
    <img src="https://docs.graphweaver.com/_next/image?url=https%3A%2F%2Fassets.super.so%2F34623db9-2df1-4511-9266-443aac2d1de3%2Fimages%2F2da1f00d-6bca-4881-8a8c-a3b589f8a191%2FScreenshot_2023-05-11_at_4.12.28_pm.png&w=1920&q=80" alt="Project Logo">
  </a>
</p>

<!-- PROJECT TITLE -->
<h1 align="center">GraphWeaver</h1>

<!-- PROJECT DESCRIPTION -->
<p align="center">
  Welcome to GraphWeaver! This open source project allows you to seamlessly weave together complex graph structures, unlocking powerful data visualization and analysis capabilities.
</p>

<!-- PROJECT STATUS -->
<p align="center">
  [![Project Status](https://img.shields.io/badge/status-active-brightgreen.svg)](https://github.com/exogee-technology/graphweaver)
  [![GitHub Issues](https://github.com/exogee-technology/graphweaver/issues)](https://img.shields.io/github/issues/exogee-technology/graphweaver)
  [![Pull Requests](https://github.com/exogee-technology/graphweaver/pulls)](https://img.shields.io/github/issues-pr/exogee-technology/graphweaver)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
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

GraphWeaver allows you to build modern applications which accept that they are not the source of truth for all data in the application. Seamlessly join multiple backend services including REST APIs, databases, and SaaS platforms into a single GraphQL API, then administer the data in all of those places.

Never replicate your data again.

<!-- DOCUMENTATION -->

## Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://docs.graphweaver.com). It covers installation instructions, detailed API documentation, and guides to help you get started with GraphWeaver.

<!-- QUICK START -->

## Quick Start

You can create a new project with the **GraphWeaver CLI**, by running `npx @exogee/graphweaver-cli create`.

The prompts will ask you which backends to install, and create a scaffold project with schema folders ready to create a schema.

```
❯ npm init @exogee/graphweaver
GraphWeaver

? What would your like to call your new project?
test-project

? Which GraphWeaver backends will you need?
 ◯ MikroORM - PostgreSQL Backend
 ◯ MikroORM - MySQL Backend
 ◯ REST Backend

? OK, we're ready- I'm going to create a new app in "/Users/test-project" - is that OK?
Yes

All Done!

Make sure you npm install / yarn install / pnpm install, then run the start script to get started
❯
```

Finally,

```
cd ./test-project
pnpm i
pnpm start
```

Open your web browser and navigate to http://localhost:9000.

Explore the Admin UI and start weaving your own graphs!

<!-- CONTRIBUTING -->

## Contributing

We welcome contributions from the community! If you're interested in improving GraphWeaver, please refer to our Contribution Guidelines for detailed instructions.

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
