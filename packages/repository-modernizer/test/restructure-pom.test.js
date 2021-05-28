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

const rewire = require("rewire");
const pomsRewire = rewire("./../src/restructure-pom");
const poms = require("./../src/restructure-pom");
jest.mock("../src/util/pom-manipulation-util");
const pomManipulationUtil = require("../src/util/pom-manipulation-util");
const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
jest.mock("@adobe/aem-cs-source-migration-commons");
const dir = "./testFolder";
let srcpath = "./test/resources/pom.xml";
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const constants = require("../src/util/constants");
const configFileName = "config.yaml";
const testDir = path.join(process.cwd(), "test");
const { readFileSync } = jest.requireActual("fs");
const config = yaml.safeLoad(
    readFileSync(path.join(testDir, configFileName), "utf8")
);
const xmlContent = describe("restructure pom", function () {
    var conversionSteps = [];
    test("restructure pom", () => {
        let projects = config.projects;
        let srcContentPackages = projects[0].existingContentPackageFolder;
        let srcPomFile = path.join(
            projects[0].projectPath,
            srcContentPackages[0],
            constants.POM_XML
        );
        let package_artifactId_list = [];
        let projectPath = path.join(
            commons_constants.TARGET_PROJECT_SRC_FOLDER,
            path.basename(config.projects[0].projectPath)
        );
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
        let allPackagePomFile = path.join(
            projectPath,
            constants.ALL,
            constants.POM_XML
        );
        let pluginObj = {
            pluginList: [],
            pluginManagementList: [],
            filevaultPluginEmbeddedList: [],
        };
        let ui_content_artifactId = config.projects[0].artifactId.concat(
            ".",
            constants.UI_CONTENT
        );
        let ui_apps_artifactId = config.projects[0].artifactId.concat(
            ".",
            constants.UI_APPS
        );
        let uiContentDependencyList = [
            constants.DEFAULT_DEPENDENCY_TEMPLATE.replace(
                constants.DEFAULT_ARTIFACT_ID,
                ui_apps_artifactId
            )
                .replace(constants.DEFAULT_GROUP_ID, config.groupId)
                .replace(constants.DEFAULT_VERSION, projects[0].version),
        ];
        const xmlContent = fs.readFileSync(srcpath, "utf8").split(/\r?\n/);
        //mock methods
        pomManipulationUtil.addDependencies.mockReturnValue(true);
        pomManipulationUtil.addPlugins.mockResolvedValue(true);
        pomManipulationUtil.embeddArtifactsUsingTemplate.mockResolvedValue(
            true
        );

        let sdkDependency = constants.SDK_DEPENDENCY_TEMPLATE.replace(
            "${version}",
            constants.DEFAULT_SDK_VERSION
        );
        pomManipulationUtil.removeDuplicatesDependencies.mockReturnValue(true);
        pomManipulationUtil.embeddedArtifactsToFileVaultPlugin.mockResolvedValue(
            true
        );
        pomManipulationUtil.replaceVariables.mockResolvedValue(true);
        pomManipulationUtil.removeDuplicatesPlugins.mockReturnValue(true);
        util.globGetFilesByName.mockReturnValue(["xyz/pom.xml", "abc/pom.xml"]);
        util.writeDataToFileSync.mockResolvedValue(true);
        util.getXMLContent.mockReturnValue(xmlContent);
        return poms.restructure(config, conversionSteps).then(() => {
            expect(pomManipulationUtil.addDependencies).toHaveBeenCalledWith(
                uiContentPomFile,
                uiContentDependencyList,
                expect.anything()
            );
            expect(pomManipulationUtil.addDependencies).toHaveBeenCalledTimes(
                5
            );
            expect(
                pomManipulationUtil.removeDuplicatesDependencies
            ).toHaveBeenCalledTimes(3);
            expect(
                pomManipulationUtil.embeddedArtifactsToFileVaultPlugin
            ).toHaveBeenCalledWith(
                uiAppsPomFile,
                pluginObj.filevaultPluginEmbeddedList,
                expect.anything()
            );
            expect(
                pomManipulationUtil.removeDuplicatesPlugins
            ).toHaveBeenCalledTimes(3);
            expect(
                pomManipulationUtil.embeddArtifactsUsingTemplate
            ).toHaveBeenCalledTimes(1);
        });
    });
    test("get dependencies", async () => {
        let dependencyList = await pomsRewire.__get__("getDependenciesFromPom")(
            srcpath
        );
        var expected = [
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.apps</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </dependency>",
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.core</artifactId>",
            "        <version>1.0.1</version>",
            "      </dependency>",
            "      <dependency>",
            "        <groupId>com.adobe.aem</groupId>",
            "        <artifactId>aem.test.core</artifactId>",
            "        <version>1.0.1</version>",
            "      </dependency>",
        ];
        expect(dependencyList).toEqual(expected);
    });
    test("get 3rd party dependencies", async () => {
        let NonAdobeList = await pomsRewire.__get__("get3rdPartyDependency")(
            srcpath
        );

        expect(NonAdobeList.length).toBeGreaterThan(0);
    });
    test("exports", async () => {
        expect(typeof pomsRewire.__get__("add3rdPartyRepoSection")).toEqual(
            "function"
        );
        expect(typeof pomsRewire.__get__("getDependenciesFromPom")).toEqual(
            "function"
        );
        expect(typeof pomsRewire.__get__("get3rdPartyDependency")).toEqual(
            "function"
        );
        expect(typeof pomsRewire.__get__("getPluginsFromPom")).toEqual(
            "function"
        );
        expect(typeof pomsRewire.__get__("fetchSDKMetadata")).toEqual(
            "function"
        );
    });
    test("get plugins from pom", async () => {
        let pluginObj = {
            pluginList: [],
            pluginManagementList: [],
            filevaultPluginEmbeddedList: [],
        };
        await pomsRewire.__get__("getPluginsFromPom")(srcpath, pluginObj);
        let expectedPluginList = [
            "      <plugin>",
            "        <groupId>io.github.zlika</groupId>",
            "        <artifactId>reproducible-build-maven-plugin</artifactId>",
            "        <version>0.11</version>",
            "        <executions>",
            "          <execution>",
            "            <goals>",
            "              <goal>strip-jar</goal>",
            "            </goals>",
            "          </execution>",
            "        </executions>",
            "      </plugin>",
        ];
        let expectedPluginManagementList = [
            "        <plugin>",
            "          <groupId>org.codehaus.mojo</groupId>",
            "          <artifactId>jaxws-maven-plugin</artifactId>",
            "          <version>2.5</version>",
            "        </plugin>",
        ];

        expect(pluginObj.pluginList).toEqual(expectedPluginList);
        expect(pluginObj.pluginManagementList).toEqual(
            expectedPluginManagementList
        );
    });
    test("fetch sdk version", async () => {
        let version = await pomsRewire.__get__("fetchSDKMetadata")(srcpath);
        expect(version).not.toBeNull();
    });
});
