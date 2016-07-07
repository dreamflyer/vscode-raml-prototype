"use strict";
/// <reference path="../typings/promise.d.ts" />
var path = require("path");
var parser = require("raml-1-parser");
var suggestions = require("raml-suggestions");
var cache = {};
var dirCache = {};
var FSResolver = (function () {
    function FSResolver(connection) {
        this.connection = connection;
    }
    FSResolver.prototype.content = function (path) {
        this.connection.console.log("FSResolver content: " + path);
        if (cache[path]) {
            return cache[path];
        }
        return "";
    };
    FSResolver.prototype.contentAsync = function (path) {
        this.connection.console.log("FSResolver contentAsync: " + path);
        if (cache[path]) {
            return Promise.resolve(cache[path]);
        }
        return this.connection.sendRequest({ method: "content" }, { uri: path }).then(function (response) {
            return Promise.resolve(response.content);
        });
    };
    FSResolver.prototype.list = function (path) {
        this.connection.console.log("FSResolver list: " + path);
        if (dirCache[path]) {
            return dirCache[path];
        }
        return [];
    };
    FSResolver.prototype.listAsync = function (path) {
        this.connection.console.log("FSResolver listAsync: " + path);
        if (dirCache[path]) {
            return Promise.resolve(dirCache[path]);
        }
        return this.connection.sendRequest({ method: "list" }, { uri: path }).then(function (response) {
            dirCache[path] = response.list;
            return Promise.resolve(response.list);
        });
    };
    return FSResolver;
}());
exports.FSResolver = FSResolver;
function onErrors(uri, text, connection, handle) {
    cache[uri] = text;
    parser.loadApi(uri, { fsResolver: new FSResolver(connection) }).then(function (api) {
        handle(api.errors());
    });
}
exports.onErrors = onErrors;
var ContentProvider = (function () {
    function ContentProvider() {
    }
    ContentProvider.prototype.contentDirName = function (content) {
        return path.dirname(content.getPath());
    };
    ContentProvider.prototype.dirName = function (fpath) {
        return path.dirname(fpath);
    };
    ContentProvider.prototype.exists = function (fpath) {
        //return fs.existsSync(fpath);
        return cache[fpath] === "" || cache[fpath];
    };
    ContentProvider.prototype.resolve = function (contextPath, relativePath) {
        return path.resolve(contextPath, relativePath);
    };
    ContentProvider.prototype.isDirectory = function (path) {
        return false;
    };
    ContentProvider.prototype.readDir = function (path) {
        return dirCache[path] || [];
    };
    return ContentProvider;
}());
var completionProvider = new suggestions.CompletionProvider(new ContentProvider());
function completionByOffset(filePath, offset) {
    var content = getlFsContent(filePath);
    var position = getPosition(offset);
    var proposals = completionProvider.suggest(new suggestions.CompletionRequest(content, position), true);
    var result = proposals.map(function (suggestion) {
        return suggestion.text || suggestion.displayText;
    });
    return result;
}
exports.completionByOffset = completionByOffset;
function getlFsContent(filePath) {
    return {
        getText: function () {
            if (cache[filePath]) {
                return cache[filePath];
            }
            return "";
        },
        getPath: function () {
            return filePath;
        },
        getBaseName: function () {
            return path.basename(filePath);
        }
    };
}
function getPosition(offset) {
    return {
        getOffset: function () {
            return offset;
        }
    };
}
//# sourceMappingURL=validation.js.map