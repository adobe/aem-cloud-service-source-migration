const AssertionError = require("chai").assert;
const assert = require("chai").assert;
const conversionStep = require("../src/conversion_report/conversion_step");
const conversionOperation = require("../src/conversion_report/conversion_operation");
const constants = require("../src/constants");

describe("ConversionSteps", () => {
    beforeEach(() => {
        this.step = new conversionStep("rule", "description");
    });

    it("test get operations", () => {
        try {
            this.step.addOperation(
                new conversionOperation(
                    constants.ACTION_DELETED,
                    "location",
                    "Action"
                )
            );
            assert.isTrue(
                this.step.getOperations().length > 0,
                "Length is greater than 0"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("test get description", () => {
        try {
            assert.isTrue(
                this.step.getDescription().toString() === "description"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("test get rule", () => {
        try {
            assert.isTrue(this.step.getRule().toString() === "rule");
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("test is Performed", () => {
        try {
            this.step.addOperation(
                new conversionOperation(
                    constants.ACTION_DELETED,
                    "location",
                    "Action"
                )
            );
            assert.isTrue(this.step.isPerformed().toString() === "true");
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });
});
