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

const RepositoryModernizer = require("..");
const {
    logger,
    constants,
    util,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const yaml = require("js-yaml");

// if `target` folder already exists, delete it
if (fs.existsSync(constants.TARGET_FOLDER)) {
    logger.info("Deleting existing ./target folder.");
    console.log("Deleting existing ./target folder.");
    util.deleteFolderRecursive(constants.TARGET_FOLDER);
    logger.info("./target deleted successfully");
    console.log("./target deleted successfully");
}
fs.mkdirSync(constants.TARGET_FOLDER);
const yamlFile = fs.readFileSync(process.cwd() + "/config.yaml", "utf8");
let config = yaml.safeLoad(yamlFile);
executeRepoModernizer(config);
/**
 *
 * @param object config yaml object containing info of project to be restructured
 *
 * Main script to be executed to re-structure Project
 */
async function executeRepoModernizer(config) {
    console.log("Restructuring...");
    try {
        if (
            await RepositoryModernizer.checkConfig(config.repositoryModernizer)
        ) {
            await RepositoryModernizer.performModernization(
                config.repositoryModernizer,
                ".."
            );
            logger.info("Restructuring Completed!");
            console.log("Restructuring Completed!");
            console.log(
                `Please check ${constants.TARGET_PROJECT_SRC_FOLDER} folder for transformed configuration files.`
            );
            console.log(
                `Please check ${constants.TARGET_PROJECT_FOLDER} for summary report.`
            );
            console.log(`Please check ${constants.LOG_FILE} for logs.`);
        } else {
            console.log(
                `Missing configuration! Please check ${constants.LOG_FILE} for more information.`
            );
        }
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}
