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

[![Version](https://img.shields.io/npm/v/@adobe/aem-cs-source-migration-commons.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-commons)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aem-cs-source-migration-commons.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-commons)

# @adobe/aem-cs-source-migration-commons

`aem-cs-source-migration-commons` library provides common functionalities and helper utilities used
 by AEM as a Cloud Service Code Refactoring Tools (packages).


# Introduction

While the Code Refactoring tools (modules) are created for different purposes, they each end up
 defining a set of utility methods and functionalities that are similar.
To avoid duplicate code or functionalities, common utilities are extracted out into its own module,
 which can then be included by the tools and used.

This project offers a set of functionalities that can be shared among different code refactoring tool modules:

*   Logging Functionality 
*   Summary Report Generation Functionality
*   Common Utility Methods and Constants

# Usage

## Installing the Utilities

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Check your system if you
 already have these utilities installed.

It can be installed like any other `Node.js` module.

```shell script
$ npm install @adobe/aem-cs-source-migration-commons
```

## Adding the Module Requirement

Follow the steps below to add the module to your `Node.js` project:

1. [Install](#install) the module in your project.
1. Add the `require` function in the module in the javascript file where it will be consumed:

```javascript
const Commons = require('@adobe/aem-cs-source-migration-commons');
```
or by destructuring assignment syntax (as per requirement)

```javascript
const {    
    logger,
    constants,
    util,
    ConversionStep,
    ConversionOperation,
    SummaryReportWriter} = require('@adobe/aem-cs-source-migration-commons');
```

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.
