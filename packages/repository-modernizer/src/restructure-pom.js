/*
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

const constants = require("./util/constants");
const pomManipulationUtil = require("./util/pom-manipulation-util");
const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

var RestructurePoms = {
    /**
     *
     * @param object config yaml object containing info of project to be restructured
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Restructure pom file  of packages
     */
    async restructure(config, conversionSteps) {
        let sdkVersion = "";
        let projects = config.projects;
        let package_artifactId_list = [];
        let nonAdobeDependencyList = new Set();
        let conversionStep = new ConversionStep(
            "Restructure pom files",
            "Add required plugins, dependencies to appropriate `pom.xml` files."
        );
        let projectRootPath = commons_constants.TARGET_PROJECT_SRC_FOLDER;
        for (const project of projects) {
            let projectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            if (projects.length === 1) {
                projectRootPath = projectPath;
            }
            let uiAppsPomFile = path.join(
                projectPath,
                constants.UI_APPS,
                constants.POM_XML
            );
            let uiContentPomFile = path.join(
                projectPath,
                constants.UI_CONTENT,
                constants.POM_XML
            );
            let ui_apps_artifactId = project.artifactId.concat(
                ".",
                constants.UI_APPS
            );
            let ui_content_artifactId = project.artifactId.concat(
                ".",
                constants.UI_CONTENT
            );
            package_artifactId_list.push(ui_apps_artifactId);
            package_artifactId_list.push(ui_content_artifactId);
            // add dependencies in ui.content
            let uiContentDependencyList = [
                constants.DEFAULT_DEPENDENCY_TEMPLATE.replace(
                    constants.DEFAULT_ARTIFACT_ID,
                    ui_apps_artifactId
                ).replace(constants.DEFAULT_GROUP_ID, config.groupId),
            ];
            pomManipulationUtil.addDependencies(
                uiContentPomFile,
                uiContentDependencyList,
                conversionStep
            );

            // add dependencies in ui.apps
            let uiAppsDependencyList = [];
            let srcContentPackages = project.existingContentPackageFolder;
            let pluginObj = {
                pluginList: [],
                pluginManagementList: [],
                filevaultPluginEmbeddedList: [],
            };
            for (const contentPackage of srcContentPackages) {
                let srcPomFile = path.join(
                    project.projectPath,
                    contentPackage,
                    constants.POM_XML
                );
                let dependencies = await getDependenciesFromPom(srcPomFile);
                uiAppsDependencyList.push(...dependencies);
                await getPluginsFromPom(srcPomFile, pluginObj);
                let thirdPartyDependencies = await get3rdPartyDependency(
                    srcPomFile
                );
                // add the 3rd party dependencies retieved to the list
                thirdPartyDependencies.forEach((item) =>
                    nonAdobeDependencyList.add(item)
                );
            }
            sdkVersion = await fetchSDKMetadata();
            let sdkDependency = constants.SDK_DEPENDENCY_TEMPLATE.replace(
                "${version}",
                sdkVersion
            );
            uiAppsDependencyList.push(sdkDependency);
            addSdkDependencytoCoreBundles(
                project.projectPath,
                projectPath,
                sdkDependency,
                conversionStep
            );
            uiAppsDependencyList = pomManipulationUtil.removeDuplicatesDependencies(
                uiAppsDependencyList
            );
            pluginObj.pluginList = pomManipulationUtil.removeDuplicatesPlugins(
                pluginObj.pluginList
            );
            await pomManipulationUtil.addDependencies(
                uiAppsPomFile,
                uiAppsDependencyList,
                conversionStep
            );
            // add the artifacts embedded in the source pom file's
            // filevault plugin to the new pom's filevault plugin
            await pomManipulationUtil.embeddedArtifactsToFileVaultPlugin(
                uiAppsPomFile,
                pluginObj.filevaultPluginEmbeddedList,
                conversionStep
            );
            await pomManipulationUtil.addPlugins(
                uiAppsPomFile,
                pluginObj,
                conversionStep
            );
        }
        // all package pom file manipulation
        let allPackageDependencyList = [];
        let allPackagePomFile = path.join(
            projectRootPath,
            constants.ALL,
            constants.POM_XML
        );
        // add dependencies to all package pom file
        package_artifactId_list.forEach((artifactId) => {
            allPackageDependencyList.push(
                constants.DEFAULT_DEPENDENCY_TEMPLATE.replace(
                    constants.DEFAULT_ARTIFACT_ID,
                    artifactId
                ).replace(constants.DEFAULT_GROUP_ID, config.groupId)
            );
        });
        // embed required packages in all package pom file
        await pomManipulationUtil.embeddArtifactsUsingTemplate(
            allPackagePomFile,
            package_artifactId_list,
            config.groupId,
            conversionStep
        );
        await pomManipulationUtil.addDependencies(
            allPackagePomFile,
            allPackageDependencyList,
            conversionStep
        );
        // refactor the parent pom.xml
        await refactorParentPom(
            path.join(projectRootPath, constants.POM_XML),
            sdkVersion,
            config,
            nonAdobeDependencyList,
            conversionStep
        );
        conversionSteps.push(conversionStep);
    },
};
/**
 *
 * @param String pomFile path of pom file in which dependency need to be added
 * @param Set<string> nonAdobeDependencyList  list of non-Adobe dependency List
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Add 3rd party Repo Section
 */
async function add3rdPartyRepoSection(
    pomFile,
    nonAdobeDependencyList,
    conversionStep
) {
    // if there are 3rd party dependency ,make folder and add repo section
    if (nonAdobeDependencyList.size > 0) {
        logger.warn(
            `RestructurePom: Found 3rd party dependencies : ${[
                ...nonAdobeDependencyList,
            ].join(", ")}.`
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.WARNING,
                "",
                `Found 3rd party dependencies : ${[
                    ...nonAdobeDependencyList,
                ].join(", ")}.`
            )
        );
        let nonAdobeDependencyFolder = path.join(
            path.dirname(pomFile),
            "nonAdobeDependencies"
        );
        fs.mkdirSync(nonAdobeDependencyFolder, {
            recursive: true,
        });
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.WARNING,
                pomFile,
                `Created folder ${nonAdobeDependencyFolder}, please add 3rd party dependency jar files in it`
            )
        );
        logger.info(
            `RestructurePom: Created folder ${nonAdobeDependencyFolder},please add 3rd party dependency jar files in it.`
        );
        let fileContent = await util.getXMLContent(pomFile);
        let contentToBeWritten = [];
        fileContent.forEach((line) => {
            contentToBeWritten.push(line);
            if (line === constants.REPOSITORIES_SECTION_START) {
                contentToBeWritten.push(
                    constants.NON_ADOBE_REPO_SECTION_TEMPLATE
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        pomFile,
                        `Added repository section for including 3rd party dependencies from local-repo.`
                    )
                );
            }
        });
        await util.writeDataToFileAsync(pomFile, contentToBeWritten);
        logger.info(
            `RestructurePom: Added 3rd party repo section in ${pomFile}.`
        );
    }
}
/**
 *
 * @param String pomFile path of pom file in which dependency need to be added
 * @param String sdkVersion  sdk version to be added
 * @param object config yaml object containing info of project to be restructured
 * @param Set<string> nonAdobeDependencyList  list of non-Adobe dependency List
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Async function to refactor parent pom file
 */
async function refactorParentPom(
    pomFile,
    sdkVersion,
    config,
    nonAdobeDependencyList,
    conversionStep
) {
    // replace the OOTB variables
    await pomManipulationUtil.replaceVariables(
        pomFile,
        {
            [constants.DEFAULT_GROUP_ID]: config.groupId,
            [constants.DEFAULT_ARTIFACT_ID]: config.parentPom.artifactId,
            [constants.DEFAULT_APP_TITLE]: config.parentPom.appTitle,
            [constants.DEFAULT_SDK_API]: sdkVersion,
        },
        conversionStep
    );
    // add local-repo section for including non-adobe dependencies
    await add3rdPartyRepoSection(
        pomFile,
        nonAdobeDependencyList,
        conversionStep
    );
    await addParentandModuleinfo(pomFile, config.parentPom.path);
    // add dependencies from source parent pom.xml
    let dependencyList = await getDependenciesFromPom(config.parentPom.path);
    await pomManipulationUtil.addDependencies(
        pomFile,
        dependencyList,
        conversionStep,
        true
    );
    let pluginObj = {
        pluginList: [],
        pluginManagementList: [],
        filevaultPluginEmbeddedList: [],
    };
    await getPluginsFromPom(config.parentPom.path, pluginObj);
    pluginObj.pluginManagementList = pomManipulationUtil.removeDuplicatesPlugins(
        pluginObj.pluginManagementList,
        new Set(constants.OOTB_PARENT_POM_PLUGIN_MANAGEMENT)
    );
    // as we are only interested in the pluginmanagement info,
    // remove the other info from the pluginObj
    pluginObj.pluginList = [];
    pluginObj.filevaultPluginEmbeddedList = [];
    await pomManipulationUtil.addPlugins(pomFile, pluginObj, conversionStep);
    conversionStep.addOperation(
        new ConversionOperation(
            commons_constants.WARNING,
            pomFile,
            `Please review the dependencies and plugins (added to the parent pom file from the source parent pom file) to check if their version need to be updated.`
        )
    );
    logger.warn(
        "RestructurePom: Please review the dependencies and plugins (added to the parent pom file from the source parent pom file) to check if their version need to be updated."
    );
}
/**
 *
 * @param String pomFile path of pom file from which 3rd party dependencies need to be retrieve
 * @return {Array.<String>} return list of non adobe dependencies
 *
 * Function to get list of non adobe dependencies present in pom file
 */
async function get3rdPartyDependency(pomFile) {
    let fileContent = await util.getXMLContent(pomFile);
    let nonAdobeDependencyList = [];
    let line = 0;
    let pomLine = "";
    while (
        line < fileContent.length &&
        pomLine != constants.DEPENDENCY_SECTION_START_TAG
    ) {
        pomLine = fileContent[line].trim();
        line++;
    }
    while (
        line < fileContent.length &&
        pomLine != constants.DEPENDENCY_SECTION_END_TAG
    ) {
        pomLine = fileContent[line].trim();
        // check if line contains group ID
        if (pomLine.includes(constants.GROUP_ID_START_TAG)) {
            let groupId = pomLine.substring(
                pomLine.indexOf(">") + 1,
                pomLine.indexOf(constants.GROUP_ID_END_TAG)
            );
            // if groupID is not of Adobe/Day category ,add artifactId to 3rd party list
            let isAdobeGroup = false;
            constants.ADOBE_DEPENDENCY_GROUP.forEach((group) => {
                if (groupId.includes(group)) {
                    isAdobeGroup = true;
                }
            });
            if (!isAdobeGroup) {
                line++;
                pomLine = fileContent[line].trim();
                let artifactId = pomLine.substring(
                    pomLine.indexOf(">") + 1,
                    pomLine.indexOf(constants.ARTIFACT_ID_END_TAG)
                );
                nonAdobeDependencyList.push(artifactId);
            }
        }
        line++;
    }
    return nonAdobeDependencyList;
}
/**
 *
 * @param String pomFile path of pom file from which dependencies need to be retrieved
 * @return {Array.<String>} return list of dependencies present in pom file
 *
 * Function to get list of dependencies present in pom file
 */
async function getDependenciesFromPom(pomFile) {
    let dependencyList = [];
    let fileContent = await util.getXMLContent(pomFile);
    let pushContent = false;
    let pomLine = "";
    for (let line = 0; line < fileContent.length; line++) {
        pomLine = fileContent[line];
        // add dependencies to the list
        if (pomLine.trim() === constants.DEPENDENCY_SECTION_START_TAG) {
            //skipping dependency section start tag from getting added to list
            pushContent = true;
            continue;
        }
        if (pomLine.trim() === constants.DEPENDENCY_SECTION_END_TAG) {
            //not adding end tag to list
            pushContent = false;
        }
        if (pushContent) {
            if (pomLine.trim() === constants.UBER_JAR_ARTIFACT_ID) {
                //pop out <groupId> and <dependency> tag of uber jar
                dependencyList.pop();
                dependencyList.pop();
                //skip lines till dependency end tag
                while (
                    line < fileContent.length &&
                    pomLine.trim() != constants.DEPENDENCY_END_TAG
                ) {
                    line++;
                    pomLine = fileContent[line];
                }
                continue;
            }
            dependencyList.push(pomLine);
        }
    }
    return dependencyList;
}

/**
 *
 * @param String pomFile path of pom file from which plugin list and pluginManagementList need to be retrieved
 * @param object plugin object path of pom file from which plugin list and pluginManagementList need to be retrieved
 *
 * Function to set values to Plugins object containing plugin list and pluginManagementList present in pom file
 */
async function getPluginsFromPom(pomFile, pluginObj) {
    let fileContent = await util.getXMLContent(pomFile);
    let pushContent = false;
    let pomLine = "";
    for (let line = 0; line < fileContent.length; line++) {
        pomLine = fileContent[line].trim();
        // adding plugin management section to list
        if (pomLine === constants.PLUGINS_MANAGEMENT_SECTION_START_TAG) {
            // skip the <pluginManagement> and the following <plugin> tags
            line += 2;
            // add the plugins inside pluginManagement section till the </plugins> tag is found
            while (
                line < fileContent.length &&
                pomLine != constants.PLUGINS_SECTION_END_TAG
            ) {
                pluginObj.pluginManagementList.push(fileContent[line]);
                line++;
                pomLine = fileContent[line].trim();
                // skip commented lines if any
                if (pomLine.startsWith(constants.XML_COMMENT_START)) {
                    while (!pomLine.endsWith(constants.XML_COMMENT_END)) {
                        line++;
                        pomLine = fileContent[line].trim();
                    }
                }
            }
        }
        if (pomLine === constants.PLUGINS_SECTION_START_TAG) {
            //skipping plugin section start tag from getting added to list
            pushContent = true;
            continue;
        }
        if (pomLine === constants.PLUGINS_SECTION_END_TAG) {
            // not adding end tag to list
            pushContent = false;
        }
        if (pushContent) {
            // Skip the filevault plugin from the source, the new pom will
            // have a OOTB filevault plugin section with latest configs.
            // We need to extract the artifacts embedded in the source pom file's
            // filevault plugin into a separate list, which will be added to the
            // OOTB filevault plugin section.
            if (
                constants.FILEVAULT_PACKAGE_MAVEN_PLUGIN !==
                fileContent[line]
                    .trim()
                    .substring(
                        pomLine.indexOf(">") + 1,
                        pomLine.indexOf(constants.ARTIFACT_ID_END_TAG)
                    )
            ) {
                pluginObj.pluginList.push(fileContent[line]);
            } else {
                // if filevault plugin is found...
                // removing last entires until the start tag <plugin> is found
                while (
                    pluginObj.pluginList.length > 0 &&
                    pluginObj.pluginList.pop().trim() !=
                        constants.PLUGIN_START_TAG
                ) {
                    /* empty */
                }
                while (
                    line < fileContent.length &&
                    pomLine != constants.PLUGIN_END_TAG
                ) {
                    // if start of embedded section is found
                    if (
                        pomLine.startsWith(
                            constants.EMBEDDEDS_SECTION_START_TAG
                        )
                    ) {
                        line++;
                        pomLine = fileContent[line].trim();
                        // Add all embedded artifacts to the list till the embedded section ends
                        while (
                            line < fileContent.length &&
                            !pomLine.startsWith(
                                constants.EMBEDDEDS_SECTION_END_TAG
                            )
                        ) {
                            pluginObj.filevaultPluginEmbeddedList.push(
                                fileContent[line]
                            );
                            line++;
                            pomLine = fileContent[line].trim();
                        }
                    }
                    line++;
                    pomLine = fileContent[line].trim();
                }
            }
        }
    }
}
/**
 *
 * @param String source path of package to be to be restructured
 * @param String destination path of target project
 * @param String sdkDependency  sdk dependency to be added
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Function to add sdk dependency to core Bundles
 */
async function addSdkDependencytoCoreBundles(
    source,
    destination,
    sdkDependency,
    conversionStep
) {
    let allPomFiles = util.globGetFilesByName(source, constants.POM_XML);
    for (let pomFile = 0; pomFile < allPomFiles.length; pomFile++) {
        if (
            pomManipulationUtil.verifyArtifactPackagingType(
                allPomFiles[pomFile],
                constants.BUNDLE_PACKAGING_TYPES
            )
        ) {
            let bundleFolderPath = path.dirname(allPomFiles[pomFile]);
            let PomFile = path.join(
                destination + bundleFolderPath.replace(source, ""),
                constants.POM_XML
            );
            await pomManipulationUtil.addSdkDependencies(
                PomFile,
                sdkDependency,
                conversionStep
            );
        }
    }
}
/**
 * Function to fetch sdk version
 */
async function fetchSDKMetadata() {
    let response = await fetch(constants.URL_TO_FETCH_SDK_VERSION);
    let version = "";
    if (response.ok) {
        let json = await response.text();
        version = JSON.parse(json).response.docs[0].latestVersion;
    } else {
        version = constants.DEFAULT_SDK_VERSION;
    }
    return version;
}

/**
 *
 * @param String pomFile path of parent pom
 * @param String originalParent path of originalParent
 *
 * Function to add parent and module info
 */
async function addParentandModuleinfo(pomFile, originalParent) {
    let parentModule = [];
    let pushContent = false;
    let fileContent = await util.getXMLContent(originalParent);

    for (let line = 0; line < fileContent.length; line++) {
        pomLine = fileContent[line];
        if (pomLine.trim() == constants.PARENT_START_TAG) {
            while (
                line < fileContent.length &&
                pomLine.trim() != constants.PARENT_END_TAG
            ) {
                parentModule.push(pomLine);
                line++;
                pomLine = fileContent[line];
            }
            parentModule.push(pomLine);
        }
        if (pomLine.trim() == constants.MODULE_START_TAG) {
            while (
                line < fileContent.length &&
                pomLine.trim() != constants.MODULE_END_TAG
            ) {
                parentModule.push(pomLine);
                line++;
                pomLine = fileContent[line];
            }
            parentModule.push(pomLine);
        }
    }
    let contentToBeWritten = [];
    if (parentModule.length != 0) {
        let fileContent = await util.getXMLContent(pomFile);
        for (let line = 0; line < fileContent.length; line++) {
            let pomLine = fileContent[line];
            if (pomLine.trim() == constants.PARENT_START_TAG) {
                parentModule.forEach((module) => {
                    contentToBeWritten.push(module);
                });
                line = line + 2;
            }
            pomLine = fileContent[line];
            contentToBeWritten.push(pomLine);
        }
        await util.writeDataToFileAsync(pomFile, contentToBeWritten);
    }
}

module.exports = RestructurePoms;
