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

[![Version](https://img.shields.io/npm/v/@adobe/aem-cs-source-migration-dispatcher-converter.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-dispatcher-converter)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aem-cs-source-migration-dispatcher-converter.svg)](https://npmjs.org/package/@adobe/aem-cs-source-migration-dispatcher-converter)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aem-cs-source-migration-dispatcher-converter/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aem-cs-source-migration-dispatcher-converter/)

# @adobe/aem-cs-source-migration-dispatcher-converter

`aem-cs-source-migration-dispatcher-converter` provides the capability for configuring existing
 on-premise or Adobe Managed Services Dispatcher configurations to AEM as a Cloud Service
 compatible Dispatcher configuration.


# Introduction

The goal of this project is to make it as simple as possible for AEM developers to migrate existing
 AEM Dispatcher configurations to AEM as a Cloud Service compatible dispatcher configurations.

# Usage

While it is recommended to use this tool via our AIO CLI plugin for source migration (refer to [aio-cli-plugin-aem-cloud-service-migration](https://github.com/adobe/aio-cli-plugin-aem-cloud-service-migration)),
 it can also be executed standalone.

## Installation

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Go check them out if
 you don't have them locally installed.

It can be installed like any other Node.js module.

```sh
$ npm install @adobe/aem-cs-source-migration-dispatcher-converter
```

## Adding the Module Requirement

To add the module to your `Node.js` project:

1. [Install](#install) the module in your project.
2. Add the `require` function in the module in the javascript file where it will be consumed:

```javascript
const DispatcherConverter = require('@adobe/aem-cs-source-migration-dispatcher-converter');
```

## How to execute

To execute the repository-modernizer tool locally :
1. Run `git clone git@github.com:adobe/aem-cloud-service-source-migration.git` to clone the
 repository locally
2. Navigate to the `dispatcher-converter` folder
3. Run `npm install` to install all the required dependencies
4. Inside the `executors` folder:
    * add the required configurations to `config.yaml`. Refer to [Configurations](#configurations)
     sections bellow to know more.
    * run `node main.js` to execute the tool on customer's Adobe Managed Services (AMS) dispatcher
     configurations
    * run `node singleFileMain.js` to execute the tool on customer's on-Premise dispatcher
     configurations
    * `target/dispatcher/src/` will contain the resulting restructured projects

## Configurations

The dispatcher converter configuration uses YAML to define necessary configurations. Due to the
 known nature of Adobe Managed Services (AMS) dispatcher configurations, the configurations
 required for converting them to be AEM as a Cloud Service compatible dispatcher configurations,
 are relatively simple. However, since there are fewer restrictions to on-premise implementations,
 more specific configurations are necessary.

As sample configuration is below:

| Property | Description |
|---|---|
| sdkSrc* | Path to your dispatcher sdk source code.  You must include the `src` folder itself in the path. |
| onPremise/dispatcherAnySrc | Path to the dispatcher.any file. |
| onPremise/httpdSrc | Path to the httpd.conf file (the main apache config file) - If `vhostsToConvert` is not specified you can use this property to find vhosts by parsing the main apache file. |
| onPremise/vhostsToConvert | Array of paths to vhosts files you wish to convert to cloud service configurations. |
| onPremise/variablesToReplace | Array of mapped objects that replace existing variables with new variables. The original variable is first and the variable to replace is second. |
| onPremise/appendToVhosts | This can be a file that you want to append to every vhost file in case you need logic added to all configurations. This is useful to replace logic that was once stored in your main apache config file. |
| onPremise/pathToPrepend | Array of paths to existing dispatcher configuration root folders to scan for the included files. These paths help to map includes in the configurations to their current location in the provided folder structure. |
| onPremise/portsToMap | Only port 80 is supported in AEM as a Cloud Service - if you were using a non standard port here and need it mapped in AEM, provide it here - all other vhosts with non default ports will be removed. |
| ams/cfg* | Path to dispatcher configuration folder (expected immediate subfolders - `conf`, `conf.d`, `conf.dispatcher.d` and `conf.modules.d`) |
| * denotes required field | |

```$yaml
dispatcherConverter:
    # Path to the src folder of the dispatcher sdk. You must include the src folder itself in the path.
    sdkSrc: "/Users/{username}/some/path/to/dispatcher-sdk-2.0.21/src"
    # Add information about on-premise dispatcher configuration here
	onPremise:
        # Path to the dispatcher.any file
        dispatcherAnySrc: "/Users/{username}/some/path/to/dispatcher.any"
        # Path to the httpd.conf file (the main apache config file)
        # If `vhostsToConvert` is not specified you can use this property to find vhosts by parsing the main apache file
        httpdSrc: "/Users/{username}/some/path/to/httpd.conf"
        # Array of paths to vhosts files you wish to convert to cloud service configurations
        vhostsToConvert:
            - "/Users/{username}/some/path/to/mywebsite.vhost"
            - "/Users/{username}/some/path/to/myotherwebsite.vhost"
        # Array of mapped objects that replace existing variables with new variables.
        # The original variable is first and the variable to replace is second
        variablesToReplace:
            TIER: "ENVIRONMENT_TYPE"
        # This can be a file that you want to append to every vhost file in case you need logic added to all configurations.
        # This is useful to replace logic that was once stored in your main apache config file.
        appendToVhosts:
            - "/Users/{username}/some/path/to/appendedContent.conf"
        # Array of paths to existing dispatcher configuration root folders to scan for the included files.
        # These paths help to map includes in the configurations to their current location in the provided folder structure.
        pathToPrepend:
            - "/Users/{username}/some/path/to/your/httpd/content/"
        # Only port 80 is supported in AEM as a Cloud Service - if you were using a non standard port here and need it mapped
        # in AEM, provide it here - all other vhosts with non default ports will be removed.
        portsToMap:
            - 8000
            - 8080
    # Add information about Adobe Managed Services dispatcher configuration here
    ams:
        # Path to dispatcher configuration folder
        # (expected immediate subfolders - conf, conf.d, conf.dispatcher.d and conf.modules.d)
        cfg: "/Users/{username}/some/path/to/dispatcher/folder"
```

## Validating the output

>[NOTE]
> For more information on Dispatcher Validator, refer to [Adobe Experience Manager as a Cloud Service SDK](https://docs.adobe.com/content/help/en/experience-manager-learn/cloud-service/local-development-environment-set-up/dispatcher-tools.html).

1. Run the dispatcher validator on the converted configurations, with the `dispatcher` sub-command:

   ```shell script
   $ validator dispatcher
   ```

1. If you encounter errors about missing include files, check whether you correctly renamed those files.

1. If you see errors concerning undefined variable `PUBLISH_DOCROOT`, rename it to `DOCROOT`.

For troubleshooting other errors, refer to [Troubleshooting & Local Validation of Dispatcher Configuration](https://docs.adobe.com/content/help/en/experience-manager-learn/cloud-service/local-development-environment-set-up/dispatcher-tools.html#troubleshooting).

# Contributing

Contributions are welcomed! Refer to [Contributing Guide](../../CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. Refer to [LICENSE](../../LICENSE) for more information.
