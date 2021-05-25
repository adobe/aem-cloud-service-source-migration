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
const mapUtil = require("../src/util/map-processing-util.js");
const xmlUtil = require("../src/util/xml-processing-util.js");
const path = require("path");
const constants = require("../src/util/constants.js");

describe("Map-Processing-Util", function () {
    describe("Construct Map from Json Object", function () {
        it("should construct a map from json object", function () {
            let baseLineXMLPath = path.join("./resources/.content_65.xml");
            let baseLineJsonObject =
                xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
            let baseLineMap = new Map();
            mapUtil.buildMapFromJsonObject(
                baseLineJsonObject[constants.JCR_ROOT],
                baseLineMap
            );
            try {
                assert.isTrue(
                    baseLineMap.get("socialLucene") == "social:asiResource",
                    "Map returned successfully"
                );
            } catch (e) {
                assert.fail("Not able to return Map");
            }
        });
    });

    describe("Build Custom Index Array and Custom OOTB Index Map ", function () {
        it("should construct Custom index Array and Custom OOTB Index Map", function () {
            try {
                let baseLineXMLPath = path.join("./resources/.content_65.xml");
                let customIndexXMLPath = path.join(
                    "./test/resources/inputCustom1.xml"
                );
                let baseLineJsonObject =
                    xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
                let allCustomIndexJsonObject =
                    xmlUtil.buildJsonObjectFromXML(customIndexXMLPath);
                let allCustomIndexMap = new Map();
                mapUtil.buildMapFromJsonObject(
                    allCustomIndexJsonObject[constants.JCR_ROOT],
                    allCustomIndexMap
                );
                let baseLineMap = new Map();
                mapUtil.buildMapFromJsonObject(
                    baseLineJsonObject[constants.JCR_ROOT],
                    baseLineMap
                );
                let customOOTBIndexMap = new Map();
                let customIndex = [];
                mapUtil.buildCustomIndexMap(
                    allCustomIndexMap,
                    baseLineMap,
                    customOOTBIndexMap,
                    customIndex
                );
                assert.isTrue(
                    customOOTBIndexMap.keys().next().value == "damAssetLucene",
                    "Custom OOTB Index key is fetched successfully"
                );
                assert.isTrue(
                    customOOTBIndexMap.values().next().value ==
                        "damAssetLucene",
                    "Custom OOTB Index Value is fetched successfully"
                );
                assert.isTrue(
                    customIndex[0] == "test-lead-form",
                    "Custom Index Value is fetched successfully"
                );
            } catch (e) {
                console.log(e);
                assert.fail("Not able to return Map", e);
            }
        });
    });

    describe("Build on prem to Cloud service instance index relationship map", function () {
        it("should construct onPremToCloud map", function () {
            try {
                let baseLineMap = new Map();
                baseLineMap.set("a", "1,2");
                baseLineMap.set("b", "3,4");

                let cloudServiceIndexMap = new Map();
                cloudServiceIndexMap.set("a1", "1,2");
                cloudServiceIndexMap.set("d1", "3,2");

                let onPremToCloudMap = new Map();
                mapUtil.buildRelationshipMapOnPremToCloud(
                    baseLineMap,
                    cloudServiceIndexMap,
                    onPremToCloudMap
                );

                assert.isTrue(
                    onPremToCloudMap.values().next().value == "a1",
                    "Index name on cloud is fetched successfully"
                );
                assert.isTrue(
                    onPremToCloudMap.keys().next().value == "a",
                    "Index name on prem is fetched successfully"
                );
            } catch (e) {
                assert.fail("Not able to return Map");
            }
        });
    });
});
