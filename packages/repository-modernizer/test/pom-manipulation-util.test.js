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

const {
    constants: commons_constants,
    util,
    logger,
} = require("@adobe/aem-cs-source-migration-commons");
const rewire = require("rewire");
const pomManipulationUtil = require("./../src/util/pom-manipulation-util");
const pomUtilRewire = rewire("./../src/util/pom-manipulation-util");
let path = "./test/resources/pom.xml";
describe("pom manipulation", function () {
    test("removeDuplicates", () => {
        var list = [
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.apps</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </dependency>",
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.apps</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </dependency>",
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.core</artifactId>",
            "        <version>1.0.1</version>",
            "      </dependency>",
        ];
        var expected = [
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.apps</artifactId>",
            "        <version>1.3-SNAPSHOT</version>",
            "      </dependency>",
            "      <dependency>",
            "        <groupId>com.apps.aem</groupId>",
            "        <artifactId>test.core</artifactId>",
            "        <version>1.0.1</version>",
            "      </dependency>",
        ];
        let result = pomManipulationUtil.removeDuplicatesDependencies(list);

        expect(result.length).toBe(10);
        expect(result).toEqual(expected);
    });
    test("verifyArtifactPackagingTyperemoveDuplicates", () => {
        var result = pomManipulationUtil.verifyArtifactPackagingType(path, [
            "jar",
            "bundle",
        ]);
        expect(result).toBe(false);
    });
});
