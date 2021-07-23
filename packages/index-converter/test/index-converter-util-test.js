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
const _ = require("lodash");
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
        it("should construct finalJsonObject", function () {
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

            assert.isTrue(
                indexUtil.migrateTikaConfigUnderDamAssetLucene(
                    transformationMap,
                    path.join("", constants.RESOURCES_FOLDER)
                )
            );
            commons_util.deleteFolderRecursive(
                common_constants.TARGET_INDEX_FOLDER
            );

            let actualJson = JSON.stringify(finalJsonObject);
            let expectedFilePath = path.join(
                "test/resources/expectedCustomOOTB.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                try {
                    if (err) {
                        throw err;
                    }
                    assert.isTrue(
                        _.isEqual(data.trim(), actualJson.trim()),
                        "JSON Object constructed successfully and both are equal"
                    );
                } catch (e) {
                    assert.fail(
                        "Not able to create Json Object or actual json object does not match to expected json object"
                    );
                }
            });
        });
    });

    describe("Test migration Of Custom Indexes", function () {
        it("should construct finalJsonObject", function () {
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

            let actualJson = JSON.stringify(finalJsonObject);
            let expectedFilePath = path.join(
                "test/resources/expectedCustomIndex.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                try {
                    if (err) {
                        throw err;
                    }
                    assert.isTrue(
                        _.isEqual(data.trim(), actualJson.trim()),
                        "JSON Object constructed successfully and both are equal"
                    );
                } catch (e) {
                    assert.fail(
                        "Not able to create Json Object or actual json object does not match to expected json object",
                        e
                    );
                }
            });
        });
    });
});
