import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseZpr, ZprConfig } from "./parser";

async function getCpp(config: ZprConfig): Promise<vscode.Uri> {
    const cppFiles = await vscode.workspace.findFiles('*.cpp');
    if (cppFiles.length === 0 ) {
        throw new EvalError('No se encontraron archivos ".zpr".');
    }
    return cppFiles[0];
}

async function generateTasks(pickedCppUri: vscode.Uri): Promise<string|null> {
    if (!vscode.workspace.workspaceFolders) {
        return null;
    }
    // Llamar al comando de Cpp C_Cpp.AddDebugConfiguration para generar tasks.json
    const doc = await vscode.workspace.openTextDocument(pickedCppUri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    await vscode.commands.executeCommand('C_Cpp.BuildAndDebugFile');

    const workspaceFolderFullPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const vscodeDir = path.join(workspaceFolderFullPath, '.vscode');
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
    return path.join(vscodeDir, 'tasks.json');
}

async function applyZpr(task: &any, config: ZprConfig): Promise<boolean>
{
    if (Array.isArray(task.args)) {
        const insertIndex = task.args.indexOf('-g') + 1;
        if (insertIndex > 0) {
            task.args.splice(insertIndex, 0, `-std=${config.std_cpp || "c++11"}`);
            task.args.splice(insertIndex+1, 0, "-I${fileDirname}");
        }
        // TODO: tener en cuenta mas parametros del .zpr
    } else {
        vscode.window.showErrorMessage('No se encontraron argumentos de ejecucion en "tasks.json".');
        return false;
    }

    return true;
}

export async function generateTaskJson(zprPath: vscode.Uri): Promise<boolean> {
    if (!vscode.workspace.workspaceFolders) {
        return false;
    }

    // ======================= Conseguir CPP =======================
    // Parsear zpr
    const config: ZprConfig = parseZpr(zprPath.fsPath);

    // Seleccionar cpp
    const pickedCppUri: vscode.Uri = await getCpp(config);
    if (!pickedCppUri) {
        vscode.window.showErrorMessage('No se encontraron archivos ".zpr".');
        return false;
    }

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
    const tasksJsonPath = await generateTasks(pickedCppUri);
    if (!tasksJsonPath) {
        vscode.window.showErrorMessage('Ha ocurrido un error generando el "tasks.json".');
        return false;
    }

    // ======================= Leer tasks.json =======================
    // Leer tasks.json
    const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));

    if (!tasksJson) {
        vscode.window.showErrorMessage('Ha ocurrido un error generando el "tasks.json".');
        return false;
    }

    const tasks = tasksJson.tasks;
    if (!Array.isArray(tasks)) {
        vscode.window.showErrorMessage('Ha ocurrido un error generando el "tasks.json".');
        return false;
    }

    const task = tasks.find(t => t.type == 'cppbuild');
    if (!task) {
        vscode.window.showErrorMessage('No se encontro task "cppbuild".');
        return false;
    }

    // ======================= Modificar tasks.json a partir de ZPR =======================
    if(!(await applyZpr(task, config))) {
        return false;
    }

    // Guardar tasks.json
    fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, null, 4));

    vscode.window.showInformationMessage('tasks.json creado.');
    return true;
}