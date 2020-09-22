<!--
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

# Summary/Conversion Report Generation Framework

`aem-cs-source-migration-commons` library provides a summary report generation framework which can
 be used by AEM as a Cloud Service Code Refactoring Tools (packages).

## Classes in the framework :

### 1. SummaryReportWriter
A utility class that provides functionality for creation of summary report for the migration

**Kind**: global class  

* [SummaryReportWriter](#SummaryReportWriter)
    * [.writeSummaryReport()](#SummaryReportWriter+writeSummaryReport)
<a name="SummaryReportWriter+writeSummaryReport"></a>

#### SummaryReportWriter.writeSummaryReport(conversion_steps, target, report_name)
Create a summary report which contains the step followed (and operations performed) during the conversion.

**Kind**: static method of [<code>SummaryReportWriter</code>](#SummaryReportWriter)  

| Param | Type | Description |
| --- | ---  | --- |
| conversion_steps | <code>array</code> | List of steps performed that are to be added to the summary report. |
| target | <code>String</code> | The path/location where the summary report need to be creation. |
| report_name | <code>String</code> | The name of the base summary report template file. |



### 2. ConversionStep
ConversionStep describes a single step (or rule) that has been performed with the objective of
 source migration. Each step (or rule) can have multiple ConversionOperation performed as part of it.

**Kind**: global class  

* [ConversionStep](#ConversionStep)
    * [new ConversionStep(rule, description)](#ConversionStep+new)
    * [.addOperation()](#ConversionStep+addOperation)
    * [.getRule()](#ConversionStep+getRule) ⇒ <code>string</code>
    * [.getDescription()](#ConversionStep+getDescription) ⇒ <code>string</code>
    * [.getOperations()](#ConversionStep+getOperations) ⇒ <code>array</code>
    * [.isPerformed()](#ConversionStep+isPerformed) ⇒ <code>boolean</code>
    
<a name="ConversionStep+new"></a>
#### new ConversionStep(rule, description)
Create a new instance of ConversionStep.

**Kind**: constructor of [<code>ConversionStep</code>](#ConversionStep)  

| Param | Type | Description |
| --- | ---  | --- |
| rule | <code>string</code> | The rule that is being followed while executing the particular ConversionStep. |
| description | <code>string</code> | The details of the rule that is being followed for ConversionStep. |

<a name="ConversionStep+addOperation"></a>
#### conversionStep.addOperation(operation)
Add an operation that was performed while executing the particular ConversionStep.

**Kind**: instance method of [<code>ConversionStep</code>](#ConversionStep)  

| Param | Type | Description |
| --- | ---  | --- |
| operation | <code>object</code> | List of steps performed that are to be added to the summary report. |

<a name="ConversionStep+getRule"></a>
#### conversionStep.getRule() ⇒ <code>string</code>
Get the rule that is being followed while executing the particular ConversionStep.

**Kind**: instance method of [<code>ConversionStep</code>](#ConversionStep)  
**Returns**: <code>string</code> - Returns rule that is being followed while executing the particular ConversionStep


<a name="ConversionStep+getDescription"></a>
#### conversionStep.getDescription() ⇒ <code>string</code>
Get the details of the rule that is being followed while executing the particular ConversionStep.

**Kind**: instance method of [<code>ConversionStep</code>](#ConversionStep)  
**Returns**: <code>string</code> - Returns  details of the rule that is being followed while
 executing the particular ConversionStep.  


<a name="ConversionStep+addOperation"></a>
#### conversionStep.getOperations() ⇒ <code>array</code>
Get the list of operations performed while executing the particular ConversionStep.

**Kind**: instance method of [<code>ConversionStep</code>](#ConversionStep)  
**Returns**: <code>array</code> - Returns list of operations performed while executing the particular ConversionStep 


<a name="ConversionStep+isPerformed"></a>
#### conversionStep.isPerformed() ⇒ <code>boolean</code>
Find whether any operation has been performed while executing the particular ConversionStep.

**Kind**: instance method of [<code>ConversionStep</code>](#ConversionStep)  
**Returns**: <code>boolean</code> - Returns `true` if at least one operation has been
 performed while executing the particular ConversionStep , else `false` 


### 3. ConversionOperation
ConversionOperation describes a single operation (can be add/remove/rename/replace/delete operation)
 which has been performed on the source code as part of some conversion step.
**Kind**: global class  
 
* [ConversionOperation](#ConversionOperation)
    * [new ConversionOperation(operationType, operationLocation, operationAction)](#ConversionOperation+new)
    * [.getOperationType()](#ConversionOperation+getOperationType) ⇒ <code>string</code>
    * [.getOperationLocation()](#ConversionOperation+getOperationLocation) ⇒ <code>string</code>
    * [.getOperationAction()](#ConversionOperation+getOperationAction) ⇒ <code>string</code>
    
<a name="ConversionOperation+new"></a>
#### new ConversionOperation(rule, description)
Create a new instance of ConversionOperation.

**Kind**: constructor of [<code>ConversionOperation</code>](#ConversionOperation)  

| Param | Type | Description |
| --- | ---  | --- |
| operationType | <code>string</code> | The type of operation performed. |
| operationLocation | <code>string</code> | The location at which the operation has been performed. |
| operationAction | <code>string</code> | The gist of the operation performed. |

<a name="ConversionOperation+getOperationType"></a>
#### conversionStep.getOperationType() ⇒ <code>string</code>
Get the type of operation performed.

**Kind**: instance method of [<code>ConversionOperation</code>](#ConversionOperation)  
**Returns**: <code>string</code> - Returns the type of operation performed


<a name="ConversionOperation+getOperationLocation"></a>
#### conversionStep.getOperationLocation() ⇒ <code>string</code>
Get the location at which the operation has been performed.

**Kind**: instance method of [<code>ConversionOperation</code>](#ConversionOperation)  
**Returns**: <code>string</code> - Returns the location at which the operation has been performed  


<a name="ConversionOperation+getOperationAction"></a>
#### ConversionOperation.getOperationAction() ⇒ <code>string</code>
Get the gist of the operation performed.

**Kind**: instance method of [<code>ConversionOperation</code>](#ConversionOperation)  
**Returns**: <code>array</code> - Returns the gist of the operation performed 

## Usage :
For the purpose of this example, let us assume we have our `main` module and and certain
 other modules `ijk` and `xyz` which each handle a particular logic (step) of code refactoring.

#### Inside ijk.js
```javascript
const { 
    constants: commons_constants,
    ConversionStep,
    ConversionOperation} = require('@adobe/aem-cs-source-migration-commons');
...
function refactorIJK(...) {
    let conversionStep = new ConversionStep(
        "Add ijk to foo.",
        "Some random details just for the sake of explainging the usage of the summary reporting framework."
    );
    ...
    conversionStep.addOperation(new ConversionOperation(
            commons_constants.ACTION_ADDED,
            location_where_the_operation_was_performed,
            "A gist of the opeation."
        )
    );
    ...
    return conversionStep;
}
...
```  
#### Similarly inside xyz.js
```javascript
const { 
    constants: commons_constants,
    ConversionStep,
    ConversionOperation} = require('@adobe/aem-cs-source-migration-commons');
...
function refactorXYZ(...) {
    let conversionStep = new ConversionStep(
        "Add xyz to foo.",
        "Some random details just for the sake of explainging the usage of the summary reporting framework."
    );
    ...
    conversionStep.addOperation(new ConversionOperation(
            commons_constants.ACTION_ADDED,
            location_where_the_operation_was_performed,
            "A gist of the opeation."
        )
    );
    ...
    return conversionStep;
}
...
```  
#### Finally inside main.js
```javascript
const {SummaryReportWriter} = require('@adobe/aem-cs-source-migration-commons');
...
var conversionSteps = [];
...
conversionSteps.push(ijk.refactorIJK(...));
conversionSteps.push(xyz.refactorXYZ(...));
...
// to generate the summary report at TARGET_FOLDER using the template XYZ_CONVERTER_REPORT
SummaryReportWriter.writeSummaryReport(conversionSteps,TARGET_FOLDER, XYZ_CONVERTER_REPORT);
...
```  
