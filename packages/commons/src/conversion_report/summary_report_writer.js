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
     * @param {List[ConversionStep]} ConversionStep List of steps performed that are to be added to the summary report
     * @private
     *
     * Create a summary report which contains the step followed (and operations performed) during the conversion
     */
    static writeSummaryReport(conversion_steps, target, report_name) {
        // create a copy of the summary report template file in the target folder
        let file_path = path.join(process.cwd(), target, report_name);
        try {
            fsExtra.copyFileSync(path.join(__dirname, report_name), file_path);
            logger.info(report_name + " copied successfully to " + target);
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
        conversion_steps.forEach((conversion_step) => {
            if (conversion_step instanceof ConversionStep) {
                // only if some operation is actually performed under the step
                if (conversion_step.isPerformed()) {
                    fs.appendFileSync(file_path, LINE_SEP);
                    fs.appendFileSync(
                        file_path,
                        `#### + ${conversion_step.getRule()}`
                    );
                    fs.appendFileSync(file_path, LINE_SEP);
                    fs.appendFileSync(
                        file_path,
                        conversion_step.getDescription()
                    );
                    fs.appendFileSync(file_path, LINE_SEP);
                    SummaryReportWriter.appendTableHeader(file_path);
                    SummaryReportWriter.appendOperation(
                        file_path,
                        conversion_step.getOperations()
                    );
                }
            }
        });
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
