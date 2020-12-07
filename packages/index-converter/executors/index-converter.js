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

const IndexConverter = require("..");
const fs = require("fs");
const yaml = require("js-yaml");
const {
    constants: commons_constants,
    logger,
    util,
} = require("@adobe/aem-cs-source-migration-commons");
const yamlFile = fs.readFileSync(process.cwd() + "/config.yaml", "utf8");
let config = yaml.safeLoad(yamlFile);
// if target index definition folder exists, delete it
if (fs.existsSync(commons_constants.TARGET_FOLDER)) {
    logger.info(
        "Deleting existing target folder, path :" +
            commons_constants.TARGET_FOLDER
    );
    util.deleteFolderRecursive(commons_constants.TARGET_FOLDER);
    logger.info(
        "Deleted existing target folder, path :" +
            commons_constants.TARGET_FOLDER
    );
}

executeIndexConversion(config);

async function executeIndexConversion(config) {
    IndexConverter.performIndexConversion(config.indexConverter, "..");
}
