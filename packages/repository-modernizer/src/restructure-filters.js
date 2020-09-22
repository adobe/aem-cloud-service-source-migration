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

const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const constants = require("./util/constants");
const path = require("path");
const fs = require("fs");

var RestructureFilterPaths = {
    /**
     *
     * @param String[] projects  array of project to be restructured
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Restructure filters of ui.apps and ui.content package
     */
    restructure(projects, conversionSteps) {
        let conversionStep = new ConversionStep(
            "Add required paths in `ui.apps` and `ui.content` packages' filter.xml.",
            "`ui.apps` package should contains all the code to be deployed `/apps` or `/oak:index`, " +
                "whereas `ui.content` package should contains all content and configuration not in `/apps` or `/oak:index`."
        );
        // create the base packages for all projects
        projects.forEach((project) => {
            let targetProjectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            let uiAppsFilterPath = path.join(
                targetProjectPath,
                constants.UI_APPS,
                constants.FILTER_PATH
            );
            let uiContentFilterPath = path.join(
                targetProjectPath,
                constants.UI_CONTENT,
                constants.FILTER_PATH
            );
            const filterPaths = {
                uiAppsFilters: [],
                uiContentFilters: [],
            };
            let srcContentPackages = project.existingContentPackageFolder;
            srcContentPackages.forEach((contentPackage) => {
                let contentPackageFilterPath = path.join(
                    project.projectPath,
                    contentPackage,
                    project.relativePathToExistingFilterXml != null
                        ? project.relativePathToExistingFilterXml
                        : constants.FILTER_PATH
                );
                if (fs.existsSync(contentPackageFilterPath)) {
                    // read the project's filter.xml and separate the mutable and immutable filter paths
                    segregateFilterPaths(
                        util.getXMLContentSync(contentPackageFilterPath),
                        filterPaths
                    );
                } else {
                    logger.error(
                        `RestructureFilterPaths: Filter file at ${contentPackageFilterPath} not found!.`
                    );
                }
            });
            writeFilterPathsToFilterXml(
                filterPaths.uiAppsFilters,
                uiAppsFilterPath,
                conversionStep
            );
            writeFilterPathsToFilterXml(
                filterPaths.uiContentFilters,
                uiContentFilterPath,
                conversionStep
            );
        });
        conversionSteps.push(conversionStep);
    },
};
/**
 *
 * @param String[] filterFileContent filter.xml content as array of string
 * @param String[] filterPaths arrays to hold ui.apps and ui.content filter paths
 *
 * Segregate filters of ui.apps and ui.content package
 */
function segregateFilterPaths(filterFileContent, filterPaths) {
    let previousLine = "";
    // add the logic for creating the two filter path arrays here..
    filterFileContent.forEach((line) => {
        //skip start, end line and empty lines
        if (
            !constants.FILTER_XML_START.includes(line) &&
            !constants.FILTER_XML_START_WITH_SPACE.includes(line) &&
            constants.FILTER_XML_END != line.trim() &&
            !/^\s*$/.test(line)
        ) {
            //add line to respective arrays
            if (isImmutableContentFilter(line)) {
                filterPaths.uiAppsFilters.push(line);
            } else {
                // if current line is a filter section end (i.e. `</filter>`),
                // check if it should be added to ui.apps filter or ui.content filter
                if (
                    line.trim() === constants.FILTER_SECTION_END &&
                    isImmutableContentFilter(previousLine)
                ) {
                    filterPaths.uiAppsFilters.push(line);
                } else {
                    filterPaths.uiContentFilters.push(line);
                }
            }
            previousLine = line;
        }
    });
}

/**
 *
 * @param String[] filterPaths content to be written to filter.xml
 * @param String filePath path of filter.xml where content need to be written
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Write filter path to filter.xml
 */
function writeFilterPathsToFilterXml(filterPaths, filePath, conversionStep) {
    if (fs.existsSync(filePath)) {
        let contentToBeWritten = constants.FILTER_XML_START.concat(
            filterPaths,
            constants.FILTER_XML_END
        );
        util.writeDataToFileSync(
            filePath,
            contentToBeWritten,
            `RestructureFilterPaths: Error while trying to add filters to ${filePath}.`
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                filePath,
                "Included required paths to `filter.xml`"
            )
        );
        logger.info(`RestructureFilterPaths: Filters added to  ${filePath}.`);
    } else {
        logger.error(`RestructureFilterPaths: File  ${filePath} not found.`);
    }
}

function isImmutableContentFilter(line) {
    line = line.substring(line.indexOf('"') + 1);
    return (
        line.startsWith("/apps") ||
        line.startsWith("/libs") ||
        line.startsWith("/oak:index")
    );
}

module.exports = RestructureFilterPaths;
