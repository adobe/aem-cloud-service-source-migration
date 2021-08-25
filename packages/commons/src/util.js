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
const fsExtra = require("fs-extra");
const glob = require("glob");
const logger = require("./logger");
const path = require("path");

var Util = {
    /**
     *
     * @param String flag command line argument which need to be read
     * @return {String} flag value
     *
     *  Grab values from command line input
     */
    grab: (flag) => {
        let indexAfterFlag = process.argv.indexOf(flag) + 1;
        return process.argv[indexAfterFlag];
    },

    /**
     *
     * @param String path The path/location where content need to be deleted
     *
     * Recursively delete a folder and its content
     */
    deleteFolderRecursive: (path) => {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file) {
                var curPath = path + "/" + file;
                // if entry is a directory, recursively delete it's content
                if (fs.lstatSync(curPath).isDirectory()) {
                    Util.deleteFolderRecursive(curPath);
                } else {
                    // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    },

    /**
     *
     * @param String filePath path of file whose content need to be read
     * @return {Array.<String>} content of an XML file as a array of strings
     *
     * Async function to get the content of an XML file as a array of strings (lines)
     */
    getXMLContent: async (filePath) => {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        // read contents of the file and split them by newline
        var data = await fs.promises.readFile(filePath, "utf8");
        return data.split(/\r?\n/);
    },

    /**
     *
     * @param String filePath path of file whose content need to be read
     * @return {Array.<String>} content of an XML file as a array of strings
     *
     * Sync function to get the content of an XML file as a array of strings (lines)
     */
    getXMLContentSync: (filePath) => {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        // read contents of the file and split them by newline
        return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    },

    /**
     *
     * @param String filePath path of file where data need to be written
     * @param String[] data content to be written of provided file
     *
     * Async function to write data (a string array) to a file
     */
    writeDataToFileAsync: (filePath, data) => {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            data.forEach((line) => {
                file.write(line.toString() + "\r\n");
            });
            file.end();
            file.on("finish", () => resolve(true));
            file.on("error", reject);
        });
    },

    /**
     *
     * @param String filePath path of file where data need to be written
     * @param String[] data content to be written of provided file
     * @param String errorMsg error msg to log in case of failure/error
     *
     * Sync function to write data (a string array) to a file
     */
    writeDataToFileSync: (filePath, data, errorMsg) => {
        var file = fs.createWriteStream(filePath);
        file.on("error", function () {
            logger.error(errorMsg);
        });
        data.forEach((line) => {
            file.write(line.toString() + "\r\n");
        });
        file.end();
    },

    /**
     *
     * @param String sourcePath path from where file need to be copied
     * @param String destinationPath path where file to be copied
     * @param String errorMsg error msg to log in case of failure/error
     * @param {Array.<String>} name of folders to ignore
     *
     * Sync function to write data (a string array) to a file
     */
    copyFolderSync: (sourcePath, destinationPath, ignoreFolders = []) => {
        // NOTE : In copySync method of fs-extra module, if src is a directory it will copy
        // everything inside of this directory, not the entire directory itself!!
        // Hence create the required folder structure in the destination
        fs.mkdirSync(destinationPath, { recursive: true });
        fsExtra.copySync(sourcePath, destinationPath, {
            filter: (folder) => {
                return ignoreFolders.indexOf(path.basename(folder)) > -1
                    ? false
                    : true;
            },
        });
    },

    /**
     *
     * @param String fileName name of the file to create if it doesn't exist
     * @param String parentPath path where file needs to be created
     * Sync function to create a file with empty content
     */
    ensureFileExistsSync: (fileName, parentPath) => {
        if (!fs.existsSync(path.join(parentPath, fileName))) {
            fs.mkdirSync(parentPath, { recursive: true });
            fs.writeFileSync(path.join(parentPath, fileName), "");
        }
    },

    /**
     *
     * @param String directoryPath path which need to be scanned
     * @param String fileExtension file extension which need to be search
     * @return {Array.<String>} list of all files
     *
     * Get all files with given extension under given directory
     */
    globGetFilesByExtension(directoryPath, fileExtension) {
        let globPattern = path.join(directoryPath + "/**/*" + fileExtension);
        return glob.sync(globPattern);
    },

    /**
     *
     * @param String directoryPath path which need to be scanned
     * @param String fileName file name which need to be search
     * @return {Array.<String>} list of all files
     *
     * Get all files with given fileName under given directory
     */
    globGetFilesByName(directoryPath, fileName) {
        let globPattern = path.join(directoryPath + "/**/" + fileName);
        return glob.sync(globPattern);
    },
};

module.exports = Util;
