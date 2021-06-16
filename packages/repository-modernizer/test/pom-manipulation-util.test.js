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
    util,
    ConversionStep,
} = require("@adobe/aem-cs-source-migration-commons");
const pomManipulationUtil = require("./../src/util/pom-manipulation-util");
const constants = require("../src/util/constants");
const fs = require("fs");
let path = "./test/resources/pom.xml";
jest.mock("@adobe/aem-cs-source-migration-commons");
describe("pom manipulation", function () {
    const xmlContent = [
        "      <dependencies>",
        "        <dependency>",
        "          <groupId>com.adobe.aem</groupId>",
        "          <artifactId>uber-jar</artifactId>",
        "          <version>1.0.1</version>",
        "        </dependency>",
        "      </dependencies>",
    ];
    test("removeDuplicates", () => {
        var list = [
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.apps</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </dependency>",
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
        ];
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
        ];
        let result = pomManipulationUtil.removeDuplicatesDependencies(list);

        expect(result.length).toBe(10);
        expect(result).toEqual(expected);
    });

    test("removeDuplicate plugins", () => {
        var list = [
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
        ];
        var expected = [
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
        ];
        let result = pomManipulationUtil.removeDuplicatesPlugins(list);

        expect(result.length).toBe(5);
        expect(result).toEqual(expected);
    });

    test("verifyArtifactPackagingTyperemoveDuplicates", () => {
        util.getXMLContentSync.mockReturnValue(fs.readFileSync(path, "utf8").split(/\r?\n/));
        const result = pomManipulationUtil.verifyArtifactPackagingType(path, [
            "jar",
            "bundle",
        ]);
        expect(result).toBe(false);
    });

    test("verify add plugins", async() => {
        const list = [
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
        ];
        const xmlContent = [
            '       <pluginManagement>',
            '         <plugins>',
            '           <plugin>',
            '             <groupId>com.aem.custom.plugin</groupId>',
            '             <artifactId>test.plugin</artifactId>',
            '             <version>1.3-SNAPSHOT</version>',
            '           </plugin>',
            '         </plugins>',
            '       </pluginManagement>',
        ];
        const xmlContentWithoutPluginManagement = [
            '       <plugins>',
            '         <plugin>',
            '           <groupId>com.aem.custom.plugin</groupId>',
            '           <artifactId>test.plugin</artifactId>',
            '           <version>1.3-SNAPSHOT</version>',
            '         </plugin>',
            '       </plugins>',
        ];
        const pluginObj = {
            pluginList: [],
            pluginManagementList: list,
            filevaultPluginEmbeddedList: [],
        };
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(xmlContent);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.addPlugins(path, pluginObj, conversionStep);
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(2);
    });

    test("verify add plugins with no pluginManagement tags", async() => {
        const list = [
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
            "      <plugin>",
            "        <groupId>com.aem.plugin</groupId>",
            "        <artifactId>test.plugin</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </plugin>",
        ];
        const xmlContentWithoutPluginManagement = [
            '       <plugins>',
            '         <plugin>',
            '           <groupId>com.aem.custom.plugin</groupId>',
            '           <artifactId>test.plugin</artifactId>',
            '           <version>1.3-SNAPSHOT</version>',
            '         </plugin>',
            '       </plugins>',
        ];
        const pluginObj = {
            pluginList: [],
            pluginManagementList: list,
            filevaultPluginEmbeddedList: [],
        };
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(xmlContentWithoutPluginManagement);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.addPlugins(path, pluginObj, conversionStep);
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(0);
    });

    test("verify add sdk dependencies", async() => {
        const expectedContent = [
            "      <dependencies>",
            "        <dependency>\n" +
            "          <groupId>com.adobe.aem</groupId>\n" + 
            "          <artifactId>aem-sdk-api</artifactId>\n" +
            "          <version>${aem.sdk.api}</version>\n" +
            "          <scope>provided</scope>\n" +
            "        </dependency>",
            "      </dependencies>",
        ];
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(xmlContent);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.addSdkDependencies(path, conversionStep);
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(1);
        expect(util.writeDataToFileAsync).toHaveBeenCalledWith(path, expectedContent);
    });

    test("verify add dependencies", async() => {
        const expectedContent = [
            "      <dependencies>",
            "        <dependency>\n" +
            "          <groupId>com.adobe.aem</groupId>\n" + 
            "          <artifactId>aem-sdk-api</artifactId>\n" +
            "          <version>${aem.sdk.api}</version>\n" +
            "          <scope>provided</scope>\n" +
            "        </dependency>",
            "        <dependency>",
            "          <groupId>com.adobe.aem</groupId>",
            "          <artifactId>uber-jar</artifactId>",
            "          <version>1.0.1</version>",
            "        </dependency>",
            "      </dependencies>",
        ];
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(xmlContent);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.addDependencies(path, [constants.SDK_DEPENDENCY_TEMPLATE], conversionStep);
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(1);
        expect(util.writeDataToFileAsync).toHaveBeenCalledWith(path, expectedContent);
    });

    test("embeddedArtifactsToFileVaultPlugin", async() => {
        const embedPluginContent = [
        "          <plugin>",
        "            <groupId>org.apache.jackrabbit</groupId>",
        "            <artifactId>filevault-package-maven-plugin</artifactId>",
        "            <version>1.1.4</version>",
        "            <extensions>true</extensions>",
        "            <configuration>",
        "              <group>${groupId}</group>",
        "              <embeddeds>",
        "              </embeddeds>",
        "              <subPackages>",
        "              </subPackages>",
        "            </configuration>",
        "          </plugin>",
        ];
        
        const expectedContent = [
        "          <plugin>",
        "            <groupId>org.apache.jackrabbit</groupId>",
        "            <artifactId>filevault-package-maven-plugin</artifactId>",
        "            <version>1.1.4</version>",
        "            <extensions>true</extensions>",
        "            <configuration>",
        "              <group>${groupId}</group>",
        "              <embeddeds>",
        "                        <embedded>\n"+
        "                            <groupId>com.adobe.aem</groupId>\n"+
        "                            <artifactId>${artifactId}</artifactId>\n"+
        "                            <type>zip</type>\n"+
        "                            <target>/apps/aem-packages/content/install</target>\n"+
        "                        </embedded>",
        "              </embeddeds>",
        "              <subPackages>",
        "              </subPackages>",
        "            </configuration>",
        "          </plugin>",
        ];
        let embedToAdd = [ constants.DEFAULT_EMBEDDED_CONTENT_TEMPLATE.replace(
                constants.DEFAULT_GROUP_ID,
                'com.adobe.aem'
            )
            .replace(constants.DEFAULT_APP_ID, 'aem')
        ];
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(embedPluginContent);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.embeddedArtifactsToFileVaultPlugin(path, embedToAdd, conversionStep);
        //expect(conversionStep.addOperation).toHaveBeenCalledTimes(1);
        expect(util.writeDataToFileAsync).toHaveBeenCalledWith(path, expectedContent);
    });

    test("embeddArtifactsUsingTemplate", async() => {
        const embedPluginContent = [
        "          <plugin>",
        "            <groupId>org.apache.jackrabbit</groupId>",
        "            <artifactId>filevault-package-maven-plugin</artifactId>",
        "            <version>1.1.4</version>",
        "            <extensions>true</extensions>",
        "            <configuration>",
        "              <group>${groupId}</group>",
        "              <embeddeds>",
        "              </embeddeds>",
        "              <subPackages>",
        "              </subPackages>",
        "            </configuration>",
        "          </plugin>",
        ];
        
        const expectedContent = [
        "          <plugin>",
        "            <groupId>org.apache.jackrabbit</groupId>",
        "            <artifactId>filevault-package-maven-plugin</artifactId>",
        "            <version>1.1.4</version>",
        "            <extensions>true</extensions>",
        "            <configuration>",
        "              <group>${groupId}</group>",
        "              <embeddeds>",
        "                        <embedded>\n"+
        "                            <groupId>com.adobe.aem</groupId>\n"+
        "                            <artifactId>aem.ui.apps</artifactId>\n"+
        "                            <type>zip</type>\n"+
        "                            <target>/apps/aem-packages/application/install</target>\n"+
        "                        </embedded>",
        "                        <embedded>\n"+
        "                            <groupId>com.adobe.aem</groupId>\n"+
        "                            <artifactId>aem.ui.content</artifactId>\n"+
        "                            <type>zip</type>\n"+
        "                            <target>/apps/aem-packages/content/install</target>\n"+
        "                        </embedded>",
        "              </embeddeds>",
        "              <subPackages>",
        "              </subPackages>",
        "            </configuration>",
        "          </plugin>",
        ];
        let packageArtifactIdInfoList = [];
        packageArtifactIdInfoList.push({
            artifactId: 'aem.ui.apps',
            appId: 'aem',
            version: '1.1.1',
        });
        packageArtifactIdInfoList.push({
            artifactId: 'aem.ui.content',
            appId: 'aem',
            version: '1.1.1',
        });
        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(embedPluginContent);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.embeddArtifactsUsingTemplate(path, packageArtifactIdInfoList, 'com.adobe.aem', conversionStep);
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(2);
        expect(util.writeDataToFileAsync).toHaveBeenCalledWith(path, expectedContent);
    });

    test("replaceVariables", async() => {
        const contentToReplace = [
            "      <dependencies>",
            "        <dependency>",
            "          <groupId>${groupId}</groupId>",
            "          <artifactId>${artifactId}</artifactId>",
            "          <version>${version}</version>",
            "        </dependency>",
            "      </dependencies>",
        ];

        const expectedContent = [
            "      <dependencies>",
            "        <dependency>",
            "          <groupId>com.adobe.aem</groupId>",
            "          <artifactId>uber-jar</artifactId>",
            "          <version>1.0.1</version>",
            "        </dependency>",
            "      </dependencies>",
        ];

        const conversionStep = new ConversionStep();
        util.getXMLContent.mockReturnValue(contentToReplace);
        util.writeDataToFileAsync.mockReturnValue(true);
        await pomManipulationUtil.replaceVariables(
            path,
            {
                [constants.DEFAULT_GROUP_ID]: 'com.adobe.aem',
                [constants.DEFAULT_ARTIFACT_ID]: 'uber-jar',
                [constants.DEFAULT_VERSION]: '1.0.1',
            },
            conversionStep
        );        
        expect(conversionStep.addOperation).toHaveBeenCalledTimes(3);
        expect(util.writeDataToFileAsync).toHaveBeenCalledWith(path, expectedContent);
    });
});
