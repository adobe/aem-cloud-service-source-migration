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

var RestructureContent = {
    /**
     *
     * @param object config yaml object containing info of project to be restructured
     * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
     *
     * Restructure content of packages to mutable package/immutable package
     */
    restructure(projects, conversionSteps) {
        let conversionStep = new ConversionStep(
            "Separate immutable and mutable content into respective `ui.apps` and `ui.content` packages.",
            "`ui.apps` package should contains all the code to be deployed `/apps` or `/oak:index`, " +
                "whereas `ui.content` package should contains all content and configuration not in `/apps` or `/oak:index`."
        );
        projects.forEach((project) => {
            let targetProjectPath = path.join(
                commons_constants.TARGET_PROJECT_SRC_FOLDER,
                path.basename(project.projectPath)
            );
            let uiAppsJcrRootPath = path.join(
                targetProjectPath,
                constants.UI_APPS,
                constants.JCR_ROOT_PATH
            );
            let uiContentJcrRootPath = path.join(
                targetProjectPath,
                constants.UI_CONTENT,
                constants.JCR_ROOT_PATH
            );
            let srcContentPackages = project.existingContentPackageFolder;
            srcContentPackages.forEach((contentPackage) => {
                let srcContentPackageJcrRootPath = path.join(
                    project.projectPath,
                    contentPackage,
                    project.relativePathToExistingJcrRoot != null
                        ? project.relativePathToExistingJcrRoot
                        : constants.JCR_ROOT_PATH
                );
                if (fs.existsSync(srcContentPackageJcrRootPath)) {
                    migrateContent(
                        srcContentPackageJcrRootPath,
                        uiAppsJcrRootPath,
                        uiContentJcrRootPath,
                        conversionStep
                    );
                } else {
                    logger.error(
                        `RestructureContent: ${srcContentPackageJcrRootPath} does not exist.
                     Unable to split content from ${contentPackage}.`
                    );
                }
            });
        });
        conversionSteps.push(conversionStep);
    },
};

/**
 *
 * @param String sourceJcrRootPath  jcr root path of source package
 * @param String uiAppsJcrRootPath  jcr root path of ui.apps package
 * @param String uiContentJcrRootPath  jcr root path of ui.content package
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Migrate content of packages to ui.apps and ui.content
 */
function migrateContent(
    sourceJcrRootPath,
    uiAppsJcrRootPath,
    uiContentJcrRootPath,
    conversionStep
) {
    if (fs.existsSync(sourceJcrRootPath)) {
        fs.readdirSync(sourceJcrRootPath).forEach(function (file) {
            var currentPath = path.join(sourceJcrRootPath, file);
            // if entry is a directory, copy it to the respective package
            if (fs.lstatSync(currentPath).isDirectory()) {
                // if folder name is `apps` or `libs`, copy it to ui.apps (immutable content) package
                if (
                    file === "apps" ||
                    file === "libs" ||
                    file === "_oak_index"
                ) {
                    copyContent(
                        currentPath,
                        path.join(uiAppsJcrRootPath, file),
                        conversionStep
                    );
                } else {
                    // else copy it to ui.content (mutable content) package
                    copyContent(
                        currentPath,
                        path.join(uiContentJcrRootPath, file),
                        conversionStep
                    );
                }
            }
        });
    }
}
/**
 *
 * @param String source path from where package to be copied
 * @param String target path from package to be copied
 * @param object conversionStep  object containing info about rule and  details of the rule that is being followed
 *
 * Copy files from source to target
 */
function copyContent(source, target, conversionStep) {
    // if target doesn't exist, then copy it directly
    if (!fs.existsSync(target)) {
        if (fs.lstatSync(source).isDirectory()) {
            util.copyFolderSync(source, target);
        } else {
            // if target is a file, if required create the folder hierarchy first
            if (!fs.existsSync(target)) {
                fs.mkdirSync(target);
            }
            // then copy the file
            fs.copyFileSync(source, target);
        }
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                target,
                `Copied content from ${source} to ${target}`
            )
        );
        logger.info(`RestructureContent: Copied ${source} to ${target}.`);
    } else {
        // copy its content iteratively
        fs.readdirSync(source).forEach(function (file) {
            var currentPath = path.join(source, file);
            var destination = path.join(target, file);
            // if entry is a directory
            if (fs.lstatSync(currentPath).isDirectory()) {
                // if directory already exists in the destination,
                // recursively copy the children of the directory(merge)
                if (fs.existsSync(destination)) {
                    copyContent(currentPath, destination, conversionStep);
                } else {
                    // else copy the directory as is
                    util.copyFolderSync(currentPath, destination);
                    conversionStep.addOperation(
                        new ConversionOperation(
                            commons_constants.ACTION_ADDED,
                            destination,
                            `Copied content from ${currentPath} to ${destination}`
                        )
                    );
                    logger.info(
                        `RestructureContent: Copied ${currentPath} to ${destination}.`
                    );
                }
            } else {
                // if entry is a file
                // if file doesn't already exist in the destination, copy it
                if (!fs.existsSync(destination)) {
                    // if parent directories dont exist, first create them
                    if (!fs.existsSync(target)) {
                        fs.mkdirSync(target);
                    }
                    // then copy the file
                    fs.copyFileSync(currentPath, destination);
                    conversionStep.addOperation(
                        new ConversionOperation(
                            commons_constants.ACTION_ADDED,
                            destination,
                            `Copied content from ${currentPath} to ${destination}`
                        )
                    );
                    logger.info(
                        `RestructureContent: Copied ${currentPath} to ${destination}.`
                    );
                } else {
                    // else log a conflict msg, to be handled manually
                    logger.warn(
                        `RestructureContent: Conflict while trying to copy ${currentPath} to ${destination}. Structure already exists, need manual intervention.`
                    );
                    conversionStep.addOperation(
                        new ConversionOperation(
                            commons_constants.WARNING,
                            destination,
                            ` Conflict while trying to copy ${currentPath}. Structure already exists at target location, need manual intervention. `
                        )
                    );
                }
            }
        });
    }
}

module.exports = RestructureContent;
