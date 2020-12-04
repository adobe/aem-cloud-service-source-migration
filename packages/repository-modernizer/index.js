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
};

module.exports = RepositoryModernizer;
