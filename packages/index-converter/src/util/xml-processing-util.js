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

const fs = require("fs");
const xml2json = require("xml-js");
const format = require("xml-formatter");
const constants = require("./constants");
const path = require("path");
const {
    constants: commons_constants,
    util,
    logger,
} = require("@adobe/aem-cs-source-migration-commons");

let fileName = path.basename(__filename);

module.exports = {
    /**
     *
     * @param path path(location in file system) of xml file .
     *
     * Build JSON Object from xml file.
     *
     */
    buildJsonObjectFromXML(path) {
        return JSON.parse(
            xml2json.xml2json(fs.readFileSync(path, constants.UTF_8), {
                compact: true,
                ignoreComment: true,
            })
        );
    },

    /**
     *
     * @param pathOfIndexFolder path(location in file system) of .content.xml files corresponding to Custom Oak Index Definitions.
     * @param ensureIndexes boolean Flag (True if set of Custom Oak Indexes are processed from Ensure Indexes  else false).
     *
     * Build consolidated JSON Object from set of .content.xml files present inside multiple folders.
     *
     */
    buildCustomIndexJsonObject(pathOfIndexFolder, ensureIndexes) {
        let pathStringForRootContentXML = path.join(
            pathOfIndexFolder,
            constants.INPUT_CONTENT_XML
        );
        let pathForContentXMLTempArray = util.globGetFilesByName(
            pathOfIndexFolder,
            constants.XML_EXTENSION
        );
        let pathForContentXMLArray = pathForContentXMLTempArray.map(function (
            item
        ) {
            return path.join(item);
        });
        let isRootContentXMLForIndexesExist = false;
        let jsonObjectForRootContentXML = null;
        let interimObj = new Object();
        if (
            !ensureIndexes &&
            pathForContentXMLArray.includes(pathStringForRootContentXML)
        ) {
            isRootContentXMLForIndexesExist = true;
            jsonObjectForRootContentXML = this.buildJsonObjectFromXML(
                pathStringForRootContentXML
            );
        } else {
            pathForContentXMLArray.forEach((xmlPath) => {
                buildJsonObjectFromContentXMLInsideFolders(interimObj, xmlPath);
            });
            return this.constructJsonObject(interimObj);
        }

        if (
            isRootContentXMLForIndexesExist &&
            pathForContentXMLArray.length > 1
        ) {
            pathForContentXMLArray.forEach((xmlPath) => {
                let indexName = lastFolderName(xmlPath);
                if (
                    xmlPath != pathStringForRootContentXML &&
                    this.lookupForKey(jsonObjectForRootContentXML, indexName) ==
                        null
                ) {
                    buildJsonObjectFromContentXMLInsideFolders(
                        interimObj,
                        xmlPath
                    );
                    jsonObjectForRootContentXML[constants.JCR_ROOT][indexName] =
                        interimObj[indexName];
                }
            });
        }
        return jsonObjectForRootContentXML;
    },
    /**
     *
     * @param jsonObject JSON Object which needs to be transformed into XML file.
     *
     * Build .content.xml from JSON Object at {commons_constants.TARGET_INDEX_FOLDER}.
     *
     */
    convertJSONtoXML: (jsonObject) => {
        let objectToXML = xml2json.json2xml(jsonObject, {
            indentAttributes: true,
            spaces: "\t",
            compact: true,
        });
        let outputFile = path.join(
            commons_constants.TARGET_INDEX_FOLDER,
            constants.OUTPUT_FILE_NAME
        );
        fs.writeFileSync(outputFile, constants.XML_HEADER);
        fs.appendFileSync(outputFile, constants.LINE_SEPARATOR);
        fs.appendFileSync(outputFile, format(objectToXML), {
            indentation: "  ",
            lineSeparator: constants.LINE_SEPARATOR,
            collapseContent: true,
        });
    },
    /**
     *
     * @param jsonObject JSON Object.
     *
     * Add xml schema header properties in json object.
     *
     */
    constructJsonObject: (jsonObject) => {
        let headerObject = Object();
        headerObject["xmlns:oak"] = "http://jackrabbit.apache.org/oak/ns/1.0";
        headerObject["xmlns:slingevent"] =
            "http://sling.apache.org/jcr/event/1.0";
        headerObject["xmlns:sling"] = "http://sling.apache.org/jcr/sling/1.0";
        headerObject["xmlns:cm"] = "http://www.adobe.com/aemfd/cm/1.0";
        headerObject["xmlns:granite"] = "http://www.adobe.com/jcr/granite/1.0";
        headerObject["xmlns:social"] = "http://www.adobe.com/social/1.0";
        headerObject["xmlns:dam"] = "http://www.day.com/dam/1.0";
        headerObject["xmlns:cq"] = "http://www.day.com/jcr/cq/1.0";
        headerObject["xmlns:jcr"] = "http://www.jcp.org/jcr/1.0";
        headerObject["xmlns:mix"] = "http://www.jcp.org/jcr/mix/1.0";
        headerObject["xmlns:nt"] = "http://www.jcp.org/jcr/nt/1.0";
        headerObject["xmlns:rep"] = "internal";
        headerObject["jcr:mixinTypes"] = "[rep:AccessControllable]";
        headerObject["jcr:primaryType"] = "nt:unstructured";

        let obj = Object();
        jsonObject[constants.JSON_ATTRIBUTES_KEY] = headerObject;
        obj[constants.JCR_ROOT] = jsonObject;
        return obj;
    },

    /**
     *
     * @param object JSON Object.
     * @param key name of the key which needs to be searched into json object.
     *
     * Return value of key in json object.
     * @return
     */
    lookupForKey: (object, key) => {
        return lookup(object, key);
    },

    /**
     *
     * @param xmlFile path of source filter.xml.
     * @param keyMap Map of transformed Custom Oak Indexes {Key:Name of Custom Oak index in source filter.xml, Value: New name of Custom Oak Index After transformation}.
     * @param targetFilterXMLPath target folder path where updated filter.xml needs to be placed.
     *
     * Create copy of source filter.xml file at @param targetFilterXMLPath with new index names.
     *
     */
    updateIndexNameInFilterXML: (xmlFile, keyMap, targetFilterXMLPath) => {
        fs.copyFileSync(xmlFile, targetFilterXMLPath);
        var xmlString = fs.readFileSync(targetFilterXMLPath, constants.UTF_8);
        for (let [key, val] of keyMap) {
            xmlString = xmlString.replace(key, val);
            logger.info(
                fileName +
                    ": Path '/oak:index/" +
                    key +
                    "' is updated to '/oak:index/" +
                    val +
                    "'"
            );
        }
        fs.unlinkSync(targetFilterXMLPath);
        fs.writeFileSync(targetFilterXMLPath, xmlString);
    },

    /**
     *
     * @param ensureIndexJsonObject consolidated json object built of Custom Oak Indexes transformed from Ensure Indexes .
     * @param transformationMap Map of transformed Custom Oak Indexes {Key:Name of Custom Oak index in source filter.xml, Value: New name of Custom Oak Index After transformation}.
     * @param copiedFilterXML path of filter.xml which needs to be updated.
     *
     * Add new index filters in filter.xml file present at @param copiedFilterXML.
     *
     */
    updateEnsureIndexFilter: (
        ensureIndexJsonObject,
        transformationMap,
        copiedFilterXML
    ) => {
        let migratedEnsureIndexes = [];

        for (var key in ensureIndexJsonObject[constants.JCR_ROOT]) {
            if (transformationMap.has(key)) {
                migratedEnsureIndexes.push(transformationMap.get(key));
            }
        }

        let newFiltersString = "";
        for (let val of migratedEnsureIndexes) {
            let filterEntryString = `\t<filter root="/oak:index/` + val + `"/>`;
            newFiltersString += filterEntryString;
            logger.info(
                fileName +
                    ": New filter is added for Ensure Index: '/oak:index/" +
                    val +
                    "'"
            );
            newFiltersString += constants.LINE_SEPARATOR;
        }
        newFiltersString += constants.FILTER_FOOTER_TAG;

        var xmlString = fs.readFileSync(copiedFilterXML, constants.UTF_8);

        xmlString = xmlString.replace(
            constants.FILTER_FOOTER_TAG,
            newFiltersString
        );

        fs.unlinkSync(copiedFilterXML);
        fs.writeFileSync(copiedFilterXML, xmlString);
    },

    mergeJsonObjects: (jsonObject1, jsonObject2) => {
        let jsonObjectInterim = jsonObject1[constants.JCR_ROOT];
        removeKeys(jsonObjectInterim, constants.XML_HEADER_PROPERTIES);
        for (var key in jsonObjectInterim) {
            jsonObject2[constants.JCR_ROOT][key] = jsonObjectInterim[key];
        }
        return jsonObject2;
    },
    removeKeys,
};

function lastFolderName(xmlPath) {
    return path.dirname(xmlPath).split(path.sep).pop();
}

function lookup(object, key) {
    if (typeof object != "object") {
        return null;
    }
    var result = null;
    if (Object.prototype.hasOwnProperty.call(object, key)) {
        return object[key];
    } else {
        for (var obj in object) {
            result = lookup(object[obj], key);
            if (result == null) continue;
            else break;
        }
    }
    return result;
}

/**
 *
 * @param interimJsonObject JSON Object which needs to be updated.
 * @param xmlPath actual path of .content.xml.
 *
 * Update JSON Object from .content.xml file if any lucene type Oak index present.
 *
 */
function buildJsonObjectFromContentXMLInsideFolders(
    interimJsonObject,
    xmlPath
) {
    let jsonObjectForSingleIndex = JSON.parse(
        xml2json.xml2json(fs.readFileSync(xmlPath, constants.UTF_8), {
            compact: true,
        })
    );
    let jsonObjectTemp = jsonObjectForSingleIndex[constants.JCR_ROOT];
    removeKeys(jsonObjectTemp, constants.XML_HEADER_PROPERTIES, false);
    if (jsonObjectTemp[constants.JSON_ATTRIBUTES_KEY]["type"] == "lucene") {
        let indexName = lastFolderName(xmlPath);
        interimJsonObject[indexName] = jsonObjectTemp;
    }
}

/**
 *
 * @param jsonObject jsonObject of specific oak index.
 * @param keysToBeDeleted array of keys which needs to be removed from jsonObject.
 * @param loggingFlag Boolean {true if operation performed in this function needs to be logged else False}
 *
 * Delete set of keys @param keysToBeDeleted (array of keys) from @param jsonObject.
 */

function removeKeys(jsonObject, keysToBeDeleted, loggingFlag) {
    for (var key in jsonObject) {
        if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
            switch (typeof jsonObject[key]) {
                case "object":
                    if (keysToBeDeleted.indexOf(key) > -1) {
                        delete jsonObject[key];
                        if (loggingFlag) {
                            logger.info(
                                fileName + ": Property '" + key + "' is deleted"
                            );
                        }
                    } else {
                        removeKeys(
                            jsonObject[key],
                            keysToBeDeleted,
                            loggingFlag
                        );
                    }
                    break;
                default:
                    if (keysToBeDeleted.indexOf(key) > -1) {
                        delete jsonObject[key];
                        if (loggingFlag) {
                            logger.info(
                                fileName + ": Property '" + key + "' is deleted"
                            );
                        }
                    }
                    break;
            }
        }
    }
    return jsonObject;
}
