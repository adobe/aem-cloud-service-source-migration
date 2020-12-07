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

const ConversionStep = require("./conversion_step");
const ConversionOperation = require("./conversion_operation");
const DetectionList = require("./detection_list");
const constants = require("../constants");
const logger = require("../logger");
const fsExtra = require("fs-extra");
const fs = require("fs");
const path = require("path");
const LINE_SEP = constants.SUMMARY_REPORT_LINE_SEPARATOR;

class SummaryReportWriter {
    // A utility class that provides functionality for creation of summary report for the migration

    /**
     *
     * @param {Array[ConversionStep || DetectionList]} summaryReportWriter List of conversion_step or detection_list that are to be added to the summary report
     * @param String target The path/location where the summary report need to be created
     * @param String report_name The name of the base summary report template file
     * @private
     *
     * Create a summary report which contains the conversion_step  followed (and operations performed) or detection_list during the conversion
     */
    static writeSummaryReport(summaryReportWriter, target, report_name) {
        // create a copy of the summary report template file in the target folder
        let file_path = path.join(process.cwd(), target, report_name);
        try {
            fsExtra.copyFileSync(
                path.join(__dirname, constants.TEMPLATE_FOLDER, report_name),
                file_path
            );
            logger.info(
                "Base summary report template " +
                    report_name +
                    " copied to " +
                    target
            );
        } catch (err) {
            logger.error(
                "Error copying " +
                    report_name +
                    " to " +
                    target +
                    " with error " +
                    err
            );
        }
        summaryReportWriter.forEach((step) => {
            if (step instanceof ConversionStep) {
                // only if some operation is actually performed under the conversion_step
                if (step.isPerformed()) {
                    fs.appendFileSync(file_path, LINE_SEP);
                    fs.appendFileSync(file_path, `#### ${step.getRule()}`);
                    fs.appendFileSync(file_path, LINE_SEP);
                    fs.appendFileSync(file_path, step.getDescription());
                    fs.appendFileSync(file_path, LINE_SEP);
                    SummaryReportWriter.appendTableHeader(file_path);
                    SummaryReportWriter.appendOperation(
                        file_path,
                        step.getOperations()
                    );
                }
            } else if (step instanceof DetectionList) {
                if (step.isDetected()) {
                    // only if some element is actually added under the detection_step
                    fs.appendFileSync(file_path, LINE_SEP);
                    fs.appendFileSync(file_path, step.getHeading());
                    fs.appendFileSync(file_path, LINE_SEP);
                    step.getDetectionList().forEach((element) => {
                        fs.appendFileSync(file_path, "*  " + element);
                        fs.appendFileSync(file_path, LINE_SEP);
                    });
                }
            } else {
                fs.appendFileSync(file_path, LINE_SEP);
                fs.appendFileSync(file_path, step);
            }
        });
        logger.info(report_name + " generation complete.");
    }

    /**
     * Appends header to the table in Summary Report
     */
    static appendTableHeader(file_path) {
        fs.appendFileSync(file_path, "\r\n");
        fs.appendFileSync(file_path, "| ");
        fs.appendFileSync(file_path, "Action Type");
        fs.appendFileSync(file_path, " | ");
        fs.appendFileSync(file_path, "Location");
        fs.appendFileSync(file_path, " | ");
        fs.appendFileSync(file_path, "Action");
        fs.appendFileSync(file_path, " |");
        fs.appendFileSync(file_path, LINE_SEP);
        fs.appendFileSync(file_path, "| ----------- | -------- | ------ |");
        fs.appendFileSync(file_path, LINE_SEP);
    }

    /**
     * Appends the row entry to the table in Summary Report
     * @param conversion_operations
     */
    static appendOperation(file_path, conversion_operations) {
        conversion_operations.forEach((conversion_operation) => {
            if (conversion_operation instanceof ConversionOperation) {
                fs.appendFileSync(file_path, "|");
                fs.appendFileSync(
                    file_path,
                    " " + conversion_operation.getOperationType() + " "
                );
                fs.appendFileSync(file_path, "|");
                fs.appendFileSync(
                    file_path,
                    " " + conversion_operation.getOperationLocation() + " "
                );
                fs.appendFileSync(file_path, "|");
                fs.appendFileSync(
                    file_path,
                    " " + conversion_operation.getOperationAction() + " "
                );
                fs.appendFileSync(file_path, "|");
                fs.appendFileSync(file_path, LINE_SEP);
            }
        });
    }
}

module.exports = SummaryReportWriter;
