const assert = require("chai").assert;
let folderOperations = require("../src/util/FolderOperations");
const { ConversionStep } = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");

const testFolder = "testFolder";
const renamedFolder = "renamedFolder";

describe("FolderOperations", () => {
    beforeEach(() => {
        if (!fs.existsSync(testFolder)) {
            fs.mkdirSync(testFolder);
        }
    });

    afterEach(function () {
        if (fs.existsSync(testFolder)) {
            fs.rmdirSync(testFolder);
        }
        if (fs.existsSync(renamedFolder)) {
            fs.rmdirSync(renamedFolder);
        }
    });

    it("should delete folder", () => {
        if (fs.existsSync(testFolder)) {
            let folderOperation = new folderOperations();
            try {
                folderOperation.deleteFolder(testFolder, new ConversionStep());
                assert.equal(fs.existsSync(testFolder), false);
            } catch (err) {
                if (err) {
                    assert.fail("Folder not deleted " + err);
                }
            }
        } else if (!fs.existsSync(testFolder)) {
            assert.equal(fs.existsSync(testFolder), false);
        }
    });

    it("should rename folder", () => {
        if (fs.existsSync(testFolder)) {
            let folderOperation = new folderOperations();
            try {
                folderOperation.renameFolder(
                    testFolder,
                    renamedFolder,
                    new ConversionStep()
                );
                assert.equal(fs.existsSync(renamedFolder), true);
            } catch (err) {
                assert.fail("Folder not renamed " + err);
            }
        } else if (!fs.existsSync(testFolder)) {
            assert.fail(fs.existsSync(testFolder), false);
        }
    });
});
