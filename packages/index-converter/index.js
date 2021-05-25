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
    constants: common_constants,
    SummaryReportWriter,
    logger,
} = require("@adobe/aem-cs-source-migration-commons");

const indexConverter = require("./src/index-converter.js");
const ensureDefinitionConverter = require("./src/ensure-definition-converter.js");
const constants = require("./src/util/constants.js");
const fs = require("fs");
const path = require("path");

let fileName = path.basename(__filename);

var IndexConverter = {
    /**
     *
     * @param config yaml object containing info of project to be restructured
     * @param basePath root path of project to be restructured
     *
     * Convert Oak Index Definitions
     */
    performIndexConversion: (config, basePath) => {
        console.log("Index Conversion Start...");
        logger.info(fileName + ": Index Conversion Start...");
        if (config.aemVersion == null) {
            let aemVersionMessage =
                "AEM Version is not provided, Please update 'aemVersion' property in yaml file";
            logger.error(fileName + ": " + aemVersionMessage);
            console.log(aemVersionMessage);
            return;
        }

        console.log("Base AEM Version for Reference " + config.aemVersion);
        logger.info(
            fileName + ": Base AEM Version for Reference " + config.aemVersion
        );

        if (
            config.customOakIndexDirectoryPath == null &&
            config.ensureIndexDefinitionContentPackageJcrRootPath == null
        ) {
            let configMessage =
                "Both customOakIndexDirectoryPath and ensureIndexDefinitionContentPackageJcrRootPath can not be null. Please provide value for either";
            logger.error(fileName + ": " + configMessage);
            console.log(configMessage);
            return;
        }

        // create a new target index definition folder
        fs.mkdirSync(common_constants.TARGET_INDEX_FOLDER, { recursive: true });
        var writer_buffer = [];
        writer_buffer.push(
            "## AEM as a Cloud Service - Index Conversion Report Update "
        );
        logger.info("Index Conversion Report Update ");
        writer_buffer.push(constants.LINE_SEPARATOR);
        writer_buffer.push(
            "Base AEM Version for Reference:\t " + config.aemVersion
        );
        writer_buffer.push(
            "Custom Oak Index Definition content.xml(s) are placed at below paths :"
        );
        writer_buffer.push(config.customOakIndexDirectoryPath);
        writer_buffer.push(
            config.ensureIndexDefinitionContentPackageJcrRootPath
        );
        writer_buffer.push(constants.LINE_SEPARATOR);

        logger.info(
            fileName +
                ": Custom Oak Index Definition content.xml(s) are placed at '" +
                config.customOakIndexDirectoryPath +
                "','" +
                config.ensureIndexDefinitionContentPackageJcrRootPath +
                "'"
        );
        // Convert Ensure Definitions
        let wasEnsureDefinitionConverted =
            ensureDefinitionConverter.performConversion(config, writer_buffer);
        if (
            !wasEnsureDefinitionConverted &&
            config.customOakIndexDirectoryPath == null
        ) {
            let infoMessage =
                "No legit custom indexes are found , can not process further.";
            logger.info(fileName + ": " + infoMessage);
            console.log(infoMessage);
            return;
        }
        // Convert Index Definitions
        let conversionCompleted = indexConverter.performConversion(
            config,
            basePath,
            wasEnsureDefinitionConverted,
            writer_buffer
        );
        writer_buffer.push(
            "Note: For transforming `property` type index into `lucence` type index. Please refer " +
                "`http://jackrabbit.apache.org/oak/docs/query/lucene.html`."
        );
        let reportMessage =
            "Index Converter Report can be found at '" +
            path.join(
                process.cwd(),
                common_constants.TARGET_INDEX_FOLDER,
                constants.INDEX_CONVERTER_REPORT
            ) +
            "'";
        let logFileMessage =
            "Index Converter logs can be found at '" +
            path.join(process.cwd(), common_constants.LOG_FILE) +
            "'";
        let outFilePathMessage =
            "Output .content.xml after transformation can be found at '" +
            path.join(
                process.cwd(),
                common_constants.TARGET_INDEX_FOLDER,
                constants.OUTPUT_FILE_NAME
            ) +
            "'";
        let filterXML =
            "Updated filter.xml can be found at '" +
            path.join(
                process.cwd(),
                common_constants.TARGET_INDEX_FOLDER,
                constants.FILTER_XML_NAME
            ) +
            "'";
        if (conversionCompleted) {
            SummaryReportWriter.writeSummaryReport(
                writer_buffer,
                common_constants.TARGET_INDEX_FOLDER,
                constants.INDEX_CONVERTER_REPORT
            );

            console.log("Index Conversion Completed");
            logger.info(fileName + ": Index Conversion Completed");

            console.log(reportMessage);
            console.log(logFileMessage);
            console.log(outFilePathMessage);

            logger.info(fileName + ": " + reportMessage);
            logger.info(fileName + ": " + outFilePathMessage);

            if (config.filterXMLPath != null) {
                logger.info(fileName + ": " + filterXML);
                console.log(filterXML);
            }
        }
    },
};

module.exports = IndexConverter;
