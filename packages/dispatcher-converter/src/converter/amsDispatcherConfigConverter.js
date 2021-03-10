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
const FolderOperationsUtility = require("../util/FolderOperations");
const {
    util,
    logger,
    constants: commons_constants,
    ConversionStep,
    ConversionOperation,
    SummaryReportWriter,
} = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

class AEMDispatcherConfigConverter {
    constructor(config, dispatcherConfigPath) {
        this.sdkSrcPath = config.sdkSrc;
        this.dispatcherConfigPath = dispatcherConfigPath;
        this.conversionSteps = [];
        this.FileOperationsUtility = new FileOperationsUtility(config.ams);
        this.FolderOperationsUtility = new FolderOperationsUtility();
    }

    transform() {
        /*
            Perform the transition steps mentioned in [1].
             [1]: https://git.corp.adobe.com/Granite/skyline-dispatcher-sdk/blob/master/docs/TransitionFromAMS.md
             */

        // this.__extract_archive()
        this.removeUnusedFoldersFiles();
        this.removeNonPublishVhostFiles();
        this.removeVhostSectionNotReferringToPort80();
        this.replaceVariableInVhostFile();
        this.checkRewrites();
        this.checkVariables();
        this.removeWhitelists();
        this.removeNonPublishFarms();
        this.renameFarmFiles();
        this.checkCache();
        this.checkClientHeaders();
        this.checkFilter();
        this.checkRenderers();
        this.checkVhosts();
        this.replaceVariableInFarmFiles();
        this.removeNonWhitelistedDirectives();

        // create the summary report for the conversion performed
        SummaryReportWriter.writeSummaryReport(
            this.conversionSteps,
            path.dirname(this.dispatcherConfigPath),
            Constants.DISPATCHER_CONVERTER_REPORT
        );
    }

    removeUnusedFoldersFiles() {
        let conversionStep = this.__remove_unused_folders_files_summary_generator();
        this.FolderOperationsUtility.deleteFolder(
            path.join(this.dispatcherConfigPath, Constants.CONF),
            conversionStep
        );
        this.FolderOperationsUtility.deleteFolder(
            path.join(this.dispatcherConfigPath, Constants.CONF_MODULES_D),
            conversionStep
        );
        this.FileOperationsUtility.deleteFilesWithExtension(
            path.join(this.dispatcherConfigPath, Constants.CONF_D),
            Constants.CONF,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    __remove_unused_folders_files_summary_generator() {
        logger.info(
            "AEMDispatcherConverter: Executing Rule : Remove subfolders conf and conf.modules.d, as well as files matching conf.d/*.conf."
        );
        return new ConversionStep(
            "Get rid of ununsed subfolders and files",
            "Remove subfolders `conf` and `conf.modules.d`" +
                " as well as files matching `conf.d/*.conf` ."
        );
    }

    removeNonPublishVhostFiles() {
        let conversionStep = this.__remove_non_publish_vhost_files_summary_generator();
        // Remove any vhost file in conf.d/enabled_vhosts that has author, unhealthy, health, lc or flush in its name.
        let enabled_vhosts_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.ENABLED_VHOSTS
        );
        let non_publish_keyword_list = [
            "author",
            "unhealthy",
            "health",
            "lc",
            "flush",
        ];
        let available_vhosts_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.AVAILABLE_VHOSTS
        );
        non_publish_keyword_list.forEach((keyword) => {
            this.FileOperationsUtility.deleteAllFilesContainingSubstring(
                enabled_vhosts_dir_path,
                keyword,
                conversionStep
            );
            this.FileOperationsUtility.deleteAllFilesContainingSubstring(
                available_vhosts_dir_path,
                keyword,
                conversionStep
            );
        });

        this.FileOperationsUtility.removeNonMatchingFilesByName(
            enabled_vhosts_dir_path,
            available_vhosts_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    __remove_non_publish_vhost_files_summary_generator() {
        logger.info(
            "AEMDispatcherConverter: Executing Rule : Get rid of all non-publish virtual hosts."
        );
        return new ConversionStep(
            "Get rid of all non-publish virtual hosts",
            "Remove any virtual host file in `conf.d/enabled_vhosts` that has `author` " +
                "`unhealthy` , `health` , `lc` or `flush` in its name. All virtual host " +
                "files in `conf.d/available_vhosts` that are not linked to should be removed."
        );
    }

    removeVhostSectionNotReferringToPort80() {
        let conversionStep = this.__remove_vhost_section_not_referring_to_port_80_summary_generator();
        let enabled_vhost_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.ENABLED_VHOSTS
        );
        let available_vhost_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.AVAILABLE_VHOSTS
        );
        this.FileOperationsUtility.removeVirtualHostSectionsNotPort80(
            enabled_vhost_dir_path,
            conversionStep
        );
        this.FileOperationsUtility.removeVirtualHostSectionsNotPort80(
            available_vhost_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    __remove_vhost_section_not_referring_to_port_80_summary_generator() {
        logger.info(
            "AEMDispatcherConverter: Executing Rule : Remove virtual host sections that do not refer to port " +
                "80."
        );
        return new ConversionStep(
            "Remove virtual host sections that do not refer to port 80" +
                "If you still have sections in your virtual host files that exclusively " +
                "refer to other ports than port 80, e.g. " +
                "`<VirtualHost *:443>...</VirtualHost>`"
        );
    }

    replaceVariableInVhostFile() {
        let conversionStep = this.replaceVariableInVhostFileSummaryGenerator();
        let confDPath = path.join(this.dispatcherConfigPath, Constants.CONF_D);

        logger.debug(
            "AMSDispatcherConfigConverter: Renaming PUBLISH_DOCROOT to DOCROOT in all virtual host files."
        );
        this.FileOperationsUtility.replaceAllUsageOfOldVariableWithNewVariable(
            confDPath,
            Constants.VHOST,
            "PUBLISH_DOCROOT",
            "DOCROOT",
            conversionStep
        );

        logger.debug(
            "AMSDispatcherConfigConverter: Removing sections referring to variables named DISP_ID PUBLISH_FORCE_SSL or PUBLISH_WHITELIST_ENABLED in all virtual host files."
        );
        this.FileOperationsUtility.removeAllUsageOfOldVariable(
            confDPath,
            "." + Constants.VHOST,
            "PUBLISH_FORCE_SSL",
            conversionStep
        );
        this.FileOperationsUtility.removeAllUsageOfOldVariable(
            confDPath,
            "." + Constants.VHOST,
            "DISP_ID",
            conversionStep
        );
        this.FileOperationsUtility.removeAllUsageOfOldVariable(
            confDPath,
            "." + Constants.VHOST,
            "PUBLISH_WHITELIST_ENABLED",
            conversionStep
        );

        this.conversionSteps.push(conversionStep);
    }

    replaceVariableInVhostFileSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Replace any variable that is no longer available."
        );
        return new ConversionStep(
            "Replace any variable that is no longer available",
            "In all" +
                " virtual host files, rename `PUBLISH_DOCROOT` to `DOCROOT` and remove sections " +
                "referring to variables named `DISP_ID`",
            "`PUBLISH_FORCE_SSL` or `PUBLISH_WHITELIST_ENABLED`."
        );
    }

    // 4. Check rewrites folder
    checkRewrites() {
        let conversionStep = this.checkRewritesSummaryGenerator();
        let conf_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D
        );
        let rewrites_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            "rewrites"
        );

        // Remove any file named base_rewrite.rules and xforwarded_forcessl_rewrite.rules and remember to remove Include
        // statements in the virtual host files referring to them.
        let base_rewrite_rules_file = "base_rewrite.rules";
        let xforwarded_forcessl_rewrite_rules =
            "xforwarded_forcessl_rewrite.rules";
        let baseRewriteRuleFilePath = path.join(
            rewrites_dir_path,
            base_rewrite_rules_file
        );
        let xForwardedForceSSLRewriteRulesFilePath = path.join(
            rewrites_dir_path,
            xforwarded_forcessl_rewrite_rules
        );
        if (
            fs.existsSync(baseRewriteRuleFilePath) &&
            fs.lstatSync(baseRewriteRuleFilePath).isFile()
        ) {
            logger.debug(
                "AMSDispatcherConfigConverter: Removing %s.",
                base_rewrite_rules_file
            );
            this.FileOperationsUtility.removeIncludeStatementForSomeRule(
                conf_d_dir_path,
                Constants.INCLUDE_SYNTAX_IN_VHOST,
                Constants.VHOST,
                base_rewrite_rules_file,
                conversionStep
            );
            this.FileOperationsUtility.deleteFile(
                baseRewriteRuleFilePath,
                conversionStep
            );
        }

        if (
            fs.existsSync(xForwardedForceSSLRewriteRulesFilePath) &&
            fs.lstatSync(xForwardedForceSSLRewriteRulesFilePath).isFile()
        ) {
            logger.debug(
                "AMSDispatcherConfigConverter: Removing %s.",
                xforwarded_forcessl_rewrite_rules
            );
            this.FileOperationsUtility.removeIncludeStatementForSomeRule(
                conf_d_dir_path,
                Constants.INCLUDE_SYNTAX_IN_VHOST,
                Constants.VHOST,
                xforwarded_forcessl_rewrite_rules,
                conversionStep
            );
            this.FileOperationsUtility.deleteFile(
                xForwardedForceSSLRewriteRulesFilePath,
                conversionStep
            );
        }

        let files = glob.sync(path.join(rewrites_dir_path, "**", "*.rules"), {
            nodir: true,
        });

        let fileCount = files.length;
        // If conf.d/rewrites now contains a single file
        if (fileCount === 1) {
            // get rule file name
            let old_file_name = path.basename(files[0]);
            let new_file_name = "rewrite.rules";

            // it should be renamed to rewrite.rules
            let renamed_file_path = path.join(
                path.dirname(files[0]),
                new_file_name
            );
            this.FileOperationsUtility.renameFile(files[0], renamed_file_path);
            // adapt the Include statements referring to that file in the virtual host files as well.
            this.FileOperationsUtility.removeIncludeStatementForSomeRule(
                conf_d_dir_path,
                Constants.INCLUDE_SYNTAX_IN_VHOST,
                Constants.VHOST,
                old_file_name,
                conversionStep,
                new_file_name
            );
        } else if (fileCount > 1) {
            let availableVhostFiles = this.getAllAvailableVhostFiles();
            if (availableVhostFiles.length > 1) {
                files.forEach((file) => {
                    let old_file_name = path.basename(file);
                    // their contents should be copied to the Include statement referring to them in the virtual host files.
                    let fileContents = util.getXMLContentSync(file);
                    this.FileOperationsUtility.replaceIncludeStatementWithContentOfRuleFile(
                        conf_d_dir_path,
                        Constants.VHOST,
                        old_file_name,
                        fileContents,
                        Constants.INCLUDE_SYNTAX_IN_VHOST,
                        conversionStep
                    );
                    this.FileOperationsUtility.deleteFile(file);
                });
            } else if (availableVhostFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single vhost file, we should
                // consolidate all the included rule file into a single rule file and include it.
                // get the all the rewrite rule files names
                let ruleFiles = this.FileOperationsUtility.getAllFileNames(
                    files
                );
                let ruleFilesIncluded = this.FileOperationsUtility.getNamesOfRuleFilesIncluded(
                    availableVhostFiles[0],
                    ruleFiles,
                    Constants.INCLUDE_SYNTAX_IN_VHOST
                );

                files = this.filterAndRemoveUnusedFiles(
                    files,
                    ruleFilesIncluded,
                    conversionStep
                );
                this.FileOperationsUtility.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(rewrites_dir_path, "rewrite.rules"),
                    conversionStep
                );
                ruleFiles = this.FileOperationsUtility.getAllFileNames(files);
                //TODO: VALIDATE THIS IS WORKING PROPERLY
                this.FileOperationsUtility.replaceIncludesInFarmAndVhostFile(
                    conf_d_dir_path,
                    Constants.VHOST,
                    Constants.REWRITES_MODULE,
                    ruleFiles,
                    "rewrite.rules",
                    conversionStep
                );
            }
        }

        this.conversionSteps.push(conversionStep);
    }

    checkRewritesSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Check rewrites folder."
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

    removeNonWhitelistedDirectives() {
        let conversionStep = this.removeNonWhitelistedDirectivesSummaryGenerator();
        let available_vhosts_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            Constants.AVAILABLE_VHOSTS
        );
        // create a set from the list of whitelisted directive
        // (in lowercase, since Directives in the configuration files are case-insensitive
        let whitelisted_directives_set = [];
        for (const directive of Constants.WHITELISTED_DIRECTIVES_LIST) {
            whitelisted_directives_set.push(directive.toLowerCase());
        }
        this.FileOperationsUtility.removeNonWhitelistedDirectivesInVhostFiles(
            available_vhosts_dir_path,
            whitelisted_directives_set,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    removeNonWhitelistedDirectivesSummaryGenerator() {
        logger.info(
            "AEMDispatcherConverter: Checking for usage of non-whitelisted directives."
        );
        return new ConversionStep(
            "Remove usage of non-whitelisted directives",
            "Checking for usage of non-whitelisted directives and remove them."
        );
    }

    replaceVariableInFarmFiles() {
        let conversionStep = this.replaceVariableInFarmFilesSummaryGenerator();
        // In all farm files rename PUBLISH_DOCROOT to DOCROOT
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        this.FileOperationsUtility.replaceAllUsageOfOldVariableWithNewVariable(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            "PUBLISH_DOCROOT",
            "DOCROOT"
        );
        this.conversionSteps.push(conversionStep);
    }

    replaceVariableInFarmFilesSummaryGenerator() {
        logger.debug(
            "AEMDispatcherConverter: Renaming PUBLISH_DOCROOT to DOCROOT in all farm files."
        );
        return new ConversionStep(
            "Replace variables in farm files" +
                "Rename PUBLISH_DOCROOT to DOCROOT in all farm files."
        );
    }

    checkClientHeaders() {
        let conversionStep = this.checkClientHeadersSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let client_headers_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            "clientheaders"
        );
        // Remove any file prefixed ams_.
        let ams_files = this.FileOperationsUtility.globGetFilesByPattern(
            path.join(client_headers_dir_path, "**", "*ams_*.any")
        );
        ams_files.forEach((file) => {
            this.FileOperationsUtility.deleteFile(file, conversionStep);
        });
        let files = this.FileOperationsUtility.deleteAllFilesNotConformingToPattern(
            client_headers_dir_path,
            "*.any",
            conversionStep
        );

        let file_count = files.length;
        // If conf.dispatcher.d/clientheaders now contains a single file with suffix _clientheaders.any,
        if (file_count === 1 && files[0].endsWith("_clientheaders.any")) {
            let old_file_name = path.basename(files[0]);
            let new_file_name = "clientheaders.any";
            // it should be renamed to clientheaders.any
            let renamed_file_path = path.join(
                path.dirname(files[0]),
                new_file_name
            );
            this.FileOperationsUtility.renameFile(files[0], renamed_file_path);
            // adapt the $include statements referring to that file in the farm files as well
            this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                old_file_name,
                '"../clientheaders/clientheaders.any"',
                conversionStep
            );
        }
        // If the folder however contains multiple, farm specific files with that pattern,
        else if (file_count > 1) {
            let availableFarmFiles = this.getAllAvailableFarmFiles();
            if (availableFarmFiles.length > 1) {
                availableFarmFiles.forEach((file) => {
                    if (file.endsWith("_clientheaders.any")) {
                        let clientHeaderFileContents = util.getXMLContentSync(
                            file
                        );
                        this.FileOperationsUtility.replaceIncludeStatementWithContentOfRuleFile(
                            conf_dispatcher_d_dir_path,
                            Constants.FARM,
                            path.basename(file),
                            clientHeaderFileContents,
                            Constants.INCLUDE_SYNTAX_IN_FARM,
                            conversionStep
                        );
                        this.FileOperationsUtility.deleteFile(
                            file,
                            conversionStep
                        );
                    }
                });
            } else if (availableFarmFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single farm file,, we should
                // consolidate all the included rule file into a single rule file and include it.
                let ruleFiles = this.FileOperationsUtility.getAllFileNames(
                    files
                );
                // find all the rule files that are actually included in single the farm file
                let ruleFilesIncluded = this.FileOperationsUtility.getNamesOfRuleFilesIncluded(
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
                this.FileOperationsUtility.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(client_headers_dir_path, "clientheaders.any"),
                    conversionStep
                );
                ruleFiles = this.FileOperationsUtility.getAllFileNames(files);
                // replace all statements including the files in a cache-rules section with a single include statement
                let includeStatementToReplaceWith =
                    '$include "../clientheaders/clientheaders.any"';
                //TODO: Validate this is working properly
                this.FileOperationsUtility.replaceIncludesInFarmAndVhostFile(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.CLIENT_HEADER_SECTION,
                    ruleFiles,
                    includeStatementToReplaceWith,
                    conversionStep
                );
            }
        }
        this.copyDefaultClientHeadersFromSDK(
            conf_dispatcher_d_dir_path,
            client_headers_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    checkClientHeadersSummaryGenerator() {
        logger.info(
            "AEMDispatcherConverter: Executing Rule : Checking clientheaders folder."
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

    copyDefaultClientHeadersFromSDK(
        conf_dispatcher_d_dir_path,
        client_headers_dir_path,
        conversionStep
    ) {
        // Copy the file conf.dispatcher.d / clientheaders / default_clientheaders.any from the default skyline dispatcher
        // configuration to that location.
        let default_client_headers_file_from_sdk = path.join(
            this.sdkSrcPath,
            Constants.CONF_DISPATCHER_D,
            "clientheaders",
            "default_clientheaders.any"
        );
        fs.copyFileSync(
            default_client_headers_file_from_sdk,
            path.join(client_headers_dir_path, "default_clientheaders.any")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/clientheaders/default_clientheaders.any' from the standard dispatcher configuration to %s.",
            client_headers_dir_path
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                client_headers_dir_path,
                "Copied file 'conf.dispatcher.d/clientheaders/default_clientheaders.any' from the standard dispatcher configuration to " +
                    client_headers_dir_path
            )
        );
        let replacement_include_file = "";
        let include_pattern_to_replace = "";
        if (
            fs.existsSync(
                path.join(client_headers_dir_path, "clientheaders.any")
            )
        ) {
            replacement_include_file =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "../clientheaders/default_clientheaders.any"';
            include_pattern_to_replace =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "/etc/httpd/conf.dispatcher.d/clientheaders/ams_';
            this.FileOperationsUtility.replaceIncludePatternInSection(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.CLIENT_HEADER_SECTION,
                include_pattern_to_replace,
                replacement_include_file,
                conversionStep
            );
        } else {
            let client_headers_file_from_sdk = path.join(
                this.sdkSrcPath,
                Constants.CONF_DISPATCHER_D,
                "clientheaders",
                "clientheaders.any"
            );
            fs.copyFileSync(
                client_headers_file_from_sdk,
                path.join(client_headers_dir_path, "clientheaders.any")
            );
            logger.info(
                "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/clientheaders/clientheaders.any' from the standard dispatcher configuration to %s.",
                client_headers_dir_path
            );
        }

        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                client_headers_dir_path,
                "Copied file 'conf.dispatcher.d/clientheaders/clientheaders.any' from the standard dispatcher configuration to " +
                    client_headers_dir_path
            )
        );

        replacement_include_file =
            Constants.INCLUDE_SYNTAX_IN_FARM +
            ' "../clientheaders/clientheaders.any"';
        include_pattern_to_replace =
            Constants.INCLUDE_SYNTAX_IN_FARM +
            ' "/etc/httpd/conf.dispatcher.d/clientheaders/ams_';
        this.FileOperationsUtility.replaceIncludePatternInSection(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.CLIENT_HEADER_SECTION,
            include_pattern_to_replace,
            replacement_include_file,
            conversionStep
        );
    }

    checkVariables() {
        let conversionStep = this.checkVariablesSummaryGenerator();
        let conf_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D
        );
        let variables_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            "variables"
        );
        // Remove any file named ams_default.vars and remember to remove Include statements in the virtual host files
        // referring to them.
        let ams_default_vars_file = "ams_default.vars";
        if (
            fs.existsSync(
                path.join(variables_dir_path, ams_default_vars_file)
            ) &&
            fs
                .lstatSync(path.join(variables_dir_path, ams_default_vars_file))
                .isFile()
        ) {
            logger.debug(
                "AMSDispatcherConfigConverter: Removing %s.",
                ams_default_vars_file
            );
            this.FileOperationsUtility.removeIncludeStatementForSomeRule(
                conf_d_dir_path,
                Constants.INCLUDE_SYNTAX_IN_VHOST,
                Constants.VHOST,
                ams_default_vars_file,
                conversionStep
            );
            this.FileOperationsUtility.deleteFile(
                path.join(variables_dir_path, ams_default_vars_file),
                conversionStep
            );
        }

        let files = this.FileOperationsUtility.deleteAllFilesNotConformingToPattern(
            variables_dir_path,
            "*.vars",
            conversionStep
        );
        // consolidate all variable file into once "custom.vars"
        if (files.length > 0) {
            let custom_vars_file = path.join(variables_dir_path, "custom.vars");
            let variables_list = this.FileOperationsUtility.consolidateVariableFiles(
                files,
                custom_vars_file
            );
            // adapt the Include statements referring to the old var files in the vhost files.
            files.forEach((file) => {
                this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                    conf_d_dir_path,
                    Constants.VHOST,
                    Constants.INCLUDE_SYNTAX_IN_VHOST,
                    path.basename(file),
                    path.basename(custom_vars_file),
                    conversionStep
                );
                // delete the old files
                this.FileOperationsUtility.deleteFile(file, conversionStep);
            });
            // check for undefined variables
            this.FileOperationsUtility.checkForUndefinedVariables(
                conf_d_dir_path,
                variables_list
            );
        }

        // Copy the file conf.d/variables/global.vars from the default skyline dispatcher configuration to that location.
        let default_global_vars_file_from_sdk = path.join(
            this.sdkSrcPath,
            "conf.d",
            "variables",
            "global.vars"
        );
        fs.copyFileSync(
            default_global_vars_file_from_sdk,
            path.join(variables_dir_path, "global.vars")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.d/variables/global.vars' from the standard dispatcher configuration to %s.",
            variables_dir_path
        );
        this.conversionSteps.push(conversionStep);
    }

    checkVariablesSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Check variables folder."
        );
        return new ConversionStep(
            "Check variables folder" +
                "In directory `conf.d/variables`, remove any file named `ams_default.vars` " +
                "and remove Include statements in the virtual host files referring to them." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "Consolidate variable definitions from all remaining vars files in `conf.d/variables`" +
                "into a single file named `custom.vars` and adapt the Include statements " +
                "referring to them in the virtual host files."
        );
    }

    removeWhitelists() {
        let conversionStep = this.removeWhitelistsSummaryGenerator();
        let whitelists_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_D,
            "whitelists"
        );
        // remove Include statements in the virtual host files referring to some file in that subfolder.

        // Remove the folder conf.d/whitelists
        this.FolderOperationsUtility.deleteFolder(
            whitelists_dir_path,
            conversionStep
        );

        this.conversionSteps.push(conversionStep);
    }

    removeWhitelistsSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Remove whitelists."
        );
        return new ConversionStep(
            "Remove whitelists" +
                "Remove the folder `conf.d/whitelists` and remove Include statements in " +
                "the virtual host files referring to some file in that subfolder."
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
            this.FileOperationsUtility.deleteAllFilesContainingSubstring(
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
            this.FileOperationsUtility.deleteAllFilesContainingSubstring(
                available_farms_dir_path,
                keyword,
                conversionStep
            );
        });
        this.FileOperationsUtility.removeNonMatchingFilesByName(
            enabled_farms_dir_path,
            available_farms_dir_path,
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

    checkFilter() {
        let conversionStep = this.checkFilterSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let filters_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            "filters"
        );
        // Remove any file prefixed ams_.
        let ams_files = [];
        let globPattern = filters_dir_path + "/**/*" + "*ams_*.any";
        let files = glob.sync(globPattern);
        files.forEach((file) => {
            ams_files.push(file);
        });
        ams_files.forEach((file) => {
            this.FileOperationsUtility.deleteFile(file, conversionStep);
        });
        files = this.FileOperationsUtility.deleteAllFilesNotConformingToPattern(
            filters_dir_path,
            "*.any",
            conversionStep
        );
        let file_count = files.length;
        // If conf.dispatcher.d/filters now contains a single file
        if (file_count === 1 && files[0].endsWith("_filters.any")) {
            let old_file_name = path.basename(files[0]);
            let new_file_name = "filters.any";
            // it should be renamed to filters.any
            let renamed_file_path = path.join(
                path.dirname(files[0]),
                new_file_name
            );
            this.FileOperationsUtility.renameFile(
                files[0],
                renamed_file_path,
                conversionStep
            );
            // adapt the $include statements referring to that file in the farm files as well
            this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                old_file_name,
                new_file_name,
                conversionStep
            );
        } else if (file_count > 1) {
            let availableFarmFiles = this.getAllAvailableFarmFiles();
            if (availableFarmFiles.length > 1) {
                files.forEach((file) => {
                    if (file.endsWith("_filters.any")) {
                        let filterFileContents = util.getXMLContentSync(file);
                        this.FileOperationsUtility.replaceIncludeStatementWithContentOfRuleFile(
                            conf_dispatcher_d_dir_path,
                            Constants.FARM,
                            path.basename(file),
                            filterFileContents,
                            Constants.INCLUDE_SYNTAX_IN_FARM,
                            conversionStep
                        );
                        this.FileOperationsUtility.deleteFile(
                            file,
                            conversionStep
                        );
                    }
                });
            } else if (availableFarmFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single farm file,, we should
                // consolidate all the included rule file into a single rule file and include it.
                let ruleFiles = this.FileOperationsUtility.getAllFileNames(
                    files
                );
                // find all the rule files that are actually included in single the farm file
                let ruleFilesIncluded = this.FileOperationsUtility.getNamesOfRuleFilesIncluded(
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
                this.FileOperationsUtility.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(filters_dir_path, "filters.any"),
                    conversionStep
                );
                ruleFiles = this.FileOperationsUtility.getAllFileNames(files);
                // replace all statements including the files in a cache-rules section with a single include statement
                let includeStatementToReplaceWith =
                    '$include "../filters/filters.any"';
                //TODO: Validate this is working properly
                this.FileOperationsUtility.replaceIncludesInFarmAndVhostFile(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.FILTERS_SECTION,
                    ruleFiles,
                    includeStatementToReplaceWith,
                    conversionStep
                );
            }
        }
        this.copyDefaultFilterFilesFromSDK(
            conf_dispatcher_d_dir_path,
            filters_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    checkFilterSummaryGenerator() {
        logger.info(
            "AEMDispatcherConverter: Executing Rule : Checking filters folder."
        );
        return new ConversionStep(
            "Check filter",
            "In directory `conf.dispatcher.d/filters`, remove any file prefixed `ams_`." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                " If `conf.dispatcher.d/filters` now contains a single file it should be " +
                "renamed to `filters.any` and adapt the `$include` statements referring to " +
                "that file in the farm files as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If the folder however contains multiple, farm specific files with that " +
                "pattern, their contents should be copied to the `$include` statement " +
                "referring to them in the farm files." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "Copy the file `conf.dispatcher/filters/default_filters.any` from the default " +
                "AEM as a Cloud Service dispatcher configuration to that location." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "In each farm file, replace any filter include statements that looks as " +
                'follows: `$include "/etc/httpd/conf.dispatcher.d/filters/ams_publish_filters.any"`' +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                ' with the statement: `$include "../filters/default_filters.any"`'
        );
    }

    copyDefaultFilterFilesFromSDK(
        conf_dispatcher_d_dir_path,
        filtersDirPath,
        conversionStep
    ) {
        let defaultFiltersFileFromSDK = path.join(
            this.sdkSrcPath,
            Constants.CONF_DISPATCHER_D,
            "filters",
            "default_filters.any"
        );
        let filtersFilePath = path.join(filtersDirPath, "filters.any");
        fs.copyFileSync(
            defaultFiltersFileFromSDK,
            path.join(filtersDirPath, "default_filters.any")
        );
        logger.info(
            "AEMDispatcherConverter: Copied file 'conf.dispatcher.d/filters/default_filters.any' from the standard dispatcher configuration to %s.",
            filtersDirPath
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                filtersDirPath,
                "Copied file 'conf.dispatcher.d/filters/default_filters.any' from the standard dispatcher configuration to " +
                    filtersDirPath
            )
        );
        let replacement_include_file = "";
        let include_pattern_to_replace = "";
        if (fs.existsSync(filtersFilePath)) {
            replacement_include_file =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "../filters/default_filters.any"';
            include_pattern_to_replace =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "/etc/httpd/conf.dispatcher.d/filters/ams';
            this.FileOperationsUtility.replaceIncludePatternInSection(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.FILTERS_SECTION,
                include_pattern_to_replace,
                replacement_include_file,
                conversionStep
            );
        } else {
            let client_headers_file_from_sdk = path.join(
                this.sdkSrcPath,
                Constants.CONF_DISPATCHER_D,
                "filters",
                "filters.any"
            );
            fs.copyFileSync(client_headers_file_from_sdk, filtersFilePath);
            logger.info(
                "AEMDispatcherConverter: Copied file 'conf.dispatcher.d/filters/filters.any' from the standard dispatcher configuration to %s.",
                filtersDirPath
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    filtersDirPath,
                    "Copied file 'conf.dispatcher.d/filters/filters.any` 'from the standard dispatcher configuration to " +
                        filtersDirPath
                )
            );
            replacement_include_file =
                Constants.INCLUDE_SYNTAX_IN_FARM + ' "../filters/filters.any"';
            include_pattern_to_replace =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "/etc/httpd/conf.dispatcher.d/filters/ams';
            this.FileOperationsUtility.replaceIncludePatternInSection(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.FILTERS_SECTION,
                include_pattern_to_replace,
                replacement_include_file,
                conversionStep
            );
        }
    }

    renameFarmFiles() {
        let conversionStep = this.renameFarmFilesSummaryGenerator();

        let available_farms_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            Constants.AVAILABLE_FARMS
        );
        let availableFarmsFiles = glob.sync(
            path.join(available_farms_dir_path, "**", "*.any")
        );
        availableFarmsFiles.forEach((file) => {
            let new_file_name = path
                .basename(file)
                .replace("_farm", "")
                .replace(".any", ".farm");
            this.FileOperationsUtility.renameFile(
                file,
                path.join(path.dirname(file), new_file_name)
            );
        });

        let enabled_farms_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            Constants.ENABLED_FARMS
        );
        //let files = FileOperationsUtility.globGetFilesByExtension(enabled_farms_dir_path, ".any");

        // TODO: We need to add sybmolic link logic here similar to python code...
        let files = glob.sync(path.join(enabled_farms_dir_path, "**", "*.any"));
        files.forEach((file) => {
            let new_file_name = path
                .basename(file)
                .replace("_farm", "")
                .replace(".any", ".farm");
            this.FileOperationsUtility.renameFile(
                file,
                path.join(path.dirname(file), new_file_name)
            );
        });

        this.conversionSteps.push(conversionStep);
    }

    renameFarmFilesSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : All farms in conf.d/enabled_farms and " +
                "conf.d/available_farms must be renamed to match the pattern '*.farm'."
        );

        return new ConversionStep(
            "Rename farm files" +
                "All farms in `conf.d/enabled_farms` must be renamed to match the pattern " +
                "`*.farm` , so e.g. a farm file called `customerX_farm.any` should be " +
                "renamed `customerX.farm`."
        );
    }

    checkCache() {
        let conversionStep = this.checkCacheSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let cache_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            "cache"
        );
        // Remove any file prefixed ams_.
        // remove include statements for the deleted files from farm files
        let cache_files = this.FileOperationsUtility.globGetFilesByPattern(
            path.join(cache_dir_path, "**", "*.any")
        );
        let ams_files = glob.sync(
            path.join(cache_dir_path, "**", "*ams_*.any")
        );
        ams_files.forEach((amsFile) => {
            // if not all files start with 'ams' prefix
            let amsFilePath = amsFile;
            amsFile = path.basename(amsFile);
            if (cache_files.length > ams_files.length) {
                this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.INCLUDE_SYNTAX_IN_FARM,
                    amsFile,
                    '"../cache/default_rules.any"',
                    conversionStep
                );
            }
            this.FileOperationsUtility.deleteFile(amsFilePath, conversionStep);
        });

        let files = this.FileOperationsUtility.globGetFilesByPattern(
            path.join(cache_dir_path, "**", "*.any")
        );
        let file_count = files.length;

        let default_rules_file_from_sdk = path.join(
            this.sdkSrcPath,
            "conf.dispatcher.d",
            "cache",
            "default_rules.any"
        );
        fs.copyFileSync(
            default_rules_file_from_sdk,
            path.join(cache_dir_path, "default_rules.any")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/cache/default_rules.any' from the standard dispatcher configuration to %s.",
            cache_dir_path
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                cache_dir_path,
                "Copied file 'conf.dispatcher.d/cache/default_rules.any " +
                    "from the standard dispatcher configuration to " +
                    cache_dir_path
            )
        );

        // If conf.dispatcher.d/cache is now empty, copy the file conf.dispatcher.d/cache/rules.any from the standard
        // dispatcher configuration to this folder.
        // The standard dispatcher configuration can be found in the folder src of the SDK

        if (file_count === 0) {
            let rules_file_from_sdk = path.join(
                this.sdkSrcPath,
                "conf.dispatcher.d",
                "cache",
                "rules.any"
            );
            fs.copyFileSync(
                rules_file_from_sdk,
                path.join(cache_dir_path, "rules.any")
            );
            logger.info(
                "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/cache/rules.any' from the standard dispatcher configuration to %s.",
                cache_dir_path
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    cache_dir_path,
                    "Copied file 'conf.dispatcher.d/cache/rules.any " +
                        "from the standard dispatcher configuration to " +
                        cache_dir_path
                )
            );

            let includeStatementToReplaceWith = '$include "../cache/rules.any"';

            // adapt the $include statements referring to the the ams_*_cache.any rule files in the farm file
            this.FileOperationsUtility.replaceContentOfSection(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.RULES_SECTION,
                includeStatementToReplaceWith,
                conversionStep
            );
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
            this.FileOperationsUtility.renameFile(files[0], renamed_file_path);
            // adapt the $include statements referring to that file in the farm files as well
            this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                old_file_name,
                '"../cache/rules.any"',
                conversionStep
            );
        }
        // If the folder however contains multiple, farm specific files with that pattern,
        // their contents should be copied to the $include statement referring to them in the farm files.
        else if (file_count > 1) {
            let availableFarmFiles = this.getAllAvailableFarmFiles();
            if (availableFarmFiles.length > 1) {
                files.forEach((file) => {
                    if (file.endsWith("_cache.any")) {
                        let cacheFileContents = util.getXMLContentSync(file);
                        this.FileOperationsUtility.replaceIncludeStatementWithContentOfRuleFile(
                            conf_dispatcher_d_dir_path,
                            Constants.FARM,
                            path.basename(file),
                            cacheFileContents,
                            Constants.INCLUDE_SYNTAX_IN_FARM,
                            conversionStep
                        );
                        this.FileOperationsUtility.deleteFile(
                            file,
                            conversionStep
                        );
                    }
                });
            } else if (availableFarmFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single farm file,, we should
                // consolidate all the included rule file into a single rule file and include it.
                let ruleFiles = this.FileOperationsUtility.getAllFileNames(
                    files
                );
                // find all the rule files that are actually included in single the farm file
                let ruleFilesIncluded = this.FileOperationsUtility.getNamesOfRuleFilesIncluded(
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
                this.FileOperationsUtility.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(cache_dir_path, "rules.any"),
                    conversionStep
                );
                ruleFiles = this.FileOperationsUtility.getAllFileNames(files);
                // replace all statements including the files in a cache-rules section with a single include statement
                let includeStatementToReplaceWith =
                    '$include "../cache/rules.any"';
                //TODO: Validate this is working properly
                this.FileOperationsUtility.replaceFileIncludesInFarmFileAndVhostFile(
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
                this.FileOperationsUtility.deleteFile(file, conversionStep);
            }
        });

        // Copy the file conf.dispatcher.d/cache/default_invalidate_any from the default skyline dispatcher
        // configuration to that location.
        let default_invalidate_file_from_sdk = path.join(
            this.sdkSrcPath,
            "conf.dispatcher.d",
            "cache",
            "default_invalidate.any"
        );
        fs.copyFileSync(
            default_invalidate_file_from_sdk,
            path.join(cache_dir_path, "default_invalidate.any")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/cache/default_invalidate_any' from the standard dispatcher configuration to %s.",
            cache_dir_path
        );
        // In each farm file, remove any contents in the cache/allowedClients section and replace it with:
        // $include "../cache/default_invalidate.any"
        let include_statement_to_replace_with =
            '$include "../cache/default_invalidate.any"';
        this.FileOperationsUtility.replaceContentOfSection(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.ALLOWED_CLIENTS_SECTION,
            include_statement_to_replace_with,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    checkCacheSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Checking cache folder."
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

    checkRenderers() {
        let conversionStep = this.checkRenderersSummaryGenerator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let renders_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D,
            "renders"
        );
        //# Remove all files in that folder.
        let files = glob.sync(renders_dir_path + "/**/*.any");
        files.forEach((file) => {
            this.FileOperationsUtility.deleteFile(file, conversionStep);
        });

        // Copy the file conf.dispatcher.d/renders/default_renders.any from the default skyline dispatcher
        // configuration to that location.
        let default_filters_file_from_sdk = path.join(
            this.sdkSrcPath,
            Constants.CONF_DISPATCHER_D,
            "/renders/default_renders.any"
        );
        fs.copyFileSync(
            default_filters_file_from_sdk,
            path.join(renders_dir_path, "default_renders.any")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/renders/default_renders.any' from the standard dispatcher configuration to %s.",
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
        this.FileOperationsUtility.replaceContentOfSection(
            conf_dispatcher_d_dir_path,
            Constants.FARM,
            Constants.RENDERS_SECTION,
            include_statement_to_replace_with,
            conversionStep
        );

        this.conversionSteps.push(conversionStep);
    }

    checkRenderersSummaryGenerator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Checking renders folder."
        );
        return new ConversionStep(
            "Check renders",
            +"Remove all files in the directory `conf.dispatcher.d/renders'." +
                "Copy the file `conf.dispatcher.d/renders/default_renders.any` from the " +
                "default AEM as a Cloud Service dispatcher configuration to that location." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "In each farm file, remove any contents in the renders section and replace " +
                'it with: `$include "../renders/default_renders.any"`'
        );
    }

    checkVhosts() {
        let conversionStep = this.__check_virtualhosts_summary_generator();
        let conf_dispatcher_d_dir_path = path.join(
            this.dispatcherConfigPath,
            Constants.CONF_DISPATCHER_D
        );
        let old_virtualhosts_dir_path = path.join(
            conf_dispatcher_d_dir_path,
            "vhosts"
        );
        let renamed_virtualhosts_dir_path = path.join(
            conf_dispatcher_d_dir_path,
            "virtualhosts"
        );
        // Rename the directory conf.dispatcher.d/vhosts to conf.dispatcher.d/virtualhosts and enter it.

        if (
            fs.existsSync(old_virtualhosts_dir_path) &&
            fs.lstatSync(old_virtualhosts_dir_path).isDirectory()
        ) {
            this.FolderOperationsUtility.renameFolder(
                old_virtualhosts_dir_path,
                renamed_virtualhosts_dir_path,
                conversionStep
            );
        }

        // Remove any file prefixed ams_.
        this.FileOperationsUtility.deleteAllFilesContainingSubstring(
            renamed_virtualhosts_dir_path,
            "ams_",
            conversionStep
        );
        let files = this.FileOperationsUtility.deleteAllFilesNotConformingToPattern(
            renamed_virtualhosts_dir_path,
            "*.any",
            conversionStep
        );

        let fileCount = files.length;

        if (fileCount === 1 && files[0].endsWith("vhosts.any")) {
            let old_file_name = path.basename(files[0]);
            let new_file_name = '"../virtualhosts/virtualhosts.any"';
            // it should be renamed to virtualhosts.any
            let renamed_file_path = path.join(
                path.dirname(files[0]),
                new_file_name
            );
            this.FileOperationsUtility.renameFile(files[0], renamed_file_path);
            // adapt the $include statements referring to that file in the farm files as well
            this.FileOperationsUtility.replaceIncludeStatementWithNewRule(
                conf_dispatcher_d_dir_path,
                Constants.FARM,
                Constants.INCLUDE_SYNTAX_IN_FARM,
                old_file_name,
                new_file_name,
                conversionStep
            );
        } else if (fileCount > 1) {
            let availableFarmFiles = this.getAllAvailableFarmFiles();
            if (availableFarmFiles.length > 1) {
                files.forEach((file) => {
                    if (file.endsWith("_vhosts.any")) {
                        let vhostFileContents = util.getXMLContentSync(file);
                        this.FileOperationsUtility.replaceIncludeStatementWithContentOfRuleFile(
                            conf_dispatcher_d_dir_path,
                            Constants.FARM,
                            path.basename(file),
                            vhostFileContents,
                            Constants.INCLUDE_SYNTAX_IN_FARM,
                            conversionStep
                        );
                        this.FileOperationsUtility.deleteFile(
                            file,
                            conversionStep
                        );
                    }
                });
            } else if (availableFarmFiles.length === 1) {
                // If the folder however contains multiple rule files specific to a single farm file,, we should
                // consolidate all the included rule file into a single rule file and include it.
                let ruleFiles = this.FileOperationsUtility.getAllFileNames(
                    files
                );
                // find all the rule files that are actually included in single the farm file
                let ruleFilesIncluded = this.FileOperationsUtility.getNamesOfRuleFilesIncluded(
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
                this.FileOperationsUtility.consolidateAllRuleFilesIntoSingleRuleFile(
                    files,
                    path.join(
                        renamed_virtualhosts_dir_path,
                        "virtualhosts.any"
                    ),
                    conversionStep
                );
                //ruleFiles = this.FileOperationsUtility.getAllFileNames(files);
                // replace all statements including the files in a cache-rules section with a single include statement
                let includeStatementToReplaceWith =
                    '$include "../virtualhosts/virtualhosts.any"';
                //TODO: Validate this is working properly
                this.FileOperationsUtility.replaceIncludesInFarmAndVhostFile(
                    conf_dispatcher_d_dir_path,
                    Constants.FARM,
                    Constants.VIRTUALHOSTS_SECTION_IN_FARM,
                    ruleFiles,
                    includeStatementToReplaceWith,
                    conversionStep
                );
            }
        }
        this.__copy_default_virtualhost_files_from_sdk(
            conf_dispatcher_d_dir_path,
            renamed_virtualhosts_dir_path,
            conversionStep
        );
        this.conversionSteps.push(conversionStep);
    }

    __copy_default_virtualhost_files_from_sdk(
        dispatcherDirPath,
        renamedVhostPath,
        conversionStep
    ) {
        let default_virtualhost_file_from_sdk = path.join(
            this.sdkSrcPath,
            Constants.CONF_DISPATCHER_D,
            "virtualhosts",
            "default_virtualhosts.any"
        );
        fs.copyFileSync(
            default_virtualhost_file_from_sdk,
            path.join(renamedVhostPath, "default_virtualhosts.any")
        );
        logger.info(
            "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/virtualhosts/default_virtualhosts.any' from the standard dispatcher configuration to %s.",
            dispatcherDirPath
        );
        conversionStep.addOperation(
            new ConversionOperation(
                commons_constants.ACTION_ADDED,
                renamedVhostPath,
                "Copied file " +
                    "'conf.dispatcher.d/virtualhosts/default_virtualhosts.any'" +
                    "'from the standard dispatcher configuration to " +
                    renamedVhostPath
            )
        );

        if (fs.existsSync(renamedVhostPath + "/virtualhosts.any")) {
            // In each farm file, replace any filter include statements that looks as follows:
            // $include "/etc/httpd/conf.dispatcher.d/vhosts/ams_publish_vhosts.any"
            // with the statement:
            // $include "../virtualhosts/default_virtualhosts.any"
            let replacement_include_file =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "../virtualhosts/default_virtualhosts.any"';
            let include_pattern_to_replace =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "/etc/httpd/conf.dispatcher.d/vhosts/ams_';
            this.FileOperationsUtility.replaceIncludePatternInSection(
                dispatcherDirPath,
                Constants.FARM,
                Constants.VIRTUALHOSTS_SECTION_IN_FARM,
                include_pattern_to_replace,
                replacement_include_file,
                conversionStep
            );
        } else {
            let virtualhost_file_from_sdk = path.join(
                this.sdkSrcPath,
                Constants.CONF_DISPATCHER_D,
                "virtualhosts/virtualhosts.any"
            );
            fs.copyFileSync(
                virtualhost_file_from_sdk,
                path.join(renamedVhostPath, "virtualhosts.any")
            );
            logger.info(
                "AMSDispatcherConfigConverter: Copied file 'conf.dispatcher.d/virtualhosts/virtualhosts.any' from the standard dispatcher configuration to %s.",
                renamedVhostPath
            );
            conversionStep.addOperation(
                new ConversionOperation(
                    commons_constants.ACTION_ADDED,
                    renamedVhostPath,
                    "Copied file 'conf.dispatcher.d/virtualhosts/virtualhosts.any' from the standard dispatcher configuration to " +
                        renamedVhostPath
                )
            );
            // In each farm file, replace any filter include statements that looks as follows:
            // $include "/etc/httpd/conf.dispatcher.d/vhosts/ams_publish_vhosts.any"
            // with the statement:
            // $include "../virtualhosts/virtualhosts.any"
            let replacement_include_file =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "../virtualhosts/virtualhosts.any"';
            let include_pattern_to_replace =
                Constants.INCLUDE_SYNTAX_IN_FARM +
                ' "/etc/httpd/conf.dispatcher.d/vhosts/ams_';
            this.FileOperationsUtility.replaceIncludePatternInSection(
                dispatcherDirPath,
                Constants.FARM,
                Constants.VIRTUALHOSTS_SECTION_IN_FARM,
                include_pattern_to_replace,
                replacement_include_file,
                conversionStep
            );
        }
    }

    __check_virtualhosts_summary_generator() {
        logger.info(
            "AMSDispatcherConfigConverter: Executing Rule : Checking vhosts folder."
        );
        return new ConversionStep(
            "Check VirtualHosts",
            "Rename the directory `conf.dispatcher.d/vhosts` to " +
                "`conf.dispatcher.d/virtualhosts`. Remove any file prefixed `ams_` ." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If `conf.dispatcher.d/virtualhosts` now contains a single file it should " +
                "be renamed to `virtualhosts.any` and adapt the `$include` statements " +
                "referring to that file in the farm files as well." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "If the folder however contains multiple, farm specific files with that " +
                "pattern, their contents should be copied to the `$include` statement " +
                "referring to them in the farm files." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "Copy the file `conf.dispatcher/virtualhosts/default_virtualhosts.any` from " +
                "the default AEM as a Cloud Service dispatcher configuration to that location." +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                "In each farm file, replace any filter include statement that looks like :" +
                '`$include "/etc/httpd/conf.dispatcher.d/vhosts/ams_publish_vhosts.any"`' +
                Constants.SUMMARY_REPORT_LINE_SEPARATOR +
                ' with the statement: `$include "../virtualhosts/default_virtualhosts.any"`'
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

    filterAndRemoveUnusedFiles(allFiles, usedFileNames, conversionStep) {
        let usedFiles = [];

        allFiles.forEach((file) => {
            if (usedFileNames.includes(path.basename(file))) {
                usedFiles.push(file);
            } else {
                this.FileOperationsUtility.deleteFile(file, conversionStep);
            }
        });

        return usedFiles;
    }
}
//let aem_dispatcher_config_converter = new AEMDispatcherConfigConverter("/Users/prateeks/Issues/Dispatcher/SDK/dispatcher-sdk-2.0.21.1/src", "../"+commons_constants.TARGET_DISPATCHER_SRC_FOLDER);

module.exports = AEMDispatcherConfigConverter;
