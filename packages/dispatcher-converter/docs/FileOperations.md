<a name="FileOperations"></a>

## FileOperations
**Kind**: global class  

* [FileOperations](#FileOperations)
    * [.getAllFileNames(files)](#FileOperations+getAllFileNames) ⇒ <code>array</code>
    * [.doGlobDelete(globPattern, conversionStep)](#FileOperations+doGlobDelete)
    * [.globGetFilesByExtension(directoryPath, fileExtension)](#FileOperations+globGetFilesByExtension) ⇒ <code>array</code>
    * [.globGetFilesByPattern(pattern)](#FileOperations+globGetFilesByPattern) ⇒ <code>array</code>
    * [.deleteFile(filePath, conversionStep)](#FileOperations+deleteFile)
    * [.deleteFilesWithExtension(directoryPath, extension, conversionStep)](#FileOperations+deleteFilesWithExtension)
    * [.deleteAllFilesContainingSubstring(directoryPath, fileSubString, conversionStep)](#FileOperations+deleteAllFilesContainingSubstring)
    * [.deleteAllFilesNotConformingToPattern(directoryPath, filePattern, conversionStep)](#FileOperations+deleteAllFilesNotConformingToPattern) ⇒ <code>array</code>
    * [.renameFile(srcPath, destPath)](#FileOperations+renameFile)
    * [.getContentFromFile(filePath, recursive)](#FileOperations+getContentFromFile) ⇒ <code>string</code>
    * [.getReadablePath(line, pathToPrepend)](#FileOperations+getReadablePath) ⇒ <code>string</code>
    * [.getPathForDir(isConfString, dirName)](#FileOperations+getPathForDir) ⇒ <code>string</code>
    * [.removeVirtualHostSectionsNotPort80(directoryPath, conversionStep)](#FileOperations+removeVirtualHostSectionsNotPort80)
    * [.removeOrReplaceFileInclude(filePath, includeStatementSyntax, oldRuleName, newRuleName, conversionStep)](#FileOperations+removeOrReplaceFileInclude)
    * [.removeIncludeStatementForSomeRule(directoryPath, includeStatementSyntax, fileExtension, ruleFileNameToRemove, conversionStep)](#FileOperations+removeIncludeStatementForSomeRule)
    * [.replaceIncludeStatementWithNewRule(directoryPath, fileExtension, includeStatementSyntax, ruleFileToReplace, ruleFileToReplaceWith, conversionStep)](#FileOperations+replaceIncludeStatementWithNewRule)
    * [.removeOrReplaceIncludePatternInSection(filePath, sectionHeader, includePatternToReplace, includePatternToReplaceWith, conversionStep)](#FileOperations+removeOrReplaceIncludePatternInSection)
    * [.replaceIncludePatternInSection(directoryPath, fileExtension, sectionHeader, patternToReplace, fileToReplaceWith, conversionStep)](#FileOperations+replaceIncludePatternInSection)
    * [.replaceFileIncludeWithFileContent(filePath, includeStatementSyntax, ruleFileToReplace, ruleFileContent, conversionStep)](#FileOperations+replaceFileIncludeWithFileContent)
    * [.replaceIncludeStatementWithContentOfRuleFile(directoryPath, fileExtension, ruleFileToReplace, content, includeStatementSyntax, conversionStep)](#FileOperations+replaceIncludeStatementWithContentOfRuleFile)
    * [.replaceVariableUsage(filePath, variableToReplace, newVariable)](#FileOperations+replaceVariableUsage)
    * [.replaceAllUsageOfOldVariableWithNewVariable(directoryPath, fileExtension, variableToReplace, newVariable)](#FileOperations+replaceAllUsageOfOldVariableWithNewVariable)
    * [.removeVariableUsage(filePath, variableToRemove, conversionStep)](#FileOperations+removeVariableUsage)
    * [.removeAllUsageOfOldVariable(directoryPath, fileExtension, variableToRemove, conversionStep)](#FileOperations+removeAllUsageOfOldVariable)
    * [.replaceParticularSectionContentWithIncludeStatement(filePath, sectionHeader, includeStatementToReplaceWith, conversionStep)](#FileOperations+replaceParticularSectionContentWithIncludeStatement)
    * [.replaceContentOfSection(directoryPath, extension, sectionHeader, includeStatementToReplaceWith, conversionStep)](#FileOperations+replaceContentOfSection)
    * [.removeNonWhitelistedDirectivesInVhostFiles(directoryPath, whitelistedDirectivesSet, conversionStep)](#FileOperations+removeNonWhitelistedDirectivesInVhostFiles)
    * [.removeNonMatchingFilesByName(srcDir, destDir, conversionStep)](#FileOperations+removeNonMatchingFilesByName)
    * [.consolidateVariableFiles(files, newFilePath)](#FileOperations+consolidateVariableFiles) ⇒ <code>array</code>
    * [.checkForUndefinedVariables(directoryPath, definedVariablesList)](#FileOperations+checkForUndefinedVariables)
    * [.replaceIncludesInFarmAndVhostFile(dirPath, type, header, ruleFileToReplace, includePatternToReplaceWith, conversionStep)](#FileOperations+replaceIncludesInFarmAndVhostFile)
    * [.replaceFileIncludesInFarmFileAndVhostFile(filePath, type, header, ruleFilesToReplace, includePatternToReplaceWith, conversionStep)](#FileOperations+replaceFileIncludesInFarmFileAndVhostFile)
    * [.getNamesOfRuleFilesIncluded(filePath, ruleFilesToCheck, includeSyntax)](#FileOperations+getNamesOfRuleFilesIncluded) ⇒
    * [.consolidateAllRuleFilesIntoSingleRuleFile(ruleFiles, consolidatedRuleFilePath, conversionStep)](#FileOperations+consolidateAllRuleFilesIntoSingleRuleFile)
    * [.getFileContentsArray(file)](#FileOperations+getFileContentsArray)
    * [.getPath(file)](#FileOperations+getPath) ⇒ <code>string</code>

<a name="FileOperations+getAllFileNames"></a>

### fileOperations.getAllFileNames(files) ⇒ <code>array</code>
Get all the file names from the provided list of files.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>array</code> - Returns an array of file names  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>array</code> | A string array of file paths whose names will be returned |

<a name="FileOperations+doGlobDelete"></a>

### fileOperations.doGlobDelete(globPattern, conversionStep)
Delete files matching the passed globPattern

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Default |
| --- | --- |
| globPattern |  | 
| conversionStep | <code></code> | 

<a name="FileOperations+globGetFilesByExtension"></a>

### fileOperations.globGetFilesByExtension(directoryPath, fileExtension) ⇒ <code>array</code>
Utility Function to return files recursively based on a directory path and file extension.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>array</code> - files An Array of files  

| Param |
| --- |
| directoryPath | 
| fileExtension | 

<a name="FileOperations+globGetFilesByPattern"></a>

### fileOperations.globGetFilesByPattern(pattern) ⇒ <code>array</code>
Utility Function to return files based on any pattern given

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>array</code> - files An Array of files  

| Param | Type | Description |
| --- | --- | --- |
| pattern | <code>string</code> | The glob pattern used to search |

<a name="FileOperations+deleteFile"></a>

### fileOperations.deleteFile(filePath, conversionStep)
Deletes the file provided.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filePath | <code>string</code> |  | The path of the file to delete |
| conversionStep | <code>object</code> | <code></code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+deleteFilesWithExtension"></a>

### fileOperations.deleteFilesWithExtension(directoryPath, extension, conversionStep)
Deletes all files with given extension in a specific directory.
Does not check sub-directories.

Sample Usage: `FileOperations.deleteFilesWithExtension("./target/js", ".min.js")`

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to the directory where the deletion is to be performed |
| extension | <code>string</code> | The file extension which is to be matched for deletion |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+deleteAllFilesContainingSubstring"></a>

### fileOperations.deleteAllFilesContainingSubstring(directoryPath, fileSubString, conversionStep)
Deletes all files with given extension in a specific directory.
Does not check sub-directories.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to the directory where the deletion is to be performed |
| fileSubString | <code>string</code> | The file extension which is to be matched for deletion |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+deleteAllFilesNotConformingToPattern"></a>

### fileOperations.deleteAllFilesNotConformingToPattern(directoryPath, filePattern, conversionStep) ⇒ <code>array</code>
Delete all files in a given directory (recursively) on conforming to the given pattern (eg. '*.vars').
Returns the files remaining.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>array</code> - a list containing the names of the files in the directory.  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> |  |
| filePattern | <code>string</code> |  |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+renameFile"></a>

### fileOperations.renameFile(srcPath, destPath)
Renames file by copying it from source path and copying the content at the destination path

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| srcPath | 
| destPath | 

<a name="FileOperations+getContentFromFile"></a>

### fileOperations.getContentFromFile(filePath, recursive) ⇒ <code>string</code>
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>string</code> - Content of the file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filePath | <code>string</code> |  | The path to file whose content is to be retrieved |
| recursive |  | <code>false</code> |  |

<a name="FileOperations+getReadablePath"></a>

### fileOperations.getReadablePath(line, pathToPrepend) ⇒ <code>string</code>
Returns path by taking file name from path and concatenating pathToPrepend to it.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| line | 
| pathToPrepend | 

<a name="FileOperations+getPathForDir"></a>

### fileOperations.getPathForDir(isConfString, dirName) ⇒ <code>string</code>
Appends path in configuration file to get the actual path of the file

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| isConfString | 
| dirName | 

<a name="FileOperations+removeVirtualHostSectionsNotPort80"></a>

### fileOperations.removeVirtualHostSectionsNotPort80(directoryPath, conversionStep)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to the vhost directory |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+removeOrReplaceFileInclude"></a>

### fileOperations.removeOrReplaceFileInclude(filePath, includeStatementSyntax, oldRuleName, newRuleName, conversionStep)
Remove or replace inclusion of some file. If replacement file is not specified, the include statement is removed.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filePath |  |  |  |
| includeStatementSyntax |  |  |  |
| oldRuleName |  |  |  |
| newRuleName |  | <code></code> |  |
| conversionStep | <code>object</code> |  | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+removeIncludeStatementForSomeRule"></a>

### fileOperations.removeIncludeStatementForSomeRule(directoryPath, includeStatementSyntax, fileExtension, ruleFileNameToRemove, conversionStep)
Remove inclusion of some file from all files os given file-extension in specified directory and sub-directories.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to directory whose files are to be processed |
| includeStatementSyntax | <code>string</code> | The syntax of the include statement to be looked for |
| fileExtension | <code>string</code> | The extension of the type that needs to be processed |
| ruleFileNameToRemove | <code>string</code> | The rule file name (in include statement) that is to be removed |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceIncludeStatementWithNewRule"></a>

### fileOperations.replaceIncludeStatementWithNewRule(directoryPath, fileExtension, includeStatementSyntax, ruleFileToReplace, ruleFileToReplaceWith, conversionStep)
Replace inclusion of some file (with new file to be included) from all files os given file-extension in specified directory and sub-directories.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath |  | The path to directory whose files are to be processed |
| fileExtension |  | The extension of the type that needs to be processed |
| includeStatementSyntax |  | The syntax of the include statement to be looked for |
| ruleFileToReplace |  | The rule file name (in include statement) that is to be replaced |
| ruleFileToReplaceWith |  | The rule file name (in include statement) that is to be replaced with |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+removeOrReplaceIncludePatternInSection"></a>

### fileOperations.removeOrReplaceIncludePatternInSection(filePath, sectionHeader, includePatternToReplace, includePatternToReplaceWith, conversionStep)
Remove-replace include statements of certain pattern within specified sections of a file.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> |  |
| sectionHeader | <code>string</code> |  |
| includePatternToReplace | <code>string</code> |  |
| includePatternToReplaceWith | <code>string</code> |  |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceIncludePatternInSection"></a>

### fileOperations.replaceIncludePatternInSection(directoryPath, fileExtension, sectionHeader, patternToReplace, fileToReplaceWith, conversionStep)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath |  |  |
| fileExtension |  |  |
| sectionHeader |  |  |
| patternToReplace |  |  |
| fileToReplaceWith |  |  |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceFileIncludeWithFileContent"></a>

### fileOperations.replaceFileIncludeWithFileContent(filePath, includeStatementSyntax, ruleFileToReplace, ruleFileContent, conversionStep)
Replace file include statements with the content of the included file itself.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> |  |
| includeStatementSyntax | <code>string</code> |  |
| ruleFileToReplace | <code>string</code> |  |
| ruleFileContent | <code>string</code> |  |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceIncludeStatementWithContentOfRuleFile"></a>

### fileOperations.replaceIncludeStatementWithContentOfRuleFile(directoryPath, fileExtension, ruleFileToReplace, content, includeStatementSyntax, conversionStep)
Replace file include statements with the content of the included file itself, in all files of given file-type
in specified directory and sub-directories.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to directory whose files are to be processed |
| fileExtension | <code>string</code> | The extension of the type that needs to be processed |
| ruleFileToReplace | <code>string</code> | include statement pattern that is to be replaced |
| content | <code>string</code> | The content of file with which the include statement is to be replaced |
| includeStatementSyntax | <code>string</code> | The syntax of the include statement to be replaced |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceVariableUsage"></a>

### fileOperations.replaceVariableUsage(filePath, variableToReplace, newVariable)
Replace usage of a variable with a new variable.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | The file to replace the variables in |
| variableToReplace | <code>string</code> | The variable that will be replaced |
| newVariable | <code>string</code> | The new variable to put in place of replaced. |

<a name="FileOperations+replaceAllUsageOfOldVariableWithNewVariable"></a>

### fileOperations.replaceAllUsageOfOldVariableWithNewVariable(directoryPath, fileExtension, variableToReplace, newVariable)
Replaces name of old variables with the new variables.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| directoryPath | 
| fileExtension | 
| variableToReplace | 
| newVariable | 

<a name="FileOperations+removeVariableUsage"></a>

### fileOperations.removeVariableUsage(filePath, variableToRemove, conversionStep)
Remove usage of specified variable within a file.  If the variable is used in an if block - the entire
if statement is removed.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | The file to search for the variable in. |
| variableToRemove | <code>string</code> | The variable to remove. |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+removeAllUsageOfOldVariable"></a>

### fileOperations.removeAllUsageOfOldVariable(directoryPath, fileExtension, variableToRemove, conversionStep)
Replace usage of specified variable in all files of given file-type in specified directory and sub-directories.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path to directory whose files are to be processed |
| fileExtension | <code>string</code> | The extension of the type that needs to be processed |
| variableToRemove | <code>string</code> | The variable that is to be removed |
| conversionStep | <code>object</code> | The conversion step to which the performed actions are to be added. |

<a name="FileOperations+replaceParticularSectionContentWithIncludeStatement"></a>

### fileOperations.replaceParticularSectionContentWithIncludeStatement(filePath, sectionHeader, includeStatementToReplaceWith, conversionStep)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| filePath | 
| sectionHeader | 
| includeStatementToReplaceWith | 
| conversionStep | 

<a name="FileOperations+replaceContentOfSection"></a>

### fileOperations.replaceContentOfSection(directoryPath, extension, sectionHeader, includeStatementToReplaceWith, conversionStep)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| directoryPath | 
| extension | 
| sectionHeader | 
| includeStatementToReplaceWith | 
| conversionStep | 

<a name="FileOperations+removeNonWhitelistedDirectivesInVhostFiles"></a>

### fileOperations.removeNonWhitelistedDirectivesInVhostFiles(directoryPath, whitelistedDirectivesSet, conversionStep)
Removes Non Whitelisted Directives in Vhost Files

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| directoryPath | 
| whitelistedDirectivesSet | 
| conversionStep | 

<a name="FileOperations+removeNonMatchingFilesByName"></a>

### fileOperations.removeNonMatchingFilesByName(srcDir, destDir, conversionStep)
Remove files in destination dir which are not present in source dir (comparision by name)

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param | Type | Description |
| --- | --- | --- |
| srcDir | <code>string</code> | The source directory's path |
| destDir | <code>string</code> | The destination directory's path |
| conversionStep | <code>ConversionStep</code> | The Conversion Step Object used to Write the Report. |

<a name="FileOperations+consolidateVariableFiles"></a>

### fileOperations.consolidateVariableFiles(files, newFilePath) ⇒ <code>array</code>
Returns a list of the variables after consolidating the variables (duplicates not allowed)
from given files into a single new file.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Returns**: <code>array</code> - An array of variable names that were added to the new file.  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>array</code> | An array of all the files that will be parsed and combined. |
| newFilePath | <code>string</code> | The file that will be created to consolidate the variables. |

<a name="FileOperations+checkForUndefinedVariables"></a>

### fileOperations.checkForUndefinedVariables(directoryPath, definedVariablesList)
Check vhost files for usage of undefined variables.
If found, print warning in terminal.

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  
**Throws**:

- <code>TypeError</code> This will throw a error if the directory does not exist.


| Param | Type |
| --- | --- |
| directoryPath | <code>string</code> | 
| definedVariablesList | <code>array</code> | 

<a name="FileOperations+replaceIncludesInFarmAndVhostFile"></a>

### fileOperations.replaceIncludesInFarmAndVhostFile(dirPath, type, header, ruleFileToReplace, includePatternToReplaceWith, conversionStep)
Replace Includes by reading directories and passing file to include the file content

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| dirPath | 
| type | 
| header | 
| ruleFileToReplace | 
| includePatternToReplaceWith | 
| conversionStep | 

<a name="FileOperations+replaceFileIncludesInFarmFileAndVhostFile"></a>

### fileOperations.replaceFileIncludesInFarmFileAndVhostFile(filePath, type, header, ruleFilesToReplace, includePatternToReplaceWith, conversionStep)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| filePath | 
| type | 
| header | 
| ruleFilesToReplace | 
| includePatternToReplaceWith | 
| conversionStep | 

<a name="FileOperations+getNamesOfRuleFilesIncluded"></a>

### fileOperations.getNamesOfRuleFilesIncluded(filePath, ruleFilesToCheck, includeSyntax) ⇒
Returns rules file included based on includeSyntax

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| filePath | 
| ruleFilesToCheck | 
| includeSyntax | 

<a name="FileOperations+consolidateAllRuleFilesIntoSingleRuleFile"></a>

### fileOperations.consolidateAllRuleFilesIntoSingleRuleFile(ruleFiles, consolidatedRuleFilePath, conversionStep)
Writes all the rules file into a single rule file

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| ruleFiles | 
| consolidatedRuleFilePath | 
| conversionStep | 

<a name="FileOperations+getFileContentsArray"></a>

### fileOperations.getFileContentsArray(file)
**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| file | 

<a name="FileOperations+getPath"></a>

### fileOperations.getPath(file) ⇒ <code>string</code>
Returns path for a file

**Kind**: instance method of [<code>FileOperations</code>](#FileOperations)  

| Param |
| --- |
| file | 

