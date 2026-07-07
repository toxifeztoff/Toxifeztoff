# ToxiFezt v2

Sistema de registro para fiesta con Firebase, EmailJS y panel de administración.

## Archivos principales
- `index.html`: página pública de registro.
- `admin.html`: panel de administrador.
- `js/firebase.js`: conexión Firebase.
- `js/script.js`: lógica de registro, cupos y correos.
- `js/admin.js`: dashboard, configuración, exportar Excel y borrar registros.
- `css/style.css`: diseño negro/dorado responsive.

## Antes de usar
1. Abre el proyecto con Live Server en Visual Studio Code.
2. Verifica que Firebase Authentication esté activo con correo/contraseña.
3. Crea tu usuario admin en Firebase Authentication.
4. Publica estas reglas en Firestore:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /registros/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /config/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Panel admin
Entra a `admin.html` para:
- Cambiar nombre del evento.
- Cambiar cupos.
- Activar/desactivar registros.
- Buscar invitados.
- Abrir Instagram.
- Eliminar registros.
- Borrar todos los registros.
- Exportar Excel.


## IMPORTANTE SI EL PANEL NO CARGA
Si el admin no muestra registros o no guarda cupos/nombre, casi siempre son las reglas de Firestore.
Pega las reglas del archivo `REGLAS_FIRESTORE.txt` en Firebase > Firestore Database > Reglas y pulsa Publicar.
