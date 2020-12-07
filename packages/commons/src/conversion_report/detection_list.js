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

class DetectionList {
    /*
     * DetectionList describes a list of elements that has been detected with the objective of source migration.
     */

    /**
     *
     * @param {String} heading The header or tile of the list which describes the list of elements.
     *
     */
    constructor(heading = "") {
        this.heading = heading;
        this.detection_list = [];
    }
    /**
     *
     * @param {element}
     * @private
     *
     * Add an element that was detected while executing the migration.
     */
    addList(element) {
        this.detection_list.push(element);
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the heading of the list of elements.
     */
    getHeading() {
        return this.heading;
    }

    /**
     *
     * @returns {[List[String]]}
     * @private
     *
     * Get the list of elements detected  while executing the migration.
     */
    getDetectionList() {
        return this.detection_list;
    }

    /**
     *
     * @returns {boolean}
     * @private
     *
     * Find whether any element has been detected  while executing the migration
     *
     * Return:
     * boolean: `true` if at least one element has been detected or added, else `false`
     */
    isDetected() {
        return this.detection_list.length > 0;
    }
}

module.exports = DetectionList;
