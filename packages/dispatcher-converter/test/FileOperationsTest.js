const AssertionError = require("chai").assert;
const assert = require("chai").assert;
let fileOperations = require("../src/util/FileOperations");
let folderOperations = require("../src/util/FolderOperations");
const constants = require("../src/util/constants");
const { ConversionStep } = require("@adobe/aem-cs-source-migration-commons");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let testFolder = "test/newtest";

describe("FileOperations", function () {
    beforeEach(() => {
        if (!fs.existsSync(testFolder)) {
            fs.mkdirSync(testFolder);
        }
    });

    afterEach(function () {
        if (fs.existsSync(testFolder)) {
            let folderOperation = new folderOperations();
            folderOperation.deleteFolder(testFolder, new ConversionStep());
        }
    });

    describe("deleteFile(filePath)", function () {
        /* it('should return an error when no file is passed', function () {

            try {
                fileOperations = new fileOperations();
                fileOperations.deleteFile(); // this should fail
                assert.fail('expected exception not thrown'); // this throws an AssertionError
            } catch (e) {
                // this catches all errors, those thrown by fileOperations.deleteFile
                // and those thrown by assert.fail
                if (e instanceof AssertionError) {
                    // bubble up the assertion error
                    throw e;
                }

                assert.include(e.message, 'no such file or directory');
            }

        });*/

        it("should successfully delete a file with extension", function () {
            fs.appendFileSync(
                testFolder + "/newtestfile.farm",
                "Hello content!"
            );
            let fileOperation = new fileOperations("");
            fileOperation.deleteFilesWithExtension(
                testFolder,
                "farm",
                new ConversionStep()
            );
            assert.isTrue(
                !fs.existsSync("test/newtestfile.farm"),
                "File Deleted"
            );
        });

        it("should successfully delete a file when possible", function () {
            try {
                fs.appendFileSync(
                    testFolder + "/newfile.txt",
                    "Hello content!",
                    function (err) {
                        if (err) throw err;
                    }
                );
                let fileOperation = new fileOperations("");
                fileOperation.deleteFile(testFolder + "/newfile.txt");
                assert.isTrue(
                    !fs.existsSync(testFolder + "/newfile.txt"),
                    "File Deleted"
                );
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw e;
                }
            }
        });

        it("should successfully delete a file not conforming to a pattern", function () {
            try {
                fs.appendFileSync(
                    testFolder + "/newfile.any",
                    "Hello content!"
                );
                fs.appendFileSync(
                    testFolder + "/newtestfile.txt",
                    "This is a test file"
                );

                let fileOperation = new fileOperations("");
                let result = fileOperation.deleteAllFilesNotConformingToPattern(
                    path.join(__dirname, "newtest"),
                    "*.any",
                    new ConversionStep()
                );
                assert.isTrue(
                    result.toString() === __dirname + "/newtest/newfile.any",
                    "Deleting Files not conforming to pattern"
                );
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw e;
                }
            }
        });

        it("should successfully delete a file containing substring", function () {
            fs.appendFileSync(
                testFolder + "/newtestfile.txt",
                "Hello content!"
            );
            let fileOperation = new fileOperations("");
            fileOperation.deleteAllFilesContainingSubstring(
                testFolder + "/",
                "test",
                new ConversionStep()
            );
            assert.isTrue(
                !fs.existsSync(testFolder + "/newtestfile.txt"),
                "File Deleted"
            );
        });
    });

    it("should successfully rename a file when possible", function () {
        try {
            fs.appendFileSync(testFolder + "/newfile.txt", "Hello content!");
            let fileOperation = new fileOperations("");
            fileOperation.renameFileSync(
                testFolder + "/newfile.txt",
                testFolder + "/renameFile.txt"
            );
            assert.isTrue(
                fs.existsSync(testFolder + "/renameFile.txt"),
                "File Renamed"
            );
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("should not rename a file if it does not exist", function () {
        try {
            let fileOperation = new fileOperations("");
            fileOperation.renameFileSync(
                testFolder + "/newfile.txt",
                testFolder + "/renameFile.txt"
            );
            assert.isFalse(
                fs.existsSync(testFolder + "/renameFile.txt"),
                "File Renamed"
            );
        } catch (e) {
            assert.isFalse(
                fs.existsSync(
                    testFolder + "/renameFile.txt",
                    "File does not exist"
                )
            );
        }
    });

    it("should successfully get content from file", function () {
        try {
            fs.appendFileSync(testFolder + "oldfile.txt", "Test Content");
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "Include Hello content!"
            );
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "$include test/newtest/newtestfile.txt"
            );
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "Include test/newtest/old*.txt"
            );

            let path = { cfg: testFolder };
            let yamlStr = yaml.safeDump(path);
            fs.writeFileSync(testFolder + "/config.yaml", yamlStr, "utf8");

            const yamlFile = fs.readFileSync(
                testFolder + "/config.yaml",
                "utf8"
            );
            let config = yaml.safeLoad(yamlFile);
            let fileOperation = new fileOperations(config);
            let content = fileOperation.getContentFromFile(
                testFolder + "/newfile.txt",
                true
            );
            assert.include(content, "Hello content!");
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("should successfully get content from file with * in name", function () {
        try {
            fs.appendFileSync(testFolder + "oldfile.txt", "Test Content");
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "Include Hello content!"
            );
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "$include test/newtest/newtestfile.txt"
            );
            fs.appendFileSync(
                testFolder + "/newfile.txt",
                "Include test/newtest/oldfile.txt"
            );
            let path = { cfg: testFolder };
            let yamlStr = yaml.safeDump(path);
            fs.writeFileSync(testFolder + "/config.yaml", yamlStr, "utf8");

            const yamlFile = fs.readFileSync(
                testFolder + "/config.yaml",
                "utf8"
            );
            let config = yaml.safeLoad(yamlFile);
            let fileOperation = new fileOperations(config);
            let content = fileOperation.getContentFromFile(
                testFolder + "/*.txt",
                true
            );
            assert.include(content, "Hello content!");
        } catch (e) {
            if (e instanceof AssertionError) {
                throw e;
            }
        }
    });

    it("should successfully replace variable names from files", function () {
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "VirtualHost ${HOSTADDRESS}:80 \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "<If HOSTADDRESS \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "<If HOST \n");
        let fileOperation = new fileOperations("");
        fileOperation.replaceAllUsageOfOldVariableWithNewVariable(
            testFolder + "/",
            "vhost",
            "HOSTADDRESS",
            "NEWVAR"
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "NEWVAR");
    });

    it("should successfully replace Content Of Section", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "/publishfarm { \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "## client headers which should be passed through to the render instances"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "}");
        let fileOperation = new fileOperations("");
        fileOperation.replaceContentOfSection(
            testFolder + "/",
            ".vhost",
            "/publishfarm",
            "default",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "/publishfarm");
    });

    it("should successfully replace include pattern in Section", function () {
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "/publishfarm { \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "## client headers which should be passed through to the render instances \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "default \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "} \n");
        let fileOperation = new fileOperations("");
        fileOperation.replaceIncludePatternInSection(
            testFolder + "/",
            ".vhost",
            "/publishfarm",
            "default",
            "test",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "test");
    });

    it("should successfully consolidate rules file into single file", function () {
        let expectedVars = ["Define ASSETSAUTHOR_URL assets-author.adobe.foo.com",
        "Define SITESAUTHOR_URL sites-author.adobe.foo.com",
        "Define STATS_FILE_LEVEL 4"];
        let fileOneContent = `Define ASSETSAUTHOR_URL assets-author.adobe.foo.com
Define SITESAUTHOR_URL sites-author.adobe.foo.com`;
        let fileTwoContent = `Define ASSETSAUTHOR_URL assets-author.adobe.foo.com
Define SITESAUTHOR_URL sites-author.adobe.foo.com
Define STATS_FILE_LEVEL 4`;

        fs.appendFileSync(testFolder + "/newtestfile.vhost", "");
        fs.appendFileSync(testFolder + "/newtfile.vhost", "");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            fileOneContent
        );
        fs.appendFileSync(
            testFolder + "/newtfile.vhost",
            fileTwoContent
        );

        let fileOperation = new fileOperations("");
        let files = fileOperation.globGetFilesByExtension(testFolder, ".vhost");

        fileOperation.consolidateAllRuleFilesIntoSingleRuleFile(
            files,
            testFolder + "/newFile.vhost",
            new ConversionStep()
        );
        let actualVars = fileOperation.getFileContentsArray(
            testFolder + "/newFile.vhost",
            true
        ).filter(value => value.trim() !== '');
        
        assert.deepEqual(actualVars, expectedVars, "Should not contain duplicate definitions");
    });

    it("should successfully Remove Virtual Host Sections Not Port 80", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "<VirtualHost ${HOSTADDRESS}:80>\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "<VirtualHost ${HOSTADDRESS}:443>\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "This is a test content \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "</VirtualHost>");

        let fileOperation = new fileOperations("");

        fileOperation.removeVirtualHostSectionsNotPort80(
            testFolder,
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "HOSTADDRESS");
    });

    it("should successfully replace include statement with new rule", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual This is a test\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "This is a test");

        let fileOperation = new fileOperations("");

        fileOperation.replaceIncludeStatementWithNewRule(
            testFolder,
            "vhost",
            "Virtual",
            "test",
            "content",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "content");
    });

    it("should successfully replace include statement for some rule with new rule", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Include This is a test\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "This is a test");

        let fileOperation = new fileOperations("");

        fileOperation.removeIncludeStatementForSomeRule(
            testFolder,
            "Include",
            "vhost",
            "test",
            new ConversionStep(),
            "newRule"
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "newRule");
    });

    it("should successfully replace include statement for some rule without new rule", function () {
        fs.appendFileSync(
            testFolder + "/newtestfile2.vhost",
            "",
            function (err) {
                if (err) throw err;
            }
        );

        fs.appendFileSync(
            testFolder + "/newtestfile2.vhost",
            "Include This is a test\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile2.vhost",
            "This is a content text"
        );

        let fileOperation = new fileOperations("");

        fileOperation.removeIncludeStatementForSomeRule(
            testFolder,
            "Include",
            "vhost",
            "test",
            new ConversionStep(),
            null
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile2.vhost",
            true
        );
        assert.equal(content.includes("test"), false);
    });

    it("should successfully create a symlink from source to target when source exists", function () {
        fs.appendFileSync(
            path.join(testFolder, "newtestfilesource.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfiletarget.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        let fileOperation = new fileOperations("");
        fileOperation.createSymLink(
            path.join("..", "newtestfiletarget.vhost"),
            path.join(testFolder, "newtestfilesource.vhost"),
            new ConversionStep()
        );
        fs.lstat(
            path.join(testFolder, "newtestfilesource.vhost"),
            function (err, stats) {
                assert.equal(stats.isSymbolicLink(), true);
            }
        );
    });

    it("should successfully create a symlink from source to target when source doesn't exist", function () {
        fs.appendFileSync(
            path.join(testFolder, "newtestfiletarget2.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        let fileOperation = new fileOperations("");
        fileOperation.createSymLink(
            path.join("..", "newtestfiletarget2.vhost"),
            path.join(testFolder, "newtestfilesource2.vhost"),
            new ConversionStep()
        );
        fs.lstat(
            path.join(testFolder, "newtestfilesource2.vhost"),
            function (err, stats) {
                assert.equal(stats.isSymbolicLink(), true);
            }
        );
    });

    it("should successfully replace include statement with content of rule file", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual This is a test\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "This is a test");

        let fileOperation = new fileOperations("");

        fileOperation.replaceIncludeStatementWithContentOfRuleFile(
            testFolder,
            "vhost",
            "test",
            ["content"],
            "Virtual",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "content");
    });

    it("should successfully remove Non Whitelisted Directives In Vhost Files", function () {
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual This is a test\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "</ HOSTADDRESS> \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "</ TESTVAR> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "< VARTEST> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "</ TESTVAR1> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "< VARTEST1> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "< TESTVAR3> \n");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "RewriteRule ^/terms/default.aspx$ http://abc.html \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "This is a test content \n"
        );

        let fileOperation = new fileOperations("");

        let whitelistedDirectivesSet = [];
        for (const directive of constants.WHITELISTED_DIRECTIVES_LIST) {
            whitelistedDirectivesSet.push(directive.toLowerCase());
        }

        fileOperation.removeNonWhitelistedDirectivesInVhostFiles(
            testFolder,
            whitelistedDirectivesSet,
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "#");
        assert.include(
            content,
            "RewriteRule ^/terms/default.aspx$ http://abc.html"
        );
    });

    it("should successfully replace File Includes In Farm File And Vhost File", function () {
        fs.appendFile(testFolder + "/newtestfile.farm", "", function (err) {
            if (err) throw err;
        });

        fs.appendFile(testFolder + "/newtfile.any", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "<VirtualHost ${HOSTADDRESS}:80> \n"
        );
        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "ServerName www.beecube.com"
        );
        fs.appendFileSync(testFolder + "/newtfile.any", "</VirtualHost>");

        fs.appendFileSync(testFolder + "/newtestfile.farm", "/rules\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "{\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "/0000\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "{\n");
        fs.appendFileSync(
            testFolder + "/newtestfile.farm",
            "$include test/newtest/newtfile.any \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.farm",
            "# Disallow any caching by default and subsequently allow caching\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.farm",
            "$include test/newtest/newtfile.any \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.farm", "}\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "}");

        let fileOperation = new fileOperations("");

        let files =
            fileOperation.globGetFilesByPattern(
                path.join(testFolder, "**", "*.any")
            ) || [];
        let ruleFiles = fileOperation.getAllFileNames(files);
        let includeStatementToReplaceWith = '$include "../cache/rules.any"';

        fileOperation.replaceIncludesInFarmAndVhostFile(
            testFolder,
            constants.FARM,
            constants.RULES_SECTION,
            ruleFiles,
            includeStatementToReplaceWith,
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.farm",
            false
        );
        assert.include(content, "../cache/rules.any");
    });

    it("should successfully remove Non Matching Files By Name", function () {
        if (!fs.existsSync("test/oldtest")) {
            fs.mkdir("test/oldtest", (err) => {
                if (err) throw err;
            });
        }

        fs.openSync(testFolder + "/fileone.vhost", "a");
        fs.openSync(testFolder + "/filetwo.vhost", "a");
        fs.openSync("test/oldtest/fileone.vhost", "a");

        let fileOperation = new fileOperations("");

        fileOperation.removeNonMatchingFilesByName(
            "test/oldtest",
            testFolder,
            new ConversionStep()
        );
        assert.isTrue(
            !fs.existsSync("filetwo.vhost"),
            "File Two doesn't exist"
        );

        let folderOperation = new folderOperations();
        folderOperation.deleteFolder("test/oldtest", new ConversionStep());
    });

    it("should successfully remove All Usage Of Old Variable", function () {
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        fs.writeFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "VirtualHost ${HOSTADDRESS}:80 \n"
        );
        fs.writeFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "<If HOSTADDRESS> \n"
        );
        fs.writeFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "This is test content \n"
        );
        fs.writeFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "Test </If> \n"
        );
        let fileOperation = new fileOperations("");
        fileOperation.removeAllUsageOfOldVariable(
            testFolder + "/",
            "vhost",
            "HOSTADDRESS",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            path.join(testFolder, "newtestfile.vhost"),
            true
        );
        assert.notInclude(content, "HOSTADDRESS");
    });

    it("should return error if file does not exist to remove All Usage Of Old Variable", function () {
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "VirtualHost ${HOSTADDRESS}:80 \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "<If HOSTADDRESS> \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "This is test content \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "Test </If> \n"
        );

        let fileOperation = new fileOperations("");

        fileOperation.removeAllUsageOfOldVariable(
            testFolder + "/newtest/test/",
            "vhost",
            "HOSTADDRESS",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            path.join(testFolder, "newtestfile.vhost"),
            true
        );
        assert.isTrue(content.includes(""), true);
    });

    it("should successfully get Names Of Rule Files Included", function () {
        fs.appendFile(testFolder + "/newtestfile.farm", "", function (err) {
            if (err) throw err;
        });

        fs.appendFile(testFolder + "/newtfile.any", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "<VirtualHost ${HOSTADDRESS}:80> \n"
        );
        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "ServerName www.beecube.com"
        );
        fs.appendFileSync(testFolder + "/newtfile.any", "</VirtualHost>");

        fs.appendFileSync(testFolder + "/newtestfile.farm", "/rules\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "{\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "/0000\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "{\n");
        fs.appendFileSync(
            testFolder + "/newtestfile.farm",
            "$include test/newtest/newtfile.any \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.farm",
            "# Disallow any caching by default and subsequently allow caching\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.farm", "}\n");
        fs.appendFileSync(testFolder + "/newtestfile.farm", "}");

        let fileOperation = new fileOperations("");
        let result = fileOperation.getNamesOfRuleFilesIncluded(
            testFolder + "/newtestfile.farm",
            "test/newtest/newtfile.any",
            constants.INCLUDE_SYNTAX_IN_FARM,
            false
        );

        assert.isTrue(
            result.toString() === "newtfile.any",
            " Desired File is Returned"
        );
    });

    it("should successfully consolidate Variable Files", function () {
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "VirtualHost ${HOSTADDRESS} :80 \n"
        );

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Define REWRITE_LOG_LEVEL Warn"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Define CONTENT_FOLDER_NAME test"
        );

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "VirtualHost ${PORT} :80 \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "<If HOSTADDRESS");
        let fileOperation = new fileOperations("");

        let fileList = [];
        fileList.push(testFolder + "/newtestfile.vhost");
        let result = fileOperation.consolidateVariableFiles(
            fileList,
            testFolder + "/newfile.vhost"
        );
        assert.isTrue(
            result.toString().includes("VirtualHost"),
            "Desired keyword is returned"
        );

        let content = fileOperation.getContentFromFile(
            testFolder + "/newfile.vhost",
            true
        );
        assert.include(content, "HOSTADDRESS");
        assert.include(content, "CONTENT_FOLDER_NAME");
    });

    it("should successfully check For Undefined Variables", function () {
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual ${HOSTADDRESS} :80 \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual ${PORT} :80 \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "<If HOSTADDRESS");
        let variableList = [];
        variableList.push("ADDRESS");
        variableList.push("PORT");
        /*
        let fileOperation = new fileOperations("");
        let result = fileOperation.checkForUndefinedVariables(
            testFolder + "/",
            variableList
        );

        assert.isTrue(result[0].toString()==="HOSTADDRESS", "Desired keyword is returned");
        */
    });

    it("should successfully get Names Of Rule Files Included in Vhost Files", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });

        fs.appendFile(testFolder + "/newtfile.any", "", function (err) {
            if (err) throw err;
        });

        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "<VirtualHost ${HOSTADDRESS}:80> \n"
        );
        fs.appendFileSync(
            testFolder + "/newtfile.any",
            "ServerName www.beecube.com"
        );
        fs.appendFileSync(testFolder + "/newtfile.any", "</VirtualHost>");

        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "<VirtualHost:80>\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "{\n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "Test Content\n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "{\n");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Include test/newtest/newtfile.any \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "# Disallow any caching by default and subsequently allow caching\n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "}\n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "}");

        let fileOperation = new fileOperations("");
        let result = fileOperation.getNamesOfRuleFilesIncluded(
            testFolder + "/newtestfile.vhost",
            "test/newtest/newtfile.any",
            constants.INCLUDE_SYNTAX_IN_VHOST,
            false
        );

        assert.isTrue(
            result.toString() === "newtfile.any",
            " Desired File is Returned"
        );
    });

    it("should check for undefined variables", function () {
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "\n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "VirtualHost \n");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "${HOSTADDRESS} \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "<If HOSTADDRESS\n"
        );
        let fileOperation = new fileOperations("");
        let definedList = [];
        definedList.push("HOST");

        let list = fileOperation.checkForUndefinedVariables(
            testFolder,
            definedList
        );

        assert.isTrue(
            list.toString() === "${HOSTADDRESS}",
            " Desired variable is returned"
        );
    });

    it("should successfully remove Non Whitelisted Directives In Vhost Files containing start of section", function () {
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "Virtual This is a test\n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "</ HOSTADDRESS> \n"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "</ TESTVAR> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "< VARTEST> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "</ TESTVAR1> \n");
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "< VARTEST1> \n");
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "This is a test content \n"
        );

        let fileOperation = new fileOperations("");

        let whitelistedDirectivesSet = [];

        for (const directive of constants.WHITELISTED_DIRECTIVES_LIST) {
            whitelistedDirectivesSet.push(directive.toLowerCase());
        }

        fileOperation.removeNonWhitelistedDirectivesInVhostFiles(
            testFolder,
            whitelistedDirectivesSet,
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "#");
    });

    it("should successfully replace Content Of Section bracket in next line", function () {
        fs.appendFile(testFolder + "/newtestfile.vhost", "", function (err) {
            if (err) throw err;
        });
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "/publishfarm \n { \n"
        );
        fs.appendFileSync(
            testFolder + "/newtestfile.vhost",
            "## client headers which should be passed through to the render instances"
        );
        fs.appendFileSync(testFolder + "/newtestfile.vhost", "}");
        let fileOperation = new fileOperations("");
        fileOperation.replaceContentOfSection(
            testFolder + "/",
            ".vhost",
            "/publishfarm",
            "default",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            testFolder + "/newtestfile.vhost",
            true
        );
        assert.include(content, "/publishfarm");
    });

    it("should successfully remove variable usage", function () {
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "",
            function (err) {
                if (err) throw err;
            }
        );
        fs.writeFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "<If HOSTADDRESS> \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "<If HOSTADDRESS> \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "HOSTADDRESS \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "This is test content \n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "</If>\n"
        );
        fs.appendFileSync(
            path.join(testFolder, "newtestfile.vhost"),
            "</If>\n"
        );
        let fileOperation = new fileOperations("");
        fileOperation.removeVariableUsage(
            testFolder + "/" + "newtestfile.vhost",
            "HOSTADDRESS",
            new ConversionStep()
        );
        let content = fileOperation.getContentFromFile(
            path.join(testFolder, "newtestfile.vhost"),
            true
        );
        assert.notInclude(content, "HOSTADDRESS");
    });

    it("should successfully get path for directory with pathToPrepend", function () {
        let path = { pathToPrepend: ["test/newtest/", "test/newtest/"] };

        let yamlStr = yaml.safeDump(path);
        fs.writeFileSync(testFolder + "/config.yaml", yamlStr, "utf8");

        const yamlFile = fs.readFileSync(testFolder + "/config.yaml", "utf8");
        let config = yaml.safeLoad(yamlFile);
        let fileOperation = new fileOperations(config);
        let filePath = fileOperation.getPathForDir("config.yaml", true);
        assert.include(filePath, "test/newtest/config.yaml");
    });

    it("should successfully get path for directory without pathToPrepend", function () {
        let path = { cfg: "test/newtest" };
        let yamlStr = yaml.safeDump(path);
        fs.writeFileSync(testFolder + "/config.yaml", yamlStr, "utf8");

        const yamlFile = fs.readFileSync(testFolder + "/config.yaml", "utf8");
        let config = yaml.safeLoad(yamlFile);
        let fileOperation = new fileOperations(config);
        let filePath = fileOperation.getPathForDir("config.yaml", true);
        assert.include(filePath, "test/newtest/config.yaml");
    });

    it("should successfully check isPortExist", function () {
        let port = { portsToMap: ["443", "80"] };
        let yamlStr = yaml.safeDump(port);
        fs.writeFileSync(testFolder + "/config.yaml", yamlStr, "utf8");

        const yamlFile = fs.readFileSync(testFolder + "/config.yaml", "utf8");
        let config = yaml.safeLoad(yamlFile);
        let fileOperation = new fileOperations(config);
        let isPresent = fileOperation.isPortExists("443");
        assert.isTrue(isPresent, true);
    });
});
