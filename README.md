# ZPR Converter

Extensión de VSCode para generar configuración de compilación para proyecto en C++ a partir de .zpr (proyecto de Zinjai).

## Uso

Instalar desde el [marketplace](https://marketplace.visualstudio.com/items?itemName=LucasSaurin.zpr-converter).

- Puede ejecutar el comando `zpr-converter.generate` desde la barra de comandos (`ctrl+shift+p`) y escribiendo `ZPR: generar tasks.json desde .zpr`. Deberá especificar qué archivo `.zpr` usar para generar la configuración (normalmente tendremos solo uno).
- Puede hacer click derecho sobre el archivo `.zpr` y elegir la opción `ZPR: generar tasks.json para este .zpr`.

![captura 1](https://raw.githubusercontent.com/Lucasa98/zpr-converter/refs/heads/main/rsc/captura1.png)

## Requerimientos

Para usar esta extensión debe:

- Instalar la extensión oficial [ms-vscode.cpptools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
