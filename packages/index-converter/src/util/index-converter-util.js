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

const jsonDiffPatch = require("jsondiffpatch");
const mergeJSON = require("merge-json");
const diffPatch = jsonDiffPatch.create();
const constants = require("./constants");
const xmlUtil = require("./xml-processing-util");
const {
    logger,
    util,
    constants: commons_constants,
} = require("@adobe/aem-cs-source-migration-commons");

const fs = require("fs");
const path = require("path");

let keysToBeDeleted = ["reindex", "seed", "costPerEntry", "reindexCount"];
let updateValues = new Map();
updateValues.set("compatVersion", "{Long}2");
let fileName = path.basename(__filename);

module.exports = {
    /**
     *
     * @param finalJsonObject final output json object which is going to be further converted into final xml.
     * @param customOOTBIndexMap Map of Custom Product Indexes , {Key : Index from Custom index xml , value: corresponding index in baseline xml}.
     * @param baseLineJsonObject json object of baseline content xml.
     * @param allCustomIndexJsonObject json object of Custom Indexes xml.
     * @param indexOnCloudJsonObject json object of indexes present on cloud service instance.
     * @param onPremToCloudMap Map of indexes which has information of indexes from on prem to cloud {Key: index on non cloud instance , Value: corresponding index on cloud service instance}
     * @param transformationMap {key: index in customer index content xml ,Value: new name of index after transformation}
     *
     * Transform Custom Product indexes as per the guidelines of Cloud service Oak indexes.
     *
     * Fetch customization from the custom Product index
     * Find corresponding Product index in cloud service index json object
     * Merge that retrieved customization with the corresponding Cloud Service Product Index
     */

    migrationOfCustomOOTBIndex: (
        finalJsonObject,
        customOOTBIndexMap,
        baseLineJsonObject,
        allCustomIndexJsonObject,
        indexOnCloudJsonObject,
        onPremToCloudMap,
        transformationMap
    ) => {
        logger.info(
            fileName + ": Migration of Custom OOTB Index Definitions Starts ..."
        );
        customOOTBIndexMap.forEach((value, key) => {
            // Fetch json object of index from baseline json object
            let objectOOTBIndex = xmlUtil.lookupForKey(
                baseLineJsonObject,
                value
            );
            // Fetch json object of index from custom index json object
            let objectCustomIndex = xmlUtil.lookupForKey(
                allCustomIndexJsonObject,
                key
            );
            logger.info(fileName + ": Migration for '" + key + "' Starts..");
            // Fetch the difference between custom Product index and corresponding Product index
            let objectDifference = getJsonDifference(
                objectOOTBIndex,
                objectCustomIndex
            );
            // Fetch corresponding index in cloud service index map (onPremToCloudMap)
            let keyOnCloud = onPremToCloudMap.get(value);
            // Search index in cloud service index json object
            let objectCloud = xmlUtil.lookupForKey(
                indexOnCloudJsonObject,
                keyOnCloud
            );
            //Merge the retrieved customization with corresponding product index in cloud service index json object
            let mergedObject = mergeJsonDifferenceToCloudJson(
                objectCloud,
                objectDifference
            );
            // Validate index json object after merging of customization to product index
            validateOakIndexDef(mergedObject);
            // Index name : corresponding product index name on cloud +"-custom-1"
            let customOOTBKeyOnCloud =
                keyOnCloud + constants.INDEX_CUSTOM_SUFFIX;
            buildJson(customOOTBKeyOnCloud, mergedObject, finalJsonObject);

            transformationMap.set(key, customOOTBKeyOnCloud);
            logger.info(
                fileName +
                    ": '" +
                    key +
                    "' has been transformed to '" +
                    customOOTBKeyOnCloud +
                    "'"
            );
            logger.info(fileName + " : Migration for '" + key + "' completed");
        });
        logger.info(
            fileName +
                ": Migration of Custom OOTB Index Definitions is Completed"
        );
    },
    /**
     *
     * @param finalJsonObject final output json object which is going to be further converted into final xml.
     * @param customIndexes array of Custom Indexes.
     * @param allCustomIndexJsonObject json object of baseline content xml.
     * @param transformationMap json object of Custom Indexes xml.
     *
     * Transform Custom indexes as per the guidelines of Cloud service Oak indexes.
     *
     */

    migrationOfCustomIndex: (
        finalJsonObject,
        customIndexes,
        allCustomIndexJsonObject,
        transformationMap
    ) => {
        logger.info(
            fileName + ": Migration of Custom Index Definitions Starts ..."
        );
        customIndexes.forEach((key) => {
            // Fetch custom index in custom index json object
            let objectCustomIndex = xmlUtil.lookupForKey(
                allCustomIndexJsonObject,
                key
            );
            logger.info(fileName + ": Migration for '" + key + "' Starts ...");
            // Validate index json object as per cloud service oak index guidelines
            validateOakIndexDef(objectCustomIndex);
            let customKeyOnCloud = key + constants.INDEX_CUSTOM_SUFFIX;
            buildJson(customKeyOnCloud, objectCustomIndex, finalJsonObject);
            transformationMap.set(key, customKeyOnCloud);
            logger.info(
                fileName +
                    ": '" +
                    key +
                    "' has been transformed to '" +
                    customKeyOnCloud +
                    "'"
            );
            logger.info(fileName + ": Migration for '" + key + "' completed");
        });
        logger.info(
            fileName + ": Migration of Custom Index Definitions is Completed "
        );
    },

    /**
     *
     * @param transformationMap json object of Custom Indexes xml.
     * @param basePathResources base path of resources folder
     * @param customIndexXMLPath path to source Custom indexes.
     *
     * Migrates or create tika config required for the indexes
     * @returns the array of name of OOTB custom indexes for which the tika configs are migrated.
     *
     */

    migrateTikaConfig: (
        transformationMap,
        basePathResources,
        customIndexXMLPath
    ) => {
        let migratedTikaConfigs = [];
        constants.TIKA_REQUIRED_INDEXES.forEach((index) => {
            for (var key of transformationMap.keys()) {
                if (key.startsWith(index)) {
                    if (
                        customIndexXMLPath != null &&
                        fs.existsSync(
                            path.join(
                                customIndexXMLPath,
                                key,
                                constants.TIKA,
                                constants.CONFIX_XML_NAME
                            )
                        )
                    ) {
                        // copy the source tika config
                        logger.info(
                            fileName +
                                ": Migrating tika config detected in source at " +
                                path.join(
                                    customIndexXMLPath,
                                    key,
                                    constants.TIKA,
                                    constants.CONFIX_XML_NAME
                                )
                        );
                        util.copyFolderSync(
                            path.join(customIndexXMLPath, constants.TIKA),
                            path.join(
                                process.cwd(),
                                commons_constants.TARGET_INDEX_FOLDER,
                                transformationMap.get(key),
                                constants.TIKA
                            )
                        );
                    } else {
                        // copy the default tika config
                        logger.info(
                            fileName + ": Migrating default tika config"
                        );
                        util.copyFolderSync(
                            path.join(basePathResources, constants.TIKA),
                            path.join(
                                process.cwd(),
                                commons_constants.TARGET_INDEX_FOLDER,
                                transformationMap.get(key),
                                constants.TIKA
                            )
                        );
                    }
                    logger.info(
                        fileName +
                            ": Tika config Migrated to " +
                            path.join(
                                process.cwd(),
                                commons_constants.TARGET_INDEX_FOLDER,
                                transformationMap.get(key),
                                constants.TIKA
                            )
                    );
                    //push the name of custom index
                    migratedTikaConfigs.push(transformationMap.get(key));
                }
            }
        });
        return migratedTikaConfigs;
    },
};
/**
 *
 * @param cloudIndexJsonObject final output json object which is going to be further converted into final xml.
 * @param jsonDifference extracted customization in Custom Product index as jsonObject [Custom Product Index ~ Product Index].
 *
 * Merge extracted customization {jsonDifference} to corresponding index present on cloud service {cloudIndexJsonObject}
 */
function mergeJsonDifferenceToCloudJson(cloudIndexJsonObject, jsonDifference) {
    var cloudIndexJsonObjectClone = JSON.parse(
        JSON.stringify(cloudIndexJsonObject)
    );
    diffPatch.patch(cloudIndexJsonObject, jsonDifference);
    return mergeJSON.merge(cloudIndexJsonObjectClone, cloudIndexJsonObject);
}

function buildJson(key, value, finalJsonObject) {
    finalJsonObject[key] = value;
}

function getJsonDifference(defaultJSON, customJSON) {
    return diffPatch.diff(defaultJSON, customJSON);
}
/**
 *
 * @param jsonObject jsonObject of specific oak index.
 *
 * Validate Oak index json object based on cloud service oak index guidelines.
 * Add queryPaths property with the same value as includedPaths if includedPaths property is present in index json
 */

function validateOakIndexDef(jsonObject) {
    xmlUtil.removeKeys(jsonObject, keysToBeDeleted, true);
    correctValuesOfKey(jsonObject, updateValues);
    if (
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.JSON_ATTRIBUTES_KEY],
            constants.INCLUDED_PATH
        )
    ) {
        jsonObject[constants.JSON_ATTRIBUTES_KEY][constants.QUERY_PATHS] =
            jsonObject[constants.JSON_ATTRIBUTES_KEY][constants.INCLUDED_PATH];
        logger.info(fileName + ": Added property " + constants.QUERY_PATHS);
    }
}

/**
 *
 * @param jsonObject jsonObject of specific oak index.
 * @param updateValues array of key which needs to be updated in jsonObject .
 *
 * Update set of key @param updateValues (array of key) from @param jsonObject.
 */
function correctValuesOfKey(jsonObject, updateValues) {
    if (
        Object.prototype.hasOwnProperty.call(
            jsonObject,
            constants.COMPAT_VERSION
        )
    ) {
        if (
            jsonObject[constants.COMPAT_VERSION] !=
            updateValues.get(constants.COMPAT_VERSION)
        ) {
            jsonObject[constants.COMPAT_VERSION] = updateValues.get(
                constants.COMPAT_VERSION
            );
            logger.info(
                fileName +
                    ": Updating value of " +
                    constants.COMPAT_VERSION +
                    " from  " +
                    jsonObject[constants.COMPAT_VERSION] +
                    " to " +
                    updateValues.get(constants.COMPAT_VERSION)
            );
        }
    } else {
        jsonObject[constants.JSON_ATTRIBUTES_KEY][constants.COMPAT_VERSION] =
            updateValues.get(constants.COMPAT_VERSION);
        logger.info(fileName + ": Adding property " + constants.COMPAT_VERSION);
    }
    return jsonObject;
}
