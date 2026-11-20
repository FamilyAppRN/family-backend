# Guía de Integración API - Asistente Familiar Collab

Esta guía detalla cómo debe integrarse una aplicación cliente (móvil o web) con el backend, incluyendo cómo manejar la autenticación, la estructura estándar de las respuestas y los detalles de cada ruta disponible.

## 1. Autenticación (Middleware)

Casi todas las rutas de la API (excepto las de registro/login) requieren que el usuario esté autenticado. **El backend gestiona completamente Firebase Auth**, por lo que el frontend no necesita instalar ningún SDK de Firebase.

### ¿Qué debe enviar el cliente?

Para las rutas protegidas, la aplicación debe enviar el `accessToken` devuelto por los endpoints de login o registro (`/api/auth/login` o `/api/auth/register`) en la cabecera HTTP `Authorization` de la siguiente manera:

```http
Authorization: Bearer <AccessToken>
```

**Nota:** Este token expira periódicamente. Cuando esto ocurra, el cliente debe renovarlo llamando al endpoint `/api/auth/refresh` pasándole el `refreshToken` que también proveen las rutas de autenticación.

---

## 2. Estructura Estándar de las Respuestas

Todas las respuestas de la API siguen un formato estándar predecible:

### Respuesta Exitosa (200, 201)
```json
{
  "success": true,
  "message": "Mensaje descriptivo del resultado",
  "data": { 
    // Objeto o arreglo con la información solicitada/creada
  }
}
```

### Respuesta de Error (400, 401, 403, 404, 500)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_MISSING_TOKEN",
    "message": "No autorizado: Token faltante o formato incorrecto",
    "category": "AUTHENTICATION",
    "status": 401,
    "details": {},
    "traceId": "uuid-..."
  },
  "message": "No autorizado: Token faltante o formato incorrecto"
}
```

---

## 3. Referencia de Rutas por Módulo

Todas las rutas están prefijadas por `/api`.

### Autenticación y Perfil (`/api/auth` y `/api/users`)

| Método | Ruta | Auth Requerida | Body Request | Respuesta Esperada (`data`) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | `email`, `password`, `name` | Datos del usuario creado y tokens |
| `POST` | `/api/auth/login` | No | `email`, `password` | Tokens y datos del usuario |
| `POST` | `/api/auth/refresh` | No | `refreshToken` | `accessToken`, `refreshToken` (opcional) |
| `POST` | `/api/auth/check-email` | No | `email` | `exists` (boolean) |
| `GET` | `/api/auth/session` | **Sí** | (Ninguno) | Datos de sesión activa |
| `POST` | `/api/auth/logout` | **Sí** | `refreshToken` (opcional) | Status de éxito |
| `GET` | `/api/users/me` | **Sí** | (Ninguno) | Perfil del usuario `user` y sus hogares `households` |
| `PATCH` | `/api/users/me/push-token`| **Sí** | `token` | (Vacío) |
| `DELETE`| `/api/users/me/push-token`| **Sí** | `token` | (Vacío) |

---

### Hogares (`/api/households`)

| Método | Ruta | Auth | Body / Params Request | Respuesta Esperada (`data`) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/households` | **Sí** | `name` (string), `settings` (opt: `{ timezone, locale }`) | Detalles del hogar creado |
| `GET` | `/api/households/:householdId` | **Sí** | (Ninguno) | Detalles completos del hogar |
| `PATCH` | `/api/households/:householdId` | **Sí** | `name` (opt), `settings` (opt) | Hogar actualizado |
| `POST` | `/api/households/:householdId/invitations` | **Sí** | `email` (string) | Invitación aceptada para envío; no agrega miembros |
| `POST` | `/api/households/join` | **Sí** | `inviteCode` (string) | Confirmación de acceso al hogar |
| `DELETE`| `/api/households/:householdId/members/:targetUserId` | **Sí** | Params: `householdId`, `targetUserId` | (Vacío) |

---

### Listas de Compras (`/api/shopping`)

| Método | Ruta | Auth | Body / Params / Query | Respuesta Esperada (`data`) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/shopping` | **Sí** | `household_id`, `name` | Crea la primera lista activa; falla con 409 si ya existe una |
| `GET` | `/api/shopping/:householdId` | **Sí** | Query params: `status` ('active' o 'archived' opcional) | Arreglo de cero o una lista activa; su campo `history` contiene los lotes de ítems finalizados |
| `POST` | `/api/shopping/:listId/items`| **Sí** | `name` (string), `quantity` (number, default: 1) | Item añadido |
| `PATCH` | `/api/shopping/:listId/items/:itemId` | **Sí** | `is_completed` (boolean) | Item actualizado |
| `POST` | `/api/shopping/:listId/finalize` | **Sí** | (Ninguno) | Agrega los ítems completados a `history` y vacía los ítems activos de la misma lista |
| `PATCH` | `/api/shopping/:listId` | **Sí** | `name` (opt) | Lista de compras actualizada |
| `DELETE`| `/api/shopping/:listId` | **Sí** | Param: `listId` | (Vacío) |

---

### Tareas (`/api/tasks`)

| Método | Ruta | Auth | Body / Params / Query | Respuesta Esperada (`data`) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/tasks` | **Sí** | `household_id`, `title`, `description` (opt), `assignee_id` (opt), `due_date` (opt), `status` (opt) | Tarea creada |
| `GET` | `/api/tasks` | **Sí** | Query params: `household_id`, `status` (opt), `assignee_id` (opt) | Arreglo de tareas |
| `PATCH` | `/api/tasks/:id/status` | **Sí** | `status` ('pending', 'in_progress', 'completed') | Tarea actualizada |
| `PATCH` | `/api/tasks/:id/assign` | **Sí** | `assignee_id` (string) | Tarea asignada |
| `DELETE`| `/api/tasks/:id` | **Sí** | Param: `id` | `{ success: true }` |

---

### Notas (`/api/notes`)

| Método | Ruta | Auth | Body / Params | Respuesta Esperada (`data`) |
| --- | --- | --- | --- | --- |
| `GET` | `/api/notes/:householdId` | **Sí** | Param: `householdId` | Arreglo de notas |
| `POST` | `/api/notes/:householdId` | **Sí** | `title`, `content`, `color` (opt), `pinned` (opt) | Nota creada |
| `PATCH` | `/api/notes/:householdId/:noteId` | **Sí** | `title` (opt), `content` (opt), `color` (opt), `pinned` (opt) | Nota actualizada |
| `DELETE`| `/api/notes/:householdId/:noteId` | **Sí** | Param: `householdId`, `noteId` | (Vacío) |

---

## 4. Próximos pasos para el desarrollador de la app
1. Consumir los endpoints de `/api/auth/login` y `/api/auth/register` y guardar localmente (de forma segura) los tokens devueltos (`accessToken` y `refreshToken`).
2. Interceptar todas las peticiones protegidas a la API e inyectar el `accessToken` guardado en la cabecera HTTP `Authorization`.
3. Implementar un mecanismo de auto-renovación llamando a `/api/auth/refresh` cuando la API devuelva un error de expiración.
4. Crear un envoltorio (wrapper/interceptor) global que desempaquete el formato de respuesta (`{ success, message, data }`) o capture y procese el formato de errores estandarizado.
