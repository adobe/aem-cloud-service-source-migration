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
    UI_APPS: "ui.apps",

    UI_CONTENT: "ui.content",

    // Filter path from project root
    FILTER_PATH: "/src/main/content/META-INF/vault/filter.xml",

    // filter.xml starting lines
    FILTER_XML_START: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<workspaceFilter version="1.0">',
    ],

    FILTER_XML_END: ["</workspaceFilter>"],

    FILTER_SECTION_END: ["</filter>"],

    FILEVAULT_PLUGIN: "<artifactId>filevault-package-maven-plugin</artifactId>",

    FILEVAULT_PLUGIN_EXPECTED_VERSION: "1.1.4",

    PACKAGE_TYPE: "<packageType>",

    PLUGINS_SECTION_START: "<plugins>",

    PLUGINS_SECTION_END: "</plugins>",

    ARTIFACT_ID_START_TAG: "    <artifactId>",

    ARTIFACT_ID_END_TAG: "</artifactId>",

    CLOUD_MANAGER_TARGET: "<cloudManagerTarget>",

    POM_XML: "pom.xml",

    VERSION_START_TAG: "<version>",

    VERSION_END_TAG: "</version>",

    CONFIGURATION_START_TAG: "<configuration>",
};
