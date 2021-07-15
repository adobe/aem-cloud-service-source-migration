/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { SingleFilesConverter } = require("../index");
const {
    logger,
    constants,
    util,
} = require("@adobe/aem-cs-source-migration-commons");
const utilConstants = require("../src/util/constants");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");

const yamlFile = fs.readFileSync(
    path.join(process.cwd(), "config.yaml"),
    "utf8"
);
let config = yaml.safeLoad(yamlFile);

// if `target` folder already exists, delete it
if (fs.existsSync(constants.TARGET_FOLDER)) {
    util.deleteFolderRecursive(constants.TARGET_FOLDER);
    logger.info("./target is removed successfully");
}

// Copy files to target folder
try {
    util.copyFolderSync(
        config.dispatcherConverter.sdkSrc,
        constants.TARGET_DISPATCHER_SRC_FOLDER
    );
    // creates marker file if not already present as part of dispatcher sdk
    // marker file is used to validate the dispatcher configurations with latest checks
    util.ensureFileExistsSync(
        utilConstants.USE_SOURCES_DIRECTLY,
        path.join(constants.TARGET_DISPATCHER_SRC_FOLDER, utilConstants.OPT_IN)
    );
    logger.info("Files successfully copied to target folder");
} catch (err) {
    logger.error(
        "Error copying " +
            config.dispatcherConverter.onPremise.sdkSrc +
            " to " +
            constants.TARGET_DISPATCHER_SRC_FOLDER +
            " with error " +
            err
    );
}

//instantiate and run the converter
let aemDispatcherConfigConverter = new SingleFilesConverter(
    config.dispatcherConverter
);

if (aemDispatcherConfigConverter.checkConfig(config.dispatcherConverter)) {
    aemDispatcherConfigConverter.transform();

    // log some final details
    console.log("\nTransformation Complete!\n");
    console.log(
        `Please check ${constants.TARGET_DISPATCHER_SRC_FOLDER} folder for transformed configuration files.`
    );
    console.log(
        `Please check ${constants.TARGET_DISPATCHER_FOLDER} for summary report.`
    );
    console.log(`Please check ${constants.LOG_FILE} for logs.`);
} else {
    console.log(
        `Missing configuration! Please check ${constants.LOG_FILE} for more information.`
    );
}
