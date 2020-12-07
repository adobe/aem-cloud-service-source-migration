# AEM as a Cloud Service - Index Converter Report 
This report contains the changes that have been made to Custom Oak Index Definitions and Ensure Indexes while doing migration into AEM as a Cloud Service compatible Oak Index Definitions  by the tool.

## Ensure Definitions

Refer to [Ensure Oak Index](https://adobe-consulting-services.github.io/acs-aem-commons/features/ensure-oak-index/index.html) to learn how to define and create Oak Definitions. These were created (in place of actual Oak index definitions) so that they do not wipe out the actual index data when updating the node, necessitating a reindex. 

AEM as a Cloud Service has no support for Ensure Definitions, and hence they need to be converted to Oak Index Definitions (then further migrated into AEM as a Cloud Service compatible Custom Oak Index Definitions) as per below guidelines:

* If property ignore is set to true, ignore/skip the Ensure Definition
* Update the `jcr:primaryType` to `oak:QueryIndexDefinition`
* Remove any properties that are to be ignored as mentioned in OSGi configurations
* Remove subtree `/facets/jcr:content` from Ensure Definition

Custom Oak Index Definitions are categorized as:

* **Custom OOTB (Product) Oak Index Definitions**: Modification into existing OOTB Oak Index Definitions
-* **Newly created Oak Index Definitions**

## Operations For Custom OOTB (Product) Oak Index Definition

* This tool will parse the Custom OOTB (Product) Oak Index Definition and fetch the associated OOTB Index Definition.
* It will compare the Custom OOTB Oak Index Definition to the associated OOTB Index Definition and retrieve the difference between Custom OOTB Index Definition. and associated OOTB Index Definition. That difference or delta is basically customization done by the user in OOTB Oak Index Definition. 
* It will validate the retrieved customization as per AEM as Cloud Service compatible OAK Index Definitions guidelines.
* It will merge validated customization of Custom OOTB Oak Index Definition to corresponding OAK Index Definition present on AEM as a Cloud Service.

## Naming Conventions for Custom OOTB (Product) Oak Index Definition

   ```"Name of the corresponding OAK Index Definition on AEM as a Cloud Service"-"latest version of this index on AEM as a Cloud Service "-"custom"-1```

      eg. damAssetLucene-6-custom-1

## Operations For Newly created Custom Oak Index Definition

* It will parse and validate the Custom Oak Index Definition as per AEM as Cloud Service compatible OAK Index Definitions guidelines.
* It will rename the Custom Oak Index Definition.

## Naming Conventions for Newly created Custom Oak Index Definition :

   ```"Name of the Custom Oak Index Definition"-"custom"-1```

      for example, testindex-custom-1

This tool will update the filter path in filter.xml as well based on the new name of Custom OAK Index Definitions.

   for example, from ```<filter root="/oak:index/damAssetLucene1"/> to <filter root="/oak:index/damAssetLucene-6-custom-1"/>```
