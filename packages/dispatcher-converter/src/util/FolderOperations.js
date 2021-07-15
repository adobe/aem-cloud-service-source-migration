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
    logger,
    constants: commons_constants,
    ConversionOperation,
    util,
} = require("@adobe/aem-cs-source-migration-commons");
const path = require("path");
const fs = require("fs");

class FolderOperationsUtility {
    constructor() {}

    // A utility class that provides various static methods pertaining for manipulation of dispatcher files
    /**
     *
     * @param dirPath The directory to be deleted
     * @param conversionStep The conversion step to which the performed actions are to be added.
     * @returns {boolean}
     *
     * Delete specified folder.
     */
    deleteFolder(dirPath, conversionStep) {
        // if is directory
        if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            try {
                util.deleteFolderRecursive(dirPath);
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_DELETED,
                        dirPath,
                        "Deleted folder " + dirPath
                    )
                );
                logger.info(
                    "FolderOperationsUtility: Deleted folder " + dirPath
                );
            } catch (err) {
                logger.error(
                    "FolderOperationsUtility: error while deleting file, " +
                        err.filename +
                        "-" +
                        err.stderr
                );
            }
            return true;
        }
    }

    /**
     *
     * @param src_path The directory to be renamed
     * @param dest_path The directory where file is to be renamed
     * @param conversionStep The conversion step to which the performed actions are to be added.
     * @returns {boolean}
     *
     * Rename specified folder.
     */
    renameFolder(src_path, dest_path, conversionStep) {
        // if path exists
        if (fs.existsSync(src_path) && fs.lstatSync(src_path).isDirectory()) {
            try {
                fs.renameSync(src_path, dest_path);
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_RENAMED,
                        path.dirname(src_path),
                        "Renamed folder " +
                            path.basename(src_path) +
                            " to " +
                            path.basename(dest_path)
                    )
                );
                logger.info(
                    "FolderOperationsUtility: Renamed folder " +
                        src_path +
                        "to" +
                        dest_path
                );
            } catch (err) {
                logger.error(
                    "FolderOperationsUtility:  " +
                        err.filename +
                        "-" +
                        err.stderr
                );
            }
            return true;
        }
    }
}

module.exports = FolderOperationsUtility;
