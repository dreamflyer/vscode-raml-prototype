/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as fs from 'fs';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
	workspace.getConfiguration()

	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	let debugOptions = {execArgv: ["--nolazy", "--debug=6004"]};

	let serverOptions:ServerOptions = {
		run: {module: serverModule, transport: TransportKind.ipc},
		debug: {module: serverModule, transport: TransportKind.ipc, options: debugOptions}
	}

	// Options to control the language client
	let clientOptions:LanguageClientOptions = {
		//documentSelector: ['raml'],
		documentSelector: ['raml'],
		synchronize: {
			configurationSection: 'languageServerExample'
			//fileEvents: workspace.createFileSystemWatcher('**/*.*')
		}
	}

	let client = new LanguageClient('Language Server Example', serverOptions, clientOptions);

	client.onRequest({method: "content"}, (request:any) => {
		var content = fs.existsSync(request.uri) ? fs.readFileSync(request.uri).toString() : null;

		return {content: content};
	})

	client.onRequest({method: "list"}, (request:any) => {
		var content = fs.existsSync(request.uri) ? fs.readdirSync(request.uri).toString() : [];

		return {list: content};
	})

	client.onRequest({method: "savecontent"}, (request:any) => {
		fs.writeFileSync(request.uri, request.content);

		return {};
	})

	let disposable = client.start();

	context.subscriptions.push(disposable);
}