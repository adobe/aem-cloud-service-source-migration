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

[![Version](https://img.shields.io/npm/v/@adobe/aem-cs-source-migration-repository-modernizer.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-repository-modernizer)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aem-cs-source-migration-repository-modernizer.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-repository-modernizer)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aem-cs-source-migration-repository-modernizer/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aem-cs-source-migration-repository-modernizer/)

# @adobe/aem-cs-source-migration-repository-modernizer

`aem-cs-source-migration-repository-modernizer` provides the capability to restructure existing projects packages into
 AEM as a CLoud Service compatible packages.


# Introduction

AEM requires a separation of content and code, which means a single content package cannot deploy
 to both `/apps` and runtime-writable areas (e.g. `/content` , `/conf` , `/home` , or anything not
 `/apps`) of the repository. Instead, the application must separate code and content into discrete
 packages for deployment into AEM.

Adobe Experience Manager Maven projects to be AEM Cloud Service compatible, need to ensure that
* they respect the split of mutable and immutable content
* the requisite dependencies are established to create non-conflicting, deterministic deployments
* they are packaged in a deployable structure - AEM application deployments must be comprised
  of a single AEM package. This package should in turn contain sub-packages that comprise 
  everything required by the application to function, including code, configuration and any
  supporting baseline content.
 
The objective of this tool is to modernize any given project(s) into AEM Cloud Service compatible
 structure, by creating the following deployment structure :
-   The `ui.apps` package, or Code Package, contains all the code to be deployed and only deploys
 to `/apps`
-   The `ui.content` package, or Content Package, contains all content and configuration
-   The `all` package is a container package that ONLY includes the `ui.apps` and `ui.content`
 packages as embeds

# Usage

While it is recommended to use this tool via our AIO CLI plugin for source migration (refer to [aio-cli-plugin-aem-cloud-service-migration](https://github.com/adobe/aio-cli-plugin-aem-cloud-service-migration)),
 it can also be executed standalone.
 

## Installation

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Go check them out if
 you don't have them locally installed.

It can be installed like any other Node.js module.

```shell script
$ npm install @adobe/aem-cs-source-migration-repository-modernizer
```

## Adding the Module Requirement

To add the module to your `Node.js` project:

1. [Install](#install) the module in your project.
2. Add the `require` function in the module in the javascript file where it will be consumed:

```javascript
const RepositoryModernizer = require('@adobe/aem-cs-source-migration-repository-modernizer');
```

## How to execute

To execute the repository-modernizer tool locally :
1. Run `git clone git@github.com:adobe/aem-cloud-service-source-migration.git` to clone the
 repository locally
2. Navigate to the `repository-modernizer` folder
3. Run `npm install` to install all the required dependencies
4. Inside the `executors` folder:
    * add the required configurations to `config.yaml`. Refer to [Configurations](#configurations)
     sections bellow to know more.
    * run `node repository-modernizer.js` to execute the tool
    * `target/project/src/` will contain the resulting restructured projects

## Configurations

The repository modernizer expects the following configurations to be specified for execution :

-   `groupId` : The `groupId` to be used for newly created artifacts.
-   `parentPom` : Add the required information about parent pom
    - `path` : The absolute path to the existing parent pom file.
    - `artifactId` : The `artifactId` to be set for the parent pom.
    - `appTitle` : The application title to be set for the parent pom.
-   `all` : Add the required information for `all` package
    - `artifactId` : The prefix that is to be used to set the artifactId for the `all` package.
    - `appTitle` : The application title.
-   `projects` : Add the required information about all the projects you want to restructure.
    (NOTE : Expects an array of project details objects.)
    -   `projectPath` : The absolute path to the project folder.
    -   `existingContentPackageFolder` : relative path(s) (w.r.t. the project folder) to the existing
     content package(s) that needs to be restructured. (NOTE : Expects an array of relative paths.)
    -   `relativePathToExistingFilterXml` : The relative path (w.r.t. the existing content package
        folder) to the vault filter.xml file. For example : `/src/main/content/META-INF/vault/filter.xml`
    -   `relativePathToExistingJcrRoot` : The relative path (w.r.t. the existing content package
        folder) to the jcr_root directory. For example : `/src/main/content/jcr_root`
    -   `artifactId` : The prefix that is to be used to set the artifactId for all newly
        created `ui.apps` and `ui.content` packages.
    -   `appTitle` : The application title.

Example:

```@yaml
repositoryModernizer:
  # groupId to be used for newly created packages
  groupId: com-xyz-aem
  # information about parent pom
  parentPom:
    # absolute path to the parent pom file
    path: /Users/{username}/some/path/to/xyz-aem/pom.xml
    # the artifactId to be set for the parent pom
    artifactId: xyz-aem-parent
    # the application title to be set for the parent pom
    appTitle: XYZ-AEM Parent
  # information required for all package
  all:
    # prefix that is to be used to set the artifactId for all package
    artifactId: xyz-aem
    # application title
    appTitle: XYZ-AEM Code Repository
  # information about projects
  projects:
    - # absolute path to the project folder
      projectPath: /Users/{username}/some/path/to/xyz-aem
      # relative path(s) (w.r.t. the project folder) to the existing content package(s) that needs to be restructured
      # (expects one or more relative paths to be provided in array format)
      existingContentPackageFolder:
        - /ui.apps
        - /ui.content
        - /ui.permissions
        - /oak-index-definitions
      # relative path (w.r.t. the existing content package folder) to the filter.xml file
      # (If not specified, default path `/src/main/content/META-INF/vault/filter.xml` will be used.)
      relativePathToExistingFilterXml:
      # relative path (w.r.t. the existing content package folder) to the jcr_root directory
      # (If not specified, default path `/src/main/content/jcr_root` will be used)
      relativePathToExistingJcrRoot:
      # prefix that is to be used to set the artifactId for newly created ui.apps and ui.content packages
      artifactId: xyz-content-aem
      # application title
      appTitle: XYZ
```

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.
