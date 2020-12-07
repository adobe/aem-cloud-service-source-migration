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

const constants = require("./constants");

module.exports = {
    /**
     *
     * @param jsonObject json object of content xml.
     * @param map {Key : name of the index, Value: node under indexRules Node}.
     *
     * Build @param map from @param jsonObject.
     *
     */
    buildMapFromJsonObject: (jsonObject, map) => {
        buildMapFromJsonObject(jsonObject, map, null);
    },
    /**
     *
     * @param allCustomIndexMap map built based on customer Oak index content.xml {Key : name of the index, Value: node names under indexRules Node}.
     * @param baseLineMap map built based on base aem version content.xml {Key : name of the index, Value: node under indexRules Node}.
     * @param customOOTBIndexMap map of Custom Product indexes {Key : name of the index in custom oak index xml , Value: name of corresponding product index in baseline xml}.
     * @param customIndexes array of those indexes which are newly created by customer
     *
     * Build @param customOOTBIndexMap @param customIndexes from @param allCustomIndexMap and @param baseLineMap.
     *
     */

    buildCustomIndexMap: (
        allCustomIndexMap,
        baseLineMap,
        customOOTBIndexMap,
        customIndexes
    ) => {
        let relatedKey = null;
        for (let [key, val] of allCustomIndexMap) {
            relatedKey = null;
            relatedKey = getKeyByValue(baseLineMap, val);
            if (relatedKey != null) {
                if (!val.includes(constants.NT_BASE)) {
                    customOOTBIndexMap.set(key, relatedKey);
                }
            } else {
                customIndexes.push(key);
            }
        }
    },
    /**
     *
     * @param baseLineMap map built based on base aem version content.xml {Key : name of the index, Value: node names under indexRules Node}.
     * @param indexOnCloudServicesMap map of Product indexes present in cloud service aem instance {Key : name of the index, Value: node names under indexRules Node}.
     * @param onPremToCloudMap map to be populated {Key: name of index in baseline,Value: name of index in cloud service aem content.xml }
     *
     * Populate @param onPremToCloudMap based on @param baseLineMap and @param indexOnCloudServicesMap.
     *
     */
    buildRelationshipMapOnPremToCloud: (
        baseLineMap,
        indexOnCloudServicesMap,
        onPremToCloudMap
    ) => {
        let baseLineMapKeys = baseLineMap.keys();

        for (const baseLineKey of baseLineMapKeys) {
            let correspondingKey = checkSimilarKeyInOtherMap(
                baseLineKey,
                indexOnCloudServicesMap
            );
            if (correspondingKey != null) {
                onPremToCloudMap.set(baseLineKey, correspondingKey);
            }
        }
    },
};

function getKeyByValue(indexMap, value) {
    let ans = null;
    for (let [key, val] of indexMap) {
        if (value.toString() == val.toString()) {
            ans = key;
        }
    }
    return ans;
}
/**
 *
 * @param jsonObject index json object.
 * @param map map {Key : name of the index, Value: node names under indexRules Node}.
 *
 * Populate @param map based on @param jsonObject.
 *
 */
function buildMapFromJsonObject(jsonObject, map, indexName) {
    for (const [key, value] of Object.entries(jsonObject)) {
        if (key == constants.INDEX_RULE) {
            for (let k in value) {
                if (k != constants.JCR_PRIMARY_TYPE) {
                    if (indexName != null && map.has(indexName)) {
                        map[indexName] = map[indexName] || [];
                        map[indexName].push(k);
                        map.set(indexName, map[indexName]);
                    } else {
                        map.set(indexName, k);
                    }
                }
            }
        } else if (typeof value === "object" && value !== null) {
            for (let k in value) {
                if (k == constants.INDEX_RULE || k == constants.XMLNS_OAK) {
                    indexName = key;
                    buildMapFromJsonObject(value, map, indexName);
                }
            }
        }
    }
}

function checkSimilarKeyInOtherMap(baseLineKey, indexOnCloudServicesMap) {
    let indexOnCloudServicesMapKeys = indexOnCloudServicesMap.keys();
    for (const key of indexOnCloudServicesMapKeys) {
        if (key.includes(baseLineKey)) {
            indexOnCloudServicesMap.delete(key);
            return key;
        }
    }
    return null;
}
