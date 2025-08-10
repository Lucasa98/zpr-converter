// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ZprConfig, parseZpr } from './parser';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "zpr-converter" is now active!');

	const disposable = vscode.commands.registerCommand('zpr-converter.generate', async () => {
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
		// Parsear zpr
		const config: ZprConfig = parseZpr(pickedZpr);

		// Seleccionar cpp
		const cppFiles = await vscode.workspace.findFiles('*.cpp');
		if (cppFiles.length === 0) {
			vscode.window.showErrorMessage('No se encontraron archivos .cpp en la carpeta.');
			return;
		}
		const pickedCppUri = cppFiles[0];

		/* Lo ideal seria que se elija un entrypoint (main.cpp) para el proyecto. Por ahora lo dejo simple
		if (config.source_paths.length > 0) {
			const pickedCpp = config.source_paths[0];
		}
		const pickedCpp = await vscode.window.showQuickPick(config.source_paths, {
			placeHolder: 'main.cpp',
			title: 'Elija el archivo cpp para usar como entrypoint',
			canPickMany: false,
			ignoreFocusOut: false
		});
		if (!pickedCpp) return;

		const pickedCppPath = vscode.Uri.joinPath(
			vscode.Uri.file(path.dirname(pickedZpr)),
			pickedCpp
		);
		*/

		// ======================= Generar tasks.json =======================
		// Llamar al comando de Cpp C_Cpp.AddDebugConfiguration para generar tasks.json
		const doc = await vscode.workspace.openTextDocument(pickedCppUri);
		const editor = await vscode.window.showTextDocument(doc, { preview: false });
		await vscode.commands.executeCommand('C_Cpp.BuildAndDebugFile');

		// ======================= Leer tasks.json =======================
		const workspaceFolderFullPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const vscodeDir = path.join(workspaceFolderFullPath, '.vscode');
		const tasksJsonPath = path.join(vscodeDir, 'tasks.json');
		// Esperar hasta que aparezca el tasks.json (el comando es asincronico y con flujo controlado por el usuario)
		await new Promise<void>((resolve, reject) => {
			const folderWatcher = fs.watch(workspaceFolderFullPath, async (eventType, foldername) => {
				if (foldername === '.vscode') {
					await new Promise<void>((resolve, reject) => {
						const fileWatcher = fs.watch(vscodeDir, (eventType, filename) => {
							if (filename === 'tasks.json') {
								fileWatcher.close();
								resolve();
							}
						});
					});
					folderWatcher.close();
					resolve();
				}
			});
		});

		// Leer tasks.json
		const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
		const tasks = tasksJson.tasks;

		if (!tasksJson) {
			vscode.window.showErrorMessage('Ha ocurrido un error generando el "tasks.json".');
			return;
		}

		if (!Array.isArray(tasks)) {
			vscode.window.showErrorMessage('Ha ocurrido un error generando el "tasks.json".');
			return;
		}
		const task = tasks.find(t => t.type == 'cppbuild');
		if (!task) {
			vscode.window.showErrorMessage('No se encontro task "cppbuild".');
			return;
		}

		// ======================= Modificar tasks.json a partir de ZPR =======================
		if (Array.isArray(task.args)) {
			const insertIndex = task.args.indexOf('-g') + 1;
			if (insertIndex > 0) {
				task.args.splice(insertIndex, 0, `-std=${config.std_cpp || "c++11"}`);
				task.args.splice(insertIndex+1, 0, "-I${fileDirname}");
			}
			// TODO: tener en cuenta mas parametros del .zpr
		} else {
			vscode.window.showErrorMessage('No se encontraron argumentos de ejecucion en "tasks.json".');
			return;
		}

		// Guardar tasks.json
		fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, null, 4));

		vscode.window.showInformationMessage('tasks.json creado.');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
