/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

import * as fs from 'fs';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
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
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	connection.console.log("onInitialize: " + JSON.stringify(params, null, "\t"));
	
	workspaceRoot = params.rootPath;

	//a = params.initializationOptions;
	
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: TextDocumentSyncKind.Full,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true
			}
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	connection.console.log("onDidChangeContent");
	
	validateTextDocument(change.document);

	//connection.console.log("content: " + a.content);
});

// The settings interface describe the server relevant settings part
interface Settings {
	languageServerExample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	connection.console.log("onDidChangeConfiguration: " + JSON.stringify(change, null, "\t"));
	
	let settings = <Settings>change.settings;
	maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

import validation = require("./validation");

function validateTextDocument(textDocument: TextDocument): void {
	connection.console.log("validateTextDocument");
	
	let diagnostics: Diagnostic[] = [];

	if(textDocument.uri.indexOf(".raml") < 0) {
		diagnostics.push();

		connection.sendDiagnostics({ uri: textDocument.uri,  diagnostics});

		return;
	}

	var filePath = textDocument.uri.replace('file:///', '/');

	validation.onErrors(filePath, textDocument.getText(), connection, errors => {
		errors.forEach((error: any) => {
			var start = textDocument.positionAt(error.start);
			var end = textDocument.positionAt(error.end);

			diagnostics.push({
				severity: DiagnosticSeverity.Warning,
				range: {
					start: start,
					end: end
				},
				message: error.message,
				source: 'ex'
			});
		});

		connection.sendDiagnostics({ uri: textDocument.uri,  diagnostics});
	});
}

connection.onDidChangeWatchedFiles((change) => {
	connection.console.log("onDidChangeWatchedFiles");
	
	connection.console.log('We recevied an file change event');
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	connection.console.log("onCompletion");
	
	var filePath = textDocumentPosition.textDocument.uri.replace('file:///', '/');
	
	var offset = documents.get(textDocumentPosition.textDocument.uri).offsetAt(textDocumentPosition.position);
	
	return validation.completionByOffset(filePath, offset).map(proposed => {
		return {
			label: proposed,
			kind: CompletionItemKind.Text
		}
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

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
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