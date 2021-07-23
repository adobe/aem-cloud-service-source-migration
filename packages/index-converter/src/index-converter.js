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
const xmlUtil = require("./util/xml-processing-util.js");
const mapUtil = require("./util/map-processing-util.js");
const indexMigration = require("./util/index-converter-util.js");
const constants = require("./util/constants.js");
const {
    DetectionList,
    logger,
    constants: commons_constants,
} = require("@adobe/aem-cs-source-migration-commons");

let fileName = path.basename(__filename);

module.exports = {
    performConversion: (
        config,
        basePath = "",
        wasEnsureDefinitionConverted,
        writer_buffer
    ) => {
        let basePathResources = path.join(basePath, "resources");
        let aemVersion = config.aemVersion;
        let baseLineXML = ".content_" + aemVersion + ".xml";
        logger.info(
            fileName +
                ": Baseline AEM Oak Index Definition xml : " +
                baseLineXML
        );
        let customIndexXMLPath = config.customOakIndexDirectoryPath;
        let filterXMLPath = config.filterXMLPath;
        let baseLineXMLPath = path.join(basePathResources, baseLineXML);
        logger.info(fileName + ": Building JSON Object from baseLineXML ...");
        let baseLineJsonObject = null;
        try {
            baseLineJsonObject =
                xmlUtil.buildJsonObjectFromXML(baseLineXMLPath);
        } catch (err) {
            let errorStringBaseLine =
                "Not able to read baseline.xml for AEM Version " + aemVersion;
            logger.error(fileName + ": " + errorStringBaseLine);
            console.log(errorStringBaseLine);
            return false;
        }
        logger.info(
            fileName + ": Processing starts for converting Custom Oak Index ..."
        );
        logger.info(fileName + ": Built JSON Object from baseLineXML");
        logger.info(fileName + ": Building Custom JSON Object ...");
        logger.info(
            fileName +
                ": Ensure Definition Index Converted :" +
                wasEnsureDefinitionConverted
        );
        let allCustomIndexJsonObjectFromEnsure = null;
        if (wasEnsureDefinitionConverted) {
            allCustomIndexJsonObjectFromEnsure =
                xmlUtil.buildCustomIndexJsonObject(
                    path.join(
                        commons_constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER
                    ),
                    true
                );
        }
        let allCustomIndexJsonObject = null;

        if (customIndexXMLPath != null) {
            logger.info(
                fileName +
                    ": Custom Index Definitions are present at '" +
                    customIndexXMLPath +
                    "'"
            );
            allCustomIndexJsonObject = xmlUtil.buildCustomIndexJsonObject(
                customIndexXMLPath,
                false
            );
        } else {
            allCustomIndexJsonObject = allCustomIndexJsonObjectFromEnsure;
        }

        if (wasEnsureDefinitionConverted && customIndexXMLPath != null) {
            logger.info(
                fileName +
                    ": Both Custom Oak and Ensure Index Definitions are present"
            );
            allCustomIndexJsonObject = xmlUtil.mergeJsonObjects(
                allCustomIndexJsonObjectFromEnsure,
                allCustomIndexJsonObject
            );
        }
        logger.info(fileName + ": Built Custom Index Json Object");

        let allCustomIndexes = [];
        let allCustomIndexJsonObjectInterim =
            allCustomIndexJsonObject[constants.JCR_ROOT];

        for (var key in allCustomIndexJsonObjectInterim) {
            if (
                typeof allCustomIndexJsonObjectInterim[key] === "object" &&
                Object.prototype.hasOwnProperty.call(
                    allCustomIndexJsonObjectInterim[key],
                    constants.JSON_ATTRIBUTES_KEY
                )
            ) {
                allCustomIndexes.push(key);
            }
        }
        let detectionList1 = new DetectionList(
            "### Detected Custom Index Definitions"
        );
        logger.info(fileName + ": All Custom Oak Indexes");
        for (let index of allCustomIndexes) {
            detectionList1.addList(index);
            logger.info(fileName + ": " + index);
        }
        writer_buffer.push(detectionList1);

        let baseLineMap = new Map();
        mapUtil.buildMapFromJsonObject(
            baseLineJsonObject[constants.JCR_ROOT],
            baseLineMap
        );

        let allCustomLuceneIndexMap = new Map();
        mapUtil.buildMapFromJsonObject(
            allCustomIndexJsonObject[constants.JCR_ROOT],
            allCustomLuceneIndexMap
        );
        let customOOTBIndexMap = new Map();
        let customIndexes = [];
        mapUtil.buildCustomIndexMap(
            allCustomLuceneIndexMap,
            baseLineMap,
            customOOTBIndexMap,
            customIndexes
        );

        let detectionList2 = new DetectionList(
            "### Custom OOTB Oak Index Definitions type of lucene detected in content.xml"
        );
        logger.info(
            fileName +
                ": List of Custom OOTB Indexes (going to be migrated further)"
        );
        for (let key of customOOTBIndexMap.keys()) {
            detectionList2.addList(key);
            logger.info(fileName + ": " + key);
        }
        writer_buffer.push(detectionList2);

        let detectionList3 = new DetectionList(
            "### Custom Oak Index Definitions type of lucene detected in content.xml"
        );
        logger.info(
            fileName + ": List of Custom Indexes (going to be migrated further)"
        );
        logger.info(fileName + ": " + customIndexes);

        for (let val of customIndexes) {
            detectionList3.addList(val);
        }
        writer_buffer.push(detectionList3);

        let interimOutputJsonObject = Object();
        let indexOnCloudXMLPath = path.join(
            basePathResources,
            constants.CLOUD_SERVICE_INDEX_FILE_NAME
        );
        let indexOnCloudServicesJsonObject =
            xmlUtil.buildJsonObjectFromXML(indexOnCloudXMLPath);
        let indexOnCloudServicesMap = new Map();

        mapUtil.buildMapFromJsonObject(
            indexOnCloudServicesJsonObject[constants.JCR_ROOT],
            indexOnCloudServicesMap
        );
        let onPremToCloudMap = new Map();
        mapUtil.buildRelationshipMapOnPremToCloud(
            baseLineMap,
            indexOnCloudServicesMap,
            onPremToCloudMap
        );
        logger.info(
            fileName +
                ": OOTB Indexes name updated from onPrem to Cloud Service"
        );
        for (var [indexOnPrem, indexOnCloud] of onPremToCloudMap.entries()) {
            logger.info(fileName + ": " + indexOnPrem + " to " + indexOnCloud);
        }

        let transformationMap = new Map();
        indexMigration.migrationOfCustomOOTBIndex(
            interimOutputJsonObject,
            customOOTBIndexMap,
            baseLineJsonObject,
            allCustomIndexJsonObject,
            indexOnCloudServicesJsonObject,
            onPremToCloudMap,
            transformationMap
        );
        indexMigration.migrationOfCustomIndex(
            interimOutputJsonObject,
            customIndexes,
            allCustomIndexJsonObject,
            transformationMap
        );
        let detectionList4 = new DetectionList(
            "### Indexes have been converted as mentioned below :"
        );
        logger.info(fileName + ": Custom Oak Index Conversion Summary");

        for (let entry of transformationMap.entries()) {
            detectionList4.addList(
                "Transformed from " + entry[0] + " to " + entry[1]
            );
            logger.info(
                fileName + ": Transformed from " + entry[0] + " to " + entry[1]
            );
        }
        writer_buffer.push(detectionList4);
        if (customIndexXMLPath != null) {
            logger.info(
                fileName + ": Updating index name in directory structure."
            );
            xmlUtil.copyAnalyzersFolder(customIndexXMLPath, transformationMap);
            logger.info(
                fileName + ": Updated index name in directory structure."
            );
        }

        let finalOutputJsonObject = xmlUtil.constructJsonObject(
            interimOutputJsonObject
        );

        xmlUtil.convertJSONtoXML(finalOutputJsonObject);
        logger.info(fileName + ": Final Json Object is converted into xml");
        logger.info(
            fileName +
                ": Updating filter.xml present at '" +
                config.filterXMLPath +
                "'"
        );
        let targetFilterXMLPath = path.join(
            commons_constants.TARGET_INDEX_FOLDER,
            constants.FILTER_XML_NAME
        );
        if (filterXMLPath != null) {
            xmlUtil.updateIndexNameInFilterXML(
                filterXMLPath,
                transformationMap,
                targetFilterXMLPath
            );

            if (wasEnsureDefinitionConverted) {
                xmlUtil.updateEnsureIndexFilter(
                    allCustomIndexJsonObjectFromEnsure,
                    transformationMap,
                    targetFilterXMLPath
                );
            }
        } else {
            let filterXMLMessage =
                fileName +
                ": filterXMLPath is not provided, skipping to update filter.xml.";
            logger.warn(filterXMLMessage);
            console.log(filterXMLMessage);
        }

        let detectionList5 = new DetectionList(
            "### Indexes as mentioned below need to be migrated manually (either these indexes are not Lucene, or customization is done for 'nt:Base')"
        );
        logger.info(
            fileName + ": Custom Oak Indexes which need to be migrated manually"
        );

        if (
            indexMigration.migrateTikaConfigUnderDamAssetLucene(
                transformationMap,
                basePathResources,
                customIndexXMLPath
            )
        ) {
            writer_buffer.push(
                "Output tika config for damAssetLucene after transformation can be found at " +
                    path.join(
                        process.cwd(),
                        commons_constants.TARGET_INDEX_FOLDER
                    )
            );
        }

        for (let index of allCustomIndexes) {
            if (!transformationMap.has(index)) {
                detectionList5.addList(index);
                logger.info(fileName + ": " + index);
            }
        }
        writer_buffer.push(detectionList5);

        return true;
    },
};
