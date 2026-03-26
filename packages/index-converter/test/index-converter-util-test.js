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
const assert = require("chai").assert;
const indexUtil = require("../src/util/index-converter-util.js");
const xmlUtil = require("../src/util/xml-processing-util.js");
const {
    util: commons_util,
    constants: common_constants,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");
const constants = require("../src/util/constants");

describe("index-converter-util", function () {
    describe("Test migration Of Custom OOTB Indexes", function () {
        it("should construct finalJsonObject", function (done) {
            let finalJsonObject = {};
            let baseLineXMLPath = path.join("test/resources/.content_65.xml");
            let customIndexXMLPath = path.join(
                "test/resources/inputCustom1.xml"
            );
            let indexOnCloudXMLPath = path.join(
                "test/resources/.content_Cloud_Services.xml"
            );
            let baseLineJsonObject =
                xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
            let allCustomIndexJsonObject =
                xmlUtil.buildJsonObjectFromXML(customIndexXMLPath);
            let indexOnCloudJsonObject =
                xmlUtil.buildJsonObjectFromXML(indexOnCloudXMLPath);
            let customOOTBIndexMap = new Map();
            customOOTBIndexMap.set("damAssetLucene", "damAssetLucene");
            let onPremToCloudMap = new Map();
            onPremToCloudMap.set("damAssetLucene", "damAssetLucene-6");
            let transformationMap = new Map();

            indexUtil.migrationOfCustomOOTBIndex(
                finalJsonObject,
                customOOTBIndexMap,
                baseLineJsonObject,
                allCustomIndexJsonObject,
                indexOnCloudJsonObject,
                onPremToCloudMap,
                transformationMap
            );

            let migratedTikaConfigs = indexUtil.migrateTikaConfig(
                transformationMap,
                path.join("", constants.RESOURCES_FOLDER)
            );
            assert.isTrue(migratedTikaConfigs.length == 1);
            commons_util.deleteFolderRecursive(
                common_constants.TARGET_INDEX_FOLDER
            );

            let expectedFilePath = path.join(
                "test/resources/expectedCustomOOTB.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                if (err) {
                    done(err);
                    return;
                }
                try {
                    let expectedJson = JSON.parse(data);
                    assert.deepEqual(
                        finalJsonObject,
                        expectedJson,
                        "JSON Object constructed successfully and both are equal"
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("should merge cqPageContent customization without crashing", function () {
            let finalJsonObject = {};
            let baseLineXMLPath = path.join("resources/.content_65.xml");
            let indexOnCloudXMLPath = path.join(
                "resources/.content_Cloud_Services.xml"
            );
            let baseLineJsonObject =
                xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
            let indexOnCloudJsonObject =
                xmlUtil.buildJsonObjectFromXML(indexOnCloudXMLPath);
            // Recreate the failing shape from the customer sample without
            // depending on external workspace data in the test suite.
            let customIndexJson = JSON.parse(
                JSON.stringify(baseLineJsonObject["jcr:root"].cqPageLucene)
            );
            customIndexJson._attributes.type = "disabled";
            customIndexJson._attributes.includedPaths = "[/content]";
            customIndexJson._attributes.originalType = "lucene";
            customIndexJson._attributes.queryPaths = "[/content]";
            customIndexJson._attributes.selectionPolicy = "tag";
            customIndexJson._attributes.tags = "[personalization,pages]";
            customIndexJson.aggregates["cq:PageContent"].include4 = {
                _attributes: {
                    "jcr:primaryType": "nt:unstructured",
                    path: "*/*/*/*/*",
                },
            };
            customIndexJson.indexRules[
                "cq:Page"
            ]._attributes.includePropertyTypes = "[String]";
            customIndexJson.indexRules["cq:Page"].properties.resourceType = {
                _attributes: {
                    "jcr:primaryType": "nt:unstructured",
                    name: "jcr:content/sling:resourceType",
                    propertyIndex: "{Boolean}true",
                    type: "String",
                },
            };
            customIndexJson.indexRules[
                "cq:Page"
            ].properties.cqLastReplicationActionPublish = {
                _attributes: {
                    "jcr:primaryType": "nt:unstructured",
                    name: "jcr:content/cq:lastReplicationAction_publish",
                    propertyIndex: "{Boolean}true",
                    type: "String",
                },
            };
            customIndexJson.indexRules[
                "cq:Page"
            ].properties.cqLastReplicationActionPreview = {
                _attributes: {
                    "jcr:primaryType": "nt:unstructured",
                    name: "jcr:content/cq:lastReplicationAction_preview",
                    propertyIndex: "{Boolean}true",
                    type: "String",
                },
            };
            let allCustomIndexJsonObject = {
                "jcr:root": {
                    "cqPageContent-1": customIndexJson,
                },
            };
            let customOOTBIndexMap = new Map();
            customOOTBIndexMap.set("cqPageContent-1", "cqPageLucene");
            let onPremToCloudMap = new Map();
            onPremToCloudMap.set("cqPageLucene", "cqPageLucene");
            let transformationMap = new Map();

            indexUtil.migrationOfCustomOOTBIndex(
                finalJsonObject,
                customOOTBIndexMap,
                baseLineJsonObject,
                allCustomIndexJsonObject,
                indexOnCloudJsonObject,
                onPremToCloudMap,
                transformationMap
            );

            assert.deepEqual(
                transformationMap.get("cqPageContent-1"),
                "cqPageLucene-custom-1"
            );
            assert.deepEqual(
                finalJsonObject["cqPageLucene-custom-1"]._attributes.type,
                "disabled"
            );
            assert.deepEqual(
                finalJsonObject["cqPageLucene-custom-1"].aggregates[
                    "cq:PageContent"
                ].include4._attributes.path,
                "*/*/*/*/*"
            );
            assert.deepEqual(
                finalJsonObject["cqPageLucene-custom-1"].indexRules["cq:Page"]
                    .properties.resourceType._attributes.name,
                "jcr:content/sling:resourceType"
            );
        });
    });

    describe("Test migration Of Custom Indexes", function () {
        it("should construct finalJsonObject", function (done) {
            let finalJsonObject = {};
            let customIndexXMLPath = path.join(
                "test/resources/inputCustom1.xml"
            );
            let allCustomIndexJsonObject =
                xmlUtil.buildJsonObjectFromXML(customIndexXMLPath);
            let customIndex = ["test-lead-form"];
            let transformationMap = new Map();

            indexUtil.migrationOfCustomIndex(
                finalJsonObject,
                customIndex,
                allCustomIndexJsonObject,
                transformationMap
            );

            let expectedFilePath = path.join(
                "test/resources/expectedCustomIndex.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                if (err) {
                    done(err);
                    return;
                }
                try {
                    let expectedJson = JSON.parse(data);
                    assert.deepEqual(
                        finalJsonObject,
                        expectedJson,
                        "JSON Object constructed successfully and both are equal"
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});
