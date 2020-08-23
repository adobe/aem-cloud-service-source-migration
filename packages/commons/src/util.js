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

var Util = {
    // Function to grab values from command line input
    grab: (flag) => {
        let indexAfterFlag = process.argv.indexOf(flag) + 1;
        return process.argv[indexAfterFlag];
    },

    // Function to recursively delete a folder and its content
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

    // Function to get the content of an XML file as a array of strings (lines)
    getXMLContent: (file) => {
        if (!fs.existsSync(file)) {
            return [];
        }
        // read contents of the file and split them by newline
        return fs.readFileSync(file.toString(), "UTF-8").split(/\r?\n/);
    },

    // Function to data (a string array) to a file
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

    copyFolderSync: (sourcePath, destinationPath) => {
        // NOTE : In copySync method of fs-extra module, if src is a directory it will copy
        // everything inside of this directory, not the entire directory itself!!
        // Hence create the required folder structure in the destination
        fs.mkdirSync(destinationPath, { recursive: true });
        fsExtra.copySync(sourcePath, destinationPath);
    },

    globGetFilesByExtension(directoryPath, fileExtension) {
        let globPattern = directoryPath + "/**/*" + fileExtension;
        return glob.sync(globPattern);
    },

    globGetFilesByName(directoryPath, fileName) {
        let globPattern = directoryPath + "/**/" + fileName;
        return glob.sync(globPattern);
    },
};

module.exports = Util;
