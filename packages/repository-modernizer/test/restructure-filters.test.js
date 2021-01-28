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
jest.mock("fs");

const {
    constants: commons_constants,
    util,
    logger,
} = require("@adobe/aem-cs-source-migration-commons");
const constants = require("../src/util/constants");
const filter = require("../src/restructure-filters");
const rewire = require("rewire");
const filterRewire = rewire("./../src/restructure-filters");
const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const { readFileSync } = jest.requireActual("fs");

const configFileName = "config.yaml";
const testDir = path.join(process.cwd(), "test");
const config = yaml.safeLoad(
    readFileSync(path.join(testDir, configFileName), "utf8")
);
const xmlContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<workspaceFilter version="1.0">',
    '    <filter root="/apps/dam/cfm"/>',
    '	 <filter root="/apps/dam/content/schemaeditors/reports"/>',
    '    <filter root="/etc/dam/viewers/s7viewers/libs"/>',
    '	 <filter root="/etc/map/non-migrated-ddp-results-lm"/>',
    '    <filter root="/home/users/system/ni/content"/>',
    '    <filter root="/content/configuration"/>',
    "</workspaceFilter>",
];
const expectedUIContentFilterPaths = [
    '    <filter root="/etc/dam/viewers/s7viewers/libs"/>',
    '	 <filter root="/etc/map/non-migrated-ddp-results-lm"/>',
    '    <filter root="/home/users/system/ni/content"/>',
    '    <filter root="/content/configuration"/>',
];

const expectedUIAppsFilterPaths = [
    '    <filter root="/apps/dam/cfm"/>',
    '	 <filter root="/apps/dam/content/schemaeditors/reports"/>',
];

const configFilterContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<workspaceFilter version="1.0">',
    '    <filter root="/apps/${appId}/osgiconfig"/>',
    "</workspaceFilter>",
];
const expectedUIConfigFilterPaths = [
    '    <filter root="/apps/test/osgiconfig"/>',
];

const allFilterContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<workspaceFilter version="1.0">',
    "</workspaceFilter>",
];
const expectedAllFilterPaths = ['    <filter root="/apps/test-packages"/>'];

describe(" restructure filter", function () {
    test("exports", async () => {
        expect(typeof filterRewire.__get__("isImmutableContentFilter")).toEqual(
            "function"
        );
        expect(typeof filterRewire.__get__("segregateFilterPaths")).toEqual(
            "function"
        );
    });

    test("restructure", () => {
        let conversionSteps = [];
        let targetProjectPath = path.join(
            commons_constants.TARGET_PROJECT_SRC_FOLDER,
            path.basename(config.projects[0].projectPath)
        );
        let allFilterPath = path.join(
            targetProjectPath,
            constants.ALL,
            constants.FILTER_PATH
        );
        let uiAppsFilterPath = path.join(
            targetProjectPath,
            constants.UI_APPS,
            constants.FILTER_PATH
        );
        let uiContentFilterPath = path.join(
            targetProjectPath,
            constants.UI_CONTENT,
            constants.FILTER_PATH
        );
        let uiConfigFilterPath = path.join(
            targetProjectPath,
            constants.UI_CONFIG,
            constants.FILTER_PATH
        );
        let contentPackageFilterPath = path.join(
            config.projects[0].projectPath,
            config.projects[0].existingContentPackageFolder[0],
            constants.FILTER_PATH
        );
        // mock the methods return values
        fs.existsSync.mockReturnValue(true);
        util.getXMLContentSync
            .mockReturnValueOnce(xmlContent)
            .mockReturnValueOnce(configFilterContent)
            .mockReturnValueOnce(allFilterContent);
        util.writeDataToFileSync.mockResolvedValue(true);
        // execute the method
        filter.restructure(config.projects, conversionSteps);
        // test whether the appropriate methods were called with correct params
        expect(fs.existsSync).toHaveBeenCalledWith(contentPackageFilterPath);
        expect(util.getXMLContentSync).toHaveBeenCalledWith(
            contentPackageFilterPath
        );
        expect(util.writeDataToFileSync).toHaveBeenCalledWith(
            uiAppsFilterPath,
            constants.FILTER_XML_START.concat(
                expectedUIAppsFilterPaths,
                constants.FILTER_XML_END
            ),
            `RestructureFilterPaths: Error while trying to add filters to ${uiAppsFilterPath}.`
        );
        expect(util.writeDataToFileSync).toHaveBeenCalledWith(
            uiContentFilterPath,
            constants.FILTER_XML_START.concat(
                expectedUIContentFilterPaths,
                constants.FILTER_XML_END
            ),
            `RestructureFilterPaths: Error while trying to add filters to ${uiContentFilterPath}.`
        );
        expect(fs.existsSync).toHaveBeenCalledWith(uiConfigFilterPath);
        expect(util.getXMLContentSync).toHaveBeenCalledWith(uiConfigFilterPath);
        expect(util.writeDataToFileSync).toHaveBeenCalledWith(
            uiConfigFilterPath,
            constants.FILTER_XML_START.concat(
                expectedUIConfigFilterPaths,
                constants.FILTER_XML_END
            ),
            `RestructureFilterPaths: Error while trying to add filters to ${uiConfigFilterPath}.`
        );
        expect(fs.existsSync).toHaveBeenCalledWith(allFilterPath);
        expect(util.getXMLContentSync).toHaveBeenCalledWith(allFilterPath);
        expect(util.writeDataToFileSync).toHaveBeenCalledWith(
            allFilterPath,
            constants.FILTER_XML_START.concat(
                expectedAllFilterPaths,
                constants.FILTER_XML_END
            ),
            `RestructureFilterPaths: Error while trying to add filters to ${allFilterPath}.`
        );
    });

    test("segregateFilterPaths", () => {
        const filterPaths = {
            uiAppsFilters: [],
            uiContentFilters: [],
        };
        filterRewire.__get__("segregateFilterPaths")(xmlContent, filterPaths);
        expect(filterPaths.uiAppsFilters.length).toBe(2);
        expect(filterPaths.uiContentFilters.length).toBe(4);
        for (var i = 0; i < expectedUIAppsFilterPaths.length; i++) {
            expect(filterPaths.uiAppsFilters[i].trim()).toEqual(
                expectedUIAppsFilterPaths[i].trim()
            );
        }
        for (var i = 0; i < expectedUIContentFilterPaths.length; i++) {
            expect(filterPaths.uiContentFilters[i].trim()).toEqual(
                expectedUIContentFilterPaths[i].trim()
            );
        }
    });

    test("isImmutableContentFilter", () => {
        let line = '<filter root="/apps/dam/cfm" />';
        let val = filterRewire.__get__("isImmutableContentFilter")(line);
        expect(val).toBe(true);
        line = '<filter root="/content/configuration" />';
        val = filterRewire.__get__("isImmutableContentFilter")(line);
        expect(val).toBe(false);
    });
});
