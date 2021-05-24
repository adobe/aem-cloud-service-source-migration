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
const constants = require("../src/util/constants.js");
const ensureDefinitionConverter = require("../src/ensure-definition-converter.js");
const commons = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");

const testEnsureDefinitionFolder = "test/resources/ensureDefinitions";
const testEnsureDefinitionOakIndexFolder = path.join(
    testEnsureDefinitionFolder,
    "oak-index"
);

describe("ensure-definition-converter-util", function () {
    describe("Convert Ensure Definitions", function () {
        it("should convert to Oak Index Definitions", function () {
            let config = {
                ensureIndexDefinitionContentPackageJcrRootPath:
                    testEnsureDefinitionFolder,
                ensureIndexDefinitionConfigPackageJcrRootPath:
                    testEnsureDefinitionFolder,
            };
            assert.isTrue(
                ensureDefinitionConverter.performConversion(config, [])
            );
            assert.isTrue(
                fs.existsSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER
                    )
                )
            );
            assert.isFalse(
                fs.existsSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER,
                        "damAssetLucene",
                        ".content.xml"
                    )
                )
            );
            assert.isTrue(
                fs.existsSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER,
                        "custLucene",
                        ".content.xml"
                    )
                )
            );
            // clean up
            commons.util.deleteFolderRecursive(
                path.join(
                    commons.constants.TARGET_INDEX_FOLDER,
                    constants.ENSURE_DEFINITIONS_FOLDER
                )
            );
        });
    });

    describe("No Ensure Definitions", function () {
        it("should skip conversion to Oak Index Definitions", function () {
            let config = {
                aemVersion: 64,
            };
            assert.isFalse(
                ensureDefinitionConverter.performConversion(config, [])
            );
            assert.isFalse(
                fs.existsSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER
                    )
                )
            );
        });
    });

    describe("Wrong Ensure Definitions path in config", function () {
        it("should skip conversion to Oak Index Definitions", function () {
            let config = {
                ensureIndexDefinitionContentPackageJcrRootPath:
                    testEnsureDefinitionFolder,
                ensureIndexDefinitionConfigPackageJcrRootPath:
                    testEnsureDefinitionOakIndexFolder,
            };
            assert.isFalse(
                ensureDefinitionConverter.performConversion(config, [])
            );
            assert.isFalse(
                fs.existsSync(
                    path.join(
                        commons.constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER
                    )
                )
            );
        });
    });
});
