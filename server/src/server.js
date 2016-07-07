/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var vscode_languageserver_1 = require('vscode-languageserver');
// Create a connection for the server. The connection uses Node's IPC as a transport
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// var old: any = (<any>fs).readFileSync;
//
// (<any>fs).readFileSync = function(a, b, c, d) {
//     connection.console.log("readfilesync!!!!");
//
// 	return old(a, b, c ,d);
// }
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
var workspaceRoot;
connection.onInitialize(function (params) {
    connection.console.log("onInitialize: " + JSON.stringify(params, null, "\t"));
    workspaceRoot = params.rootPath;
    //a = params.initializationOptions;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Full,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true
            }
        }
    };
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(function (change) {
    connection.console.log("onDidChangeContent");
    validateTextDocument(change.document);
    //connection.console.log("content: " + a.content);
});
// hold the maxNumberOfProblems setting
var maxNumberOfProblems;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(function (change) {
    connection.console.log("onDidChangeConfiguration: " + JSON.stringify(change, null, "\t"));
    var settings = change.settings;
    maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});
var validation = require("./validation");
function validateTextDocument(textDocument) {
    connection.console.log("validateTextDocument");
    var diagnostics = [];
    if (textDocument.uri.indexOf(".raml") < 0) {
        diagnostics.push();
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
        return;
    }
    var filePath = textDocument.uri.replace('file:///', '/');
    validation.onErrors(filePath, textDocument.getText(), connection, function (errors) {
        errors.forEach(function (error) {
            var start = textDocument.positionAt(error.start);
            var end = textDocument.positionAt(error.end);
            diagnostics.push({
                severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                range: {
                    start: start,
                    end: end
                },
                message: error.message,
                source: 'ex'
            });
        });
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
    });
}
connection.onDidChangeWatchedFiles(function (change) {
    connection.console.log("onDidChangeWatchedFiles");
    connection.console.log('We recevied an file change event');
});
connection.onCompletion(function (textDocumentPosition) {
    connection.console.log("onCompletion");
    var filePath = textDocumentPosition.textDocument.uri.replace('file:///', '/');
    var offset = documents.get(textDocumentPosition.textDocument.uri).offsetAt(textDocumentPosition.position);
    return validation.completionByOffset(filePath, offset).map(function (proposed) {
        return {
            label: proposed,
            kind: vscode_languageserver_1.CompletionItemKind.Text
        };
    });
    // return [
    // 	{
    // 		label: 'TypeScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 1
    // 	},
    // 	{
    // 		label: 'JavaScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 2
    // 	}
    // ]
});
connection.onCompletionResolve(function (item) {
    // connection.console.log("onCompletionResolve");
    //
    // if (item.data === 1) {
    // 	item.detail = 'TypeScript details',
    // 	item.documentation = 'TypeScript documentation'
    // } else if (item.data === 2) {
    // 	item.detail = 'JavaScript details',
    // 	item.documentation = 'JavaScript documentation'
    // }
    return item;
});
/*
connection.onDidOpenTextDocument((params) => {
    // if(!vfs) {
    // 	connection.sendRequest({method: "someid1"}, {type: "directory1", path: workspaceRoot}).then((arg) => {
    // 		vfs = {};
    //
    // 		connection.console.log("recieved: " + JSON.stringify(arg));
    // 	});
    //
    // 	connection.sendRequest({method: "someid2"}, {type: "directory2", path: workspaceRoot}).then((arg) => {
    // 		vfs = {};
    //
    // 		connection.console.log("recieved: " + JSON.stringify(arg));
    // 	});
    // }
    
    // A text document got opened in VSCode.
    // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
    // params.text the initial full content of the document.
    connection.console.log(`${params.textDocument.uri} opened: ${JSON.stringify(params)}`);
});

connection.onDidChangeTextDocument((params) => {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.

    console.log("document changed: " + JSON.stringify(params, null, "\t"));
});


connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    connection.console.log(`${params.textDocument.uri} closed: ${JSON.stringify(params)}`);
});
*/
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map