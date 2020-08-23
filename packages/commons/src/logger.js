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

const constants = require("./constants");
const winston = require("winston");
const path = require("path");

const logger = new winston.createLogger({
    level: "verbose",
    format: winston.format.combine(
        winston.format.timestamp({ format: `ddd, DD MMM YYYY HH:mm:ss` }),
        winston.format.printf((log) => {
            return `${log.timestamp} | ${log.level}: ${log.message}`;
        })
    ),
    transports: [
        new winston.transports.File({
            colorize: true,
            json: false,
            filename: path.join(process.cwd(), constants.LOG_FILE),
            level: "info",
        }),
    ],
});

logger.stream = {
    write: function (message) {
        logger.info(message);
    },
};

module.exports = logger;
