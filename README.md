<!--
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aem-cloud-service-source-migration/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aem-cloud-service-source-migration/)

# aem-cloud-service-source-migration

This monorepo contains the code refactoring tools that help customers to migrate to AEM as a
 Cloud Service.

# Available Tools
-   [Dispatcher Converter](./packages/dispatcher-converter) - configuring existing on-premise or
 Adobe Managed Services (AMS) dispatcher configurations to AEM as a Cloud Service compatible
 dispatcher configuration.
-   [Repository Modernizer](./packages/repository-modernizer) - restructure existing projects
  into AEM as a Cloud Service compatible packages.
-   [Index Converter](./packages/index-converter) - migrate existing Custom Oak Index Defintions 
  into AEM as a Cloud Service compatible Custom Oak Index Defintions.

## Setup
```
    npm install yarn lerna -g
    yarn install
```
        
## Test
```
    yarn test
```

## Publishing to npm
This repository has been configured to automatically publish the tool packages to `npm` registry.
 Publishing packages involve two components :
#### 1. Changesets
We leverage [changesets](https://github.com/atlassian/changesets) which lets contributors declare
 how their changes should be released, automates updating package versions, and changelogs, and
  publishing new versions of packages based on the provided information.
A `changeset` is an intent to release a set of packages at particular semver bump types with a
 summary of the changes made.
The `@changesets/cli` package allows us to create multiple `changeset` files as we make changes,
 then combine any number of `changeset` files into a release. A `changeset` is created using the
  `changeset CLI` using the command below :
```
yarn changeset
```
When run, we get a number of questions about which packages are affected and what semver range
 this `changeset` should bump (major, minor, or patch).
```shell script
maji@MAJI-WX-2 MINGW32 ~/Documents/GitHub/aem-cloud-service-source-migration (master)
$ yarn changeset
yarn run v1.22.4
$ C:\Users\maji\Documents\GitHub\aem-cloud-service-source-migration\node_modules\.bin\changeset
�  Which packages would you like to include? · @adobe/aem-cs-source-migration-dispatcher-converter
�  Which packages should have a major bump? · No items were selected
�  Which packages should have a minor bump? · No items were selected
�  The following packages will be patch bumped:
�  @adobe/aem-cs-source-migration-dispatcher-converter@1.1.0
�  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
�  Summary · Fixing rule file and rewrite path in farm and vhost files
�  === Releasing the following packages ===
�  [Patch]
�    @adobe/aem-cs-source-migration-dispatcher-converter
�  ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
�  ║                                                      ========= NOTE ========                                                       ║
�  ║All dependents of these packages that will be incompatible with the new version will be patch bumped when this changeset is applied.║
�  ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
�  Is this your desired changeset? (Y/n) · true
�  Changeset added! - you can now commit it
�
�  If you want to modify or expand on the changeset summary, you can find it here
�  info C:\Users\maji\Documents\GitHub\aem-cloud-service-source-migration\.changeset\fluffy-turkeys-wink.md
Done in 101.92s.
```
This will produce a `changeset` file (./changest/fluffy-turkeys-wink.md) whose content would look something like :
```markdown
---
"@adobe/aem-cs-source-migration-dispatcher-converter": patch
---
Fixing rule file and rewrite path in farm and vhost files
```
This `changeset` file will get deleted automatically later (and merged into the CHANGELOG.md) when our
 Github Action processes it. Please create a `changeset` for each package that needs to be published.

#### 2. Github Action
The preconfigured [Github publish action](https://github.com/adobe/aem-cloud-service-source-migration/blob/master/.github/workflows/publish.yml)
 will look for the presence of `changeset` files in all commits to `master` branch. If found, it
 will automatically create a PR including all of the version bumps and `CHANGELOG.mds` that need
 to happen from any given `changeset`. We can then merge that PR after reviewing all the version bumps.
 Merging will trigger the automated publish for the mentioned packages to the `npm` registry.

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.


# Reporting

Please follow the [Issue template](ISSUE_TEMPLATE.md) to report issues or to request enhancements.
