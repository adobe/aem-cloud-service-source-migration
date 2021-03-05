/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
const {
    logger,
    constants,
    util,
    ConversionStep,
} = require("@adobe/aem-cs-source-migration-commons");
const rewire = require("rewire");
let srcPath="./test/resources/";
let configpath = "./test/resources/ui.config/";
const configRewire = rewire("./../src/restructure-config");
const fs = require("fs");
const fsPromises = require('fs').promises; 

describe(" restructure config", function () {

    test("formatConfig", async () => {
        util.deleteFolderRecursive(configpath);
        fs.mkdirSync(configpath);
        let oldConfigs=['com.adobe.config.test.xml','com.adobe.test.config'];
        let newConfigs=['com.adobe.config.test.cfg.json','com.adobe.test.cfg.json'];
        let conversionStep = new ConversionStep();
        for (const val of oldConfigs) {
           await fsPromises.copyFile(srcPath+val, configpath+val) 
            .then(function() { 
                console.log("File Copied"); 
            }) 
            .catch(function(error) { 
            console.log(error); 
            }); 
            await configRewire.__get__("formatConfig")(configpath+val,conversionStep);
        }
        for (const val of newConfigs) {
         let fileContent = util.getXMLContentSync(configpath+val);
         let content= util.getXMLContentSync(srcPath+val);
         expect(fileContent).toEqual(expect.arrayContaining(content));
        }
        if (fs.existsSync(configpath)){
        util.deleteFolderRecursive(configpath);
        }
    });

});
