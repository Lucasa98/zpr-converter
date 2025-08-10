# ZPR Converter

Extensión de VSCode para generar configuración de compilación para proyecto en C++ a partir de .zpr (proyecto de Zinjai).

## Uso

Instalar desde el [marketplace](https://marketplace.visualstudio.com/items?itemName=LucasSaurin.zpr-converter).

Puede ejecutar el comando `zpr-converter.generate` desde la barra de comandos (`ctrl+shift+p`) y escribiendo `zpr-converter: generar tasks.json desde .zpr`.

Deberá especificar qué archivo `.zpr` usar para generar la configuración (normalmente tendremos solo uno).

## Requerimientos

Para usar esta extensión debe:

- Instalar la extensión oficial [ms-vscode.cpptools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
