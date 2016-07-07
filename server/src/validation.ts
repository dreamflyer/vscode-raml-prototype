/// <reference path="../typings/promise.d.ts" />
declare function require(s:string):any;

var path = require("path");

import parser = require("raml-1-parser");
import suggestions = require("raml-suggestions");

var cache: any = {};
var dirCache: any = {}

export class FSResolver{
    constructor(private connection: any) {
        
    }
    
    content(path:string):string {
        this.connection.console.log("FSResolver content: " + path);

        if(cache[path]) {
            return cache[path];
        }
        
        return "";
    }
    
    contentAsync(path:string):Promise<string> {
        this.connection.console.log("FSResolver contentAsync: " + path);
        
        if(cache[path]) {
            return Promise.resolve(cache[path])
        }
        
        return this.connection.sendRequest({method: "content"}, {uri: path}).then(response => {
            return Promise.resolve(response.content);
        });
    }

    list(path:string):string[]{
        this.connection.console.log("FSResolver list: " + path);

        if(dirCache[path]) {
            return dirCache[path];
        }
        
        return [];
    }

    listAsync(path:string):Promise<string[]>{
        this.connection.console.log("FSResolver listAsync: " + path);
        
        if(dirCache[path]) {
            return Promise.resolve(dirCache[path]);
        }

        return this.connection.sendRequest({method: "list"}, {uri: path}).then(response => {
            dirCache[path] = response.list;
            
            return Promise.resolve(response.list);
        });
    }
}

export function onErrors(uri: string, text: string, connection, handle) {
    cache[uri] = text;
    
    parser.loadApi(uri, {fsResolver: new FSResolver(connection)}).then(api => {
        handle(api.errors());
    });
}

class ContentProvider implements  suggestions.ICompletionContentProvider {
    constructor() {

    }

    contentDirName(content: suggestions.IContent): string {
        return path.dirname(content.getPath());
    }

    dirName(fpath: string): string {
        return path.dirname(fpath);
    }

    exists(fpath: string): boolean {
        //return fs.existsSync(fpath);

        return cache[fpath] === "" || cache[fpath];
    }

    resolve(contextPath: string, relativePath: string): string {
        return path.resolve(contextPath, relativePath);
    }
    isDirectory(path: string): boolean {
        return false;
    }
    readDir(path: string): string[] {
        return dirCache[path] || [];
    }
}

var completionProvider = new suggestions.CompletionProvider(new ContentProvider());

export function completionByOffset(filePath, offset): string[] {
    var content: suggestions.IContent  = <suggestions.IContent>getlFsContent(filePath);
    var position: suggestions.IPosition = <suggestions.IPosition>getPosition(offset);

    var proposals = completionProvider.suggest(new suggestions.CompletionRequest(content, position), true);

    var result = proposals.map(function(suggestion) {
        return suggestion.text || suggestion.displayText;
    });
    
    return result;
}

function getlFsContent(filePath): any {
    return {
        getText: function() {
            if(cache[filePath]) {
                return cache[filePath]
            }

            return "";
        },

        getPath: function() {
            return filePath;
        },

        getBaseName: function() {
            return path.basename(filePath);
        }
    }
}

function getPosition(offset): any {
    return {
        getOffset: function() {
            return offset;
        }
    }
}