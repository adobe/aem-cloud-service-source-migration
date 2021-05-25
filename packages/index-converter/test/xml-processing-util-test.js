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
const xmlUtil = require("../src/util/xml-processing-util.js");
var constants = require("../src/util/constants.js");
const commons = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

describe("XML-Processing-Util", function () {
    describe("Construct Json Object", function () {
        it("should construct a json object", function () {
            let jsonObject = {};
            jsonObject = xmlUtil.constructJsonObject(jsonObject);

            try {
                assert.isTrue(
                    JSON.stringify(jsonObject).includes("jcr:root"),
                    "JSON Object constructed successfully"
                );
            } catch (e) {
                assert.fail("Not able to create Json Object");
            }
        });
    });

    describe("Test convertJSONtoXML", function () {
        it("should change json to xml", function () {
            let jsonObject = require("./resources/output_json.json");
            let obj = Object();
            obj["jcr:root"] = jsonObject;

            if (!fs.existsSync(commons.constants.TARGET_INDEX_FOLDER))
                fs.mkdirSync(commons.constants.TARGET_INDEX_FOLDER);
            xmlUtil.convertJSONtoXML(obj);

            let content = fs.readFileSync(
                path.join(
                    commons.constants.TARGET_INDEX_FOLDER,
                    constants.OUTPUT_FILE_NAME
                )
            );
            if (fs.existsSync(commons.constants.TARGET_INDEX_FOLDER)) {
                fs.unlinkSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.OUTPUT_FILE_NAME
                    )
                );
                fs.rmdirSync(commons.constants.TARGET_INDEX_FOLDER, {
                    recursive: true,
                });
            }
            try {
                assert.isTrue(
                    content.includes("<jcr:root"),
                    "JSON Object converted to XML successfully"
                );
            } catch (e) {
                assert.fail("Not able to convert JSON to XML");
            }
        });
    });

    describe("Test buildJsonObjectFromXML", function () {
        it("should build jsonObject from xml", function () {
            try {
                let baseLineXMLPath = path.join("./resources/.content_65.xml");
                let baseLineJsonObject =
                    xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
                assert.isTrue(
                    Object.keys(baseLineJsonObject[constants.JCR_ROOT])
                        .length == 32,
                    "XML Object converted to JSON successfully"
                );
            } catch (e) {
                assert.fail("Not able to convert XML to JSON");
            }
        });
    });

    describe("Update Index Name In Filter XML", function () {
        it("should update index name in filter.xml", function () {
            let transformationMap = new Map();
            transformationMap.set("k1", "kc1");
            transformationMap.set("k2", "kc2");
            let filterXMLPath = path.join("test/resources/filter.xml");
            let filterXMLPathTemp = path.join("test/resources/filter1.xml");
            xmlUtil.updateIndexNameInFilterXML(
                filterXMLPath,
                transformationMap,
                filterXMLPathTemp
            );
            let xmlStringExpected = fs.readFileSync(
                filterXMLPathTemp,
                constants.UTF_8
            );
            fs.unlinkSync(filterXMLPathTemp);
            try {
                assert.isTrue(
                    xmlStringExpected.includes("kc1"),
                    "Filter.xml updated with new index name"
                );
            } catch (e) {
                assert.fail("Not able to update filter.xml");
            }
        });
    });

    describe("Building JSON object from multiple .content.xml ,present in multiple folders {content.xml present at root}", function () {
        it("Build consolidated json Object", function () {
            let pathForFolder = path.join("test/resources/_oak_index");
            let jsonObject = xmlUtil.buildCustomIndexJsonObject(
                pathForFolder,
                false
            );
            let actualJson = JSON.stringify(jsonObject);
            let expectedFilePath = path.join(
                "test/resources/expectedNested.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                try {
                    if (err) {
                        throw err;
                    }
                    assert.isTrue(
                        _.isEqual(data.trim(), actualJson.trim()),
                        "JSON Object constructed successfully from multiple xml and both are equal"
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

    describe("Building JSON object from multiple .content.xml ,present in multiple folders {content.xml is not present at root}", function () {
        it("Build consolidated json Object", function () {
            let pathForFolder = path.join("test/resources/_oak_index_1");
            let jsonObject = xmlUtil.buildCustomIndexJsonObject(
                pathForFolder,
                false
            );
            let actualJson = JSON.stringify(jsonObject);
            let expectedFilePath = path.join(
                "test/resources/expectedNested1.json"
            );
            fs.readFile(expectedFilePath, "utf8", (err, data) => {
                try {
                    if (err) {
                        throw err;
                    }
                    assert.isTrue(
                        _.isEqual(data.trim(), actualJson.trim()),
                        "JSON Object constructed successfully from multiple xml and both are equal"
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

    describe("Adding new entry in filter.xml for Ensure Indexes", function () {
        it("Filter.xml updated with new entry for ensure indexes", function () {
            let ensureIndexJson = '{"jcr:root":{"k1":"v1"}}';
            let transformationMap = new Map();
            transformationMap.set("k1", "kc1");
            transformationMap.set("k2", "kc2");
            let filterXMLPath = path.join("test/resources/filter.xml");
            let filterXMLPathTemp = path.join("test/resources/filter1.xml");
            let xmlString = fs.readFileSync(filterXMLPath, constants.UTF_8);
            fs.writeFileSync(filterXMLPathTemp, xmlString);

            xmlUtil.updateEnsureIndexFilter(
                JSON.parse(ensureIndexJson),
                transformationMap,
                filterXMLPathTemp
            );
            let xmlStringExpected = fs.readFileSync(
                filterXMLPathTemp,
                constants.UTF_8
            );
            fs.unlinkSync(filterXMLPathTemp);

            try {
                assert.isTrue(
                    xmlStringExpected.includes("kc1"),
                    "Ensure Index updated in filter.xml"
                );
            } catch (e) {
                assert.fail(
                    "Not able to update ensure index entry in filter.xml"
                );
            }
        });
    });

    describe("Test merge two json object", function () {
        it("Build merged json object", function () {
            let jsonObject1 = '{"jcr:root":{"k1":"v1"}}';
            let jsonObject2 = '{"jcr:root":{"k2":"v2"}}';
            let actualJsonObject = xmlUtil.mergeJsonObjects(
                JSON.parse(jsonObject1),
                JSON.parse(jsonObject2)
            );
            let actualString = JSON.stringify(actualJsonObject);
            let expectedString = '{"jcr:root":{"k2":"v2","k1":"v1"}}';

            try {
                assert.isTrue(
                    _.isEqual(expectedString.trim(), actualString.trim()),
                    "Merged JSON Object constructed successfully from two JSON Objects"
                );
            } catch (e) {
                assert.fail(
                    "Not able to create merged Json Object or actual json object does not match to expected json object"
                );
            }
        });
    });
});
