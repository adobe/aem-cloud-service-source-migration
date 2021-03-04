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

const Constants = require("../util/constants");
const FileOperationsUtility = require("../util/FileOperations");
const {
    logger,
    constants: commons_constants,
    ConversionStep,
    ConversionOperation,
    SummaryReportWriter,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const os = require("os");

class SingleFilesConverter {
    /**
     * @param config The parsed config.yaml object
     * @constructor
     */
    constructor(config) {
        this.dispatcherConfigPath = Constants.TARGET_DISPATCHER_SRC_FOLDER;
        this.dispatcherAnyPath = config.onPremise.dispatcherAnySrc;
        this.httpdSrcPath = config.onPremise.httpdSrc;
        this.sdkPath = config.sdkSrc;
        this.conversionSteps = [];
        this.fileOpsUtil = new FileOperationsUtility(config.onPremise);
        this.config = config.onPremise;
    }

    /**
     * Method responsible for running all of the necessary transformations on the source files.
     */
    transform() {
        // check for undefined variables in the generated file to determine if there are env variables being used and such.
        this.alertForUndefinedVariables();
        // remove some of the sample files that aren't used
        this.cleanUpSDKFiles();
        // map variables as per the file
        if (this.config.variablesToReplace) {
            this.replaceVariableInFile();
        }

        // HTTPD.CONF METHODS
        this.createVirtualHostFiles();
        this.createVhostSymLinks();
        this.replaceVariableInVhostFile();
        this.removeNonWhitelistedDirectives();
        if (this.config.appendToVhosts) {
            this.appendAdditionalDirectives();
        }

        // DISPATCHER.ANY METHODS
        this.createFarmFiles();
        this.checkFarmDocRoot();
        this.checkRenderers();
        this.checkCache();
        this.checkClientHeaders();
        this.checkDispatcherVirtualhosts();
        this.createFarmSymLinks();
        this.checkFilter();
        this.checkRewrites();
        this.removeNonPublishFarms();
        // create the summary report for the conversion performed
        SummaryReportWriter.writeSummaryReport(
            this.conversionSteps,
            path.dirname(this.dispatcherConfigPath),
            Constants.DISPATCHER_CONVERTER_REPORT
        );
    }

    /**
     * Go through the copied SDK source files and delete the ones we wont be using in a client project.
     */
    cleanUpSDKFiles() {
        this.fileOpsUtil.deleteFile(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_D,
                Constants.AVAILABLE_VHOSTS,
                "default.vhost"
            )
        );
        this.fileOpsUtil.deleteFile(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_D,
                Constants.ENABLED_VHOSTS,
                "default.vhost"
            )
        );
        this.fileOpsUtil.deleteFile(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_DISPATCHER_D,
                Constants.AVAILABLE_FARMS,
                "default.farm"
            )
        );
        this.fileOpsUtil.deleteFile(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_DISPATCHER_D,
                Constants.ENABLED_FARMS,
                "default.farm"
            )
        );
    }

    /**
     * Method that goes through the dispatcher farm files and sets all the docroots to the `${DOCROOT}` variable.
     */
    checkFarmDocRoot() {
        let conversionStep = this.checkFarmDocRootSummaryGenerator();
        let files = this.getAllAvailableFarmFiles();
        files.forEach((file) => {
            logger.info(
                "Single File Converter: Traversing file for FarmDocRoot : " +
                    file
            );

            let fileContentsArray = this.fileOpsUtil.getFileContentsArray(file);
            let returnContent = "";

            fileContentsArray.forEach((line) => {
                if (
                    line.trim().startsWith("/docroot") &&
                    !line.endsWith("${DOCROOT}")
                ) {
                    line =
                        line.substring(0, line.length - line.trim().length) +
                        '/docroot "${DOCROOT}"';
                }
                returnContent += line + os.EOL;
            });

            logger.info(
                "Single File Converter: Writing file FarmDocRoot : " + file
            );

            fs.writeFileSync(file, returnContent);

            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_MODIFIED,
                    file,
                    "Checking farm docroot and adding /docroot ${DOCROOT} at the end"
                )
            );
        });

        this.conversionSteps.push(conversionStep);
    }

    checkFarmDocRootSummaryGenerator() {
        logger.info(
            "Single File Converter: Check Farm Files for lines starting with /docroot and not ending with ${DOCROOT}"
        );
        return new ConversionStep(
            "Check Farm Files",
            "Check Farm Files for lines starting with /docroot and not ending with ${DOCROOT}"
        );
    }

    /**
     * This method parses the generated "single file" dispatcher configuration, and finds all the farm definitions and
     * copies them into available farms folder.  This method will use the name of the farm configuration with the
     * dispatcher configuration as the name of the farm file.
     */
    createFarmFiles() {
        let conversionStep = this.createFarmFilesSummaryGenerator();
        let TEMP_FILE = "tempFile.txt";
        let fileContentsArray = this.fileOpsUtil.getFileContentsArray(
            this.dispatcherAnyPath
        );
        fs.writeFileSync(
            Constants.TARGET_SINGLE_DISPATCHER,
            fileContentsArray.join(os.EOL)
        );

        let returnContent = "";
        let rootFlag = false;
        let newFileName = "";
        let farmFlag = false;
        let sectionArrays = [];

        logger.info(
            "Single File Converter: Creating farm file from dispatcher.any"
        );

        fs.writeFileSync(
            path.join(Constants.TARGET_DISPATCHER_SRC_FOLDER, TEMP_FILE),
            ""
        );
        // adding content of a farm file to a temporary file for processing non - recursively
        for (let i = 0; i < fileContentsArray.length; i++) {
            if (
                fileContentsArray[i].includes("$include") &&
                fileContentsArray[i].trim().split(" ")[1].includes("farm")
            ) {
                fileContentsArray[i] = this.fileOpsUtil
                    .getContentFromFile(fileContentsArray[i].trim(), false)
                    .split(os.EOL);
                fileContentsArray[i] = fileContentsArray[i].join(os.EOL);
            }

            fileContentsArray[i] = fileContentsArray[i] + os.EOL;

            fs.appendFileSync(
                path.join(Constants.TARGET_DISPATCHER_SRC_FOLDER, TEMP_FILE),
                fileContentsArray[i]
            );
        }

        fileContentsArray = this.fileOpsUtil.getFileContentsArray(
            path.join(Constants.TARGET_DISPATCHER_SRC_FOLDER, TEMP_FILE)
        );
        // adding the required changes to the main farm file by reading content from temp file
        for (let i = 0; i < fileContentsArray.length; i++) {
            if (rootFlag && farmFlag) {
                if (fileContentsArray[i].trim().includes("{")) {
                    sectionArrays.push("1");
                }
                if (fileContentsArray[i].trim().includes("}")) {
                    //by the time we get to the last }, the array will have only 1 item in it, every other time it will contain 2...
                    if (sectionArrays.length === 1) {
                        //found the closing for the farm
                        farmFlag = false;
                        sectionArrays = [];
                        returnContent += fileContentsArray[i] + os.EOL;

                        logger.info(
                            "Single File Converter: Writing farm file : " +
                                newFileName +
                                " at" +
                                path.join(
                                    commons_constants.TARGET_DISPATCHER_SRC_FOLDER,
                                    Constants.CONF_DISPATCHER_D,
                                    Constants.AVAILABLE_FARMS,
                                    newFileName + "." + Constants.FARM
                                )
                        );

                        fs.writeFileSync(
                            path.join(
                                commons_constants.TARGET_DISPATCHER_SRC_FOLDER,
                                Constants.CONF_DISPATCHER_D,
                                Constants.AVAILABLE_FARMS,
                                newFileName + "." + Constants.FARM
                            ),
                            returnContent
                        );

                        conversionStep.addOperation(
                            new ConversionOperation(
                                commons_constants.ACTION_ADDED,
                                path.join(
                                    commons_constants.TARGET_DISPATCHER_SRC_FOLDER,
                                    Constants.CONF_DISPATCHER_D,
                                    Constants.AVAILABLE_FARMS,
                                    newFileName + "." + Constants.FARM
                                ),
                                "Created Farm File from dispatcher.any"
                            )
                        );

                        newFileName = "";
                        returnContent = "";
                        sectionArrays = [];

                        continue;
                    }
                    sectionArrays.pop();
                }
                returnContent += fileContentsArray[i] + os.EOL;
            }

            if (fileContentsArray[i].trim().startsWith("{") && !rootFlag) {
                rootFlag = true;
                logger.debug(
                    "Single File Converter: FileOperationsUtility: Found virtual host section"
                );
            }

            if (rootFlag && farmFlag === false) {
                // at this point with root flag true and farm flag false, we are looking for the next
                // `/` which must be another farm as farm flag is false and root flag is true, the only lines that
                // start with `/` that are allowed are farm names.
                if (fileContentsArray[i].trim().startsWith("/")) {
                    farmFlag = true;
                    returnContent += fileContentsArray[i];
                }
            }

            if (
                rootFlag &&
                fileContentsArray[i].trim().startsWith("/") &&
                newFileName === ""
            ) {
                newFileName = fileContentsArray[i].trim().replace("/", "");
            }
        }
        fs.unlinkSync(
            path.join(Constants.TARGET_DISPATCHER_SRC_FOLDER, "tempFile.txt")
        );
        this.conversionSteps.push(conversionStep);
    }

    createFarmFilesSummaryGenerator() {
        logger.info("Single File Converter: Creating Farm Files");
        return new ConversionStep(
            "Create Farm File",
            "Create farm files from dispatcher.any"
        );
    }

    /**
     * Scans the `available_vhosts` folder, and if a symbolic link doesn't already exist in the `enabled_vhosts` folder, one
     * is created.
     */
    createVhostSymLinks() {
        let enabledVhostsPath = path.join(
            commons_constants.TARGET_DISPATCHER_SRC_FOLDER,
            Constants.CONF_D,
            Constants.ENABLED_VHOSTS
        );

        let conversionStep = this.createVhostSymLinksSummaryGenerator();
        let files =
            glob.sync(
                path.join(
                    this.dispatcherConfigPath,
                    Constants.CONF_D,
                    Constants.AVAILABLE_VHOSTS,
                    "*.vhost"
                )
            ) || [];
        files.forEach((file) => {
            logger.info(
                "Single File Converter: Creating Vhost Symbolic Link in target folder for file : " +
                    file
            );
            // if the symbolic link doesnt exist - lets create it.
            let fileName = path.basename(file);
            if (!fs.existsSync(path.join(enabledVhostsPath, fileName))) {
                fs.symlinkSync(
                    "../available_vhosts/" + fileName,
                    path.join(enabledVhostsPath, fileName)
                );

                logger.info(
                    "Single File Converter: Created Vhost Symbolic Link in target folder for file : " +
                        file
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        path.join(enabledVhostsPath, fileName),
                        `Generated SymLink for the file ${path.basename(file)}`
                    )
                );
            }
        });
        this.conversionSteps.push(conversionStep);
    }

    createVhostSymLinksSummaryGenerator() {
        logger.info("Single File Converter: Creating Vhost SymLinks");
        return new ConversionStep(
            "Create Vhost SymLinks",
            "Generate Vhost SymLinks form vhost files"
        );
    }

    /**
     * Scans the `available_farms` folder, and if a symbolic link doesn't already exist in the `enabled_farms` folder, one
     * is created.
     */
    createFarmSymLinks() {
        let enabledFarmsPath = path.join(
            commons_constants.TARGET_DISPATCHER_SRC_FOLDER,
            Constants.CONF_DISPATCHER_D,
            Constants.ENABLED_FARMS
        );
        let conversionStep = this.createFarmSymLinksSummaryGenerator();
        let files =
            glob.sync(
                path.join(
                    this.dispatcherConfigPath,
                    Constants.CONF_DISPATCHER_D,
                    Constants.AVAILABLE_FARMS,
                    "*.farm"
                )
            ) || [];
        files.forEach((file) => {
            logger.info(
                "Single File Converter: Creating Farm Symbolic Link in target folder for file : " +
                    file
            );
            // if the symbolic link doesnt exist - lets create it.
            if (
                !fs.existsSync(
                    path.join(
                        this.dispatcherConfigPath,
                        Constants.CONF_DISPATCHER_D,
                        Constants.ENABLED_FARMS,
                        path.basename(file)
                    )
                )
            ) {
                fs.symlinkSync(
                    "../available_farms/" + path.basename(file),
                    path.join(enabledFarmsPath, path.basename(file))
                );
                logger.info(
                    "Single File Converter: Created Farm Symbolic Link in target folder for file : " +
                        file
                );
                conversionStep.addOperation(
                    new ConversionOperation(
                        commons_constants.ACTION_ADDED,
                        file,
                        `Generated SymLink for the file ${path.basename(file)}`
                    )
                );
            }
        });

        this.conversionSteps.push(conversionStep);
    }

    createFarmSymLinksSummaryGenerator() {
        logger.info("Single File Converter: Creating Farm SymLinks");
        return new ConversionStep(
            "Create Farm SymLinks",
            "Generate Farm SymLinks form farm files"
        );
    }

    getAllVhosts() {
        let allFiles = [];
        let vhostFiles = this.config.vhostsToConvert;

        vhostFiles.forEach((file) => {
            if (fs.lstatSync(file).isFile()) {
                allFiles.push(file);
            } else if (fs.lstatSync(file).isDirectory()) {
                let globPattern = file + "/**/*";
                let files = glob.sync(globPattern);

                files.forEach((fetchedFiles) => {
                    allFiles.push(fetchedFiles);
                });
            }
        });
        return allFiles;
    }
    createVirtualHostFiles() {
        let conversionStep = this.createVirtualHostsSummary();
        if (this.config.vhostsToConvert) {
            let vhostFiles = this.getAllVhosts();
            vhostFiles.forEach((file) => {
                logger.info(
                    "Single File Converter: Creating Virtual Host File from config parameter: vhostsToConvert for " +
                        file
                );
                let fileContents = this.fileOpsUtil.getContentFromFile(
                    file,
                    true
                );
                fs.writeFileSync(
                    path.join(
                        this.dispatcherConfigPath,
                        Constants.CONF_D,
                        Constants.AVAILABLE_VHOSTS,
                        path.basename(file) + ".vhost"
                    ),
                    fileContents
                );
                logger.info(
                    "Single File Converter: Created Virtual Host File from config parameter: vhostsToConvert for " +
                        file
                );
                this.fileOpsUtil.removeVirtualHostSectionsNotPort80(
                    path.join(
                        this.dispatcherConfigPath,
                        Constants.CONF_D,
                        Constants.AVAILABLE_VHOSTS
                    ),
                    conversionStep
                );
            });
        } else {
            let fileContentsArray = this.fileOpsUtil.getFileContentsArray(
                this.httpdSrcPath
            );
            let returnContent = "";
            let vHostFlag = false;
            let newVhostFileName = "";

            fileContentsArray.forEach((line) => {
                if (
                    line
                        .trim()
                        .startsWith(Constants.VIRTUAL_HOST_SECTION_START) &&
                    line.trim().indexOf("80") > -1
                ) {
                    vHostFlag = true;
                    logger.debug(
                        "Single File Converter: Found virtual host section"
                    );
                }
                if (
                    line
                        .trim()
                        .startsWith(Constants.VIRTUAL_HOST_SECTION_END) &&
                    vHostFlag
                ) {
                    vHostFlag = false;
                    returnContent += line.trim() + os.EOL;
                    if (
                        newVhostFileName !== "" &&
                        !fs.existsSync(
                            path.join(
                                this.dispatcherConfigPath,
                                Constants.CONF_D,
                                Constants.AVAILABLE_VHOSTS,
                                newVhostFileName + ".vhost"
                            )
                        )
                    ) {
                        fs.writeFileSync(
                            path.join(
                                this.dispatcherConfigPath,
                                Constants.CONF_D,
                                Constants.AVAILABLE_VHOSTS,
                                newVhostFileName + ".vhost"
                            ),
                            returnContent
                        );
                        logger.info(
                            "Single File Converter: Created Virtual Host File " +
                                newVhostFileName
                        );

                        this.fileOpsUtil.removeVirtualHostSectionsNotPort80(
                            path.join(
                                this.dispatcherConfigPath,
                                Constants.CONF_D,
                                Constants.AVAILABLE_VHOSTS
                            ),
                            conversionStep
                        );
                    }
                    returnContent = "";
                    newVhostFileName = "";
                }
                if (vHostFlag && line.trim() !== "") {
                    if (line.trim().toLowerCase().indexOf("servername") > -1) {
                        newVhostFileName = line
                            .trim()
                            .toLowerCase()
                            .split("servername")[1]
                            .trim()
                            .replace(/\${([^:]*?)\}/g, "");
                    }
                    returnContent += line;
                    returnContent += os.EOL;
                }
                //write out file comments
                if (line.trim().startsWith("#")) {
                    returnContent += line + os.EOL;
                }
            });
        }
    }

    createVirtualHostsSummary() {
        logger.info("Single File Converter: Creating Virtual Hosts");
        return new ConversionStep(
            "Create Virtual Hosts",
            "Move the required virtual hosts into the correct structure"
        );
    }

    replaceVariableInVhostFile() {
        let confDPath = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.AVAILABLE_VHOSTS
        );

        logger.debug(
            "Single File Converter: Replace DocumentRoot fields with `${DOCROOT}` variable."
        );
        this.replaceDocumentRoots(confDPath, Constants.VHOST, "${DOCROOT}");
        let files =
            this.fileOpsUtil.globGetFilesByExtension(
                confDPath,
                Constants.VHOST
            ) || [];
        files.forEach((file) => {
            // we probably need to use some type of variable mapper here to figure out what all we need to replace
            // at least for environment variables
            logger.info(
                "Single File Converter: Replacing variable from config file in file : " +
                    file
            );
            let obj = this.config.variablesToReplace;
            let thisParameter = this;
            Object.keys(obj).forEach(function (key) {
                let value = obj[key];
                thisParameter.fileOpsUtil.replaceVariableUsage(
                    file,
                    key,
                    value
                );
            });
        });
    }

    replaceDocumentRoots(directoryPath, fileExtension, newVariable) {
        if (
            fs.existsSync(directoryPath) &&
            fs.lstatSync(directoryPath).isDirectory()
        ) {
            logger.info(
                "Single File Converter: Replacing document roots in directory : " +
                    directoryPath
            );
            // get all files under given directory and sub-directories with given file extension
            let globPattern = directoryPath + "/**/*" + fileExtension;
            let files = glob.sync(globPattern);
            // lookup for include statements of the specified rule, and replace them with new rule
            for (const file of files) {
                logger.info(
                    "Single File Converter: Traversing file for replacing document root in file : " +
                        file
                );

                // split the contents of the file by newline
                let fileContentsArray = this.fileOpsUtil.getFileContentsArray(
                    file
                );
                let returnContent = "";

                // iterate over the contents of the file and check for variables to replace
                fileContentsArray.forEach((line) => {
                    // if we find one to replace, replace it and write it to the file
                    if (line.indexOf("DocumentRoot") !== -1) {
                        returnContent += line.replace(
                            line.split("DocumentRoot")[1],
                            " " + newVariable
                        );
                        // console.info("FileOperationsUtility: Replaced variable '" + variableToReplace + "' with variable '" + newVariable + "' in file " + filePath + ".");
                    }
                    // if we dont find any variables to replace, just write the line as is.
                    else {
                        returnContent += line;
                    }
                    // write a new line to maintain formatting.
                    returnContent += os.EOL;
                });

                fs.writeFileSync(file, returnContent);
                logger.info(
                    "Single File Converter: Successfully replaced document root in file : " +
                        file
                );
            }
        }
    }

    removeNonWhitelistedDirectives() {
        let conversionStep = this.removeNonWhitelistedDirectivesSummaryGenerator();
        let available_vhosts_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.AVAILABLE_VHOSTS
        );
        // create a set from the list of whitelisted directive
        // (in lowercase, since Directives in the configuration files are case-insensitive
        let whitelistedDirectivesSet = [];
        for (const directive of Constants.WHITELISTED_DIRECTIVES_LIST) {
            whitelistedDirectivesSet.push(directive.toLowerCase());
        }
        this.fileOpsUtil.removeNonWhitelistedDirectivesInVhostFiles(
            available_vhosts_dir_path,
            whitelistedDirectivesSet,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    removeNonWhitelistedDirectivesSummaryGenerator() {
        logger.info(
            "Single File Converter: Checking for usage of non-whitelisted directives."
        );
        return new ConversionStep(
            "Remove usage of non-whitelisted directives",
            "Checking for usage of non-whitelisted directives and remove them."
        );
    }

    checkRenderers() {
        let conversionStep = this.checkRenderersSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let renders_dir_path = path.join(conf_dispatcher_d_dir_path, "renders");
        //# Remove all files in that folder.
        logger.info(
            "Single File Converter: Removing all file in a folder conf.dispatcher/renders"
        );
        let files = glob.sync(renders_dir_path + "/**/*.any") || [];
        files.forEach((file) => {
            this.fileOpsUtil.deleteFile(file, conversionStep);
            logger.info("Single File Converter: Deleting file : " + file);
        });

        // Copy the file conf.dispatcher.d/renders/default_renders.any from the default skyline dispatcher
        // configuration to that location.
        let default_filters_file_from_sdk = path.join(
            this.sdkPath,
            Constants.CONF_DISPATCHER_D,
            "/renders/default_renders.any"
        );
        fs.copyFileSync(
            default_filters_file_from_sdk,
            path.join(renders_dir_path, "default_renders.any")
        );
        logger.info(
            "Single File Converter: : Copied file 'conf.dispatcher.d/renders/default_renders.any' from the standard dispatcher configuration to %s.",
            renders_dir_path
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                renders_dir_path,
                " Copied file 'conf.dispatcher.d/renders/default_renders.any` 'from the standard dispatcher configuration to " +
                    renders_dir_path
            )
        );
        // In each farm file, remove any contents in the renders section and replace it with:
        // $include "../renders/default_renders.any"
        let include_statement_to_replace_with =
            '$include "../renders/default_renders.any"';

        this.fileOpsUtil.replaceContentOfSection(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.RENDERS_SECTION,
            include_statement_to_replace_with,
            conversionStep,
            false
        );

        this.conversionSteps.push(conversionStep);
    }

    checkRenderersSummaryGenerator() {
        logger.info(
            "Single File Converter: Executing Rule : Checking renders folder."
        );
        return new ConversionStep(
            "Check renders",
            "Remove all files in the directory `conf.dispatcher.d/renders'." +
                "Copy the file `conf.dispatcher.d/renders/default_renders.any` from the " +
                "default AEM as a Cloud Service dispatcher configuration to that location." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "In each farm file, remove any contents in the renders section and replace " +
                'it with: `$include "../renders/default_renders.any"`'
        );
    }

    checkCache() {
        let conversionStep = this.checkCacheSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let cache_dir_path = path.join(conf_dispatcher_d_dir_path, "cache");

        // If conf.dispatcher.d/cache is now empty, copy the file conf.dispatcher.d/cache/rules.any from the standard
        // dispatcher configuration to this folder.
        // The standard dispatcher configuration can be found in the folder src of the SDK
        logger.info(
            "Single File Converter: Checking for files in cache directory"
        );
        let files =
            this.fileOpsUtil.globGetFilesByPattern(
                path.join(cache_dir_path, "**", "*.any")
            ) || [];
        let file_count = files.length;
        if (file_count === 0) {
            let rules_file_from_sdk = path.join(
                this.sdkPath,
                Constants.CONF_DISPATCHER_D,
                "cache",
                "rules.any"
            );
            fs.copyFileSync(
                rules_file_from_sdk,
                path.join(cache_dir_path, "rules.any")
            );
            logger.info(
                "Single File Converter: Copied file 'conf.dispatcher.d/cache/rules.any' from the standard dispatcher configuration to %s.",
                cache_dir_path
            );
            let default_rules_file_from_sdk = path.join(
                this.sdkPath,
                Constants.CONF_DISPATCHER_D,
                "cache",
                "default_rules.any"
            );
            fs.copyFileSync(
                default_rules_file_from_sdk,
                path.join(cache_dir_path, "default_rules.any")
            );
            logger.info(
                "Single File Converter: Copied file 'conf.dispatcher.d/cache/default_rules.any' from the standard dispatcher configuration to %s.",
                cache_dir_path
            );
            // adapt the $include statements referring to the the ams_*_cache.any rule files in the farm file
            files.forEach((amsFile) => {
                this.fileOpsUtil.replaceIncludeStatementWithNewRule(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.INCLUDE_SYNTAX_IN_FARM,
                    path.basename(amsFile),
                    "rules.any",
                    conversionStep
                );
            });
        }
        // If instead conf.dispatcher.d/cache now contains a single file with suffix _cache.any
        else if (file_count === 1 && files[0].endsWith("_cache.any")) {
            let old_file_name = path.basename(files[0]);
            let new_file_name = "rules.any";
            //  it should be renamed to rules.any
            let renamed_file_path = path.join(
                path.dirname(files[0]),
                new_file_name
            );
            this.fileOpsUtil.renameFile(files[0], renamed_file_path);
            // adapt the $include statements referring to that file in the farm files as well
            this.fileOpsUtil.replaceIncludeStatementWithNewRule(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                old_file_name,
                new_file_name,
                conversionStep
            );
        }
        // If the folder however contains multiple, farm specific files with that pattern,
        // their contents should be copied to the $include statement referring to them in the farm files.
        else if (file_count > 1) {
            let availableFarmFiles = this.getAllAvailableFarmFiles();
            if (availableFarmFiles.length > 1) {
                availableFarmFiles.forEach((file) => {
                    if (file.endsWith("_cache.any")) {
                        let cacheFileContents = this.fileOpsUtil.getContentFromFile(
                            file,
                            true
                        );
                        this.fileOpsUtil.replaceIncludeStatementWithContentOfRuleFile(
                            conf_dispatcher_d_dir_path,
                            Constants.FARM,
                            path.basename(file),
                            cacheFileContents,
                            Constants.INCLUDE_SYNTAX_IN_FARM,
                            conversionStep
                        );
                        this.fileOpsUtil.deleteFile(file, conversionStep);
                    }
                });
            } else if (availableFarmFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single farm file,, we should
                // consolidate all the included rule file into a single rule file and include it.
                let ruleFiles = this.fileOpsUtil.getAllFileNames(files);
                // find all the rule files that are actually included in single the farm file
                let ruleFilesIncluded = this.fileOpsUtil.getNamesOfRuleFilesIncluded(
                    availableFarmFiles[0],
                    ruleFiles,
                    Constants.INCLUDE_SYNTAX_IN_FARM
                );
                // delete the rule files not included in the single available farm file, and get the files actually used
                files = this.filterAndRemoveUnusedFiles(
                    files,
                    ruleFilesIncluded,
                    conversionStep
                );
                // consolidate all rule files into a single rules.any file
                this.fileOpsUtil.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(cache_dir_path, "rules.any"),
                    conversionStep
                );
                ruleFiles = this.fileOpsUtil.getAllFileNames(files);
                // replace all statements including the files in a cache-rules section with a single include statement
                let includeStatementToReplaceWith =
                    '$include "../cache/rules.any"';
                //TODO: Validate this is working properly - DONE (another function is included to pass arguments to the main include function)
                this.fileOpsUtil.replaceIncludesInFarmAndVhostFile(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.RULES_SECTION,
                    ruleFiles,
                    includeStatementToReplaceWith,
                    conversionStep
                );
            }
        }
        // Remove any file that has the suffix _invalidate_allowed.any
        files.forEach((file) => {
            if (file.endsWith("_invalidate_allowed.any")) {
                this.fileOpsUtil.deleteFile(file, conversionStep);
                logger.info(
                    "Single File Converter: Removed file that has suffix _invalidate_allowed.any : " +
                        file
                );
            }
        });

        //replace the docroot value to match the default docroot...

        // Copy the file conf.dispatcher.d/cache/default_invalidate_any from the default skyline dispatcher
        // configuration to that location.
        let default_invalidate_file_from_sdk = path.join(
            this.sdkPath,
            Constants.CONF_DISPATCHER_D,
            "cache",
            "default_invalidate.any"
        );
        fs.copyFileSync(
            default_invalidate_file_from_sdk,
            path.join(cache_dir_path, "default_invalidate.any")
        );
        logger.info(
            "Single File Converter: Copied file 'conf.dispatcher.d/cache/default_invalidate_any' from the standard dispatcher configuration to %s.",
            cache_dir_path
        );
        // In each farm file, remove any contents in the cache/allowedClients section and replace it with:
        // $include "../cache/default_invalidate.any"
        let include_statement_to_replace_with =
            '$include "../cache/default_invalidate.any"';
        this.fileOpsUtil.replaceContentOfSection(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.ALLOWED_CLIENTS_SECTION,
            include_statement_to_replace_with,
            conversionStep,
            false
        );
        this.conversionSteps.push(conversionStep);
    }

    checkCacheSummaryGenerator() {
        logger.info(
            "Single File Converter:  Executing Rule : Checking cache folder."
        );
        return new ConversionStep(
            "Check cache" +
                "In directory `conf.dispatcher.d/cache`, remove any file prefixed `ams_`. " +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If `conf.dispatcher.d/cache` is now empty, copy the file " +
                "`conf.dispatcher.d/cache/rules.any` from the standard dispatcher " +
                "configuration to this folder. The standard dispatcher configuration can " +
                "be found in the folder src of the dispatcher SDK. Adapt the `$include` " +
                "statements referring to the `ams_*_cache.any` rule files in the farm " +
                "files as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                " If instead `conf.dispatcher.d/cache` now contains a single " +
                "file with suffix `_cache.any`, it should be renamed to `rules.any` and " +
                "adapt the `$include` statements referring to that file in the farm files " +
                "as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If the folder however contains multiple, farm specific files " +
                "with that pattern, their contents should be copied to the `$include` " +
                "statement referring to them in the farm files, and the delete the files. " +
                "Remove any file that has the suffix `_invalidate_allowed.any`." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "Copy the file `conf.dispatcher.d/cache/default_invalidate_any` from the " +
                "default AEM in the Cloud dispatcher configuration to that location. " +
                "In each farm file, remove any contents in the `cache/allowedClients` " +
                "section and replace it with:" +
                ' `$include "../cache/default_invalidate.any"`'
        );
    }

    getAllAvailableVhostFiles() {
        return glob.sync(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_D,
                Constants.AVAILABLE_VHOSTS,
                "**",
                "*." + Constants.VHOST
            )
        );
    }

    getAllAvailableFarmFiles() {
        return glob.sync(
            path.join(
                this.dispatcherConfigPath,
                Constants.CONF_DISPATCHER_D,
                Constants.AVAILABLE_FARMS,
                "**",
                "*." + Constants.FARM
            )
        );
    }

    /**
     * Removing files which are not used and return list of files which are used
     * @param allFiles
     * @param usedFileNames
     * @param conversionStep
     * @returns {[]}
     */
    filterAndRemoveUnusedFiles(allFiles, usedFileNames, conversionStep) {
        let usedFiles = [];

        allFiles.forEach((file) => {
            logger.info("Single File Converter: Checking for file : " + file);
            if (usedFileNames.includes(path.basename(file))) {
                usedFiles.push(file);
                logger.info(
                    "Single File Converter: File marked as used : " + file
                );
            } else {
                this.fileOpsUtil.deleteFile(file, conversionStep);
                logger.info(
                    "Single File Converter: File marked as unused and deleted"
                );
            }
        });

        return usedFiles;
    }

    checkDispatcherVirtualhosts() {
        let conversionStep = this.checkClientHeadersSummaryGenerator();
        let files = this.getAllAvailableFarmFiles();

        files.forEach((file) => {
            logger.info(
                "Single File Converter: Checking dispatcher virtual host and replacing section content for file : " +
                    file
            );
            this.replaceSectionContent(
                file,
                Constants.VIRTUALHOSTS_SECTION_IN_FARM,
                '"*"',
                '$include "../virtualhosts/virtualhosts.any"',
                conversionStep,
                false
            );
        });

        this.conversionSteps.push(conversionStep);
    }

    checkClientHeaders() {
        let conversionStep = this.checkClientHeadersSummaryGenerator();
        let files = this.getAllAvailableFarmFiles();

        files.forEach((file) => {
            logger.info(
                "Single File Converter: Checking for client headers and replace section content for file : " +
                    file
            );
            this.replaceSectionContent(
                file,
                Constants.CLIENT_HEADER_SECTION,
                '"*"',
                Constants.INCLUDE_SYNTAX_IN_FARM +
                    ' "../clientheaders/clientheaders.any"',
                conversionStep,
                false
            );
        });

        this.conversionSteps.push(conversionStep);
    }

    checkClientHeadersSummaryGenerator() {
        logger.info(
            "Single File Converter: Executing Rule : Checking clientheaders folder."
        );
        return new ConversionStep(
            "Check client headers",
            "In directory `conf.dispatcher.d/clientheaders`, remove any file prefixed " +
                "`ams_` ." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If `conf.dispatcher.d/clientheaders` now contains a single file with " +
                "suffix `_clientheaders.any` , it should be renamed to `clientheaders.any` " +
                "and adapt the `$include` statements referring to that file in the farm " +
                "files as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If the folder however contains multiple, farm specific files with that " +
                "pattern, their contents should be copied to the `$include` statement " +
                "referring to them in the farm files." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "Copy the file `conf.dispatcher/clientheaders/default_clientheaders.any` " +
                "from the default AEM as a Cloud Service dispatcher configuration to that " +
                "location." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "In each farm file, replace any clientheader include statements that looks " +
                "the following : " +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                '`$include "/etc/httpd/conf.dispatcher.d/clientheaders/' +
                'ams_publish_clientheaders.any"`' +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                '`$include "/etc/httpd/conf.dispatcher.d/clientheaders/ams_common_clientheaders.any"` ' +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "with the statement: " +
                '`$include "../clientheaders/default_clientheaders.any"`'
        );
    }

    /**
     * Replace section content bsed on the section header and include pattern to replace
     * @param filePath
     * @param sectionHeader
     * @param includePatternToReplace
     * @param includePatternToReplaceWith
     * @param conversionStep
     */
    replaceSectionContent(
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

            let fileContentsArray = this.fileOpsUtil.getFileContentsArray(
                filePath,
                false
            );
            let returnContent = "";

            logger.info(
                "Single File Converter: Replacing pattern :" +
                    includePatternToReplace +
                    " with pattern :" +
                    includePatternToReplaceWith +
                    " in file:" +
                    filePath
            );
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
                    if (
                        trimmedLine.startsWith(includePatternToReplace) &&
                        !replacedFlag
                    ) {
                        replacedFlag = true;
                        returnContent +=
                            line.substring(
                                0,
                                line.length - trimmedLine.length
                            ) +
                            includePatternToReplaceWith +
                            os.EOL;
                        console.info(
                            "Single File Converter: Replaced include statement " +
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

    checkFilter() {
        let conversionStep = this.checkClientHeadersSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let filters_dir_path = path.join(conf_dispatcher_d_dir_path, "filters");
        // If the folder however contains multiple rule files specific to a single farm file,, we should
        // consolidate all the included rule file into a single rule file and include it.
        let filterFiles = this.fileOpsUtil.deleteAllFilesNotConformingToPattern(
            filters_dir_path,
            "*.any",
            conversionStep
        );
        let ruleFiles = this.fileOpsUtil.getAllFileNames(filterFiles);
        // find all the rule files that are actually included in single the farm file
        let farmFiles = this.getAllAvailableFarmFiles();
        farmFiles.forEach((farm) => {
            logger.info(
                "Single File Converter: Checking filter for available farm file : " +
                    farm
            );
            let ruleFilesIncluded = this.fileOpsUtil.getNamesOfRuleFilesIncluded(
                farm,
                ruleFiles,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                true
            );
            // delete the rule files not included in the single available farm file, and get the files actually used
            let files = this.filterAndRemoveUnusedFiles(
                filterFiles,
                ruleFilesIncluded,
                conversionStep
            );
            // consolidate all rule files into a single rules.any file
            this.fileOpsUtil.consolidateAllRuleFilesIntoSingleRuleFile(
                files,
                path.join(filters_dir_path, "filters.any"),
                conversionStep
            );
        });

        ruleFiles = this.fileOpsUtil.getAllFileNames(farmFiles);
        // replace all statements including the files in a cache-rules section with a single include statement
        let includeStatementToReplaceWith = '$include "../filters/filters.any"';
        //TODO: Validate this is working properly
        this.fileOpsUtil.replaceIncludesInFarmAndVhostFile(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.FILTERS_SECTION,
            ruleFiles,
            includeStatementToReplaceWith,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    alertForUndefinedVariables() {
        let conversionStep = this.checkForUndefinedVariablesSummaryGenerator();

        if (this.config.vhostsToConvert) {
            let vhostFiles = this.getAllVhosts();
            vhostFiles.forEach((file) => {
                let variablesUsedList = [];
                let variablesDefinedList = [];

                let fileContents = this.fileOpsUtil
                    .getContentFromFile(file)
                    .split(os.EOL);
                logger.info(
                    "Single File Converter: Checking for undefined variables in " +
                        file
                );
                fileContents.forEach((line) => {
                    // check for variables being defined.
                    if (line.trim().startsWith("DEFINE")) {
                        if (
                            !variablesDefinedList.includes(
                                line.trim().split("DEFINE ")[1]
                            )
                        ) {
                            variablesDefinedList.push(
                                line.trim().split("DEFINE ")[1]
                            );
                        }
                    }
                    let variableRegEx = /\${([^:]*?)\}/g;
                    let lineVarArray = line.trim().match(variableRegEx);
                    // check if the line is using a variable
                    if (lineVarArray !== null) {
                        lineVarArray.forEach((varUsed) => {
                            let fixedVar = varUsed
                                .replace("${", "")
                                .replace("}", "");
                            if (!variablesUsedList.includes(fixedVar)) {
                                variablesUsedList.push(fixedVar);
                            }
                        });
                    }
                });

                for (let variableUsed of variablesUsedList) {
                    if (!variablesDefinedList.includes(variableUsed)) {
                        let conversion_operation = new ConversionOperation(
                            Constants.WARNING,
                            file,
                            "Found Undefined Variable " + variableUsed
                        );
                        conversionStep.addOperation(conversion_operation);
                        this.conversionSteps.push(conversionStep);
                        logger.warn(
                            "Single File Converter: FOUND UNDEFINED VARIABLE %s",
                            variableUsed
                        );
                    }
                }
            });
        } else {
            logger.error("Single File Converter: No vhost file exists");
        }
    }

    checkForUndefinedVariablesSummaryGenerator() {
        logger.info(
            "Single File Converter: Executing Rule : Checking for Undefined Variables."
        );
        return new ConversionStep(
            "Check Undefined Variables",
            "In the vhosts file - check for any variables that are being used that are not defined"
        );
    }

    /**
     * Replace variable name in file name as per variable list in config file
     * @param thisParameter
     * @param fileName
     * @param variableList
     */
    replaceVariableNames(thisParameter, fileName, variableList) {
        let result = "";
        let fileContents = thisParameter.fileOpsUtil
            .getContentFromFile(fileName)
            .split(os.EOL);

        logger.info(
            "Single File Converter: Replacing variable in file : " + fileName
        );
        fileContents.forEach((line) => {
            for (let variable in variableList) {
                let indices = [];
                let tempLine = line;
                let indexCounter = 0;

                while (
                    tempLine.indexOf(
                        variableList[variable].split(":")[0].toString()
                    ) > -1
                ) {
                    let indexOfVariable = tempLine.indexOf(
                        variableList[variable].split(":")[0].toString()
                    );
                    if (
                        indexOfVariable > -1 &&
                        (tempLine.charAt(indexOfVariable - 1).toString() ==
                            "$" ||
                            tempLine.charAt(indexOfVariable - 1).toString() ==
                                "{")
                    ) {
                        indices.push(indexCounter + indexOfVariable);
                    }
                    indexCounter +=
                        indexOfVariable +
                        variableList[variable].split(":")[0].toString().length;
                    tempLine = tempLine.substring(
                        indexOfVariable +
                            variableList[variable].split(":")[0].toString()
                                .length,
                        tempLine.length
                    );
                }

                indices.forEach((index) => {
                    if (
                        index > -1 &&
                        (line.charAt(index - 1).toString() == "$" ||
                            line.charAt(index - 1).toString() == "{")
                    ) {
                        //line = line.replace((variableList[variable].split(":")[0]).toString(), (variableList[variable].split(":")[1]).toString());
                        line =
                            line.substring(0, index) +
                            variableList[variable].split(":")[1].toString() +
                            line.substring(
                                index +
                                    variableList[variable]
                                        .split(":")[0]
                                        .toString().length,
                                line.length
                            );
                    }
                });

                if (
                    line.includes(
                        "export " +
                            variableList[variable].split(":")[0].toString()
                    ) ||
                    line.startsWith(
                        "EXPORT " +
                            variableList[variable].split(":")[0].toString()
                    )
                ) {
                    while (
                        line.includes(
                            variableList[variable].split(":")[0].toString()
                        )
                    ) {
                        line = line.replace(
                            variableList[variable].split(":")[0].toString(),
                            variableList[variable].split(":")[1].toString()
                        );
                    }
                }
            }
            result += line + os.EOL;
        });

        fs.writeFileSync(fileName, result, "utf8", function (err) {
            if (err) {
                logger.error(err);
            } else {
                logger.info(
                    "Single File Converter: Successfully changed variable in file : " +
                        fileName
                );
            }
        });
    }

    replaceVariableInFile() {
        let variableList = [];
        let obj = this.config.variablesToReplace;

        Object.keys(obj).forEach(function (key) {
            let value = obj[key];
            variableList.push(key + ":" + value);
        });

        if (this.config.vhostsToConvert) {
            let vhostFiles = this.getAllVhosts();
            vhostFiles.forEach((file) => {
                this.replaceVariableNames(this, file, variableList);
            });
        } else {
            logger.error("Single File Converter: No vhost file exists");
        }
    }

    appendAdditionalDirectives() {
        let conversionStep = this.appendAdditionalDirectivesSummaryGenerator();
        const appendFileContents = fs
            .readFileSync(this.config.appendToVhosts)
            .toString();
        let vhosts = this.getAllAvailableVhostFiles();
        vhosts.forEach((file) => {
            logger.info(
                "Single File Converter: Appending additional directives for vhost file : " +
                    file
            );
            let fileContentsArray = this.fileOpsUtil.getFileContentsArray(file);
            let returnContent = "";
            fileContentsArray.forEach((line) => {
                if (
                    line.trim().startsWith(Constants.VIRTUAL_HOST_SECTION_END)
                ) {
                    returnContent += appendFileContents + os.EOL;
                }
                returnContent += line + os.EOL;
            });
            fs.writeFileSync(file, returnContent);

            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_MODIFIED,
                    file,
                    "Appended Additional Directives to the vhost file"
                )
            );
        });

        this.conversionSteps.push(conversionStep);
    }

    appendAdditionalDirectivesSummaryGenerator() {
        logger.info(
            "Single File Converter: Append Additional Directives to All Available Vhost Files"
        );
        return new ConversionStep(
            "Append Additional Directives",
            "Append Additional Directives Defined as Global Configuration to Vhost Files"
        );
    }

    checkRewrites() {
        let conversionStep = this.checkRewritesSummaryGenerator();
        let vhostFiles = this.getAllAvailableVhostFiles();

        vhostFiles.forEach((file) => {
            logger.info(
                "Single File Converter: Including rewrite file content in vhost file : " +
                    file
            );
            let fileContentsArray = this.fileOpsUtil.getFileContentsArray(file);
            let returnContent = "";
            fileContentsArray.forEach((line) => {
                if (line.trim().toLowerCase().startsWith("include")) {
                    let readablePath = this.fileOpsUtil.getReadablePath(line);
                    logger.info(
                        "Single File Converter: Including rewrite file :" +
                            readablePath
                    );
                    line = this.fileOpsUtil.getContentFromFile(readablePath);
                }
                returnContent += line + os.EOL;
            });
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    file,
                    "Included Rewrites to the vhost file"
                )
            );
            fs.writeFileSync(file, returnContent);
        });

        this.conversionSteps.push(conversionStep);
    }

    checkRewritesSummaryGenerator() {
        logger.info(
            "Single File Converter: Executing Rule : Check rewrites folder."
        );
        return new ConversionStep(
            "Check rewrites folder In directory `conf.d/rewrites`, remove any file named `base_rewrite.rules` and `xforwarded_forcessl_rewrite.rules` and remove " +
                "Include statements in the virtual host files referring to them." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If `conf.d/rewrites` now contains a single file, it should be renamed to " +
                "`rewrite.rules` and adapt the Include statements referring to that file " +
                "in the virtual host files as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If the folder however contains multiple, virtual host specific files, " +
                "their contents should be copied to the Include statement referring to " +
                "them in the virtual host files."
        );
    }
    removeNonPublishFarms() {
        let conversionStep = this.removeNonPublishFarmsSummaryGenerator();
        let non_publish_keyword_list = [
            "author",
            "unhealthy",
            "health",
            "lc",
            "flush",
        ];
        // Remove farm files in conf.dispatcher.d/enabled_farms that has author,unhealthy,health,lc or flush in its name.
        let enabled_farms_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            Constants.ENABLED_FARMS
        );
        non_publish_keyword_list.forEach((keyword) => {
            this.fileOpsUtil.deleteAllFilesContainingSubstring(
                enabled_farms_dir_path,
                keyword,
                conversionStep
            );
        });

        // All farm files in conf.dispatcher.d/available_farms that are not linked to can be removed as well.
        // TODO : This is a hack, instead find symlinks in enabled_farms and their targets in available_farms
        let available_farms_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            Constants.AVAILABLE_FARMS
        );
        non_publish_keyword_list.forEach((keyword) => {
            this.fileOpsUtil.deleteAllFilesContainingSubstring(
                available_farms_dir_path,
                keyword,
                conversionStep
            );
        });
        this.fileOpsUtil.removeNonMatchingFilesByName(
            available_farms_dir_path,
            enabled_farms_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    removeNonPublishFarmsSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Get rid of all non-publish farms."
        );
        return new ConversionStep(
            "Get rid of all non-publish farms" +
                "Remove any farm file in `conf.dispatcher.d/enabled_farms` that has " +
                "`author , unhealthy , health , lc , flush` in its name. All farm files " +
                "in `conf.dispatcher.d/available_farms` that are not linked to can be " +
                "removed as well."
        );
    }
}

module.exports = SingleFilesConverter;
