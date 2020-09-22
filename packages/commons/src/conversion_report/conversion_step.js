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

class ConversionStep {
    /*
     * ConversionStep describes a single step (or rule) that has been performed with the objective of source migration.
     * Each step (or rule) can have multiple ConversionOperation performed as part of it.
     */

    /**
     *
     * @param {String} rule The rule that is being followed while executing the particular ConversionStep.
     * @param {String} description The details of the rule that is being followed for ConversionStep.
     *
     */
    constructor(rule = "", description = "") {
        this.rule = rule;
        this.description = description;
        this.operations_performed = [];
    }

    /**
     *
     * @param {ConversionOperation}
     * @private
     *
     * Add an operation that was performed while executing the ConversionStep
     */
    addOperation(operation) {
        this.operations_performed.push(operation);
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the rule that is being followed while executing the particular ConversionStep.
     */
    getRule() {
        return this.rule;
    }

    /**
     *
     * @returns {String}
     * @private
     *
     * Get the details of the rule that is being followed while executing the particular ConversionStep.
     */
    getDescription() {
        return this.description;
    }

    /**
     *
     * @returns {[List[ConversionOperation]]}
     * @private
     *
     * Get the list of operations performed while executing the particular ConversionStep
     */
    getOperations() {
        return this.operations_performed;
    }

    /**
     *
     * @returns {boolean}
     * @private
     *
     * Find whether any operation has been performed while executing the particular ConversionStep
     *
     * Return:
     * boolean: `true` if at least one operation has been performed, else `false`
     */
    isPerformed() {
        return this.operations_performed.length > 0;
    }
}

module.exports = ConversionStep;
