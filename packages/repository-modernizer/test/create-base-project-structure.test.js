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
jest.mock("@adobe/aem-cs-source-migration-commons");
jest.mock("../src/util/pom-manipulation-util");
jest.mock("fs");
jest.mock("fs-extra");
jest.mock("node-pom-parser", () => {
    const pomObj = {
        artifactId: "test.artifactId",
        version: "1.0.0",
    };
    return { parsePom: jest.fn(() => pomObj) };
});

const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const pomManipulationUtil = require("../src/util/pom-manipulation-util");
const constants = require("../src/util/constants");
const rewire = require("rewire");
const base = require("../src/create-base-project-structure");
const baseRewired = rewire("../src/create-base-project-structure");
const setPackageArtifactAndGroupId = baseRewired.__get__(
    "setPackageArtifactAndGroupId"
);
const copyCoreBundles = baseRewired.__get__("copyCoreBundles");
const copyOtherModules = baseRewired.__get__("copyOtherModules");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const configFileName = "config.yaml";
const multiProjectConfigFileName = "multiProjectConfig.yaml";
const testDir = path.join(process.cwd(), "test");
const { readFileSync } = jest.requireActual("fs");
const config = yaml.safeLoad(
    readFileSync(path.join(testDir, configFileName), "utf8")
);
const multiProjectConfig = yaml.safeLoad(
    readFileSync(path.join(testDir, multiProjectConfigFileName), "utf8")
);
describe("create-base-project-structure", function () {
    test("check type", async () => {
        expect(typeof base.create).toEqual("function");
        expect(typeof setPackageArtifactAndGroupId).toEqual("function");
        expect(typeof copyCoreBundles).toEqual("function");
        expect(typeof copyOtherModules).toEqual("function");
    });

    test("create", () => {
        let conversionSteps = [];
        let projectPath = path.join(
            commons_constants.TARGET_PROJECT_SRC_FOLDER,
            path.basename(config.projects[0].projectPath)
        );
        // mock the methods
        pomManipulationUtil.replaceVariables.mockResolvedValue(true);
        pomManipulationUtil.verifyArtifactPackagingType.mockReturnValue(false);
        util.globGetFilesByName.mockReturnValue(["xyz/pom.xml", "abc/pom.xml"]);
        fs.existsSync.mockResolvedValue(true);
        fs.mkdirSync.mockResolvedValue(true);
        fs.copyFileSync.mockResolvedValue(true);
        fsExtra.copySync.mockResolvedValue(true);
        // call the method
        return base.create(config, "", conversionSteps).then(() => {
            // test whether the appropriate methods were called with correct params
            expect(fs.mkdirSync).toHaveBeenCalledWith(projectPath, {
                recursive: true,
            });
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_ALL_PACKAGE),
                path.join(projectPath, constants.ALL)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_ANALYSE_PACKAGE),
                path.join(projectPath, constants.ANALYSE)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_APPS_PACKAGE),
                path.join(projectPath, constants.UI_APPS)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_APPS_STRUCTURE_PACKAGE),
                path.join(projectPath, constants.UI_APPS_STRUCTURE)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_CONTENT_PACKAGE),
                path.join(projectPath, constants.UI_CONTENT)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_CONFIG_PACKAGE),
                path.join(projectPath, constants.UI_CONFIG)
            );
            expect(fs.copyFileSync).toHaveBeenCalledWith(
                path.join(constants.BASE_PARENT_POM),
                path.join(projectPath, constants.POM_XML)
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_APPS, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        config.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: config.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: config.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_ONE_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(
                    projectPath,
                    constants.UI_APPS_STRUCTURE,
                    constants.POM_XML
                ),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        config.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: config.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: config.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_ONE_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_CONTENT, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        config.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: config.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: config.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_ONE_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_CONFIG, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        config.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: config.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: config.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_ONE_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.ALL, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]: config.all.artifactId,
                    [constants.DEFAULT_VERSION]: config.all.version,
                    [constants.DEFAULT_APP_TITLE]: config.all.appTitle,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.ANALYSE, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: config.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]: config.all.artifactId,
                    [constants.DEFAULT_APP_TITLE]: config.all.appTitle,
                    [constants.DEFAULT_VERSION]: config.all.version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        config.parentPom.artifactId,
                    [constants.DEFAULT_ROOT_VERSION]: config.parentPom.version,
                },
                expect.anything()
            );
            expect(util.globGetFilesByName).toHaveBeenCalledWith(
                path.join(config.projects[0].projectPath),
                constants.POM_XML
            );
        });
    });

    test("create multi project", () => {
        let conversionSteps = [];
        let projectPath = path.join(
            commons_constants.TARGET_PROJECT_SRC_FOLDER,
            path.basename(multiProjectConfig.projects[0].projectPath)
        );
        // mock the methods
        pomManipulationUtil.replaceVariables.mockResolvedValue(true);
        pomManipulationUtil.verifyArtifactPackagingType.mockReturnValue(false);
        util.globGetFilesByName.mockReturnValue(["xyz/pom.xml", "abc/pom.xml"]);
        fs.existsSync.mockResolvedValue(true);
        fs.mkdirSync.mockResolvedValue(true);
        fs.copyFileSync.mockResolvedValue(true);
        fsExtra.copySync.mockResolvedValue(true);
        // call the method
        return base.create(multiProjectConfig, "", conversionSteps).then(() => {
            // test whether the appropriate methods were called with correct params
            expect(fs.mkdirSync).toHaveBeenCalledWith(projectPath, {
                recursive: true,
            });
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_ALL_PACKAGE),
                path.join(commons_constants.TARGET_PROJECT_SRC_FOLDER, constants.ALL)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_ANALYSE_PACKAGE),
                path.join(commons_constants.TARGET_PROJECT_SRC_FOLDER, constants.ANALYSE)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_APPS_PACKAGE),
                path.join(projectPath, constants.UI_APPS)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_APPS_STRUCTURE_PACKAGE),
                path.join(projectPath, constants.UI_APPS_STRUCTURE)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_CONTENT_PACKAGE),
                path.join(projectPath, constants.UI_CONTENT)
            );
            expect(fsExtra.copySync).toHaveBeenCalledWith(
                path.join(constants.BASE_UI_CONFIG_PACKAGE),
                path.join(projectPath, constants.UI_CONFIG)
            );
            expect(fs.copyFileSync).toHaveBeenCalledWith(
                path.join(constants.BASE_PARENT_POM),
                path.join(projectPath, constants.POM_XML)
            );
            expect(fs.copyFileSync).toHaveBeenCalledWith(
                path.join(constants.BASE_PARENT_POM),
                path.join(commons_constants.TARGET_PROJECT_SRC_FOLDER, constants.POM_XML)
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_APPS, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        multiProjectConfig.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_TWO_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(
                    projectPath,
                    constants.UI_APPS_STRUCTURE,
                    constants.POM_XML
                ),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        multiProjectConfig.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_TWO_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_CONTENT, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        multiProjectConfig.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_TWO_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(projectPath, constants.UI_CONFIG, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]:
                        multiProjectConfig.projects[0].artifactId,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.projects[0].appTitle,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.projects[0].version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_RELATIVE_PATH]:
                        constants.RELATIVE_PATH_TWO_LEVEL_UP,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(commons_constants.TARGET_PROJECT_SRC_FOLDER, constants.ALL, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]: multiProjectConfig.all.artifactId,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.all.version,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.all.appTitle,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            expect(pomManipulationUtil.replaceVariables).toHaveBeenCalledWith(
                path.join(commons_constants.TARGET_PROJECT_SRC_FOLDER, constants.ANALYSE, constants.POM_XML),
                {
                    [constants.DEFAULT_GROUP_ID]: multiProjectConfig.groupId,
                    [constants.DEFAULT_ARTIFACT_ID]: multiProjectConfig.all.artifactId,
                    [constants.DEFAULT_APP_TITLE]: multiProjectConfig.all.appTitle,
                    [constants.DEFAULT_VERSION]: multiProjectConfig.all.version,
                    [constants.DEFAULT_ROOT_ARTIFACT_ID]:
                        multiProjectConfig.parentPom.artifactId,
                    [constants.DEFAULT_ROOT_VERSION]: multiProjectConfig.parentPom.version,
                },
                expect.anything()
            );
            expect(util.globGetFilesByName).toHaveBeenCalledWith(
                path.join(multiProjectConfig.projects[0].projectPath),
                constants.POM_XML
            );
        });
    });
});
