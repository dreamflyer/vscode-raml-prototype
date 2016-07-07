/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var path = require('path');
var fs = require('fs');
var vscode_1 = require('vscode');
var vscode_languageclient_1 = require('vscode-languageclient');
function activate(context) {
    vscode_1.workspace.getConfiguration();
    var serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    var clientOptions = {
        //documentSelector: ['raml'],
        documentSelector: ['raml'],
        synchronize: {
            configurationSection: 'languageServerExample'
        }
    };
    var client = new vscode_languageclient_1.LanguageClient('Language Server Example', serverOptions, clientOptions);
    client.onRequest({ method: "content" }, function (request) {
        var content = fs.existsSync(request.uri) ? fs.readFileSync(request.uri).toString() : null;
        return { content: content };
    });
    client.onRequest({ method: "list" }, function (request) {
        var content = fs.existsSync(request.uri) ? fs.readdirSync(request.uri).toString() : [];
        return { list: content };
    });
    client.onRequest({ method: "savecontent" }, function (request) {
        fs.writeFileSync(request.uri, request.content);
        return {};
    });
    var disposable = client.start();
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map