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
-   The `ui.config` package, or OSGi Configuration Package, contains all OSGi configurations
-   The `ui.content` package, or Content Package, contains all content and configuration
-   The `all` package, container package that embeds the core bundles and the ui.apps ,ui.config
 and ui.content packages


# How it works

#### 1. Create base project structure
* Create the base template for `all` package `analyse` package and parent `pom.xml file` at the root level.
* If only single project is configured, create the base template for `ui.apps`, `ui.apps.structure`,
 `ui.content` and `ui.config` packages at the same level.
* If multiple projects are configured, create project folders (with the same name as source project) inside
 which we create the base template for `ui.apps`,`ui.apps.structure`, `ui.content` and `ui.config` packages.
* Apply the specified `groupId`, `artifactId` and `version` in the newly created artifact `pom.xml` files.
* For each project specified in the configuration, copy all packages with the packaging type `content-package`
 (other than the packages specified under `existingContentPackageFolder`) from the source.
* Copy core bundles as per input configuration and embed them in the `all/pom.xml`.

#### 2. Separate mutable and immutable content
* For each project specified in the configuration, traverse the content of the source packages
 specified under `existingContentPackageFolder` and separate the mutable and immutable content
 according to their paths.
* The separated content are copied over to the project's `ui.apps` and `ui.content` packages
 as applicable.
* OSGi configuration folders will be renamed as per the input configuration in `osgiFoldersToRename`.
   - All OSGi config folders under the same path and with same replacement name will be MERGED.
   - If there exists OSGi config files with the same pid/filename in more than one config folders which
     are to be merged, they will not be overwritten. A warning regrading the same will be generated in
	 the summary report and result log file. User would need to manually evaluate which config to persist. 
* Find and move the OSGi configurations from the `ui.apps` package to the `ui.configs` package
 (under the path `/apps/my-app/osgiconfig`).
* As per AEM as a Cloud Service best practice, all OSGi configs (except Repo Init OSGi configs) will be
 translated to `.cfg.json` format.
 
 NOTE : Conflicts during the above move operation will be reported and conflicting content needs to
 be moved over manually.

#### 3. Separate filter paths
* For each project specified in the configuration, traverse the content of the source packages
 specified under `existingContentPackageFolder` and extract the filter paths specified in their
 `filter.xml` files.
* The filter paths are separated into mutable and immutable paths based on their jcr paths.
 The separated paths are now added to the project's `ui.apps` and `ui.content` packages' filter
 file as applicable.
* In `ui.apps.structure/pom.xml`, define the JCR repository roots in which the project’s code
 sub-packages deploy into (i.e. enumerate the filter root paths present in `ui.apps` package's
 `filter.xml`). 
* Add the filter path to `/apps/my-app/osgiconfig` in `ui.configs` package's filter file.

#### 4. Refactor the pom files
* For each project specified in the configuration, traverse the content of pom files of the
 source packages specified under `existingContentPackageFolder` and extract the dependency and
 plugin info. They will be added to the `ui.apps/pom.xml` file.
 NOTE :
    - `uber-jar` dependencies will be replaced with `aem-sdk-api` dependencies
    - 3rd party bundle dependencies which are found will be reported, please add 3rd party
     dependency jar files in the `nonadobedependencies` directory (which would serve as a
     local repository for 3rd party bundles). It will be included in the repository section of
     the parent pom.
* In `ui.apps/pom.xml` add the dependency for the `ui.apps.structure` artifact.
* In `ui.content/pom.xml` add the dependency for the `ui.apps` artifact.
* In `all/pom.xml` embed the newly created `ui.apps`,`ui.config` and `ui.config` artifacts
 for each project.
* In the parent pom file, add the sub-projects info section, and the repository section for
 including 3rd party dependencies from local repository.
* In the parent pom file, add the dependency and plugin info extracted from the source parent pom.
* Add the parent pom info in the newly created `ui.apps/pom.xml`, `ui.content/pom.xml` and
 `ui.config/pom.xml` for each project.
* Scan the core bundles' pom files and replace any `uber-jar` dependency with `aem-sdk-api`
 dependency.

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
    - `version` : The version to be set for the parent pom.
-   `all` : Add the required information for `all` and `analyse` packages
    - `artifactId` : The prefix that is to be used to set the artifactId for the `all` and `analyse` packages.
    - `appTitle` : The application title.
    - `version` : The version to be set for the all pom.
-   `projects` : Add the required information about all the projects you want to restructure.
    
    (NOTE : Expects an array of project details objects.)
    
    (NOTE : For multiple projects create separate copies of the info section for each project)
    
	-   `projectPath` : The absolute path to the project folder.
    -   `existingContentPackageFolder` : relative path(s) (w.r.t. the project folder) to the existing
     content package(s) that needs to be restructured.
	 
        (NOTE : Expects an array of relative paths to existing content packages, NOT bundle/jar artifacts.)

    -   `relativePathToExistingFilterXml` : The relative path (w.r.t. the existing content package
        folder) to the vault filter.xml file. For example : `/src/main/content/META-INF/vault/filter.xml`
    -   `relativePathToExistingJcrRoot` : The relative path (w.r.t. the existing content package
        folder) to the jcr_root directory. For example : `/src/main/content/jcr_root`
    -   `artifactId` : The prefix that is to be used to set the artifactId for all newly
        created `ui.apps` and `ui.content` packages.
    -   `appTitle` : The application title.
    -   `version` : The version used for content packages.
    -   `appId` : The application Id.
    -   `coreBundles` : Array of relative path(s) (w.r.t. the project folder) to the existing code bundles
        (these bundles will be embedded in the `all` package).
    -   `osgiFoldersToRename` : OSGi config folders that need to be renamed. The existing/source OSGi
        config folder PATH (JCR path starting from '/apps') is expected as key, and the replacement OSGi
        folder NAME is expected as value.
		
        (NOTE 1 : All OSGi config folders under the same path and with same replacement name will be MERGED.)

        (NOTE 2 : If there exists OSGi config files with the same pid/filename in more than one config folders
                  which are to be merged, they will not be overwritten. A warning regrading the same will be
                  generated in the summary report and result log file. User would need to manually evaluate
                  which config to persist.)


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
    # version to be to be set for the parent pom
    version: 1.0.0-SNAPSHOT
  # information required for all and analyse packages
  all:
    # prefix that is to be used to set the artifactId for all and analyse packages
    artifactId: xyz-aem
    # application title
    appTitle: XYZ-AEM Code Repository
    # version to be set for all pom
    version: 1.0.0-SNAPSHOT
  # information about projects (expects an array of project information)
  # NOTE : For multiple projects create separate copies of the info section for each project
  projects:
    - # absolute path to the XYZ project folder
      projectPath: /Users/{username}/some/path/to/xyz-aem
      # Array of relative path(s) (w.r.t. the project folder) to the existing content package(s) that needs to be restructured.
      # NOTE : only content packages are expected here, NOT bundle/jar artifacts
      existingContentPackageFolder:
        - /ui.apps
        - /ui.content
        - /ui.permissions
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
      # application ID (will be used for config and package folder names)
      appId: xyz-app
      # project specific version to be used for content packages
      version: 2.0.0-SNAPSHOT
      # Array of relative path(s) (w.r.t. the project folder) to the existing code bundles (will be embedded in the all package).
      coreBundles:
          - /core
          - /api
      # OSGi config folders that need to be renamed.
      # The existing/source OSGi config folder PATH (JCR path starting from '/apps') is expected as key
      # and the replacement OSGi folder NAME is expected as value. See examples below :
      #    /apps/xyz/config.prod : config.publish.prod
      #    /apps/system/config.author.dev1 : config.author.dev
      #    /apps/system/config.author.dev2 : config.author.dev
      # NOTE :
      #    1. All OSGi config folders under the same path and with same replacement name will be MERGED
      #       (as configured in above example).
      #    2. If there exists OSGi config files with the same pid/filename in more than one config folders
      #       which are to be merged, they will not be overwritten. A warning regrading the same will be
      #       generated in the summary report and result log file. User would need to manually evaluate
      #       which config to persist
      osgiFoldersToRename:
          /apps/xyz/config.dev1: config.author.dev
          /apps/xyz/config.dev2: config.author.dev
          /apps/system/config.author.localdev: config.author.dev
          /apps/system/config.author.dev1: config.author.dev
          /apps/system/config.prod: config.publish.prod
          /apps/system/config.publish: config.publish.prod
    - # absolute path to the ABC project folder
      projectPath: /Users/{username}/some/path/to/abc-aem
      # Array of relative path(s) (w.r.t. the project folder) to the existing content package(s) that needs to be restructured.
      # NOTE : only content packages are expected here, NOT bundle/jar artifacts
      existingContentPackageFolder:
        - /content
        - /oak-index-definitions
      # relative path (w.r.t. the existing content package folder) to the filter.xml file
      # (If not specified, default path `/src/main/content/META-INF/vault/filter.xml` will be used.)
      relativePathToExistingFilterXml:
      # relative path (w.r.t. the existing content package folder) to the jcr_root directory
      # (If not specified, default path `/src/main/content/jcr_root` will be used)
      relativePathToExistingJcrRoot:
      # prefix that is to be used to set the artifactId for newly created ui.apps and ui.content packages
      artifactId: abc-content-aem
      # application title
      appTitle: ABC
      # application ID (will be used for config and package folder names)
      appId: abc-app
      # project specific version to be used for content packages
      version: 2.0.0-SNAPSHOT
      # Array of relative path(s) (w.r.t. the project folder) to the existing code bundles (will be embedded in the all package).
      coreBundles:
         - /core
      # OSGi config folders that need to be renamed.
      # The existing/source OSGi config folder PATH (JCR path starting from '/apps') is expected as key
      # and the replacement OSGi folder NAME is expected as value. See examples below :
      #    /apps/my-appId/config.prod : config.publish.prod
      #    /apps/system/config.author.dev1 : config.author.dev
      #    /apps/system/config.author.dev2 : config.author.dev
      # NOTE :
      #    1. All OSGi config folders under the same path and with same replacement name will be MERGED
      #       (as configured in above example).
      #    2. If there exists OSGi config files with the same pid/filename in more than one config folders
      #       which are to be merged, they will not be overwritten. A warning regrading the same will be
      #       generated in the summary report and result log file. User would need to manually evaluate
      #       which config to persist
      osgiFoldersToRename:
          /apps/abc/config.author.dev1: config.author.dev
          /apps/abc/config.author.dev2: config.author.dev
          /apps/abc/config.author.localdev: config.author.dev
          /apps/abc/config.prod: config.publish.prod
          /apps/abc/config.publish: config.publish.prod
```

# Known Limitations
The tool has some known limitations (we are working on fixing them) such as :
1. It does not create Reactor `pom.xml` files for individual projects.
 A parent `pom.xml` file is created at the root level, but for multi-project structures,
 we do not create reactor pom files for individual projects.
2. It does not make any modifications to existing core bundles, apart from replacing `uber-jar`
 dependencies with `aem-sdk-api` dependencies.

#### Things that would need to be handled manually :
* Conflicts arising during moving content to new packages or renaming/merging folders. Check the
 summary report or result log to view all such conflicts.
* Missing version info in core bundles will be reported; the version will also need to be added in
 the dependency section in the `all/pom.xml`.
* For core bundles, changes like updating them to use the BND plugin (rather than the old Felix
 pluigin), translating the Felix bundler directives to BND directives need to be done manually.
* 3rd party dependency bundles will be reported, their jar files need to be placed in the
 `nonadobedependencies` directory which will serve as a local repository.

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.
