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

class ConversionOperation {
    /*
     * ConversionOperation describes a single operation (can be add/remove/rename/replace/delete operation) which has been
     * performed on the source code as part of some conversion step.
     */

    /**
     *
     * @param {String} operationType The type of operation performed.
     * @param {String} operationLocation The location at which the operation has been performed.
     * @param {String} operationAction The gist of the operation performed.
     *
     */
    constructor(operationType, operationLocation, operationAction) {
        this.action = operationAction;
        this.location = operationLocation;
        this.type = operationType;
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the type of operation performed
     */
    getOperationType() {
        return this.type;
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the location at which the operation has been performed
     */
    getOperationLocation() {
        return this.location;
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the gist of the operation performed
     */
    getOperationAction() {
        return this.action;
    }
}

module.exports = ConversionOperation;
