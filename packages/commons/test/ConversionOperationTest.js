const AssertionError = require("chai").assert;
const assert = require("chai").assert;
const conversionOperation = require("../src/conversion_report/conversion_operation");

describe("ConversionOperation", () => {
    beforeEach(() => {
        this.conversionOp = new conversionOperation(
            "type",
            "location",
            "action"
        );
    });

    it("test get operation type", () => {
        try {
            assert.isTrue(
                this.conversionOp.getOperationType().toString() === "type",
                "Type is as expected"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("test get operation location", () => {
        try {
            assert.isTrue(
                this.conversionOp.getOperationLocation().toString() ===
                    "location",
                "Location is as expected"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("test get operation action", () => {
        try {
            assert.isTrue(
                this.conversionOp.getOperationAction().toString() === "action"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });
});
