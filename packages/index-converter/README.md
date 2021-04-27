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

[![Version](https://img.shields.io/npm/v/@adobe/aem-cs-source-migration-index-converter.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-index-converter)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aem-cs-source-migration-index-converter.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-index-converter)

# @adobe/aem-cs-source-migration-index-converter

`aem-cs-source-migration-index-converter` provides the capability to transform on-premise
 *Custom OAK Index Definitions* to *AEM as a Cloud Service compatible OAK Index Definitions*.


# Introduction

Index Converter allows Adobe Experience Manager (AEM) developers to migrate existing
 *Custom Oak Index Definitions* to *AEM as a Cloud Service compatible Custom Oak Index Definitions*.

Custom Oak Index Definitions are categorized as:
* **Custom OOTB (Product) Oak Index Definitions**: Modification into existing OOTB Oak Index Definitions
* **Newly created Oak Index Definitions**

There are two ways to create Custom Oak Index Definitions:
* either under `/apps` (through any custom content package) 
* directly under `/oak:index` path

This utility transforms only lucene type Custom Oak Index Definitions which are present under 
 `/apps` or `/oak:index`. It will not transform those lucene type indexes which are created for
 `nt:base`.


# How it works
#### 1. Handle Ensure Definitions
Refer to [Ensure Oak Index](https://adobe-consulting-services.github.io/acs-aem-commons/features/ensure-oak-index/index.html)
 to learn how to define and create Oak Definitions. These were created (in place of actual Oak
 index definitions) so that they do not wipe out the actual index data when updating the node,
 necessitating a reindex.
AEM as a Cloud Service does not support Ensure Definitions, and hence they will be converted
 to Oak Index Definitions (then further migrated into AEM as a Cloud Service compatible Custom Oak
 Index Definitions) as per below guidelines:
* If property ignore is set to `true`, ignore or skip the Ensure Definition
* Update the `jcr:primaryType` to `oak:QueryIndexDefinition`
* Remove any properties that are to be ignored as mentioned in OSGi configurations
* Remove subtree `/facets/jcr:content` from Ensure Definition

#### 2. Handle Custom OOTB (Product) Oak Index Definition
* It will parse the Custom OOTB (Product) Oak Index Definition and fetch the associated OOTB
 Index Definition corresponding to the `aemVersion` specified.
* It will compare the Custom OOTB Oak Index Definition to the associated OOTB Index Definition and
 retrieve the difference between Custom OOTB Index Definition and associated OOTB Index Definition.
 That difference or delta is basically customization done by the user in OOTB Oak Index Definition.
* It will validate the retrieved customization as per AEM as Cloud Service compatible OAK Index
 Definitions guidelines.
* It will merge validated customization of Custom OOTB Oak Index Definition to corresponding OAK
 Index Definition present on AEM as a Cloud Service.
###### Naming Conventions for Custom OOTB (Product) Oak Index Definition
```
"Name of the corresponding OAK Index Definition on AEM as a Cloud Service"-
"latest version of this index on AEM as a Cloud Service "-"custom"-1
```
For example, `damAssetLucene-6-custom-1`

#### 3. Handle Newly created Custom Oak Index Definition
* It will parse and validate the Custom Oak Index Definition as per AEM as Cloud Service compatible
 OAK Index Definitions guidelines.
* It will rename the Custom Oak Index Definition.
###### Naming Conventions for Newly created Custom Oak Index Definition :
 ```"Name of the Custom Oak Index Definition"-"custom"-1```
For example, `testindex-custom-1`

#### 4. Update the filter path
This tool will update the filter path in filter.xml as well based on the new name of Custom OAK
 Index Definitions.
For example, from `<filter root="/oak:index/damAssetLucene1"/>` to
 `<filter root="/oak:index/damAssetLucene-6-custom-1"/>`

# Usage

While it is recommended to use this tool via [AIO CLI plugin for source migration](https://github.com/adobe/aio-cli-plugin-aem-cloud-service-migration), it can also be executed standalone.
 

## Installation

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Check the resources for installation.

It can be installed like any other `Node.js` module.

```shell script
$ npm install @adobe/aem-cs-source-migration-index-converter
```

## Adding the Module Requirement

To add the module to your `Node.js` project:

1. [Install](#install) the module in your project.
2. Add the `require` function in the module in the javascript file where it will be consumed.

```javascript
const IndexConverter = require('@adobe/aem-cs-source-migration-index-converter');
```

## Executing the Index Conveter Tool

To execute the index-converter tool locally :
1. Run `git clone git@github.com:adobe/aem-cloud-service-source-migration.git` to clone the
 repository locally
2. Navigate to the `index-converter` folder
3. Run `npm install` to install all the required dependencies
4. Inside the `executors` folder:
    * add the required configurations to `config.yaml`. Refer to [Configurations](#configurations)
     sections below to learn more.
    * run `node index-converter.js` to execute the tool
    * `./target/index/` will contain the resulting restructured projects

## Specifying the Configurations

The following configurations are required for the Index Converter utility:

* `ensureIndexDefinitionContentPackageJcrRootPath`: Absolute path to the jcr_root directory of the package
 containing the **Ensure Index Definitions** (please ignore if there are no Ensure Index Definitions).
* `ensureIndexDefinitionConfigPackageJcrRootPath`: Absolute path to the jcr_root directory of the package
 containing the **Ensure Index OSGi Configuration** (please ignore if there are no Ensure Index Definitions).
* `aemVersion`: Version of AEM customer is on, used to determine the baseline index definitions.
* `customOakIndexDirectoryPath`: Path to the customer OAK Index Definition directory.
* `filterXMLPath`: Path to the existing package `filter.xml` file.

## Example Code

```@yaml
indexConverter:
    # Absolute path to the jcr_root directory of the package containing the Ensure Index Definitions
    # (please ignore if there are no Ensure Index Definitions)
    # eg. /Users/xyz/sampleCode/content/src/main/content/jcr_root
    ensureIndexDefinitionContentPackageJcrRootPath: "/Users/xyz/sampleCode/content/src/main/content/jcr_root"
    # Absolute path to the jcr_root directory of the package containing the Ensure Oak Index OSGI Configuration
    # (please ignore if there are no Ensure Index Definitions)
    # eg. /Users/xyz/sampleCode/CONFIG/src/main/content/jcr_root
    ensureIndexDefinitionConfigPackageJcrRootPath: "/Users/xyz/sampleCode/CONFIG/src/main/content/jcr_root"
    # Version of AEM customer is on, used to determine the baseline index definitions
    aemVersion: 64
    # Path to the customer OAK Index Definition directory
    # (please ignore if there are no Custom Oak Index Definitions under /oak:index)
    # eg /Users/xyz/sampleCode/ui.apps/src/main/content/jcr_root/_oak_index
    customOakIndexDirectoryPath:"/Users/xyz/sampleCode/ui.apps/src/main/content/jcr_root/_oak_index"
    # Path to the existing package `filter.xml` file
    # eg /Users/xyz/sampleCode/ui.apps/src/main/content/META-INF/vault/filter.xml
    filterXMLPath:"/Users/xyz/sampleCode/ui.apps/src/main/content/META-INF/vault/filter.xml"
```

# Known Limitations
The tool has some known limitations (we are working on fixing them) such as :
1. This utility transforms Custom Oak Index Definitions `aemVersion` 6.3 onwards.
2. This utility transforms only lucene type Custom Oak Index Definitions which are present under
 `/apps` or `/oak:index`.
3. It will not transform those lucene type indexes which are created for `nt:base`.

#### Things that would need to be handled manually :
* copy the converted index definitions to the `/oak:index` folder inside `ui.apps` package.
* copy the index definition filter paths from the generated `filter.xml` to the `ui.apps`
 package's `filter.xml` file.

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.
