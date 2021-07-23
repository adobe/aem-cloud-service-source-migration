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

module.exports = {
    INDEX_RULE: "indexRules",

    JCR_PRIMARY_TYPE: "jcr:primaryType",

    XMLNS_OAK: "xmlns:oak",

    TARGET_FOLDER: "./target",

    UTF_8: "utf8",

    NT_BASE: "nt:base",

    OUTPUT_FILE_NAME: ".content.xml",

    XML_HEADER: '<?xml version="1.0" encoding="UTF-8"?>',

    LINE_SEPARATOR: "\n",

    INCLUDED_PATH: "includedPaths",

    QUERY_PATHS: "queryPaths",

    COMPAT_VERSION: "compatVersion",

    FILTER_XML_NAME: "filter.xml",

    TYPE_OAK_QUERY_INDEX_DEFINITION: "oak:QueryIndexDefinition",

    TYPE_OAK_UNSTRUCTURED: "oak:Unstructured",

    ENSURE_DEFINITIONS_FOLDER: "convertedEnsureDefinitions",

    ENSURE_OAK_INDEX_CONFIG_FILE:
        "com.adobe.acs.commons.oak.impl.EnsureOakIndex*.xml",

    ENSURE_OAK_INDEX_MANAGER_CONFIG_FILE:
        "com.adobe.acs.commons.oak.impl.EnsureOakIndexManagerImpl.xml",

    ENSURE_DEFINITIONS_PATH: "ensure-definitions.path",

    ENSURE_DEFINITION_PROPERTIES_IGNORE: "properties.ignore",

    JCR_PROPERTY_IGNORE: "ignore",

    JCR_VALUE_TRUE: "{Boolean}true",

    NODE_FACETS: "facets",

    NODE_JCR_CONTENT: "jcr:content",

    XML_EXTENSION: ".*.xml",

    INPUT_CONTENT_XML: ".content.xml",

    JCR_ROOT: "jcr:root",

    XML_HEADER_PROPERTIES: [
        "xmlns:oak",
        "xmlns:slingevent",
        "xmlns:sling",
        "xmlns:cm",
        "xmlns:granite",
        "xmlns:social",
        "xmlns:dam",
        "xmlns:cq",
        "xmlns:jcr",
        "xmlns:mix",
        "xmlns:nt",
        "xmlns:rep",
        "jcr:mixinTypes",
    ],

    FILTER_FOOTER_TAG: "</workspaceFilter>",

    INDEX_CONVERTER_REPORT: "index-converter-report.md",

    CLOUD_SERVICE_INDEX_FILE_NAME: ".content_Cloud_Services.xml",

    INDEX_CUSTOM_SUFFIX: "-custom-1",

    JSON_ATTRIBUTES_KEY: "_attributes",

    JSON_DECLARATION_KEY: "_declaration",

    INDEX_ANALYZERS: "analyzers",

    TIKA_REQUIRED_INDEXES: ["lucene", "graphqlConfig", "damAssetLucene"],

    TIKA: "tika",

    CONFIX_XML_NAME: "config.xml",

    RESOURCES_FOLDER: "resources",
};
