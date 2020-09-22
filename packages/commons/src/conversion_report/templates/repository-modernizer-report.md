# AEM as a Cloud Service - Repository Modernizer Report
This report contains the changes that have been made to your repository package structure by the tool.
After reviewing these changes, you should simply run the validator on the new packages, to check the state. 

## Project Structure changes

AEM requires a separation of content and code, which means a single content package cannot deploy
 to both `/apps` and runtime-writable areas (e.g. `/content` , `/conf` , `/home` , or anything not
 `/apps`) of the repository. Instead, the application must separate code and content into discrete
 packages for deployment into AEM.

Adobe Experience Manager Maven projects to be AEM Cloud Service compatible, need to ensure that
* they respect the split of mutable and immutable content
* the requisite dependencies are established to create non-conflicting, deterministic deployments
* they are packaged in a deployable structure - AEM application deployments must be comprised
  of a single AEM package. This package should in turn contain sub-packages that comprise 
  everything required by the application to function, including code, configuration and any
  supporting baseline content.
 
The objective of this tool is to modernize any given project(s) into AEM Cloud Service compatible
 structure, by creating the following deployment structure :
-   The `ui.apps` package, or Code Package, contains all the code to be deployed and only deploys
 to `/apps`
-   The `ui.content` package, or Content Package, contains all content and configuration
-   The `all` package is a container package that ONLY includes the `ui.apps` and `ui.content`
 packages as embeds

For conversion of the provided packages to AEM as a Cloud Service compatible package structure,
 we have made the following changes to the dispatcher configuration:




