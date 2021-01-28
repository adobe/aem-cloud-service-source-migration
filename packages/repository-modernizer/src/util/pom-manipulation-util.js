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
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const constants = require("./constants");
const fs = require("fs");

var PomManipulationUtil = {
    /**
     *
     * @param String pomFilePath  path of pom file in which variable replace operation to be performed
     * @param object replacementObj  object containing info about elements to be replace
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Replace to one or more variables in the package's pom
     */
    async replaceVariables(pomFilePath, replacementObj, conversionStep) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            // find the variable
            for (let index = 0; index < content.length; index++) {
                let line = content[index];
                // check for each variable in the object keys
                for (const variable in replacementObj) {
                    if (line.includes(variable)) {
                        // if variable is found, replace it with the specified value
                        content[index] = line.replace(
                            variable,
                            replacementObj[variable]
                        );
                        conversionStep.addOperation(
                            new ConversionOperation(
                                commons_constants.ACTION_REPLACED,
                                `${pomFilePath} - L${index + 1}`,
                                `${variable} set to ${replacementObj[variable]}`
                            )
                        );
                        logger.info(
                            `PomManipulationUtil: ${variable} set to ${
                                replacementObj[variable]
                            } in ${pomFilePath}-L${index + 1}.`
                        );
                    }
                }
            }
            await util.writeDataToFileAsync(pomFilePath, content);
        }
    },

    /**
     *
     * @param String pomFilePath  path of pom file in whose packaging type need to be checked
     * @param Array.<String> expectedPackaging  array of string containing packaging type
     *
     * Check the artifact's packaging type
     */
    verifyArtifactPackagingType(pomFilePath, expectedPackaging) {
        let fileContent = util.getXMLContentSync(pomFilePath);
        for (const line of fileContent) {
            // if it is a packaging tag
            if (line.trim().startsWith(constants.PACKAGING_TAG_START)) {
                let packagingType = line.substring(
                    line.indexOf(">") + 1,
                    line.indexOf(constants.PACKAGING_TAG_END)
                );
                // return whether the packaging type matches
                return expectedPackaging.includes(packagingType.trim());
            }
        }
        // packaging type not found
        return false;
    },

    /**
     *
     * @param pomFilePath  path of pom file in which artifactId's need to be set
     * @param artifactIdInfoList  list of artifact
     * @param groupId groupId to be use in pom
     * @param conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Set artifactId in the package's pom
     */
    async embeddArtifactsUsingTemplate(
        pomFilePath,
        artifactIdInfoList,
        groupId,
        conversionStep
    ) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            let contentToBeWritten = [];
            for (let index = 0; index < content.length; index++) {
                let line = content[index];
                contentToBeWritten.push(line);
                if (
                    line
                        .trim()
                        .startsWith(constants.EMBEDDEDS_SECTION_START_TAG)
                ) {
                    artifactIdInfoList.forEach((artifactIdInfo) => {
                        let artifactId = artifactIdInfo.artifactId;
                        let appId = artifactIdInfo.appId;
                        // embedd the artifacts (ui.apps and ui.content packages
                        // are installed in separate locations)
                        if (
                            artifactId.endsWith(constants.UI_APPS) ||
                            artifactId.endsWith(constants.UI_CONFIG)
                        ) {
                            contentToBeWritten.push(
                                constants.DEFAULT_EMBEDDED_APPS_TEMPLATE.replace(
                                    constants.DEFAULT_ARTIFACT_ID,
                                    artifactId
                                )
                                    .replace(
                                        constants.DEFAULT_GROUP_ID,
                                        groupId
                                    )
                                    .replace(constants.DEFAULT_APP_ID, appId)
                            );
                            logger.info(
                                `PomManipulationUtil: Embedded artifact ${artifactId} in ${pomFilePath}.`
                            );
                            conversionStep.addOperation(
                                new ConversionOperation(
                                    commons_constants.ACTION_ADDED,
                                    pomFilePath,
                                    `Embedded artifact ${artifactId} in all package`
                                )
                            );
                        } else if (artifactId.endsWith(constants.UI_CONTENT)) {
                            contentToBeWritten.push(
                                constants.DEFAULT_EMBEDDED_CONTENT_TEMPLATE.replace(
                                    constants.DEFAULT_ARTIFACT_ID,
                                    artifactId
                                )
                                    .replace(
                                        constants.DEFAULT_GROUP_ID,
                                        groupId
                                    )
                                    .replace(constants.DEFAULT_APP_ID, appId)
                            );
                            logger.info(
                                `PomManipulationUtil: Embedded artifact ${artifactId} in ${pomFilePath}.`
                            );
                            conversionStep.addOperation(
                                new ConversionOperation(
                                    commons_constants.ACTION_ADDED,
                                    pomFilePath,
                                    `Embedded artifact ${artifactId} in all package`
                                )
                            );
                        } else {
                            contentToBeWritten.push(
                                constants.DEFAULT_EMBEDDED_CORE_BUNDLE_TEMPLATE.replace(
                                    constants.DEFAULT_ARTIFACT_ID,
                                    artifactId
                                ).replace(constants.DEFAULT_GROUP_ID, groupId)
                                .replace(constants.DEFAULT_APP_ID, appId)
                            );
                            logger.info(
                                `PomManipulationUtil: Embedded artifact ${artifactId} in ${pomFilePath}.`
                            );
                            conversionStep.addOperation(
                                new ConversionOperation(
                                    commons_constants.ACTION_ADDED,
                                    pomFilePath,
                                    `Embedded artifact ${artifactId} in all package`
                                )
                            );
                        }
                    });
                }
            }
            await util.writeDataToFileAsync(pomFilePath, contentToBeWritten);
        }
    },

    /**
     *
     * @param String pomFilePath  path of pom file in which artifact to be  added under fault plugin
     * @param Array.<String> filevaultPluginEmbeddedList  list of artifact to embedded
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Embed artifact to FileVaultPlugin
     */
    async embeddedArtifactsToFileVaultPlugin(
        pomFilePath,
        filevaultPluginEmbeddedList,
        conversionStep
    ) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            let contentToBeWritten = [];
            for (let index = 0; index < content.length; index++) {
                let line = content[index];
                contentToBeWritten.push(line);
                if (
                    line
                        .trim()
                        .startsWith(constants.EMBEDDEDS_SECTION_START_TAG)
                ) {
                    filevaultPluginEmbeddedList.forEach((line) => {
                        contentToBeWritten.push(line);
                        if (
                            line
                                .trim()
                                .startsWith(constants.ARTIFACT_ID_START_TAG)
                        ) {
                            let artifactId = line.substring(
                                line.indexOf(">") + 1,
                                line.indexOf(constants.ARTIFACT_ID_END_TAG)
                            );
                            conversionStep.addOperation(
                                new ConversionOperation(
                                    commons_constants.ACTION_ADDED,
                                    pomFilePath,
                                    `Embedded artifact ${artifactId} in ${constants.FILEVAULT_PACKAGE_MAVEN_PLUGIN}.`
                                )
                            );
                            logger.info(
                                `PomManipulationUtil: Embedded artifact ${artifactId} in ${pomFilePath}`
                            );
                        }
                    });
                }
            }
            await util.writeDataToFileAsync(pomFilePath, contentToBeWritten);
        }
    },

    /**
     *
     * @param String pomFilePath  path of pom file in which dependencies to be added
     * @param Array.<String> dependencyList  list of dependency to be added to pom
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     * @param boolean inDependencyManagement flag to indicate DependencyManagement
     *
     * Add dependency in the package's pom
     */
    async addDependencies(
        pomFilePath,
        dependencyList,
        conversionStep,
        inDependencyManagement = false
    ) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            let contentToBeWritten = [];
            let doAdd = !inDependencyManagement;
            for (let index = 0; index < content.length; index++) {
                let line = content[index];
                contentToBeWritten.push(line);
                if (line.trim() === constants.DEPENDENCY_SECTION_START_TAG) {
                    if (
                        inDependencyManagement &&
                        content[index - 1].trim() ===
                            constants.DEPENDENCY_MANAGEMENT_SECTION_START_TAG
                    ) {
                        doAdd = true;
                    }
                    if (doAdd) {
                        dependencyList.forEach((dependency) => {
                            contentToBeWritten.push(dependency);
                            if (
                                dependency.includes(
                                    constants.ARTIFACT_ID_START_TAG
                                ) &&
                                dependency.includes(
                                    constants.ARTIFACT_ID_END_TAG
                                )
                            ) {
                                let artifactId = dependency.substring(
                                    dependency.indexOf(
                                        constants.ARTIFACT_ID_START_TAG
                                    ) + constants.ARTIFACT_ID_START_TAG.length,
                                    dependency.indexOf(
                                        constants.ARTIFACT_ID_END_TAG
                                    )
                                );
                                conversionStep.addOperation(
                                    new ConversionOperation(
                                        commons_constants.ACTION_ADDED,
                                        pomFilePath,
                                        `Added dependency: ${artifactId}`
                                    )
                                );
                                logger.info(
                                    `PomManipulationUtil: Added dependency: ${artifactId} in ${pomFilePath}.`
                                );
                            }
                        });
                    }
                }
            }
            await util.writeDataToFileAsync(pomFilePath, contentToBeWritten);
        }
    },
    /**
     *
     * @param String pomFilePath  path of pom file in which sdk Dependency need to be added
     * @param String sdkDependency  sdk Dependency to be add
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Add  Sdk dependency in the package's pom
     */
    async addSdkDependencies(pomFilePath, sdkDependency, conversionStep) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            let contentToBeWritten = [];
            for (let index = 0; index < content.length; index++) {
                let line = content[index];
                if (line.trim() === constants.UBER_JAR_ARTIFACT_ID) {
                    // poping out last 2 lines if uber-jar artifact Id present
                    contentToBeWritten.pop();
                    contentToBeWritten.pop();
                    //skipping line till </dependency> end tag
                    while (line.trim() != constants.DEPENDENCY_END_TAG) {
                        index++;
                        line = content[index];
                    }

                    contentToBeWritten.push(sdkDependency);
                    continue;
                }
                contentToBeWritten.push(line);
            }
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    pomFilePath,
                    `Added SDK dependency: in ${pomFilePath}`
                )
            );
            logger.info(
                `PomManipulationUtil: Added SDK dependency: in ${pomFilePath}.`
            );
            await util.writeDataToFileAsync(pomFilePath, contentToBeWritten);
        }
    },
    /**
     *
     * @param String pomFilePath  path of pom file in which plugins need to be added
     * @param object pluginObj  object containing plugin list and pluginManagementList
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Add Plugins in the package's pom
     */
    async addPlugins(pomFilePath, pluginObj, conversionStep) {
        if (!fs.existsSync(pomFilePath)) {
            logger.error(
                `PomManipulationUtil: Cannot find file  ${pomFilePath}`
            );
        } else {
            // read the content of the pom file
            let content = await util.getXMLContent(pomFilePath);
            let contentToBeWritten = [];
            // these flag denote whether the plugins need to be added to the pom
            // we need these since a pom file can contain multiple pluginManagement,
            // or plugins section(eg. inside profiles)
            let toAddPluginManagement = true;
            let toAddPlugins = true;
            for (let index = 0; index < content.length; index++) {
                contentToBeWritten.push(content[index]);
                let line = content[index].trim();
                // <pluginManagement> section
                if (
                    toAddPluginManagement &&
                    line.startsWith(
                        constants.PLUGINS_MANAGEMENT_SECTION_START_TAG
                    )
                ) {
                    // add the <plugins> tag as is
                    contentToBeWritten.push(content[++index]);
                    // set the flag to false to avoid adding the plugins repeatedly
                    toAddPluginManagement = false;
                    //plugin management added here
                    pluginObj.pluginManagementList.forEach(
                        (pluginManagement) => {
                            contentToBeWritten.push(pluginManagement);
                            if (
                                pluginManagement
                                    .trim()
                                    .startsWith(constants.ARTIFACT_ID_START_TAG)
                            ) {
                                let artifactId = pluginManagement.substring(
                                    pluginManagement.indexOf(">") + 1,
                                    pluginManagement.indexOf(
                                        constants.ARTIFACT_ID_END_TAG
                                    )
                                );
                                conversionStep.addOperation(
                                    new ConversionOperation(
                                        commons_constants.ACTION_ADDED,
                                        pomFilePath,
                                        `Added plugin info for ${artifactId} inside <pluginManagement> section`
                                    )
                                );
                                logger.info(
                                    `PomManipulationUtil: Added plugin info for ${artifactId} inside <pluginManagement> section in ${pomFilePath}.`
                                );
                            }
                        }
                    );
                    // add the content till </pluginManagement> tag is found
                    while (
                        index < content.length - 1 &&
                        line != constants.PLUGINS_MANAGEMENT_SECTION_END_TAG
                    ) {
                        index++;
                        line = content[index].trim();
                        contentToBeWritten.push(content[index]);
                    }
                } else if (
                    toAddPlugins &&
                    line.startsWith(constants.PLUGINS_SECTION_START_TAG)
                ) {
                    // <plugins> section
                    // set the flag to false to avoid adding the plugins repeatedly
                    toAddPlugins = false;
                    pluginObj.pluginList.forEach((pluginLine) => {
                        contentToBeWritten.push(pluginLine);
                        if (
                            pluginLine
                                .trim()
                                .startsWith(constants.ARTIFACT_ID_START_TAG)
                        ) {
                            let artifactId = pluginLine.substring(
                                pluginLine.indexOf(">") + 1,
                                pluginLine.indexOf(
                                    constants.ARTIFACT_ID_END_TAG
                                )
                            );
                            conversionStep.addOperation(
                                new ConversionOperation(
                                    commons_constants.ACTION_ADDED,
                                    pomFilePath,
                                    `Added plugin ${artifactId} `
                                )
                            );
                            logger.info(
                                `PomManipulationUtil: Added plugin ${artifactId} in ${pomFilePath}.`
                            );
                        }
                    });
                    // add the content till </plugins> tag is found
                    while (
                        index < content.length - 1 &&
                        line != constants.PLUGINS_SECTION_END_TAG
                    ) {
                        index++;
                        line = content[index].trim();
                        contentToBeWritten.push(content[index]);
                    }
                }
            }
            await util.writeDataToFileAsync(pomFilePath, contentToBeWritten);
        }
    },
    removeDuplicatesPlugins(pluginList, removeList) {
        return removeDuplicates(
            pluginList,
            removeList,
            constants.PLUGIN_START_TAG,
            constants.PLUGIN_END_TAG
        );
    },
    removeDuplicatesDependencies(dependencyList, removeList) {
        return removeDuplicates(
            dependencyList,
            removeList,
            constants.DEPENDENCY_START_TAG,
            constants.DEPENDENCY_END_TAG
        );
    },
};
/**
 *
 * @param String[] list  list of plugin or dependency
 * @param Set<string> removeList  the list of artifacts that need to be removed from the result
 * @param String startTag  the start tag (<plugin> or <depedency>)
 * @param String endTag  the end tag (</plugin> or </depedency>)
 * @return {Array.<String>} an list of plugins or dependencies without any duplicate artifacts
 *
 * Remove duplicate plugins or dependencies
 */
function removeDuplicates(list, removeList = new Set(), startTag, endTag) {
    var result = [];
    let wasAdded = new Set();
    for (let index = 0; index < list.length; index++) {
        result.push(list[index]);
        let line = list[index].trim();
        if (
            line.startsWith(constants.ARTIFACT_ID_START_TAG) &&
            line.endsWith(constants.ARTIFACT_ID_END_TAG)
        ) {
            let artifactId = line.substring(
                line.indexOf(">") + 1,
                line.indexOf(constants.ARTIFACT_ID_END_TAG)
            );
            if (wasAdded.has(artifactId) || removeList.has(artifactId)) {
                // removing last entires until the start tag is found(<plugin> or <dependency>)
                while (result.length > 0 && result.pop().trim() != startTag) {
                    /* empty */
                }
                // skip the rest of the plugin/dependency
                while (index < list.length && line != endTag) {
                    line = list[index++].trim();
                }
                // index will be auto-incremented in loop
                index--;
            } else {
                wasAdded.add(artifactId);
            }
        }
    }
    return result;
}

module.exports = PomManipulationUtil;
