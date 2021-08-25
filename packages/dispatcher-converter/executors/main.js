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

const { AEMDispatcherConfigConverter } = require("../index");
const {
    logger,
    constants,
    util,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const utilConstants = require("../src/util/constants");
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
        config.dispatcherConverter.ams.cfg,
        constants.TARGET_DISPATCHER_SRC_FOLDER,
        ["enabled_farms", "enabled_vhosts"]
    );
    // ensures marker file is created if not present as part of dispatcher sdk
    // marker file is used to validate the dispatcher configurations with latest checks
    util.ensureFileExistsSync(
        utilConstants.USE_SOURCES_DIRECTLY,
        path.join(constants.TARGET_DISPATCHER_SRC_FOLDER, utilConstants.OPT_IN)
    );
    logger.info("Files successfully copied to target folder");
} catch (err) {
    logger.error(
        "Error copying " +
            config.dispatcherConverter.ams.cfg +
            " to " +
            constants.TARGET_DISPATCHER_SRC_FOLDER +
            " with error " +
            err
    );
}
//instantiate and run the converter
let aemDispatcherConfigConverter = new AEMDispatcherConfigConverter(
    config.dispatcherConverter,
    constants.TARGET_DISPATCHER_SRC_FOLDER
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
