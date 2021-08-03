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

const Constants = require("./constants");
const {
    util,
    logger,
    constants: commons_constants,
    ConversionOperation,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const os = require("os");

/**
 * @class FileOperations
 */
class FileOperations {
    constructor(config) {
        this.config = config;
    }
    /**
     * Get all the file names from the provided list of files.
     *
     * @param {array} files A string array of file paths whose names will be returned
     * @returns {array} Returns an array of file names
     */
    getAllFileNames(files) {
        let result = [];
        for (const file of files) {
            result.push(path.basename(file));
        }
        return result;
    }

    /**
     * Delete files matching the passed globPattern
     * @param globPattern
     * @param conversionStep
     */
    doGlobDelete(globPattern, conversionStep = null) {
        // if you dont pass in a globPattern - error
        if (!globPattern) {
            logger.error(
                "FileOperationsUtility: Glob Pattern missing from method call"
            );
            throw new TypeError("globPattern missing from method call");
        }

        let files = glob.sync(globPattern) || [];
        files.forEach((fileToDelete) => {
            let conversionOperation = new ConversionOperation(
                commons_constants.ACTION_DELETED,
                path.dirname(fileToDelete),
                "Deleted file " + fileToDelete
            );
            if (conversionStep) {
                conversionStep.addOperation(conversionOperation);
                this.deleteFile(fileToDelete, conversionStep);
                logger.info(
                    "FileOperationsUtility: Deleted file ",
                    fileToDelete
                );
            } else {
                this.deleteFile(fileToDelete);
                logger.info(
                    "FileOperationsUtility: Deleted file ",
                    fileToDelete
                );
            }
        });
    }

    /**
     * Utility Function to return files recursively based on a directory path and file extension.
     *
     * @param directoryPath
     * @param fileExtension
     * @returns {array} files An Array of files
     */
    globGetFilesByExtension(directoryPath, fileExtension) {
        let globPattern = directoryPath + "/**/*" + fileExtension;
        return glob.sync(globPattern);
    }

    /**
     * Utility Function to return files based on any pattern given
     *
     * @param {string} pattern The glob pattern used to search
     * @returns {array} files An Array of files
     */
    globGetFilesByPattern(pattern) {
        return glob.sync(pattern);
    }

    /**
     * Deletes the file provided.
     *
     * @param {string} filePath The path of the file to delete
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    deleteFile(filePath = "", conversionStep = null) {
        try {
            fs.unlinkSync(filePath);
            logger.info("FileOperationsUtility: Deleted file " + filePath);
            let conversionOperation = new ConversionOperation(
                commons_constants.ACTION_DELETED,
                path.dirname(filePath),
                "Deleted file " + filePath
            );
            conversionStep.addOperation(conversionOperation);
        } catch (err) {
            logger.error(
                "FileOperationsUtility:" + err.filename + " to " + err.stderr
            );
        }
    }

    /**
     * Deletes all files with given extension in a specific directory.
     * Does not check sub-directories.
     *
     * Sample Usage: `FileOperations.deleteFilesWithExtension("./target/js", ".min.js")`
     *
     * @param {string} directoryPath The path to the directory where the deletion is to be performed
     * @param {string} extension The file extension which is to be matched for deletion
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    deleteFilesWithExtension(directoryPath, extension, conversionStep) {
        if (fs.existsSync(directoryPath)) {
            let globPattern = directoryPath + "/**/*" + extension;
            this.doGlobDelete(globPattern, conversionStep);
        }
    }

    /**
     * Deletes all files with given extension in a specific directory.
     * Does not check sub-directories.
     *
     * @param {string} directoryPath The path to the directory where the deletion is to be performed
     * @param {string} fileSubString The file extension which is to be matched for deletion
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    deleteAllFilesContainingSubstring(
        directoryPath,
        fileSubString,
        conversionStep
    ) {
        if (fs.existsSync(directoryPath)) {
            let globPattern = directoryPath + "/*" + fileSubString + "*";
            this.doGlobDelete(globPattern, conversionStep);
        }
    }

    /**
     * Delete all files in a given directory (recursively) on conforming to the given pattern (eg. '*.vars').
     * Returns the files remaining.
     * @param {string} directoryPath
     * @param {string} filePattern
     * @returns {array} a list containing the names of the files in the directory.
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    deleteAllFilesNotConformingToPattern(
        directoryPath,
        filePattern,
        conversionStep
    ) {
        if (fs.existsSync(directoryPath)) {
            // Glob pattern to return all files that dont match the pattern
            let globPatternNot = "!" + directoryPath + "/**/" + filePattern;
            let globPattern = directoryPath + "/**/" + filePattern;

            this.doGlobDelete(globPatternNot, conversionStep);

            return glob.sync(globPattern) || [];
        } else {
            return [];
        }
    }

    /**
     * Renames file by copying it from source path and copying the content at the destination path
     * @param srcPath
     * @param destPath
     */
    renameFile(srcPath, destPath) {
        fs.rename(srcPath, destPath, (err) => {
            if (err) throw err;
            fs.stat(destPath, (err) => {
                if (err) throw err;
                logger.info(
                    "FileOperationsUtility: Renaming file " +
                        srcPath +
                        " to " +
                        destPath
                );
            });
        });
    }

    /**
     *
     * @param {string} filePath  The path to file whose content is to be retrieved
     * @param recursive
     * @returns {string} Content of the file
     */
    getContentFromFile(filePath, recursive = false) {
        logger.info(
            "FileOperationsUtility: Getting file from path : " + filePath
        );
        let result = "";
        let readableFilePath = "";
        let finalResult = "";

        if (filePath.indexOf("*") > -1) {
            let files = glob.sync(this.getReadablePath(filePath)) || [];
            files.forEach((file) => {
                if (file.indexOf("author") === -1) {
                    result += fs.readFileSync(file).toString();
                    let resultArray = result.split(os.EOL);
                    resultArray.forEach((line, index) => {
                        if (recursive) {
                            if (
                                line
                                    .trim()
                                    .startsWith(
                                        Constants.INCLUDE_SYNTAX_IN_FARM
                                    )
                            ) {
                                let replaceContents = "";
                                replaceContents = this.getContentFromFile(
                                    line
                                        .split(
                                            Constants.INCLUDE_SYNTAX_IN_FARM
                                        )[1]
                                        .trim(),
                                    true
                                );

                                result += replaceContents;

                                let prependFileName =
                                    Constants.COMMENT_ANNOTATION +
                                    " " +
                                    line.trim() +
                                    os.EOL;
                                resultArray[index] =
                                    prependFileName +
                                    (line.startsWith("\t")
                                        ? "\t" + replaceContents
                                        : replaceContents);
                            } else if (
                                line
                                    .trim()
                                    .startsWith(
                                        Constants.INCLUDE_SYNTAX_IN_VHOST
                                    )
                            ) {
                                let replaceContents = "";
                                if (line.trim().indexOf("*") === -1) {
                                    if (
                                        fs.existsSync(
                                            this.getReadablePath(line)
                                        )
                                    ) {
                                        replaceContents =
                                            this.getContentFromFile(
                                                this.getReadablePath(line),
                                                true
                                            );
                                    }
                                } else {
                                    replaceContents =
                                        line.substring(
                                            0,
                                            line.length - line.trim().length
                                        ) +
                                        this.getContentFromFile(
                                            this.getReadablePath(line),
                                            true
                                        );
                                }

                                let prependFileName =
                                    Constants.COMMENT_ANNOTATION +
                                    " " +
                                    line.trim() +
                                    os.EOL;
                                resultArray[index] =
                                    prependFileName +
                                    (line.startsWith("\t")
                                        ? "\t" + replaceContents
                                        : replaceContents);
                            }
                        }
                    });
                    finalResult += resultArray.join(os.EOL);
                }
            });
        } else {
            if (filePath != "") {
                readableFilePath = this.getReadablePath(filePath);
                if (fs.existsSync(readableFilePath)) {
                    result = fs.readFileSync(readableFilePath).toString();
                } else {
                    logger.error(
                        "FileOperationsUtility: File path not found " +
                            readableFilePath
                    );
                }
            }
        }
        if (fs.existsSync(readableFilePath)) {
            let resultArray = result.split(os.EOL);
            resultArray.forEach((line, index) => {
                if (recursive) {
                    if (
                        line.trim().startsWith(Constants.INCLUDE_SYNTAX_IN_FARM)
                    ) {
                        let prependFileName =
                            Constants.COMMENT_ANNOTATION +
                            " " +
                            line.trim() +
                            os.EOL;
                        resultArray[index] =
                            prependFileName +
                            (line.trim().startsWith("/t")
                                ? "/t" +
                                  this.getContentFromFile(
                                      this.getReadablePath(
                                          line
                                              .split(
                                                  Constants.INCLUDE_SYNTAX_IN_FARM
                                              )[1]
                                              .trim()
                                      ),
                                      true
                                  )
                                : this.getContentFromFile(
                                      this.getReadablePath(
                                          line
                                              .split(
                                                  Constants.INCLUDE_SYNTAX_IN_FARM
                                              )[1]
                                              .trim()
                                      ),
                                      true
                                  ));
                    } else if (
                        line
                            .trim()
                            .startsWith(Constants.INCLUDE_SYNTAX_IN_VHOST)
                    ) {
                        let replaceContents = "";

                        if (line.trim().indexOf("*") === -1) {
                            if (fs.existsSync(this.getReadablePath(line))) {
                                replaceContents = this.getContentFromFile(
                                    this.getReadablePath(line),
                                    true
                                );
                            }
                        } else {
                            replaceContents = this.getContentFromFile(
                                this.getReadablePath(line),
                                true
                            );
                        }
                        let prependFileName =
                            Constants.COMMENT_ANNOTATION +
                            " " +
                            line.trim() +
                            os.EOL;
                        resultArray[index] =
                            prependFileName +
                            (line.startsWith("\t")
                                ? "\t" + replaceContents
                                : replaceContents);
                    }
                }
            });
            finalResult = resultArray.join(os.EOL);
        }
        return finalResult;
    }

    /**
     * Returns path by taking file name from path and concatenating pathToPrepend to it.
     * @param line
     * @param pathToPrepend
     * @returns {string}
     */
    getReadablePath(line) {
        logger.info(
            "FileOperationsUtility: Getting readable path for : " + line
        );
        if (!fs.existsSync(line)) {
            let stringAfterInclude = "";
            let isConfString = "";

            line = line.toString().replace(/^"(.*)"$/, "$1");

            if (line.includes(Constants.INCLUDE_SYNTAX_IN_VHOST)) {
                stringAfterInclude = line
                    .split(Constants.INCLUDE_SYNTAX_IN_VHOST)[1]
                    .trim();
            } else if (line.includes(Constants.INCLUDE_SYNTAX_IN_FARM)) {
                stringAfterInclude = line
                    .split(Constants.INCLUDE_SYNTAX_IN_FARM)[1]
                    .trim();
            } else {
                stringAfterInclude = line;
            }

            isConfString = stringAfterInclude.split("/");

            if (isConfString.length > 0) {
                // fetch the last element of non-empty array
                isConfString = isConfString[isConfString.length - 1].trim();
            }
            // replacing special characters from file name
            isConfString = isConfString.toString().replace(/^(.*)$/g, "$1");

            line = this.getPathForDir(isConfString.replace(/"/g, ""));
        }
        return line.toString();
    }

    /**
     * Appends path in configuration file to get the actual path of the file
     * @param isConfString
     * @param dirName
     * @returns {string}
     */
    getPathForDir(isConfString) {
        let fileDirPath = "";
        logger.info(
            "FileOperationsUtility: Getting Path for File " + isConfString
        );
        if (this.config.pathToPrepend) {
            let pathToPrepend = this.config.pathToPrepend;
            pathToPrepend.forEach((file) => {
                let filePath = path.join(file, isConfString);
                let files = glob.sync(filePath) || [];

                if (isConfString.includes("*") && files.length > 0) {
                    fileDirPath = filePath;
                } else if (
                    fs.existsSync(filePath) &&
                    fs.lstatSync(filePath).isFile()
                ) {
                    fileDirPath = filePath;
                }
            });
        }
        if (fileDirPath == "" && this.config.cfg != null) {
            fileDirPath = this.globGetFilesByExtension(
                this.config.cfg,
                isConfString
            );
        }

        if (fileDirPath == "" && this.config.cfg != null) {
            fileDirPath = util.globGetFilesByName(
                Constants.TARGET_DISPATCHER_SRC_FOLDER,
                isConfString
            );
        }

        return fileDirPath;
    }

    /**
     *
     * @param {string} directoryPath The path to the vhost directory
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeVirtualHostSectionsNotPort80(directoryPath, conversionStep) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            let globPattern = directoryPath + "/*.vhost";
            let files = glob.sync(globPattern);

            for (const file of files) {
                let vHostFlag = false;

                let returnContent = "";
                let fileContentsArray = this.getFileContentsArray(file);

                fileContentsArray.forEach((line) => {
                    if (
                        line
                            .trim()
                            .startsWith(Constants.VIRTUAL_HOST_SECTION_START) &&
                        !line
                            .trim()
                            .endsWith(
                                Constants.VIRTUAL_HOST_SECTION_START_PORT_80
                            ) &&
                        !this.isPortExists(line)
                    ) {
                        vHostFlag = true;
                        logger.debug(
                            "FileOperationsUtility: Found virtual host section (not port 80 and configured ports) found in " +
                                file
                        );
                    }
                    if (
                        line
                            .trim()
                            .startsWith(Constants.VIRTUAL_HOST_SECTION_START) &&
                        this.isPortExists(line)
                    ) {
                        let index = line.indexOf(":");
                        line = line.substring(0, index + 1) + "80>";
                    }

                    if (!vHostFlag) {
                        returnContent += line;
                        returnContent += os.EOL;
                    }

                    if (
                        line.trim() === Constants.VIRTUAL_HOST_SECTION_END &&
                        vHostFlag
                    ) {
                        vHostFlag = false;
                        logger.info(
                            "FileOperationsUtility: Removed virtual host section (not port 80 and configured ports) found in " +
                                file
                        );
                        let conversionOperation = new ConversionOperation(
                            commons_constants.ACTION_REMOVED,
                            file,
                            "Removed virtual host section (not port 80 and configured ports)"
                        );
                        conversionStep.addOperation(conversionOperation);
                    }
                });

                if (
                    returnContent.trim() !== Constants.VIRTUAL_HOST_SECTION_END
                ) {
                    fs.writeFileSync(file, returnContent);
                } else {
                    fs.unlinkSync(file);
                }
            }
        }
    }

    isPortExists(line) {
        let isPresent = false;
        if (this.config.portsToMap) {
            let portsToMap = this.config.portsToMap;
            portsToMap.forEach((port) => {
                if (line.toString().includes(port)) {
                    isPresent = true;
                }
            });
        }
        return isPresent;
    }

    /**
     * Remove or replace inclusion of some file. If replacement file is not specified, the include statement is removed.
     *
     * @param filePath
     * @param includeStatementSyntax
     * @param oldRuleName
     * @param newRuleName
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeOrReplaceFileInclude(
        filePath,
        includeStatementSyntax,
        oldRuleName,
        newRuleName = null,
        conversionStep,
        replaceRule = null
    ) {
        if (fs.existsSync(filePath)) {
            let returnContent = "";
            let fileContentsArray = this.getFileContentsArray(filePath);

            fileContentsArray.forEach((line) => {
                if (
                    line.trim().startsWith(includeStatementSyntax) &&
                    line.trim().indexOf(oldRuleName) > -1
                ) {
                    logger.debug(
                        "FileOperationsUtility: Found include statement '" +
                            line.trim() +
                            "' in file" +
                            filePath +
                            "."
                    );
                    // in the include statements, replace the old rule file with the new one
                    if (newRuleName) {
                        if (replaceRule != null) {
                            line =
                                line.substring(
                                    0,
                                    line.length - line.trim().length - 1
                                ) +
                                includeStatementSyntax +
                                " " +
                                newRuleName +
                                os.EOL;
                        } else {
                            line = line.replace(oldRuleName, newRuleName);
                        }

                        returnContent += line;
                        returnContent += os.EOL;
                        logger.info(
                            "FileOperationsUtility: Replacing include statement '%s' with '%s' in %s",
                            line,
                            line.trim(),
                            filePath
                        );
                        let conversionOperation = new ConversionOperation(
                            commons_constants.ACTION_REPLACED,
                            filePath,
                            "Replacing include statement " +
                                oldRuleName +
                                " with " +
                                newRuleName
                        );
                        conversionStep.addOperation(conversionOperation);
                    } else {
                        logger.info(
                            "FileOperationsUtility: Removing include statement" +
                                line.trim() +
                                " from " +
                                filePath
                        );
                        let conversionOperation = new ConversionOperation(
                            commons_constants.ACTION_REMOVED,
                            filePath,
                            "Removing include statement " + oldRuleName
                        );
                        conversionStep.addOperation(conversionOperation);
                    }
                } else {
                    returnContent += line;
                    returnContent += os.EOL;
                }
            });
            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     * Remove inclusion of some file from all files os given file-extension in specified directory and sub-directories.
     *
     * @param {string} directoryPath The path to directory whose files are to be processed
     * @param {string} includeStatementSyntax The syntax of the include statement to be looked for
     * @param {string} fileExtension The extension of the type that needs to be processed
     * @param {string} ruleFileNameToRemove The rule file name (in include statement) that is to be removed
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeIncludeStatementForSomeRule(
        directoryPath,
        includeStatementSyntax,
        fileExtension,
        ruleFileNameToRemove,
        conversionStep,
        newRule
    ) {
        if (fs.existsSync(directoryPath)) {
            let globPattern = directoryPath + "/**/*." + fileExtension;

            let files = glob.sync(globPattern) || [];

            files.forEach((file) => {
                this.removeOrReplaceFileInclude(
                    file,
                    includeStatementSyntax,
                    ruleFileNameToRemove,
                    newRule,
                    conversionStep
                );
            });
        }
    }

    /**
     * Replace inclusion of some file (with new file to be included) from all files os given file-extension in specified directory and sub-directories.
     *
     * @param directoryPath The path to directory whose files are to be processed
     * @param fileExtension The extension of the type that needs to be processed
     * @param includeStatementSyntax The syntax of the include statement to be looked for
     * @param ruleFileToReplace The rule file name (in include statement) that is to be replaced
     * @param ruleFileToReplaceWith The rule file name (in include statement) that is to be replaced with
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    replaceIncludeStatementWithNewRule(
        directoryPath,
        fileExtension,
        includeStatementSyntax,
        ruleFileToReplace,
        ruleFileToReplaceWith,
        conversionStep
    ) {
        if (fs.existsSync(directoryPath)) {
            let globPattern = directoryPath + "/**/*" + "." + fileExtension;

            let files = glob.sync(globPattern) || [];
            files.forEach((file) => {
                this.removeOrReplaceFileInclude(
                    file,
                    includeStatementSyntax,
                    ruleFileToReplace,
                    ruleFileToReplaceWith,
                    conversionStep,
                    true
                );
            });
        }
    }

    /**
     * Remove-replace include statements of certain pattern within specified sections of a file.
     *
     * @param {string} filePath
     * @param {string} sectionHeader
     * @param {string} includePatternToReplace
     * @param {string} includePatternToReplaceWith
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeOrReplaceIncludePatternInSection(
        filePath,
        sectionHeader,
        includePatternToReplace,
        includePatternToReplaceWith,
        conversionStep
    ) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            let sectionFlag = false;
            let replacedFlag = false;
            let sectionIndentation = 0;

            let fileContentsArray = this.getFileContentsArray(filePath);
            let returnContent = "";

            // iterate over the contents of the file and check for variables to replace
            fileContentsArray.forEach((line) => {
                let trimmedLine = line.trim();
                // remove any contents in the given section
                // and replace with given include statements as applicable
                if (trimmedLine.startsWith(sectionHeader)) {
                    sectionIndentation = line.length - trimmedLine.length;
                    sectionFlag = true;
                    returnContent += line;
                    returnContent += os.EOL;
                } else if (sectionFlag) {
                    // if section is found, replace the include statements within of the section
                    if (trimmedLine.startsWith(includePatternToReplace)) {
                        // say we want to replace any clientheader include statements that looks as follows:
                        // $include "/etc/httpd/conf.dispatcher.d/clientheaders/ams_publish_clientheaders.any"
                        // $include "/etc/httpd/conf.dispatcher.d/clientheaders/ams_common_clientheaders.any"
                        // with the statement:
                        // $include "../clientheaders/default_clientheaders.any"
                        // we only need to replace the include statement once.
                        if (replacedFlag) {
                            logger.info(
                                "FileOperationsUtility: Removed include statement '%s' in %s section of file %s.",
                                trimmedLine,
                                sectionHeader,
                                filePath
                            );
                        } else {
                            replacedFlag = true;
                            returnContent +=
                                line.substring(
                                    0,
                                    line.length - trimmedLine.length - 1
                                ) +
                                includePatternToReplaceWith +
                                os.EOL;
                            logger.info(
                                "FileOperationsUtility: Replaced include statement " +
                                    trimmedLine +
                                    " of " +
                                    sectionHeader +
                                    " section with include statement in file " +
                                    filePath
                            );
                            let conversion_operation = new ConversionOperation(
                                commons_constants.ACTION_REPLACED,
                                filePath,
                                "Replaced include statement '" +
                                    trimmedLine +
                                    "' in section '" +
                                    sectionHeader +
                                    "' with '" +
                                    includePatternToReplaceWith +
                                    "'"
                            );
                            conversionStep.addOperation(conversion_operation);
                        }
                    } else if (
                        trimmedLine === Constants.CLOSE_CURLY_BRACE &&
                        line.length - trimmedLine.length === sectionIndentation
                    ) {
                        sectionFlag = false;
                        returnContent += line + os.EOL;
                    } else {
                        returnContent += line + os.EOL;
                    }
                } else {
                    returnContent += line + os.EOL;
                }
            });
            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     *
     * @param directoryPath
     * @param fileExtension
     * @param sectionHeader
     * @param patternToReplace
     * @param fileToReplaceWith
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    replaceIncludePatternInSection(
        directoryPath,
        fileExtension,
        sectionHeader,
        patternToReplace,
        fileToReplaceWith,
        conversionStep
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get all files under given directory and sub-directories with given file extension
            let files = this.globGetFilesByExtension(
                directoryPath,
                fileExtension
            );
            files.forEach((file) => {
                this.removeOrReplaceIncludePatternInSection(
                    file,
                    sectionHeader,
                    patternToReplace,
                    fileToReplaceWith,
                    conversionStep
                );
            });
        }
    }

    /**
     *  Replace file include statements with the content of the included file itself.
     *
     * @param {string} filePath
     * @param {string} includeStatementSyntax
     * @param {string} ruleFileToReplace
     * @param {string} ruleFileContent
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    replaceFileIncludeWithFileContent(
        filePath,
        includeStatementSyntax,
        ruleFileToReplace,
        ruleFileContent,
        conversionStep
    ) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            // fetch array of content in a file
            let fileContentsArray = this.getFileContentsArray(filePath);
            let returnContent = "";

            logger.info(
                "FileOperationsUtility: Replacing File Include with File Content for file :" +
                    filePath +
                    "Rules File : " +
                    ruleFileToReplace
            );
            // iterate over the contents of the file and check for variables to replace
            fileContentsArray.forEach((line) => {
                let trimmedLine = line.trim();
                if (
                    trimmedLine.startsWith(includeStatementSyntax) &&
                    trimmedLine.endsWith(ruleFileToReplace)
                ) {
                    logger.debug(
                        "FileOperationsUtility: Found include statement '%s' in file %s.",
                        trimmedLine,
                        filePath
                    );
                    // get the indentation of the include statement
                    let indentation = line.length - trimmedLine.length;
                    // replace the include statement with the rule file's content
                    if (ruleFileContent) {
                        let ruleFileContentArray = ruleFileContent.split(
                            os.EOL
                        );
                        ruleFileContentArray.forEach(
                            (ruleFileContentArrayLine) => {
                                // adjust the line to match the include statement's indentation
                                returnContent +=
                                    line.substring(0, indentation) +
                                    ruleFileContentArrayLine +
                                    os.EOL;
                                logger.info(
                                    "FileOperationsUtility: Replaced include statement " +
                                        trimmedLine +
                                        " in  file " +
                                        filePath
                                );
                                let conversion_operation =
                                    new ConversionOperation(
                                        commons_constants.ACTION_REPLACED,
                                        filePath,
                                        "Replaced include statement '" +
                                            trimmedLine +
                                            " with content of file '" +
                                            ruleFileToReplace +
                                            "'"
                                    );
                                conversionStep.addOperation(
                                    conversion_operation
                                );
                            }
                        );
                    }
                    logger.info(
                        "FileOperationsUtility: Replaced include statement '%s' in file %s.",
                        trimmedLine,
                        filePath
                    );
                } else {
                    // write out other lines as is
                    returnContent += line + os.EOL;
                }
            });
            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     * Replace file include statements with the content of the included file itself, in all files of given file-type
     * in specified directory and sub-directories.
     *
     * @param {string} directoryPath The path to directory whose files are to be processed
     * @param {string} fileExtension The extension of the type that needs to be processed
     * @param {string} ruleFileToReplace include statement pattern that is to be replaced
     * @param {string} content The content of file with which the include statement is to be replaced
     * @param {string} includeStatementSyntax The syntax of the include statement to be replaced
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    replaceIncludeStatementWithContentOfRuleFile(
        directoryPath,
        fileExtension,
        ruleFileToReplace,
        content,
        includeStatementSyntax,
        conversionStep
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get all files under given directory and sub-directories with given file extension
            let files = this.globGetFilesByExtension(
                directoryPath,
                fileExtension
            );
            // lookup for include statements of the specified rule, and replace them with new rule
            files.forEach((file) => {
                this.replaceFileIncludeWithFileContent(
                    file,
                    includeStatementSyntax,
                    ruleFileToReplace,
                    content,
                    conversionStep
                );
            });
        }
    }

    /**
     * Replace usage of a variable with a new variable.
     * @param {string} filePath The file to replace the variables in
     * @param {string} variableToReplace The variable that will be replaced
     * @param {string} newVariable The new variable to put in place of replaced.
     */
    replaceVariableUsage(filePath, variableToReplace, newVariable) {
        // check if the file exists
        if (fs.existsSync(filePath)) {
            // get file content array
            let fileContentsArray = this.getFileContentsArray(filePath);
            let returnContent = "";

            // iterate over the contents of the file and check for variables to replace
            fileContentsArray.forEach((line) => {
                // if we find one to replace, replace it and write it to the file
                if (line.indexOf(variableToReplace) !== -1) {
                    returnContent += line.replace(
                        variableToReplace,
                        newVariable
                    );
                    logger.info(
                        "FileOperationsUtility: Replaced variable '" +
                            variableToReplace +
                            "' with variable '" +
                            newVariable +
                            "' in file " +
                            filePath +
                            "."
                    );
                }
                // if we dont find any variables to replace, just write the line as is.
                else {
                    returnContent += line;
                }
                // write a new line to maintain formatting.
                returnContent += os.EOL;
            });

            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     * Replaces name of old variables with the new variables.
     * @param directoryPath
     * @param fileExtension
     * @param variableToReplace
     * @param newVariable
     */
    replaceAllUsageOfOldVariableWithNewVariable(
        directoryPath,
        fileExtension,
        variableToReplace,
        newVariable
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get all files under given directory and sub-directories with given file extension
            let globPattern = directoryPath + "/**/*" + fileExtension;
            let files = glob.sync(globPattern);
            // lookup for include statements of the specified rule, and replace them with new rule
            for (const file of files) {
                this.replaceVariableUsage(file, variableToReplace, newVariable);
            }
        }
    }

    /**
     * creates a symlink from path to target.
     * @param targetPath
     * @param sourcePath
     * @param conversionStep
     */

    createSymLink(targetPath, sourcePath, conversionStep) {
        if (fs.existsSync(sourcePath)) {
            //delete before creating a symlink
            fs.unlinkSync(sourcePath);
        }
        if (!fs.existsSync(sourcePath)) {
            fs.symlinkSync(targetPath, sourcePath);
            logger.info(
                "Created Symbolic Link in target folder for file : " +
                    path.basename(targetPath)
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    sourcePath,
                    `Generated SymLink for the file ${path.basename(
                        targetPath
                    )}`
                )
            );
        }
    }

    /**
     * Remove usage of specified variable within a file.  If the variable is used in an if block - the entire
     * if statement is removed.
     *
     * @param {string} filePath The file to search for the variable in.
     * @param {string} variableToRemove The variable to remove.
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeVariableUsage(filePath, variableToRemove, conversionStep) {
        if (fs.existsSync(filePath)) {
            let fileContents = this.getContentFromFile(filePath);

            let fileContentsArray = fileContents.split(os.EOL);
            let stack = [];
            let skipFlag = false;

            let returnContent = "";

            fileContentsArray.forEach((line) => {
                // if variable to be removed is used in if-statement, remove the whole if-block
                // keeping track of if-block opening and closing (for nested if-blocks) in the FIFO record
                if (
                    line.trim().startsWith(Constants.IF_BLOCK_START) &&
                    line.indexOf(variableToRemove) > -1
                ) {
                    stack.push(Constants.IF_BLOCK_START);
                    skipFlag = true;
                    logger.debug(
                        "FileOperationsUtility: Found usage of variable '" +
                            variableToRemove +
                            "' in 'if' condition in file " +
                            filePath +
                            "."
                    );
                }
                // if variable to be removed is used in normal line of statement, remove the line
                else if (line.indexOf(variableToRemove) > -1) {
                    logger.info(
                        "FileOperationsUtility: Removed usage of variable '" +
                            variableToRemove +
                            "' in file " +
                            filePath +
                            "."
                    );
                    let conversion_operation = new ConversionOperation(
                        commons_constants.ACTION_REMOVED,
                        filePath,
                        "Removed variable '" + variableToRemove + "'"
                    );
                    conversionStep.addOperation(conversion_operation);
                }
                // if current line is under an if-block which used the variable to replace
                // remove the current line, take care of inner if blocks if present
                else if (skipFlag) {
                    // taking care of inner if-block
                    if (line.trim().startsWith(Constants.IF_BLOCK_START)) {
                        stack.push(Constants.IF_BLOCK_START);
                    }
                    // when we find the closing of the if-block, remove the reference from the stack and if there,
                    // are no more flip the switch to skipFlag back
                    else if (line.trim().endsWith(Constants.IF_BLOCK_END)) {
                        stack.pop();
                        if (stack.length === 0) {
                            skipFlag = false;
                            logger.debug(
                                "FileOperationsUtility: Removed usage of variable '" +
                                    variableToRemove +
                                    "' in 'if' condition in file " +
                                    filePath +
                                    "."
                            );
                            let conversion_operation = new ConversionOperation(
                                commons_constants.ACTION_REMOVED,
                                filePath,
                                "Removed 'if' condition which used " +
                                    "variable '" +
                                    variableToRemove +
                                    "'"
                            );
                            conversionStep.addOperation(conversion_operation);
                        }
                    }
                }
                // if it's just a normal statement, keep it.
                else {
                    returnContent += line;
                    returnContent += os.EOL;
                }
            });

            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     * Replace usage of specified variable in all files of given file-type in specified directory and sub-directories.
     *
     * @param {string} directoryPath The path to directory whose files are to be processed
     * @param {string} fileExtension The extension of the type that needs to be processed
     * @param {string} variableToRemove The variable that is to be removed
     * @param {object} conversionStep The conversion step to which the performed actions are to be added.
     */
    removeAllUsageOfOldVariable(
        directoryPath,
        fileExtension,
        variableToRemove,
        conversionStep
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get all files under given directory and sub-directories with given file extension
            let globPattern = directoryPath + "/**/*." + fileExtension;
            let files = glob.sync(globPattern);
            for (const file of files) {
                // lookup for usage of the variable to remove passed in and remove it in each file
                this.removeVariableUsage(
                    file,
                    variableToRemove,
                    conversionStep
                );
            }
        } else {
            // should we do this or throw an error? what's the else? nothing?
            logger.error(
                `FileOperationsUtility: Unable to find Directory: ${directoryPath}`
            );
        }
    }

    /**
     *
     * @param filePath
     * @param sectionHeader
     * @param includeStatementToReplaceWith
     * @param conversionStep
     */
    replaceParticularSectionContentWithIncludeStatement(
        filePath,
        sectionHeader,
        includeStatementToReplaceWith,
        conversionStep
    ) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            let sectionFlag = false;
            let contentIndentationFlag = false;
            let sectionArrays = [];
            //let sectionIndentation = 0;
            let contentIndentation = "";

            let lines = util.getXMLContentSync(filePath);
            let returnContent = "";

            lines.forEach((line, index) => {
                let trimmedLine = line.trim();
                // remove any contents in the given section and replace with given include statements as applicable
                if (trimmedLine.startsWith(sectionHeader)) {
                    //let sectionIndentation = line.length - trimmedLine.length;
                    sectionFlag = true;
                    returnContent += line + os.EOL;
                    if (!trimmedLine.endsWith("{")) {
                        let nextLine = lines[index + 1];
                        returnContent += nextLine + os.EOL;
                        //sectionIndentation = nextLine.length - nextLine.trim().length;
                    } else {
                        sectionArrays.push("1");
                    }
                } else if (sectionFlag) {
                    if (trimmedLine.includes("{")) {
                        sectionArrays.push("1");
                    }

                    if (trimmedLine.includes("}")) {
                        if (sectionArrays.length === 1) {
                            sectionFlag = false;
                            returnContent +=
                                contentIndentation +
                                includeStatementToReplaceWith +
                                os.EOL;
                            returnContent += line + os.EOL;
                            // TODO: These logs are misleading as they will be logged even when no subsitution is done - it should only be logged if something is actually replaced I feel.
                            logger.info(
                                "FileOperationsUtility: Replaced content of " +
                                    sectionHeader +
                                    " section with include statement " +
                                    includeStatementToReplaceWith +
                                    " in file " +
                                    filePath
                            );
                            let conversion_operation = new ConversionOperation(
                                commons_constants.ACTION_REPLACED,
                                filePath,
                                "Replaced content of section '" +
                                    sectionHeader +
                                    "' with include statement " +
                                    includeStatementToReplaceWith
                            );
                            conversionStep.addOperation(conversion_operation);
                        }
                        sectionArrays.pop();
                    } else if (!contentIndentationFlag) {
                        contentIndentation = line.substring(
                            0,
                            line.length - trimmedLine.length - 1
                        );
                        contentIndentationFlag = true;
                    }
                } else {
                    returnContent += line + os.EOL;
                }
            });
            fs.writeFileSync(filePath, returnContent);
        }
    }

    /**
     *
     * @param directoryPath
     * @param extension
     * @param sectionHeader
     * @param includeStatementToReplaceWith
     * @param conversionStep
     */
    replaceContentOfSection(
        directoryPath,
        extension,
        sectionHeader,
        includeStatementToReplaceWith,
        conversionStep
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get all farm files under given directory and sub-directories
            let globPattern = directoryPath + "/**/*" + extension;
            let files = glob.sync(globPattern) || [];
            // lookup and remove any contents in the given section and replace them with given include statement
            files.forEach((file) => {
                this.replaceParticularSectionContentWithIncludeStatement(
                    file,
                    sectionHeader,
                    includeStatementToReplaceWith,
                    conversionStep
                );
            });
        }
    }

    /**
     * Removes Non Whitelisted Directives in Vhost Files
     * @param directoryPath
     * @param whitelistedDirectivesSet
     * @param conversionStep
     */
    removeNonWhitelistedDirectivesInVhostFiles(
        directoryPath,
        whitelistedDirectivesSet,
        conversionStep
    ) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            // get files of the format dir_path/*.vhost
            let globPattern = directoryPath + "/*.vhost";
            let files = glob.sync(globPattern);
            // initialize a variable to keep track of non whitelisted directives being used
            let nonWhiteListedDirectiveUsage = [];
            for (const file of files) {
                let fileContentsArray = this.getFileContentsArray(file);

                let returnContent = "";
                let startOfSectionDerivativesList = [];
                let lineCount = 0;
                fileContentsArray.forEach((line) => {
                    lineCount += 1;
                    let trimmedLine = line.trim();
                    if (trimmedLine !== "") {
                        let filePathWithLine = file + ":" + lineCount;
                        // if section with non-whitelisted directive is found
                        if (startOfSectionDerivativesList.length > 0) {
                            // we need to comment all lines in the section
                            returnContent +=
                                Constants.COMMENT_ANNOTATION + line + os.EOL;
                            logger.info(
                                "FileOperationsUtility: Commenting non-whitelisted directive usage in %s.",
                                filePathWithLine
                            );
                            // check if start of section, pop last added directive from stack
                            if (trimmedLine.startsWith("</")) {
                                let directive = trimmedLine.replace("/", "");
                                // if non-whitelisted directive is found, add to log
                                if (
                                    !whitelistedDirectivesSet.includes(
                                        directive.toLowerCase()
                                    )
                                ) {
                                    nonWhiteListedDirectiveUsage.push(
                                        filePathWithLine + " " + directive
                                    );
                                    startOfSectionDerivativesList.pop();
                                }
                            } else if (trimmedLine.startsWith("<")) {
                                // check if start of section, push directive to stack
                                let directive = trimmedLine.split(" ")[0] + ">";
                                startOfSectionDerivativesList.push(directive);
                            }
                        } else if (
                            !trimmedLine.startsWith(
                                Constants.COMMENT_ANNOTATION
                            ) &&
                            !trimmedLine.startsWith("\\")
                        ) {
                            // if line is not empty or a comment, or is not a continuation of previous line
                            // check if end of section
                            let directive = "";
                            if (trimmedLine.startsWith("</")) {
                                directive = trimmedLine.replace("/", "");

                                if (
                                    !whitelistedDirectivesSet.includes(
                                        directive.toLowerCase()
                                    )
                                ) {
                                    nonWhiteListedDirectiveUsage.push(
                                        filePathWithLine + " " + directive
                                    );

                                    returnContent +=
                                        Constants.COMMENT_ANNOTATION +
                                        line +
                                        os.EOL;
                                    logger.info(
                                        "FileOperationsUtility: Commenting non-whitelisted directive usage in ",
                                        filePathWithLine
                                    );
                                }
                            } else if (trimmedLine.startsWith("<")) {
                                // check if start of section
                                directive = trimmedLine.split(" ")[0] + ">";
                                // if non-whitelisted directive is found, add to log and comment line

                                if (
                                    !whitelistedDirectivesSet.includes(
                                        directive.toLowerCase()
                                    )
                                ) {
                                    startOfSectionDerivativesList.push(
                                        directive
                                    );
                                    nonWhiteListedDirectiveUsage.push(
                                        filePathWithLine + " " + directive
                                    );

                                    returnContent +=
                                        Constants.COMMENT_ANNOTATION +
                                        line +
                                        os.EOL;
                                    logger.info(
                                        "FileOperationsUtility: Commenting non-whitelisted directive usage in ",
                                        filePathWithLine
                                    );
                                }
                            } else {
                                // if non-whitelisted directive is used, comment the line
                                // we need to to make sure both (\t & " ") are executed
                                directive = trimmedLine;
                                if (directive.indexOf("\t") > -1) {
                                    directive = directive.split("\t")[0];
                                }
                                if (directive.indexOf(" ") > -1) {
                                    directive = directive.split(" ")[0];
                                }
                            }
                            if (
                                !whitelistedDirectivesSet.includes(
                                    directive.toLowerCase()
                                )
                            ) {
                                nonWhiteListedDirectiveUsage.push(
                                    filePathWithLine + " " + directive
                                );
                                returnContent +=
                                    Constants.COMMENT_ANNOTATION +
                                    line +
                                    os.EOL;
                                logger.info(
                                    "FileOperationsUtility: Commenting non-whitelisted directive usage in %s.",
                                    filePathWithLine
                                );
                            } else {
                                returnContent += line + os.EOL;
                            }
                        } else {
                            returnContent += line + os.EOL;
                        }
                    }
                });

                fs.writeFileSync(file, returnContent);
            }
            if (nonWhiteListedDirectiveUsage.length > 0) {
                console.log(
                    "\nApache configuration uses non-whitelisted directives:"
                );
                logger.error(
                    "FileOperationsUtility: Apache configuration uses non-whitelisted directives:"
                );
                nonWhiteListedDirectiveUsage.forEach((usage) => {
                    console.log(usage);
                    logger.error("FileOperationsUtility: " + usage);
                    let conversionOperation = new ConversionOperation(
                        commons_constants.ACTION_REMOVED,
                        usage,
                        "Commented out usage of non-whitelisted directives"
                    );
                    conversionStep.addOperation(conversionOperation);
                });
                logger.info(
                    "FileOperationsUtility: Commented out all usages of non-whitelisted directives listed above."
                );
                console.info(
                    "FileOperationsUtility: Commented out all usages of non-whitelisted directives listed above."
                );
            }
        }
    }

    /**
     * Remove files in destination dir which are not present in source dir (comparision by name)
     *
     * @param {string} srcDir The source directory's path
     * @param {string} destDir The destination directory's path
     * @param {ConversionStep} conversionStep The Conversion Step Object used to Write the Report.
     */
    removeNonMatchingFilesByName(srcDir, destDir, conversionStep) {
        let availableDirFiles = [];

        let srcDirGlob = srcDir + "/**";
        let srcDirFiles = glob.sync(srcDirGlob) || [];
        srcDirFiles.forEach((file) => {
            if (fs.statSync(file).isFile()) {
                availableDirFiles.push(file);
            }
        });

        let destDirGlob = destDir + "/**";
        let files = glob.sync(destDirGlob) || [];
        for (const file of files) {
            let matchFlag = false;
            if (fs.lstatSync(file).isFile()) {
                for (const availableDirFile of availableDirFiles) {
                    if (
                        path.basename(availableDirFile) === path.basename(file)
                    ) {
                        matchFlag = true;
                        break;
                    }
                }
                if (!matchFlag) {
                    this.deleteFile(file, conversionStep);
                    logger.info(
                        "FileOperationsUtility: Removed Non Matching File :" +
                            file
                    );
                }
            }
        }
    }

    /**
     * Returns a list of the variables after consolidating the variables (duplicates not allowed)
     * from given files into a single new file.
     *
     * @param {array} files An array of all the files that will be parsed and combined.
     * @param {string} newFilePath The file that will be created to consolidate the variables.
     * @param {doAppend} flag to append to the existing file or write to the file.
     * @returns {array} An array of variable names that were added to the new file.
     */
    consolidateVariableFiles(files = [], newFilePath, doAppend) {
        // list of defined variables (only the variable)
        let variablesList = [];
        // list of variable definitions
        let variableDefinitionList = [];
        // iterate over each file given
        for (const file of files) {
            // get file content array
            let fileContentsArray = this.getFileContentsArray(file);
            // iterate over the lines
            fileContentsArray.forEach((line) => {
                // split the lines on spaces to find the variable itself
                let variableDefinition = line.split(" ");
                if (!line.trim().startsWith(Constants.COMMENT_ANNOTATION)) {
                    // if the variable doesnt already exist - add it to the array.
                    if (
                        variableDefinition.length > 1 &&
                        variableDefinition[0].trim().toLowerCase() !=
                            "define" &&
                        !variablesList.includes(variableDefinition[0])
                    ) {
                        // add the new variable to the new list
                        variablesList.push(variableDefinition[0]);
                        // add the variable and definition to the list to write to file.
                        variableDefinitionList.push(line);
                    } else if (
                        variableDefinition.length > 2 &&
                        variableDefinition[0].trim().toLowerCase() ==
                            "define" &&
                        !variableDefinitionList.includes(variableDefinition[1])
                    ) {
                        // add the new variable to the new list
                        variablesList.push(variableDefinition[1]);
                        // add the variable and definition to the list to write to file.
                        variableDefinitionList.push(line);
                    }
                }
            });
        }

        let returnContent = "";
        // write to the file given
        variableDefinitionList.forEach((variableDef) => {
            returnContent += variableDef;
            returnContent += os.EOL;
        });

        if (doAppend && fs.existsSync(newFilePath)) {
            fs.appendFileSync(newFilePath, returnContent);
        } else {
            fs.writeFileSync(newFilePath, returnContent);
        }
        return variablesList;
    }

    /**
     * Check vhost files for usage of undefined variables.
     * If found, print warning in terminal.
     *
     * @param {string} directoryPath
     * @param {array} definedVariablesList
     * @throws {TypeError} This will throw a error if the directory does not exist.
     */
    checkForUndefinedVariables(directoryPath, definedVariablesList = []) {
        let undefinedVariableList = [];
        if (fs.existsSync(directoryPath)) {
            let flag = true;
            let globPattern = directoryPath + "/**/*.vhost";

            let files = glob.sync(globPattern);
            for (const file of files) {
                let fileContentsArray = this.getFileContentsArray(file);
                fileContentsArray.forEach((line) => {
                    let strippedLine = line.trim();
                    if (
                        !strippedLine.startsWith(Constants.COMMENT_ANNOTATION)
                    ) {
                        let match = strippedLine.match(/\${([^:]*?)\}/g);
                        if (match && !definedVariablesList.includes(match[0])) {
                            if (flag) {
                                flag = false;
                                undefinedVariableList.push(match[0]);
                                console.log(
                                    "Found usage of undefined variable:"
                                );
                                console.log(file + ":" + match[0]);
                                logger.info(
                                    "FileOperationsUtility: Found usages of undefined variable in file :" +
                                        file +
                                        " : " +
                                        match[0]
                                );
                            }
                        }
                    }
                });
            }
        } else {
            throw new TypeError(
                "Invalid Directory Path Provided: " + directoryPath
            );
        }
        return undefinedVariableList;
    }

    /**
     * Replace Includes by reading directories and passing file to include the file content
     * @param dirPath
     * @param type
     * @param header
     * @param ruleFileToReplace
     * @param includePatternToReplaceWith
     * @param conversionStep
     */
    replaceIncludesInFarmAndVhostFile(
        dirPath,
        type,
        header,
        ruleFileToReplace,
        includePatternToReplaceWith,
        conversionStep
    ) {
        if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            //get all files under given directory and sub-directories with given file extension
            let files = this.getAllFilesInDirWithGivenExtension(
                dirPath,
                type,
                true
            );
            //lookup for include statements of the specified rule and replace them with new rule

            files.forEach((file) => {
                this.replaceFileIncludesInFarmFileAndVhostFile(
                    file,
                    type,
                    header,
                    ruleFileToReplace,
                    includePatternToReplaceWith,
                    conversionStep
                );
            });
        }
    }

    getAllFilesInDirWithGivenExtension(dirPath, fileExtension, recursive) {
        return glob.sync(
            path.join(dirPath, "/**/*." + fileExtension),
            recursive
        );
    }

    /**
     *
     * @param filePath
     * @param type
     * @param header
     * @param ruleFilesToReplace
     * @param includePatternToReplaceWith
     * @param conversionStep
     */
    replaceFileIncludesInFarmFileAndVhostFile(
        filePath,
        type,
        header,
        ruleFilesToReplace,
        includePatternToReplaceWith,
        conversionStep
    ) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            let flag = false;
            let alreadyReplaced = false;
            let ifIndentation = 0;

            let fileContents = this.getContentFromFile(filePath);

            let returnContent = "";

            let fileContentsArray = fileContents.split("\n");
            fileContentsArray.forEach((line) => {
                let strippedLine = line.trim();
                if (strippedLine.startsWith(header)) {
                    ifIndentation = line.length - strippedLine.length;
                    flag = true;
                    returnContent += line + os.EOL;
                } else if (flag) {
                    if (
                        strippedLine.startsWith(
                            Constants.INCLUDE_SYNTAX_IN_FARM
                        ) ||
                        strippedLine.startsWith(
                            Constants.INCLUDE_SYNTAX_IN_VHOST
                        )
                    ) {
                        let includedFileName = "";

                        if (type.toString().trim() === "vhost") {
                            includedFileName = path
                                .basename(strippedLine.split(" ")[1])
                                .trim();
                        } else if (type.toString().trim() === "farm") {
                            includedFileName = strippedLine
                                .split(" ")[1]
                                .trim();
                        }

                        includedFileName = path.basename(includedFileName);
                        includedFileName = includedFileName.replace(
                            /['"]+/g,
                            ""
                        );
                        if (ruleFilesToReplace.indexOf(includedFileName) >= 0) {
                            if (alreadyReplaced) {
                                logger.info(
                                    "FileOperationsUtility: Removed include statement " +
                                        strippedLine +
                                        " in " +
                                        header +
                                        " section of file " +
                                        filePath
                                );
                                let conversionOperation =
                                    new ConversionOperation(
                                        commons_constants.ACTION_REMOVED,
                                        filePath,
                                        "Removed include statement '" +
                                            strippedLine +
                                            "' in section '" +
                                            header +
                                            "'"
                                    );
                                conversionStep.addOperation(
                                    conversionOperation
                                );
                            } else {
                                alreadyReplaced = true;
                                if (type.toString().trim() === "vhost") {
                                    returnContent +=
                                        line.substring(
                                            0,
                                            line.length -
                                                strippedLine.length -
                                                1
                                        ) +
                                        line
                                            .trim()
                                            .replace(
                                                includedFileName,
                                                includePatternToReplaceWith
                                            ) +
                                        os.EOL;
                                } else if (type.toString().trim() === "farm") {
                                    returnContent +=
                                        line.substring(
                                            0,
                                            line.length -
                                                strippedLine.length -
                                                1
                                        ) +
                                        includePatternToReplaceWith +
                                        os.EOL;
                                }
                                logger.info(
                                    "FileOperationsUtility: Replaced include statement '%s' of %s section with include statement '%s' in file %s.",
                                    strippedLine,
                                    header,
                                    includePatternToReplaceWith,
                                    filePath
                                );
                                let conversionOperation =
                                    new ConversionOperation(
                                        commons_constants.ACTION_REPLACED,
                                        filePath,
                                        "Replaced include statement '" +
                                            strippedLine +
                                            "' in section '" +
                                            header +
                                            "' with '" +
                                            includePatternToReplaceWith +
                                            "'"
                                    );
                                conversionStep.addOperation(
                                    conversionOperation
                                );
                            }
                        } else {
                            returnContent += line + os.EOL;
                        }
                    } else if (
                        ((type.toString() === Constants.FARM &&
                            strippedLine === Constants.CLOSE_CURLY_BRACE) ||
                            (type.toString() === Constants.VHOST &&
                                strippedLine === Constants.IFMODULE_END)) &&
                        line.length - strippedLine.length === ifIndentation
                    ) {
                        flag = false;
                        returnContent += line + os.EOL;
                    } else {
                        returnContent += line + os.EOL;
                    }
                } else {
                    returnContent += line + os.EOL;
                }
            });
            fs.writeFileSync(filePath, returnContent);
            logger.info(
                "FileOperationsUtility: " +
                    filePath +
                    " has been successfully written"
            );
        }
    }

    /**
     * Returns rules file included based on includeSyntax
     * @param filePath
     * @param ruleFilesToCheck
     * @param includeSyntax
     * @param recursive
     * @returns {}
     */
    getNamesOfRuleFilesIncluded(
        filePath,
        ruleFilesToCheck,
        includeSyntax,
        recursive = false
    ) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            let ruleFilesIncluded = [];

            let fileContentsArray = this.getContentFromFile(
                filePath,
                recursive
            ).split(os.EOL);
            fileContentsArray.forEach((line) => {
                let strippedLine = line.trim();
                if (
                    strippedLine.includes(includeSyntax) &&
                    !strippedLine.includes("#")
                ) {
                    if (includeSyntax === Constants.INCLUDE_SYNTAX_IN_FARM) {
                        let includedFileName = path.basename(
                            strippedLine
                                .split(Constants.INCLUDE_SYNTAX_IN_FARM)[1]
                                .trim()
                        );
                        includedFileName = includedFileName.substring(
                            0,
                            includedFileName.length
                        );
                        includedFileName = includedFileName
                            .toString()
                            .replace(/['"]+/g, "");
                        if (ruleFilesToCheck.includes(includedFileName)) {
                            ruleFilesIncluded.push(includedFileName);
                            logger.info(
                                "FileOperationsUtility: Included Rule File :" +
                                    includedFileName +
                                    " for farm file : " +
                                    filePath
                            );
                        }
                    } else if (
                        includeSyntax === Constants.INCLUDE_SYNTAX_IN_VHOST
                    ) {
                        let includedFileName = path.basename(
                            strippedLine
                                .split(Constants.INCLUDE_SYNTAX_IN_VHOST)[1]
                                .trim()
                        );
                        includedFileName = includedFileName
                            .toString()
                            .replace(/['"]+/g, "");
                        // what is this doing?
                        //included_file_name = included_file_name[:len(included_file_name)-1]

                        if (ruleFilesToCheck.includes(includedFileName)) {
                            ruleFilesIncluded.push(includedFileName);
                            logger.info(
                                "FileOperationsUtility: Included Rule File :" +
                                    includedFileName +
                                    " for vhost file : " +
                                    filePath
                            );
                        }
                    }
                }
            });
            return ruleFilesIncluded;
        }
    }

    /**
     * Writes all the rules file into a single rule file
     * @param ruleFiles
     * @param consolidatedRuleFilePath
     * @param conversionStep
     */
    consolidateAllRuleFilesIntoSingleRuleFile(
        ruleFiles,
        consolidatedRuleFilePath,
        conversionStep
    ) {
        let ruleFileContent = "";

        ruleFiles.forEach((file) => {
            ruleFileContent += this.getContentFromFile(file, true) + os.EOL;
            this.deleteFile(file, conversionStep);
        });

        fs.writeFileSync(consolidatedRuleFilePath, ruleFileContent);
        logger.info(
            "FileOperationsUtility: Consolidated content of rule files " +
                path.join(this.getPath(ruleFiles)) +
                " into " +
                consolidatedRuleFilePath
        );

        let conversionOperation = new ConversionOperation(
            commons_constants.ACTION_ADDED,
            path.dirname(consolidatedRuleFilePath),
            "Consolidated content of rule files into " +
                consolidatedRuleFilePath
        );
        conversionStep.addOperation(conversionOperation);
    }

    /**
     * To get the content array non-recursively from file
     * @param file
     */
    getFileContentsArray(file) {
        let fileContentsArray = "";

        fileContentsArray = util.getXMLContentSync(file);

        return fileContentsArray;
    }

    /**
     * Returns path for a file
     * @param file
     * @returns {string}
     */
    getPath(file) {
        let filePath = "";
        file.forEach((name) => {
            filePath += name;
        });
        logger.info("FileOperationsUtility: Returning filePath : " + filePath);
        return filePath;
    }
}

module.exports = FileOperations;
