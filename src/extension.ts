// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ZprConfig, parseZpr } from './parser';
import { generateTaskJson } from './generator';

async function getCpp(config: ZprConfig): Promise<vscode.Uri> {
	const cppFiles = await vscode.workspace.findFiles('*.cpp');
	if (cppFiles.length === 0 ) {
		throw new EvalError('No se encontraron archivos ".zpr".');
	}
	return cppFiles[0];
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('zpr-converter.generate', async () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('Debe haber un workspace abierto.');
			return;
		}

		// ======================= Conseguir ZPR =======================
		// Buscar archivos zpr
		const zprFiles = await vscode.workspace.findFiles('*.zpr');

		if (zprFiles.length === 0) {
			vscode.window.showErrorMessage('No se encontraron archivos ".zpr".');
			return;
		}

		// Seleccionar un zpr
		const pickedZpr = await vscode.window.showQuickPick(zprFiles.map(uri => uri.fsPath), {
			placeHolder: 'project.zpr',
			title: 'Elija el archivo zpr del proyecto de Zinjai',
			canPickMany: false,
			ignoreFocusOut: false
		});
		if (!pickedZpr) return;

		// ======================= Conseguir CPP =======================
		var i: number = 0;
		while(pickedZpr != zprFiles[i].fsPath)
			++i;
		const zprUri: vscode.Uri = zprFiles[i];
		await generateTaskJson(zprUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('zpr-converter.generateFromFile', async (zpr: vscode.Uri) => {
		if (!zpr) {
			vscode.window.showWarningMessage('No se seleccionó archivo zpr. Se procede a usar el comando "ZPR: generar tasks.json..."');
			vscode.commands.executeCommand('zpr-converter.generate');
			return;
		}
		await generateTaskJson(zpr);
	}))
}

// This method is called when your extension is deactivated
export function deactivate() {}
