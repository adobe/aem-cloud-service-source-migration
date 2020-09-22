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

const path = require("path");
const { util } = require("@adobe/aem-cs-source-migration-commons");
const constants = require("./constants");

class Validator {
    constructor(config) {
        this.uiAppsPackagePaths = config.uiAppsPackagePaths;
        this.uiContentPackagePaths = config.uiContentPackagePaths;
        this.allPackagePath = config.allPackagePath;
    }

    validate() {
        this.checkUIAppsFilters();
        this.checkUIContentFilters();
        this.validateFileVaultPluginConfig(
            this.uiAppsPackagePaths,
            "application",
            "<cloudManagerTarget>none</cloudManagerTarget>"
        );
        this.validateFileVaultPluginConfig(
            this.uiContentPackagePaths,
            "content",
            "<cloudManagerTarget>none</cloudManagerTarget>"
        );
        this.validateFileVaultPluginConfig([this.allPackagePath]);
        this.validateAllPackageEmbeddedArtifacts(
            this.allPackagePath,
            this.getArtifactIds(
                this.uiAppsPackagePaths.concat(this.uiContentPackagePaths)
            )
        );
    }

    isImmutableContentFilter(line) {
        return (
            line.includes('"/apps') ||
            line.includes('"/libs') ||
            line.includes('"/oak:index')
        );
    }

    /*
     * Checks : Whether ui.apps package deploys to mutable paths
     */
    checkUIAppsFilters() {
        this.uiAppsPackagePaths.forEach((packagePath) => {
            let uiAppsPackageFilterPath = path.join(
                packagePath,
                constants.FILTER_PATH
            );
            let filterContent = util.getXMLContent(uiAppsPackageFilterPath);
            for (let index = 0; index < filterContent.length; index++) {
                let line = filterContent[index].trim();
                // skip start, end line, empty lines and filter end tag line
                if (
                    !constants.FILTER_XML_START.includes(line) &&
                    !constants.FILTER_XML_END.includes(line) &&
                    !/^\s*$/.test(line) &&
                    !constants.FILTER_SECTION_END.includes(line)
                ) {
                    if (!this.isImmutableContentFilter(filterContent[index])) {
                        console.log(
                            "Error:" +
                                uiAppsPackageFilterPath +
                                ":L" +
                                (index + 1) +
                                " ui.apps package should not have mutable content"
                        );
                    }
                }
            }
        });
    }

    /*
     * Checks : Whether ui.content package deploys to immutable paths
     */
    checkUIContentFilters() {
        this.uiContentPackagePaths.forEach((packagePath) => {
            let uiContentPackageFilterPath = path.join(
                packagePath,
                constants.FILTER_PATH
            );
            let filterContent = util.getXMLContent(uiContentPackageFilterPath);
            for (let index = 0; index < filterContent.length; index++) {
                let line = filterContent[index].trim();
                //skip start, end line and empty lines
                if (
                    !constants.FILTER_XML_START.includes(line) &&
                    !constants.FILTER_XML_END.includes(line) &&
                    !/^\s*$/.test(line) &&
                    !constants.FILTER_SECTION_END.includes(line)
                ) {
                    if (this.isImmutableContentFilter(filterContent[index])) {
                        console.log(
                            "Error:" +
                                uiContentPackageFilterPath +
                                ":L" +
                                (index + 1) +
                                " ui.content package should not have immutable content"
                        );
                    }
                }
            }
        });
    }

    /*
     * Checks :
     * 1. In the ui.apps/pom.xml and ui.content/pom.xml , the <packageType>application</packageType>
     * & <packageType>content</packageType> respectevely are specified in configuration directive of
     * the filevault-package-maven-plugin plugin
     * 2. For all packages except for the container (all) project, check whether
     * <cloudManagerTarget>none</cloudManagerTarget> was added to the <properties> config of the
     * filevault-package-maven-plugin declaration to ensure they aren't deployed by Adobe Cloud Manager.
     * 3. Check whether unsupported plugins are used
     */
    validateFileVaultPluginConfig(
        packagePaths,
        expectedPackageType,
        expectedCloudManagerTargetConfig
    ) {
        packagePaths.forEach((packagePath) => {
            let pomFilePath = path.join(packagePath, constants.POM_XML);
            let pomFileContent = util.getXMLContent(pomFilePath);
            // this flag denotes whether <cloudManagerTarget> tag has been found in current pom file
            let fileVaultPluginSectionStart = false;
            // this flag denotes whether 'filevault-package-maven-plugin' has been found in current pom file
            let pluginsSectionStart = false;
            // this flag denotes whether <cloudManagerTarget> tag has been found in current pom file
            let cloudManagerTargetConfigFound = false;
            for (let index = 0; index < pomFileContent.length; index++) {
                let line = pomFileContent[index].trim();
                if (line === constants.PLUGINS_SECTION_START) {
                    pluginsSectionStart = true;
                } else if (line === constants.PLUGINS_SECTION_END) {
                    pluginsSectionStart = false;
                }
                if (pluginsSectionStart) {
                    if (line === constants.FILEVAULT_PLUGIN) {
                        fileVaultPluginSectionStart = true;
                        this.checkFileVaultPluginVersion(
                            pomFilePath,
                            pomFileContent,
                            index
                        );
                    } else if (
                        fileVaultPluginSectionStart &&
                        line === constants.PLUGINS_SECTION_END
                    ) {
                        // if `<cloudManagerTarget>none</cloudManagerTarget>` is not
                        // set in ui.apps and ui.content packages
                        if (
                            (packagePath.includes(constants.UI_APPS) ||
                                packagePath.includes(constants.UI_CONTENT)) &&
                            !cloudManagerTargetConfigFound
                        ) {
                            console.log(
                                "Error1:" +
                                    pomFilePath +
                                    " expected `<cloudManagerTarget>none</cloudManagerTarget>` in <properties> configuration of filevault-package-maven-plugin"
                            );
                        }
                        fileVaultPluginSectionStart = false;
                    }
                    if (fileVaultPluginSectionStart) {
                        // Check package type
                        if (line.startsWith(constants.PACKAGE_TYPE)) {
                            if (expectedPackageType == undefined) {
                                console.log(
                                    "Error:" +
                                        pomFilePath +
                                        ":L" +
                                        (index + 1) +
                                        " all package should not declare a <packageType>"
                                );
                            } else {
                                if (!line.includes(expectedPackageType)) {
                                    console.log(
                                        "Error:" +
                                            pomFilePath +
                                            ":L" +
                                            (index + 1) +
                                            " unexpected <packageType> declaration"
                                    );
                                }
                            }
                        }
                        // Check <cloudManagerTarget> config
                        if (line.startsWith(constants.CLOUD_MANAGER_TARGET)) {
                            cloudManagerTargetConfigFound = true;
                            if (
                                (packagePath.includes(constants.UI_APPS) ||
                                    packagePath.includes(
                                        constants.UI_CONTENT
                                    )) &&
                                line != expectedCloudManagerTargetConfig
                            ) {
                                console.log(
                                    "Error:" +
                                        pomFilePath +
                                        ":L" +
                                        (index + 1) +
                                        " expected `<cloudManagerTarget>none</cloudManagerTarget>` in <properties> configuration of filevault-package-maven-plugin"
                                );
                            }
                        }
                    } else if (
                        line.startsWith(constants.ARTIFACT_ID_START_TAG.trim())
                    ) {
                        // get artifactId
                        let artifactId = line.substring(
                            line.indexOf(">") + 1,
                            line.indexOf(constants.ARTIFACT_ID_END_TAG)
                        );
                        // check if plugin artifact is unsupported
                        if (constants.BLACKLISTED_PLUGIN.includes(artifactId)) {
                            console.log(
                                "Error:" +
                                    pomFilePath +
                                    ":L" +
                                    (index + 1) +
                                    " unsupported plugin " +
                                    line.substring(
                                        line.indexOf(">") + 1,
                                        line.indexOf(
                                            constants.ARTIFACT_ID_END_TAG
                                        )
                                    ) +
                                    " usage"
                            );
                        }
                    }
                }
            }
        });
    }

    checkFileVaultPluginVersion(pomFilePath, content, index) {
        while (content[index].trim() != constants.CONFIGURATION_START_TAG) {
            let line = content[index].trim();
            if (
                line.startsWith(constants.VERSION_START_TAG) &&
                line.substring(
                    line.indexOf(">") + 1,
                    line.indexOf(constants.VERSION_END_TAG)
                ) != constants.FILEVAULT_PLUGIN_EXPECTED_VERSION
            ) {
                console.log(
                    "Error:" +
                        pomFilePath +
                        ":L" +
                        (index + 1) +
                        " expected version of filevault-package-maven-plugin is " +
                        constants.FILEVAULT_PLUGIN_EXPECTED_VERSION
                );
            }
            index++;
        }
    }

    /*
     * Get the artifactIds from given packages
     */
    getArtifactIds(packagePaths) {
        let artifactIds = [];
        packagePaths.forEach((packagePath) => {
            let artifactId = this.getArtifactId(
                util.getXMLContent(path.join(packagePath, constants.POM_XML))
            );
            if (artifactId != undefined) {
                artifactIds.push(artifactId);
            }
        });
        return artifactIds;
    }

    /*
     * Get the artifactId from given package's pom.xml content
     */
    getArtifactId(content) {
        for (let index = 0; index < content.length; index++) {
            let line = content[index];
            if (line.startsWith(constants.ARTIFACT_ID_START_TAG)) {
                return line.substring(
                    line.indexOf(">") + 1,
                    line.indexOf("</artifactId>")
                );
            }
        }
        return undefined;
    }

    validateAllPackageEmbeddedArtifacts(allPackagePath, artifactList) {
        let embeddedList = [];
        let pomFilePath = path.join(allPackagePath, constants.POM_XML);
        let allPackagePomFileContent = util.getXMLContent(pomFilePath);
        // this flag denotes whether <cloudManagerTarget> tag has been found in current pom file
        let fileVaultPluginSectionStart = false;

        for (let index = 0; index < allPackagePomFileContent.length; index++) {
            let line = allPackagePomFileContent[index].trim();
            if (line === constants.FILEVAULT_PLUGIN) {
                fileVaultPluginSectionStart = true;
            } else if (
                fileVaultPluginSectionStart &&
                line === constants.PLUGINS_SECTION_END
            ) {
                fileVaultPluginSectionStart = false;
            }
            if (fileVaultPluginSectionStart) {
                if (line.startsWith(constants.ARTIFACT_ID_START_TAG.trim())) {
                    let artifactId = line.substring(
                        line.indexOf(">") + 1,
                        line.indexOf("</artifactId>")
                    );
                    embeddedList.push(artifactId);
                }
            }
        }
        // remove all artifacts which are embedded
        artifactList = artifactList.filter(
            (artifactId) => !embeddedList.includes(artifactId)
        );
        // if there are any artifacts which were not embedded
        artifactList.forEach((artifactId) => {
            console.log(
                "Error:" +
                    pomFilePath +
                    " artifact " +
                    artifactId +
                    " not embedded in `all` package"
            );
        });
    }
}

module.exports = Validator;
