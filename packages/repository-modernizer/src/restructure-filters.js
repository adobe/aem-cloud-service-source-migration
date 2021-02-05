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
        let projectRootPath = commons_constants.TARGET_PROJECT_SRC_FOLDER;
        let allFilterPaths = [];
        // create the base packages for all projects
        projects.forEach((project) => {
            let targetProjectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            if (projects.length === 1) {
                projectRootPath = targetProjectPath;
            }
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
            let uiConfigFilterPath = path.join(
                targetProjectPath,
                constants.UI_CONFIG,
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
                if (!contentPackageFilterPath.endsWith("pom.xml")) {
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
                } else {
                    segregateFilterPaths(
                        getFiltersFromPomFile(contentPackageFilterPath),
                        filterPaths
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
            replaceAppIdInFilterXml(
                uiConfigFilterPath,
                project.appId,
                null,
                conversionStep
            );
            // since different projects will have different appId
            // i.e. would require diff package installation folders in all package
            allFilterPaths.push(
                constants.DEFAULT_ALL_FILTER_PATH_TEMPLATE.replace(
                    constants.DEFAULT_APP_ID,
                    project.appId
                )
            );
        });
        // add filters to all's filter.xml
        let allPackageFilterPath = path.join(
            projectRootPath,
            constants.ALL,
            constants.FILTER_PATH
        );
        replaceAppIdInFilterXml(
            allPackageFilterPath,
            null,
            allFilterPaths,
            conversionStep
        );
        conversionSteps.push(conversionStep);
    },
};
/**
 *
 * @param String filePath path of pom.xml where content need to be written
 * get filter mentioned in pom.xml
 */
function getFiltersFromPomFile(pomFile) {
    let filterList = [];
    let fileContent = util.getXMLContentSync(pomFile);
    let pushContent = false;
    fileContent.forEach((line) => {
        // add dependencies to the list
        if (line.trim() === constants.ROOT_FILTER_SECTION_START) {
            //skipping filter section start tag from getting added to list
            pushContent = true;
            return;
        }
        if (line.trim() === constants.ROOT_FILTER_SECTION_END) {
            //not adding end tag to list
            pushContent = false;
        }
        if (pushContent) {
            filterList.push(line);
        }
    });
    return filterList;
}
/**
 *
 * @param String[] filterFileContent filter.xml content as array of string
 * @param String[] filterPaths arrays to hold ui.apps and ui.content filter paths
 *
 * Segregate filters of ui.apps and ui.content package
 */
function segregateFilterPaths(filterFileContent, filterPaths) {
    let prevState = false;
    let uiAppsExtraRoot = [];
    let uiContentExtraRoot = [];

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
                prevState = true;
                if (
                    line.includes("<include") ||
                    (line.includes("<exclude") && line.includes("mode="))
                ) {
                    filterPaths.uiAppsFilters.push(
                        line.substring(0, line.indexOf("mode")) + "/>"
                    );
                    uiAppsExtraRoot.push(
                        "    <filter root" + line.substring(line.indexOf("="))
                    );
                } else {
                    filterPaths.uiAppsFilters.push(line);
                }
            } else {
                // if current line is a filter section end (i.e. `</filter>`),
                // check if it should be added to ui.apps filter or ui.content filter
                if (
                    (line.trim() === constants.FILTER_SECTION_END ||
                        line
                            .trim()
                            .includes(constants.INCLUDE_FILTER_START_TAG) ||
                        line
                            .trim()
                            .includes(constants.INCLUDE_FILTER_END_TAG) ||
                        line
                            .trim()
                            .includes(constants.INCLUDE_FILTER_ROOT_TAG) ||
                        line
                            .trim()
                            .includes(constants.EXCLUDE_FILTER_START_TAG) ||
                        line
                            .trim()
                            .includes(constants.EXCLUDE_FILTER_ROOT_TAG) ||
                        line
                            .trim()
                            .includes(constants.EXCLUDE_FILTER_END_TAG)) &&
                    prevState == true
                ) {
                    filterPaths.uiAppsFilters.push(line);
                } else {
                    if (
                        line.includes("<include") ||
                        (line.includes("<exclude") && line.includes("mode="))
                    ) {
                        filterPaths.uiContentFilters.push(
                            line.substring(0, line.indexOf("mode")) + "/>"
                        );
                        uiContentExtraRoot.push(
                            "    <filter root" +
                                line.substring(line.indexOf("="))
                        );
                    } else {
                        filterPaths.uiContentFilters.push(line);
                    }
                    prevState = false;
                }
            }
        }
    });
    filterPaths.uiAppsFilters = filterPaths.uiAppsFilters.concat(
        uiAppsExtraRoot
    );
    filterPaths.uiContentFilters = filterPaths.uiContentFilters.concat(
        uiContentExtraRoot
    );
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
    if (line.indexOf('"') == -1) {
        line = line.substring(
            line.indexOf(constants.ROOT) + constants.ROOT.length
        );
    } else {
        line = line.substring(line.indexOf('"') + 1);
    }
    return (
        line.startsWith("/apps") ||
        line.startsWith("/libs") ||
        line.startsWith("/oak:index")
    );
}

/**
 *
 * @param filePath path of filter.xml where content need to be written
 * @param appId appId for the project
 * @param filterPathsToAppend paths that need to be added to the filter.xml
 * @param conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Modify the ui.config package filter paths to include the given project's appId
 */
function replaceAppIdInFilterXml(
    filterPath,
    appId,
    filterPathsToAppend,
    conversionStep
) {
    if (!fs.existsSync(filterPath)) {
        logger.error(
            `RestructureFilterPaths: Cannot find filter file at ${filterPath}`
        );
    } else {
        let fileContent = util.getXMLContentSync(filterPath);
        let replaced = false;
        for (let index = 0; index < fileContent.length; index++) {
            let line = fileContent[index];
            if (appId != null && line.includes(constants.DEFAULT_APP_ID)) {
                fileContent[index] = line.replace(
                    constants.DEFAULT_APP_ID,
                    appId
                );
                replaced = true;
            }
            // add all package filter paths
            if (
                line == constants.FILTER_XML_END &&
                filterPathsToAppend != null
            ) {
                filterPathsToAppend.forEach((filterPath) => {
                    fileContent[index++] = filterPath;
                });
                fileContent[index] = line;
                replaced = true;
            }
        }
        // only write back/ log if actually replaced
        if (replaced) {
            util.writeDataToFileSync(
                filterPath,
                fileContent,
                `RestructureFilterPaths: Error while trying to add filters to ${filterPath}.`
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    filterPath,
                    "Included required paths `filter.xml`"
                )
            );
            logger.info(
                `RestructureFilterPaths: Filters added to  ${filterPath}.`
            );
        }
    }
}

module.exports = RestructureFilterPaths;
