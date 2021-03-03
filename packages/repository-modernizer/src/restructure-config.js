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

const {
    constants: commons_constants,
    util,
    logger,
    ConversionStep,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const constants = require("./util/constants");
const fs = require("fs");
const path = require("path");
const xmljs = require("xml-js");

var RestructureContent = {
    /**
     *
     * @param object config yaml object containing info of project to be restructured
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Restructure content of packages to mutable package/immutable package
     */
    async restructure(projects, conversionSteps) {
        let conversionStep = new ConversionStep(
            "Separate OSGI configs into `ui.config` package.",
            "The ui.config package, contains all OSGi configurations:" +
                commons_constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "* Organizational folder containing run mode specific OSGi config definitions - `/apps/my-app/osgiconfig`" +
                commons_constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "* Common OSGi configuration folder containing default OSGi configurations that apply to all target AEM as a Cloud Service deployment targets - `/apps/my-app/osgiconfig/config`" +
                commons_constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "* Run mode - specific OSGi configuration folders that contains default OSGi configurations that apply to all target AEM as a Cloud Service deployment targets - `/apps/my-app/osgiconfig/config.<author|publish>.<dev|stage|prod>`."
        );
        for (let project of projects) {
            let targetProjectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            let uiAppsJcrRootPath = path.join(
                targetProjectPath,
                constants.UI_APPS,
                constants.JCR_ROOT_PATH
            );
            if (project.appId == null) {
                logger.error(
                    `RestructureConfig: 'appId' not specified for project ${project.projectPath}.`
                );
            }
            if (
                project.osgiFoldersToRename !== null &&
                project.osgiFoldersToRename !== undefined
            ) {
                await renameConfigFolders(
                    uiAppsJcrRootPath,
                    project.osgiFoldersToRename,
                    conversionStep
                );
            }
            await migrateConfig(
                uiAppsJcrRootPath,
                project.appId,
                conversionStep
            );
        }
        conversionSteps.push(conversionStep);
    },
};

/**
 *
 * @param String uiAppsJcrRootPath  jcr root path of ui.apps package
 * @param String osgiFoldersToRename the project info as configured in the input config yaml file
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Rename the OSGi config folders as defined in the config yaml file
 */
async function renameConfigFolders(
    uiAppsJcrRootPath,
    osgiFoldersToRename,
    conversionStep
) {
    for (let osgiFolderPath of Object.keys(osgiFoldersToRename)) {
        let osgiConfigFolderPath = path.join(uiAppsJcrRootPath, osgiFolderPath);
        let newOsgiConfigFolderPath = path.join(
            path.dirname(osgiConfigFolderPath),
            osgiFoldersToRename[osgiFolderPath]
        );
        if (fs.existsSync(osgiConfigFolderPath)) {
            if (fs.existsSync(newOsgiConfigFolderPath)) {
                let targetJcrPath = osgiFolderPath.replace(
                    path.basename(osgiFolderPath),
                    osgiFoldersToRename[osgiFolderPath]
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_RENAMED,
                        path.dirname(osgiFolderPath),
                        `OSGI config folder '${targetJcrPath}' already exists! '${path.basename(
                            osgiFolderPath
                        )}' will be merged with existing folder`
                    )
                );
                logger.info(
                    `RestructureConfig: OSGI config folder '${targetJcrPath}' already exists! '${path.basename(
                        osgiFolderPath
                    )}' will be merged with existing folder.`
                );
                // move the content of the OSGi config folder to the exiting one
                for (let file of await fs.promises.readdir(
                    osgiConfigFolderPath
                )) {
                    var oldPath = path.join(osgiConfigFolderPath, file);
                    var newPath = path.join(newOsgiConfigFolderPath, file);
                    // if a file/folder with the same name alread exists in the destination
                    if (fs.existsSync(newPath)) {
                        conversionStep.addOperation(
                            new ConversionOperation(
                                commons_constants.WARNING,
                                osgiFolderPath,
                                `OSGI configuration with the same PID/filename already exists at ${targetJcrPath}, '${file}' will not be moved to new location. Please evaluate which configuration to persits.`
                            )
                        );
                        logger.warn(
                            `RestructureConfig: OSGI configuration with the same PID/filename already exists at ${targetJcrPath}, '${file}' will not be moved to new location. Please evaluate which configuration to persits.`
                        );
                    } else {
                        await fs.promises.rename(oldPath, newPath);
                    }
                }
                // delete the existing content folder if empty
                deleteEmptyConfigDir(osgiConfigFolderPath);
            } else {
                // simply rename the OSGi config folder
                await fs.promises.rename(
                    osgiConfigFolderPath,
                    newOsgiConfigFolderPath
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_RENAMED,
                        path.dirname(osgiFolderPath),
                        `OSGI config folder '${path.basename(
                            osgiFolderPath
                        )}' renamed to '${osgiFoldersToRename[osgiFolderPath]}'`
                    )
                );
                logger.info(
                    `RestructureConfig: OSGI config folder '${path.basename(
                        osgiFolderPath
                    )}' renamed to '${osgiFoldersToRename[osgiFolderPath]}'`
                );
            }
        } else {
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.WARNING,
                    osgiFolderPath,
                    "OSGi folder not found! Please verify the entered OSGi configuration folder path."
                )
            );
            logger.warn(
                `RestructureConfig: OSGi folder '${osgiFolderPath}' not found! Please verify the entered OSGi configuration folder path.`
            );
        }
    }
}

/**
 *
 * @param String uiAppsJcrRootPath  jcr root path of ui.apps package
 * @param String appId the appId of the project
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Migrate content of packages to ui.apps and ui.content
 */
async function migrateConfig(uiAppsJcrRootPath, appId, conversionStep) {
    if (fs.existsSync(uiAppsJcrRootPath)) {
        const appsDirPath = path.join(constants.JCR_ROOT_PATH, "apps");
        const osgiConfigDirPath = path.join(appsDirPath, appId, "osgiconfig");
        // get all files with extension ".cfg.json", ".config", ".cfg"
        for (let configFileFormat of constants.OSGI_CONFIG_FILE_FORMATS) {
            let configFiles = util.globGetFilesByName(
                uiAppsJcrRootPath,
                configFileFormat
            );
            for (let oldConfigFilePath of configFiles) {
                oldConfigFilePath = path.join(oldConfigFilePath);
                if (
                    !(await fs.promises.lstat(oldConfigFilePath)).isDirectory()
                ) {
                    let newConfigFilePath = oldConfigFilePath.replace(
                        constants.UI_APPS,
                        constants.UI_CONFIG
                    );
                    newConfigFilePath = newConfigFilePath.split(appsDirPath);
                    newConfigFilePath = path.join(
                        newConfigFilePath[0],
                        osgiConfigDirPath,
                        newConfigFilePath[1].replace(appId, "")
                    );
                    await moveConfig(
                        oldConfigFilePath,
                        newConfigFilePath,
                        conversionStep
                    );
                    await formatConfig(newConfigFilePath);
                }
            }
        }
        // look for sling:OsgiConfig resources
        let contentXmlFiles = util.globGetFilesByExtension(
            uiAppsJcrRootPath,
            constants.XML_EXTENSION
        );
        for (let contentXmlFile of contentXmlFiles) {
            contentXmlFile = path.join(contentXmlFile);
            if (
                !(await fs.promises.lstat(contentXmlFile)).isDirectory() &&
                (await isOsgiConfig(contentXmlFile))
            ) {
                let newConfigFilePath = contentXmlFile.replace(
                    constants.UI_APPS,
                    constants.UI_CONFIG
                );
                newConfigFilePath = newConfigFilePath.split(appsDirPath);
                newConfigFilePath = path.join(
                    newConfigFilePath[0],
                    osgiConfigDirPath,
                    newConfigFilePath[1].replace(appId, "")
                );
                await moveConfig(
                    contentXmlFile,
                    newConfigFilePath,
                    conversionStep
                );
                await formatConfig(newConfigFilePath);
            }
        }
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.WARNING,
                osgiConfigDirPath,
                "Please verify the Run mode-specific OSGi configuration folders nomenclature, expected folder-name format : `config.<author|publish>.<dev|stage|prod>`."
            )
        );
        logger.warn(
            `RestructureConfig: Please verify the Run mode-specific OSGi configuration folders nomenclature; expected folder-name format :config.<author|publish>.<dev|stage|prod>.`
        );
    }
}
/**
 *
 * @param String oldConfigFilePath  config file path in ui.apps package
 * @param String newConfigFilePath the new config file path in ui.config package
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Move config file from old location to ui.config package
 */
async function moveConfig(
    oldConfigFilePath,
    newConfigFilePath,
    conversionStep
) {
    let newConfigFileParent = path.dirname(newConfigFilePath);
    // if target is a file, if required create the folder hierarchy first
    if (!fs.existsSync(newConfigFileParent)) {
        await fs.promises.mkdir(newConfigFileParent, { recursive: true });
    }
    // then move the file from ui.apps package to ui.config
    await fs.promises.rename(oldConfigFilePath, newConfigFilePath);
    conversionStep.addOperation(
        new ConversionOperation(
            commons_constants.ACTION_ADDED,
            path.dirname(newConfigFilePath),
            `Added OSGI config file ${path.basename(newConfigFilePath)}`
        )
    );
    logger.info(
        `RestructureConfig: Added OSGI config file ${newConfigFilePath}.`
    );
    // if recursively old config directory is now empty, delete it
    await deleteEmptyConfigDir(oldConfigFilePath);
}

/**
 *
 * @param String filePath  xml file path
 *
 * Check if given xml file is an 'sling:OsgiConfig' resource
 */
async function isOsgiConfig(filePath) {
    let jsonObject = JSON.parse(
        xmljs.xml2json(await fs.promises.readFile(filePath, constants.UTF_8), {
            compact: true,
        })
    );
    return (
        Object.prototype.hasOwnProperty.call(jsonObject, constants.JCR_ROOT) &&
        typeof jsonObject[constants.JCR_ROOT] === "object" &&
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.JCR_ROOT],
            constants.JSON_ATTRIBUTES_KEY
        ) &&
        typeof jsonObject[constants.JCR_ROOT][constants.JSON_ATTRIBUTES_KEY] ===
            "object" &&
        Object.prototype.hasOwnProperty.call(
            jsonObject[constants.JCR_ROOT][constants.JSON_ATTRIBUTES_KEY],
            constants.JCR_PRIMARY_TYPE
        ) &&
        jsonObject[constants.JCR_ROOT][constants.JSON_ATTRIBUTES_KEY][
            constants.JCR_PRIMARY_TYPE
        ] === constants.SLING_OSGI_CONFIG
    );
}

/**
 *
 * @param String oldConfigFilePath  config file path in ui.apps package
 *
 * Recursively delete empty (old) config directories
 */
async function deleteEmptyConfigDir(oldConfigFilePath) {
    let oldConfigFileParent = path.dirname(oldConfigFilePath);
    // while parent directory is empty delete it
    while ((await fs.promises.readdir(oldConfigFileParent)).length === 0) {
        await fs.promises.rmdir(oldConfigFileParent);
        logger.info(
            `RestructureConfig: Removed empty folder ${oldConfigFileParent}.`
        );
        oldConfigFileParent = path.dirname(oldConfigFileParent);
    }
}
/**
 *
 * @param String newConfigFilePath the new config file path in ui.config package
 *
 * format config in xml ,cfg,config format to cfg.json
 */
async function formatConfig(newConfigFilePath) {
    let fileName = newConfigFilePath.substring(
        newConfigFilePath.lastIndexOf("/") + 1
    );

    if (
        !fileName.startsWith(
            "org.apache.sling.jcr.repoinit.RepositoryInitializer"
        ) &&
        (newConfigFilePath.endsWith(".xml") ||
            newConfigFilePath.endsWith(".config") ||
            newConfigFilePath.endsWith(".cfg"))
    ) {
        let fileContent = util.getXMLContentSync(newConfigFilePath);
        let contentToBeWritten = [];
        let pushContent = false;
        let path = "";
        if (newConfigFilePath.endsWith(".xml")) {
            path =
                newConfigFilePath.substring(
                    0,
                    newConfigFilePath.lastIndexOf(".xml")
                ) + ".cfg.json";
            contentToBeWritten.push("{");
            let jsonObject = JSON.parse(
                xmljs.xml2json(
                    await fs.promises.readFile(
                        newConfigFilePath,
                        constants.UTF_8
                    ),
                    {
                        compact: true,
                    }
                )
            );
            if (
                Object.prototype.hasOwnProperty.call(
                    jsonObject[constants.JCR_ROOT][
                        constants.JSON_ATTRIBUTES_KEY
                    ],
                    constants.JCR_PRIMARY_TYPE
                )
            ) {
                let obj =
                    jsonObject[constants.JCR_ROOT][
                        constants.JSON_ATTRIBUTES_KEY
                    ];
                for (var key in obj) {
                    if (
                        key == constants.JCR_PRIMARY_TYPE &&
                        Object.prototype.hasOwnProperty.call(obj, key)
                    ) {
                        pushContent = true;
                        continue;
                    }
                    if (pushContent) {
                        var val = obj[key];
                        let str = removeUnwantedChars(
                            key,
                            val,
                            newConfigFilePath
                        );
                        contentToBeWritten.push(str + ",");
                    }
                }
                if (contentToBeWritten.length > 1) {
                    let lastStr = contentToBeWritten[
                        contentToBeWritten.length - 1
                    ].substring(
                        0,
                        contentToBeWritten[contentToBeWritten.length - 1]
                            .length - 1
                    );
                    contentToBeWritten.pop();
                    contentToBeWritten.push(lastStr);
                }
            }
            contentToBeWritten.push("}");
            await util.writeDataToFileAsync(path, contentToBeWritten);
        } else {
            if (newConfigFilePath.endsWith(".config")) {
                path =
                    newConfigFilePath.substring(
                        0,
                        newConfigFilePath.lastIndexOf(".config")
                    ) + ".cfg.json";
            } else {
                path =
                    newConfigFilePath.substring(
                        0,
                        newConfigFilePath.lastIndexOf(".cfg")
                    ) + ".cfg.json";
            }
            contentToBeWritten.push("{");
            fileContent = fileContent.filter((a) => a);
            for (let line = 0; line < fileContent.length; line++) {
                let configLine = fileContent[line].trim();
                let key = configLine.substring(0, configLine.indexOf("="));
                let val = configLine.substring(configLine.indexOf("=") + 1);
                let str = removeUnwantedChars(key, val, newConfigFilePath);
                if (key != "") {
                    if (line == fileContent.length - 1) {
                        contentToBeWritten.push(str);
                    } else {
                        contentToBeWritten.push(str + ",");
                    }
                }
            }
            contentToBeWritten.push("}");
            await util.writeDataToFileAsync(path, contentToBeWritten);
        }
        fs.unlinkSync(newConfigFilePath);
    }
}
/**
 * @param String key which will be added as key in resultant file
 * @param String val which will be added as value in resultant file
 * @param String FilePath the new config file path in ui.config package
 *
 * format generate line which will be added to resultant cfg.json file
 */
function removeUnwantedChars(key, val, filePath) {
    val = val.replace(/\\/g, "");
    let str = "";
    if (filePath.endsWith(".xml")) {
        if (val.charAt(0) == "{") {
            let type = val.substring(1, val.indexOf("}"));
            val = val.substring(val.indexOf("}") + 1);
            val = val.replace(/[^\x20-\x7E]/gim, "");
            str = '"' + key + ":" + type + '"' + ":" + '"' + val + '"';
        } else {
            val = val.replace(/[^\x20-\x7E]/gim, "");
            str = '"' + key + '"' + ":" + '"' + val + '"';
        }
    } else if (filePath.endsWith(".config") || filePath.endsWith(".cfg")) {
        if (val.charAt(0) !== '"' && val.charAt(0) !== "[") {
            val = val.substring(1);
        }
        str = '"' + key + '"' + ":" + val;
    }
    return str;
}
module.exports = RestructureContent;
