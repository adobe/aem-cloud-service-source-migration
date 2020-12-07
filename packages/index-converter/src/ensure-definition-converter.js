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

const xmlUtil = require("./util/xml-processing-util.js");
const constants = require("./util/constants.js");
const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");
const xmljs = require("xml-js");
const format = require("xml-formatter");
let fileName = path.basename(__filename);
module.exports = {
    /**
     *
     * @param config the yaml object representation of the index-converter configuration.
     * @param conversionSteps array of ConversionStep objects
     *
     * Convert Ensure Definitions to Oak Index Definitions
     *
     */
    performConversion: (config, conversionSteps) => {
        let wasEnsureDefinitionConverted = false;
        if (
            config.ensureIndexDefinitionContentPackageJcrRootPath != null &&
            config.ensureIndexDefinitionConfigPackageJcrRootPath != null
        ) {
            let conversionStep = new ConversionStep(
                "Convert Ensure Definitions to Oak Index Definitions",
                "Ensure Definitions containing custom index definitions need to be converted to Oak Index Definition."
            );
            // find the ensure definitions path
            let ensureDefinitionsPath = getEnsureDefinitionPath(
                config.ensureIndexDefinitionConfigPackageJcrRootPath
            );
            if (
                ensureDefinitionsPath != null &&
                fs.existsSync(
                    path.join(
                        config.ensureIndexDefinitionContentPackageJcrRootPath,
                        ensureDefinitionsPath
                    )
                )
            ) {
                // mandatory ignore properties list
                let propertiesToIgnore = ["seed"];
                // append additional properties to be ignored as specified in OSGI config
                var extractedPropertiesToIgnore = getIgnoredPropertiesList(
                    config.ensureIndexDefinitionConfigPackageJcrRootPath
                );
                if (extractedPropertiesToIgnore != null) {
                    propertiesToIgnore.push(...extractedPropertiesToIgnore);
                }
                // convert ensure definitions to oak index definitions
                wasEnsureDefinitionConverted = convertEnsureDefinitions(
                    path.join(
                        config.ensureIndexDefinitionContentPackageJcrRootPath,
                        ensureDefinitionsPath
                    ),
                    path.join(
                        commons_constants.TARGET_INDEX_FOLDER,
                        constants.ENSURE_DEFINITIONS_FOLDER
                    ),
                    propertiesToIgnore,
                    conversionStep
                );
                conversionSteps.push(conversionStep);
            }
        } else {
            logger.warn(
                fileName +
                    ": Configuration for Ensure Index Definitions not specified, skipping conversion of Ensure Definitions."
            );
        }
        return wasEnsureDefinitionConverted;
    },
};

/**
 *
 * @param ensureDefinitionPackage the package path containing the ensure definitions.
 *
 * Find the OSGI config com.adobe.acs.commons.oak.impl.EnsureOakIndex-*.xml,
 * and extract the ensure definitions path.
 */
function getEnsureDefinitionPath(ensureDefinitionPackage) {
    let configFiles = util.globGetFilesByName(
        ensureDefinitionPackage,
        constants.ENSURE_OAK_INDEX_CONFIG_FILE
    );
    if (configFiles.length > 0) {
        let configFileContent = util.getXMLContentSync(configFiles[0]);
        for (let line of configFileContent) {
            if (line.trim().startsWith(constants.ENSURE_DEFINITIONS_PATH)) {
                // extract the ensure definitions path
                logger.info(
                    fileName +
                        `: Found ensure definitions path in EnsureOakIndex*.xml config file : ${
                            line.split(`"`)[1]
                        }`
                );
                return line.split(`"`)[1];
            }
        }
        logger.error(
            fileName +
                `: Could not find property ${constants.ENSURE_DEFINITIONS_PATH} in config file ${configFiles[0]}`
        );
    } else {
        logger.info(
            fileName +
                `: EnsureOakIndex config file not found, no Ensure Definitions to be processed.`
        );
    }
}

/**
 *
 * @param ensureDefinitionPackage the package path containing the ensure definitions.
 *
 * Find the OSGI config com.adobe.acs.commons.oak.impl.EnsureOakIndexManagerImpl.xml,
 * and extract the ignore properties if specified.
 */
function getIgnoredPropertiesList(ensureDefinitionPackage) {
    let configFiles = util.globGetFilesByName(
        ensureDefinitionPackage,
        constants.ENSURE_OAK_INDEX_MANAGER_CONFIG_FILE
    );
    if (configFiles.length > 0) {
        let configFileContent = util.getXMLContentSync(configFiles[0]);
        for (let line of configFileContent) {
            if (
                line
                    .trim()
                    .startsWith(constants.ENSURE_DEFINITION_PROPERTIES_IGNORE)
            ) {
                // extract the properties to ignore
                // eg. properties.ignore="[myDescription,ignoreMe]"
                let propertiesToIgnore = line.split(`[`)[1];
                propertiesToIgnore = propertiesToIgnore.split(`]`)[0];
                logger.info(
                    fileName +
                        `: Found ignore properties in EnsureOakIndexManagerImpl config file : ${propertiesToIgnore}`
                );
                return propertiesToIgnore.split(`,`);
            }
        }
    } else {
        logger.info(
            fileName +
                `: EnsureOakIndexManagerImpl config file not found, no properties to ignore.`
        );
    }
}

/**
 *
 * @param ensureDefinitionsPath the path where the ensure definitions are present in customer code base.
 * @param targetPath path where the (ensure) index definitions are to be kept after conversion.
 * @param propertiesToIgnore array of keys which needs to be removed from index definitions during conversion.
 * @param conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Convert ensure definitions to oak index definitions.
 */
function convertEnsureDefinitions(
    ensureDefinitionsPath,
    targetPath,
    propertiesToIgnore,
    conversionStep
) {
    let wasEnsureDefinitionConverted = false;
    // create the target folder and copy the ensure definitions
    util.copyFolderSync(ensureDefinitionsPath, targetPath);
    // find and process all .content*.xml files
    let xmlFiles = util.globGetFilesByName(targetPath, constants.XML_EXTENSION);
    xmlFiles.forEach((xmlFile) => {
        let jsonObject = xmlUtil.buildJsonObjectFromXML(xmlFile);
        convertEnsureDefinitionsInternal(
            jsonObject,
            propertiesToIgnore,
            xmlFile,
            conversionStep
        );
        if (!isJsonObjectEmpty(jsonObject)) {
            // write converted jsonObject back to xml file
            let objectToXML = xmljs.json2xml(jsonObject, {
                indentAttributes: true,
                spaces: "\t",
                compact: true,
            });
            fs.writeFileSync(xmlFile, format(objectToXML), {
                indentation: "  ",
                lineSeparator: constants.LINE_SEPARATOR,
                collapseContent: true,
            });
            wasEnsureDefinitionConverted = true;
            logger.info(
                fileName +
                    ": Ensure definition at " +
                    xmlFile +
                    " converted to oak index definition."
            );
        } else {
            // if jsonObject is empty, delete the corresponding file
            try {
                fs.unlinkSync(xmlFile);
                logger.info(
                    fileName + ": Deleted ensure definition file " + xmlFile
                );
                let conversionOperation = new ConversionOperation(
                    commons_constants.ACTION_DELETED,
                    path.dirname(xmlFile),
                    "Deleted file " + xmlFile
                );
                conversionStep.addOperation(conversionOperation);
            } catch (err) {
                logger.error(
                    fileName +
                        ": Error while trying to delete:" +
                        err.filename +
                        " " +
                        err.stderr
                );
            }
        }
    });
    return wasEnsureDefinitionConverted;
}

/**
 *
 * @param jsonObject jsonObject
 * @param propertiesToIgnore array of keys which needs to be removed from ensure definitions.
 * @param xmlFile the xml file containing the ensure definition.
 * @param conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Identify and convert ensure definitions to oak index definitions.
 */
function convertEnsureDefinitionsInternal(
    jsonObject,
    propertiesToIgnore,
    xmlFile,
    conversionStep
) {
    for (var key in jsonObject) {
        if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
            if (typeof jsonObject[key] === "object") {
                // if object is an ensure Definition
                if (isEnsureIndexDefinition(jsonObject[key])) {
                    // Rule 1 : if property ignore is set to true, delete the ensure Definition
                    if (isIgnoreTrue(jsonObject[key])) {
                        delete jsonObject[key];
                        logger.info(
                            fileName +
                                `: Removed (ignore) ensure definition at ${xmlFile}.`
                        );
                        let conversionOperation = new ConversionOperation(
                            commons_constants.ACTION_REMOVED,
                            xmlFile,
                            `Removed (ignore) ensure definition`
                        );
                        conversionStep.addOperation(conversionOperation);
                    } else {
                        // Rule 2 : update the jcr:primaryType to oak:QueryIndexDefinition
                        updateJcrPrimaryType(
                            jsonObject[key],
                            xmlFile,
                            conversionStep
                        );
                        // Rule 3 : remove any properties that are to be ignored as mentioned in OSGI config
                        xmlUtil.removeKeys(
                            jsonObject[key],
                            propertiesToIgnore,
                            false
                        );
                        logger.info(
                            fileName +
                                `: Removed ignore properties : [${propertiesToIgnore.toString()}] at ${xmlFile}.`
                        );
                        let conversionOperation = new ConversionOperation(
                            commons_constants.ACTION_REMOVED,
                            xmlFile,
                            `Removed ignore properties : ${propertiesToIgnore.toString()}`
                        );
                        conversionStep.addOperation(conversionOperation);
                        // Rule 4 : remove subtree /facets/jcr:content from ensure Definition
                        removeFacetJcrContentSubtree(
                            jsonObject[key],
                            xmlFile,
                            conversionStep
                        );
                    }
                } else {
                    convertEnsureDefinitionsInternal(
                        jsonObject[key],
                        propertiesToIgnore,
                        xmlFile,
                        conversionStep
                    );
                }
            }
        }
    }
}

/**
 *
 * @param jsonObject jsonObject.
 *
 * Check whether given @param jsonObject has is an  ensure definition.
 */
function isEnsureIndexDefinition(jsonObject) {
    return (
        Object.prototype.hasOwnProperty.call(
            jsonObject,
            constants.JSON_ATTRIBUTES_KEY
        ) &&
        typeof jsonObject[constants.JSON_ATTRIBUTES_KEY] === "object" &&
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.JSON_ATTRIBUTES_KEY],
            constants.JCR_PRIMARY_TYPE
        ) &&
        jsonObject[constants.JSON_ATTRIBUTES_KEY][
            constants.JCR_PRIMARY_TYPE
        ] === constants.TYPE_OAK_UNSTRUCTURED
    );
}

/**
 *
 * @param jsonObject jsonObject of specific ensure definition.
 *
 * Check whether given @param jsonObject has 'ignored' property set to true.
 */
function isIgnoreTrue(jsonObject) {
    return (
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.JSON_ATTRIBUTES_KEY],
            constants.JCR_PROPERTY_IGNORE
        ) &&
        jsonObject[constants.JSON_ATTRIBUTES_KEY][
            constants.JCR_PROPERTY_IGNORE
        ] === constants.JCR_VALUE_TRUE
    );
}

/**
 *
 * @param jsonObject jsonObject of specific ensure definition.
 * @param xmlFile the xml file containing the ensure definition.
 * @param conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Update the 'jcr:primaryType' property of @param jsonObject to 'oak:QueryIndexDefinition'.
 */
function updateJcrPrimaryType(jsonObject, xmlFile, conversionStep) {
    jsonObject[constants.JSON_ATTRIBUTES_KEY][constants.JCR_PRIMARY_TYPE] =
        constants.TYPE_OAK_QUERY_INDEX_DEFINITION;
    logger.info(
        fileName +
            `: Updated the 'jcr:primaryType' property to 'oak:QueryIndexDefinition at ${xmlFile}.`
    );
    let conversionOperation = new ConversionOperation(
        commons_constants.ACTION_MODIFIED,
        xmlFile,
        "Updated the 'jcr:primaryType' property to 'oak:QueryIndexDefinition"
    );
    conversionStep.addOperation(conversionOperation);
}

/**
 *
 * @param jsonObject jsonObject of specific ensure definition.
 * @param xmlFile the xml file containing the ensure definition.
 * @param conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Remove the sub-tree [oak:QueryIndexDefinition]/facets/jcr:content from @param jsonObject (if present).
 */
function removeFacetJcrContentSubtree(jsonObject, xmlFile, conversionStep) {
    if (
        Object.prototype.hasOwnProperty.call(
            jsonObject,
            constants.NODE_FACETS
        ) &&
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.NODE_FACETS],
            constants.NODE_JCR_CONTENT
        )
    ) {
        delete jsonObject[constants.NODE_FACETS][constants.NODE_JCR_CONTENT];
        logger.info(
            fileName +
                `: Deleted sub-tree [oak:QueryIndexDefinition]/facets/jcr:content at ${xmlFile}.`
        );
        let conversionOperation = new ConversionOperation(
            commons_constants.ACTION_DELETED,
            xmlFile,
            "Deleted sub-tree [oak:QueryIndexDefinition]/facets/jcr:content"
        );
        conversionStep.addOperation(conversionOperation);
    }
}

/**
 *
 * @param jsonObject jsonObject representation of an xml file.
 *
 * Check if given @param jsonObject is empty (ignore declaration).
 */
function isJsonObjectEmpty(jsonObject) {
    return (
        Object.keys(jsonObject).length == 0 ||
        (Object.keys(jsonObject).length == 1 &&
            Object.prototype.hasOwnProperty.call(
                jsonObject,
                constants.JSON_DECLARATION_KEY
            ))
    );
}
