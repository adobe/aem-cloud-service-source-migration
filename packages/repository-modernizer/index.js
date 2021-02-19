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

const createBaseProjectStructure = require("./src/create-base-project-structure");
const restructureFilters = require("./src/restructure-filters");
const restructureContent = require("./src/restructure-content");
const restructureConfig = require("./src/restructure-config");
const restructurePoms = require("./src/restructure-pom");
const constants = require("./src/util/constants");
const {
    constants: common_constants,
    logger,
    SummaryReportWriter,
} = require("@adobe/aem-cs-source-migration-commons");

var RepositoryModernizer = {
    /**
     *
     * @param object config yaml object containing info of project to be restructured
     * @param String basePath root path of project to be restructured
     *
     * Re-structure Project
     */
    async performModernization(config, basePath) {
        var conversionSteps = [];
        await createBaseProjectStructure.create(
            config,
            basePath,
            conversionSteps
        );
        restructureFilters.restructure(config.projects, conversionSteps);
        restructureContent.restructure(config.projects, conversionSteps);
        await restructurePoms.restructure(config, conversionSteps);
        await restructureConfig.restructure(config.projects, conversionSteps);
        // create the summary report for the conversion performed
        await SummaryReportWriter.writeSummaryReport(
            conversionSteps,
            common_constants.TARGET_PROJECT_FOLDER,
            constants.REPOSITORY_MODERNIZER_REPORT
        );
    },
    async checkConfig(config) {
        let valid = true;
        if (config.groupId === null) {
            logger.error(
                "Expected parameter 'groupId' not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.parentPom.path === null) {
            logger.error(
                "Expected parameter 'path' (under 'parentPom' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.parentPom.artifactId === null) {
            logger.error(
                "Expected parameter 'artifactId' (under 'parentPom' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.parentPom.appTitle === null) {
            logger.error(
                "Expected parameter 'appTitle' (under 'parentPom' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.parentPom.version === null) {
            logger.error(
                "Expected parameter 'version' (under 'parentPom' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.all.artifactId === null) {
            logger.error(
                "Expected parameter 'artifactId' (under 'all' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.all.appTitle === null) {
            logger.error(
                "Expected parameter 'appTitle' (under 'all' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        if (config.all.version === null) {
            logger.error(
                "Expected parameter 'version' (under 'all' section) not defined in configuration file. Please add the missing parameter to execute the tool."
            );
            valid = false;
        }
        //let projects = config.projects;
        let projectIndex = 0;
        for (const project of config.projects) {
            projectIndex++;
            if (project.projectPath === null) {
                logger.error(
                    "Expected parameter 'projectPath' (under 'project'" +
                        projectIndex +
                        " section) not defined in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
            if (project.existingContentPackageFolder[0] === null) {
                logger.error(
                    "Expected parameter 'existingContentPackageFolder'(under 'project'" +
                        projectIndex +
                        " section) is empty in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
            if (project.artifactId === null) {
                logger.error(
                    "Expected parameter 'artifactId' (under 'project'" +
                        projectIndex +
                        " section) not defined in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
            if (project.appTitle === null) {
                logger.error(
                    "Expected parameter 'appTitle'(under 'project'" +
                        projectIndex +
                        " section) not defined in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
            if (project.version === null) {
                logger.error(
                    "Expected parameter 'version' (under 'project'" +
                        projectIndex +
                        " section) not defined in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
            if (project.appId === null) {
                logger.error(
                    "Expected parameter 'appId' (under 'project'" +
                        projectIndex +
                        " section) not defined in configuration file. Please add the missing parameter to execute the tool."
                );
                valid = false;
            }
        }
        return valid;
    },
};

module.exports = RepositoryModernizer;
