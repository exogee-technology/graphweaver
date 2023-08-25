# Documentation

Comprehensive documentation and usage examples can be found on our [Docs Site](https://graphweaver.com/docs).

It covers installation instructions, detailed API documentation, and guides to help you get started with Graphweaver.

# Releasing New Packages

Follow these steps to release new packages:

## 1. Create a new Branch:
Begin by creating a new branch. Base it on the latest main branch. 
## 2. Update Package Versions:
Evaluate changes and adhere to Semantic Versioning (semver). Run the relevant command for `major`, `minor` or `patch` changes.
```console
$ pnpm version:bump patch
```
## 3. Update Package References:
Now the versions are bumped, but packages that depend on each other are still referencing the old version. Run this command
to update all the references across the monorepo.

```console
$ pnpm relink:deps
```
## 4. Commit and Pull Request:
Commit the changes. Create a pull request targeting the main branch.
## 5. Review and Merge:
Await PR approval, then merge it into main to integrate new versions.
## 6. Publish to NPM:
After merging, trigger the "Publish to NPM" workflow in the Actions tab.
## 7. Verify and Monitor:
Monitor the workflow progress in GitHub Actions. Confirm successful publication in the npm registry. 

You're done!