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

module.exports = {
    DISPATCHER_CONVERTER_REPORT: "dispatcher-converter-report.md",

    TARGET_DISPATCHER_SRC_FOLDER: "./target/dispatcher/src",

    TARGET_SINGLE_DISPATCHER: "./target/disatpcher-single.any",

    CLOSE_CURLY_BRACE: "}",

    CONF: "conf",

    CONF_DISPATCHER_D: "conf.dispatcher.d",

    CONF_D: "conf.d",

    CONF_MODULES_D: "conf.modules.d",

    VHOST: "vhost",

    ANY: "any",

    FARM: "farm",

    ENABLED_FARMS: "enabled_farms",

    ENABLED_VHOSTS: "enabled_vhosts",

    AVAILABLE_VHOSTS: "available_vhosts",

    AVAILABLE_FARMS: "available_farms",

    COMMENT_ANNOTATION: "#",

    VIRTUAL_HOST_SECTION_START: "<VirtualHost",

    VIRTUAL_HOST_SECTION_END: "</VirtualHost>",

    VIRTUAL_HOST_SECTION_START_PORT_80: ":80>",

    INCLUDE_SYNTAX_IN_VHOST: "Include",

    INCLUDE_SYNTAX_IN_FARM: "$include",

    RENDERS_SECTION: "/renders",

    VIRTUALHOSTS_SECTION_IN_FARM: "/virtualhosts",

    ALLOWED_CLIENTS_SECTION: "/allowedClients",

    CLIENT_HEADER_SECTION: "/clientheader",

    FILTERS_SECTION: "/filter",

    IF_BLOCK_START: "<If",

    IF_BLOCK_END: "</If>",

    IFMODULE_END: "</IfModule>",

    BLOCK_START: "block_start",

    BLOCK_END: "block_end",

    REWRITES_MODULE: "<IfModule mod_rewrite.c>",

    RULES_SECTION: "/rules",

    WARNING: "WARNING",

    OPT_IN: "opt-in",

    USE_SOURCES_DIRECTLY: "USE_SOURCES_DIRECTLY",

    // whitelisted directives (in lower case for ease of comparision; directives can be case-insensitive)
    WHITELISTED_DIRECTIVES_LIST: [
        "<directory>",
        "<files>",
        "<filesmatch>",
        "<if>",
        "<elseif>",
        "<else>",
        "<ifdefine>",
        "<ifmodule>",
        "<location>",
        "<locationmatch>",
        "<proxy>",
        "<proxymatch>",
        "<requireall>",
        "<requireany>",
        "<virtualhost>",
        "addcharset",
        "addencoding",
        "addhandler",
        "addoutputfilter",
        "addoutputfilterbytype",
        "addtype",
        "alias",
        "allow",
        "allowencodedslashes",
        "allowmethods",
        "allowoverride",
        "authbasicprovider",
        "authgroupfile",
        "authname",
        "authtype",
        "authuserfile",
        "balancergrowth",
        "balancerinherit",
        "balancermember",
        "balancerpersist",
        "browsermatch",
        "browsermatchnocase",
        "define",
        "deflatecompressionlevel",
        "deflatefilternote",
        "deflatememlevel",
        "deflatewindowsize",
        "deny",
        "directoryslash",
        "dispatcherdeclineroot",
        "dispatchernocanonurl",
        "dispatcherpasserror",
        "dispatcheruseprocessedurl",
        "documentroot",
        "errordocument",
        "expiresactive",
        "expiresbytype",
        "expiresdefault",
        "fileetag",
        "filterchain",
        "filterdeclare",
        "filterprovider",
        "forcetype",
        "header",
        "include",
        "includeoptional",
        "keepalive",
        "limitrequestfieldsize",
        "modmimeusepathinfo",
        "noproxy",
        "options",
        "order",
        "passenv",
        "proxy100continue",
        "proxyaddheaders",
        "proxybadheader",
        "proxyblock",
        "proxydomain",
        "proxyerroroverride",
        "proxyiobuffersize",
        "proxymaxforwards",
        "proxypass",
        "proxypassinherit",
        "proxypassinterpolateenv",
        "proxypassmatch",
        "proxypassreverse",
        "proxypassreversecookiedomain",
        "proxypassreversecookiepath",
        "proxypreservehost",
        "proxyreceivebuffersize",
        "proxyremote",
        "proxyremotematch",
        "proxyrequests",
        "proxyset",
        "proxysourceaddress",
        "proxystatus",
        "proxytimeout",
        "proxyvia",
        "redirect",
        "redirectmatch",
        "remoteipheader",
        "remoteiptrustedproxylist",
        "requestheader",
        "requestreadtimeout",
        "require",
        "rewritecond",
        "rewriteengine",
        "rewritemap",
        "rewriteoptions",
        "rewriterule",
        "satisfy",
        "scriptalias",
        "secrequestbodyaccess",
        "secruleengine",
        "serveralias",
        "servername",
        "serversignature",
        "setenvif",
        "setenvifexpr",
        "setenvifnocase",
        "sethandler",
        "setoutputfilter",
        "sslproxyengine",
        "substitute",
        "traceenable",
        "undefine",
        "userdir",
    ],
};
