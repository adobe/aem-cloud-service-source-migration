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
const path = require("path");

module.exports = {
    REPOSITORY_MODERNIZER_REPORT: `repository-modernizer-report.md`,

    // Base package paths
    BASE_UI_APPS_PACKAGE: "./resources/ui.apps",

    BASE_UI_CONTENT_PACKAGE: "./resources/ui.content",

    BASE_UI_CONFIG_PACKAGE: "./resources/ui.config",

    BASE_ALL_PACKAGE: "./resources/all",

    BASE_PARENT_POM: "./resources/pom.xml",

    // relative path (w.r.t. the content package folder) to the filter.xml file
    FILTER_PATH: "/src/main/content/META-INF/vault/filter.xml",

    // relative path (w.r.t. the content package folder) to the jcr_root directory
    JCR_ROOT_PATH: "/src/main/content/jcr_root",

    // filter.xml starting lines
    FILTER_XML_START_WITH_SPACE: [
        '<?xml version="1.0" encoding="UTF - 8"?>',
        '< workspaceFilter version = "1.0" >',
    ],

    FILTER_XML_START: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<workspaceFilter version="1.0">',
    ],

    FILTER_XML_END: "</workspaceFilter>",

    FILTER_SECTION_END: "</filter>",

    FILEVAULT_PACKAGE_MAVEN_PLUGIN: `filevault-package-maven-plugin`,

    // Keywords
    UI_APPS: "ui.apps",

    UI_CONTENT: "ui.content",

    UI_CONFIG: "ui.config",

    ALL: "all",

    BUNDLE_PACKAGING_TYPES: ["jar", "bundle"],

    CONTENT_PACKAGING_TYPES: ["content-package"],

    // POM tags and entries

    PARENT_START_TAG: "<parent>",

    PARENT_END_TAG: "</parent>",

    MODULE_START_TAG: "<modules>",

    MODULE_END_TAG: "</modules>",

    ARTIFACT_ID_START_TAG: "<artifactId>",

    ARTIFACT_ID_END_TAG: "</artifactId>",

    UBER_JAR_ARTIFACT_ID: "<artifactId>uber-jar</artifactId>",

    GROUP_ID_START_TAG: "<groupId>",

    GROUP_ID_END_TAG: "</groupId>",

    EMBEDDEDS_SECTION_START_TAG: "<embeddeds>",

    EMBEDDEDS_SECTION_END_TAG: "</embeddeds>",

    DEPENDENCY_START_TAG: "<dependency>",

    DEPENDENCY_END_TAG: "</dependency>",

    DEPENDENCY_MANAGEMENT_SECTION_START_TAG: "<dependencyManagement>",

    DEPENDENCY_SECTION_START_TAG: "<dependencies>",

    DEPENDENCY_SECTION_END_TAG: "</dependencies>",

    REPOSITORIES_SECTION_START: "    <repositories>",

    DEFAULT_ARTIFACT_ID: "${artifactId}",

    DEFAULT_GROUP_ID: "${groupId}",

    DEFAULT_APP_TITLE: "${appTitle}",

    DEFAULT_APP_ID: "${appId}",

    DEFAULT_ROOT_ARTIFACT_ID: "${rootArtifactId}",

    DEFAULT_RELATIVE_PATH: "${relativePath}",

    RELATIVE_PATH_ONE_LEVEL_UP: "../pom.xml",

    RELATIVE_PATH_TWO_LEVEL_UP: "../../pom.xml",

    DEFAULT_SDK_API: "${aem.sdk.api}",

    PACKAGING_TAG_START: "<packaging>",

    PACKAGING_TAG_END: "</packaging>",

    POM_XML: "pom.xml",

    PLUGINS_MANAGEMENT_SECTION_START_TAG: "<pluginManagement>",

    PLUGINS_MANAGEMENT_SECTION_END_TAG: "</pluginManagement>",

    PLUGINS_SECTION_START_TAG: "<plugins>",

    PLUGINS_SECTION_END_TAG: "</plugins>",

    PLUGIN_START_TAG: "<plugin>",

    PLUGIN_END_TAG: "</plugin>",

    XML_COMMENT_START: "<!--",

    XML_COMMENT_END: "-->",

    ROOT_FILTER_SECTION_START: "<filters>",

    ROOT_FILTER_SECTION_END: "</filters>",

    INCLUDE_FILTER_START_TAG: "<includes>",

    INCLUDE_FILTER_END_TAG: "</includes>",

    INCLUDE_FILTER_ROOT_TAG: "<include>",

    EXCLUDE_FILTER_ROOT_TAG: "<exclude>",

    EXCLUDE_FILTER_START_TAG: "<excludes>",

    EXCLUDE_FILTER_END_TAG: "</excludes>",

    ROOT: "<root>",

    FILTER_TAGS: [
        "<includes>",
        "</includes>",
        "<include>",
        "<excludes>",
        "<exclude>",
        "</excludes>",
    ],

    OOTB_PARENT_POM_PLUGIN_MANAGEMENT: [
        "frontend-maven-plugin",
        "maven-jar-plugin",
        "maven-clean-plugin",
        "bnd-maven-plugin",
        "bnd-baseline-maven-plugin",
        "maven-resources-plugin",
        "maven-compiler-plugin",
        "maven-install-plugin",
        "maven-surefire-plugin",
        "maven-failsafe-plugin",
        "maven-deploy-plugin",
        "sling-maven-plugin",
        "htl-maven-plugin",
        "filevault-package-maven-plugin",
        "content-package-maven-plugin",
        "maven-enforcer-plugin",
        "maven-dependency-plugin",
        "build-helper-maven-plugin",
        "lifecycle-mapping",
    ],

    // Default Templates
    DEFAULT_ALL_FILTER_PATH_TEMPLATE: `    <filter root="/apps/\${appId}-packages"/>`,

    DEFAULT_EMBEDDED_APPS_TEMPLATE: `                        <embedded>
                            <groupId>\${groupId}</groupId>
                            <artifactId>\${artifactId}</artifactId>
                            <type>zip</type>
                            <target>/apps/\${appId}-packages/application/install</target>
                        </embedded>`,

    DEFAULT_EMBEDDED_CONTENT_TEMPLATE: `                        <embedded>
                            <groupId>\${groupId}</groupId>
                            <artifactId>\${artifactId}</artifactId>
                            <type>zip</type>
                            <target>/apps/\${appId}-packages/content/install</target>
                        </embedded>`,

    DEFAULT_DEPENDENCY_TEMPLATE: `        <dependency>
            <groupId>\${groupId}</groupId>
            <artifactId>\${artifactId}</artifactId>
            <version>\${project.version}</version>
            <type>zip</type>
        </dependency>`,

    SDK_DEPENDENCY_TEMPLATE: `        <dependency>
          <groupId>com.adobe.aem</groupId>
          <artifactId>aem-sdk-api</artifactId>
          <version>\${version}</version>
          <scope>provided</scope>
        </dependency>`,

    NON_ADOBE_REPO_SECTION_TEMPLATE: `        <repository>
            <id>local-repo</id>
            <url>file:nonAdobeDependencies</url>
            <name>Repository</name>
            <releases>
                <enabled>true</enabled>
                <updatePolicy>never</updatePolicy>
            </releases>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>`,

    ADOBE_DEPENDENCY_GROUP: ["com.adobe", "com.day", "org.apache"],

    DEFAULT_SDK_VERSION: "2020.11.4553.20201124T121539Z-201028",

    URL_TO_FETCH_SDK_VERSION:
        "https://search.maven.org/solrsearch/select?q=aem-sdk-api&rows=20&wt=json",

    OSGI_CONFIG_FILE_FORMATS: [
        "com.*.cfg.json",
        "com.*.config",
        "com.*.cfg",
        "org.*.cfg.json",
        "org.*.config",
        "org.*.cfg",
    ],

    XML_EXTENSION: ".xml",

    UTF_8: "utf8",

    SLING_OSGI_CONFIG: "sling:OsgiConfig",

    JCR_PRIMARY_TYPE: "jcr:primaryType",

    JCR_ROOT: "jcr:root",

    JSON_ATTRIBUTES_KEY: "_attributes",
};
