# ToxiFezt v3

Versión corregida para GitHub Pages.

## Incluye

- Registro público con nombre, apellido e Instagram.
- Contador de cupos usando `config/eventoActual`, sin leer la lista privada de registros.
- Panel admin con login Firebase.
- Cambiar nombre del evento desde admin.
- Cambiar cupos desde admin.
- Activar/desactivar registros.
- Borrar un registro.
- Borrar todos los registros.
- Exportar Excel.
- Correo automático con EmailJS.
- Diseño responsive para celular.

## Importante

En Firebase crea este documento:

Colección: `config`
Documento: `eventoActual`

Campos:

- `nombre` string `ToxiFezt`
- `cupos` number `70`
- `registrados` number `0`
- `activo` boolean `true`

## Reglas de Firestore

Pega el contenido de `REGLAS_FIRESTORE.txt` en Firestore Database > Reglas y pulsa Publicar.

## GitHub Pages

Sube todo el contenido de esta carpeta al repositorio.

El registro queda en:

`https://TUUSUARIO.github.io/TU_REPOSITORIO/`

El admin queda en:

`https://TUUSUARIO.github.io/TU_REPOSITORIO/admin.html`

## Authentication

En Firebase Authentication > Settings > Authorized domains agrega:

`TUUSUARIO.github.io`
