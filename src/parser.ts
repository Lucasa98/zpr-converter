import * as fs from 'fs';
import * as path from 'path';

export interface ZprConfig {
    std_cpp?: string;
    output_file?: string;
    headers_dirs?: string[];
    project_name?: string;
    macros?: string[];
    optimization_level?: string;
    debug_level?: string;
    compiling_extra?: string;
    libraries_dirs?: string[];
    libraries?: string[];
    source_paths: string[];
}

function solveHeaderDirName(v: string): string {
    if (!v) {
        return ' ';
    }

    const [root, folder_name] = v.split(' ');

    // No hace falta si esta en la carpeta raiz del proyecto
    if (root == '.') {
        return ' ';
    }

    return path.join(root,folder_name);
}

export function parseZpr(filePath: string): ZprConfig {
    const config: ZprConfig = {source_paths: []};

    // Leer .zpr
    const content = fs.readFileSync(filePath, 'utf8');
    let currentSection = "";
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // detectar seccion
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            currentSection = trimmed.slice(1,-1).toLowerCase();
            continue;
        }

        // cada parametro y valor del zpr
        const [key, value_comment] = line.split('=').map(elem => elem.trim());
        // eliminar posible comentario inline
        const value = value_comment?.split('#')[0];

        if (!key || !value) continue;

        // Leer parametros
        switch (key.trim()) {
            case 'std_cpp':
                config.std_cpp = value.trim();
                break;
            case 'output_file':
                config.output_file = value.trim();
                break;
            case 'headers_dirs':
                config.headers_dirs = value.split(';')
                    .map(v => solveHeaderDirName(v))
                    .filter(v => v != ' ');
                break;
            case 'project_name':
                config.project_name = value.trim();
                break;
            case 'path':
                if (currentSection == "source") {
                    config.source_paths.push(value.trim());
                }
                break;
            // TODO: agregar otros parametros
        }
    }

    return config;
}
