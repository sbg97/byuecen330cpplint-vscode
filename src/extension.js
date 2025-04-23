const vscode = require('vscode');
const os = require('os');
const path = require('path');
const log = require('./log');
const common = require("./common");
const cpplint = require("./cpplint");
let cpplint_obj = new cpplint.cpplint();

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	log.info('Congratulations, your extension "cpp-check-lint" is now active!');
	let settings = vscode.workspace.getConfiguration('cpp-check-lint');
	log.setLogLevel(settings.get('--log'));
	if (settings.get('--enable') === true) {
		log.info('start cpp-check-lint extension!');
	} else {
		log.info('disable cpp-check-lint extension!');
		return;
	}
	log.info("context.asAbsolutePath : " + context.extensionPath);

	let support_language = ["cpp", "c", "h", "hh", "hpp", "h++", "cc"];

	cpplint_obj.set_root_path(context.extensionPath);

	let tmp = vscode.commands.registerCommand('cpp-check-lint.cpplint', (url) => { cpplint_obj.activate(context, url, true); });
	context.subscriptions.push(tmp);
	tmp = vscode.commands.registerCommand('cpp-check-lint.cpplintdir', (url) => { cpplint_obj.activate(context, url, false); });
	context.subscriptions.push(tmp);
	tmp = vscode.commands.registerCommand('cpp-check-lint.cpplintcmd', (url) => { cpplint_obj.on_cmd(context, url); });
	context.subscriptions.push(tmp);
	tmp = vscode.languages.registerCodeActionsProvider(support_language, cpplint_obj);
	context.subscriptions.push(tmp);

	tmp = vscode.workspace.onDidChangeConfiguration(function (event) {
		let new_settings = vscode.workspace.getConfiguration('cpp-check-lint');
		log.setLogLevel(new_settings.get('--log'));
		log.info("onDidChangeConfiguration");
		cpplint_obj.update_setting();
	})
	context.subscriptions.push(tmp);

	tmp = vscode.workspace.onDidSaveTextDocument(function (event) {

		log.info("onDidSaveTextDocument : " + event.uri.fsPath);
		if (cpplint_obj.onsave) {
			for (let value of support_language) {
				if (event.uri.fsPath.endsWith("." + value)) {
					cpplint_obj.activate(context, event.uri, true);
					break;
				}
			}
		}
	})
	context.subscriptions.push(tmp);

	// Make cpplint.py executable on linux
	if ("win32" != os.platform()) {
		let cmd = 'chmod +x ';
		let arg = path.join(path.join(path.join(context.extensionPath, "bin"), "linux64"), "cpplint.py");
		let res = common.runCmd_execSync(cmd + arg);
		log.info(cmd + " " + arg + " -> " + res);
		cmd = 'pwd';
		res = common.runCmd_execSync(cmd);
		log.info(cmd + "->" + res);
	}
}

// this method is called when your extension is deactivated
function deactivate() {
	cpplint_obj.deactivate();
	console.log('a oh, your extension "cpp-check-lint" is now deactivate!');
}

module.exports = {
	activate,
	deactivate
}
