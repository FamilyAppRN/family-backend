# Guía de Integración Backend para React Native (App Móvil)

¡Hola, dev! 👋 Esta guía detalla cómo está estructurado el flujo de autenticación y manejo de sesión en el backend, así como los nuevos endpoints creados para facilitarte la integración en la aplicación móvil de **Asistente Familiar Collab**.

---

## 🔍 1. Explorando la Documentación Interactiva (Swagger)

Para visualizar todos los endpoints, schemas, y probar la API de forma visual, el backend tiene integrado **Swagger** generado automáticamente mediante Elysia.

**Cómo acceder:**
1. Levanta el servidor backend de forma local: `npm run dev` (o el comando equivalente).
2. Abre tu navegador y ve a: `http://localhost:3000/docs` *(asumiendo que el puerto es 3000)*.

Desde allí podrás ver todos los endpoints de `/api/auth`, `/api/households`, `/api/shopping`, etc.

---

## 🔐 2. Flujo de Autenticación y Sesión

### A. Paso Previo: ¿Login o Registro?
Para evitar preguntarle al usuario si quiere registrarse o iniciar sesión, puedes usar el endpoint de verificación de email:

*   **Endpoint:** `POST /api/auth/check-email`
*   **Body:** `{ "email": "usuario@ejemplo.com" }`
*   **Respuesta:**
    ```json
    {
      "success": true,
      "message": "Verificación de email",
      "data": {
        "exists": true // true si debe ir a la pantalla de Login, false si va a Registro
      }
    }
    ```

### B. Login y Registro (Optimizados)
Para mantener la carga útil ligera y segura, los endpoints de `/register` y `/login` ahora **solo devuelven tokens**, y **NO** incluyen la información completa del usuario. 

*   **Endpoints:** `POST /api/auth/login` y `POST /api/auth/register`
*   **Respuesta Exitosa:**
    ```json
    {
      "success": true,
      "message": "Login exitoso",
      "data": {
        "accessToken": "eyJhbG...",
        "refreshToken": "eyJhbG..."
      }
    }
    ```
> [!TIP]
> **Almacenamiento:** Debes guardar el `accessToken` y `refreshToken` en un almacenamiento seguro en el dispositivo (ej. `SecureStore` en Expo o `AsyncStorage`).

### C. Recuperando el Perfil y los Hogares (Households)
Una vez que el usuario ha iniciado sesión correctamente (tienes el `accessToken`), o cuando la aplicación se abre y verificas que el token sigue vivo, **debes llamar a este nuevo endpoint** para obtener toda la información que necesita la aplicación para renderizar la UI inicial:

*   **Endpoint:** `GET /api/users/me`
*   **Headers:** `Authorization: Bearer <TU_ACCESS_TOKEN>`
*   **Respuesta:**
    ```json
    {
      "success": true,
      "message": "Perfil del usuario",
      "data": {
        "user": {
          "id": "6a381f...",
          "email": "usuario@ejemplo.com",
          "name": "Elias Duarte",
          "plan": "free",
          "notifications_enabled": true
        },
        "households": [
          {
            "id": "abc123",
            "name": "Mi Hogar",
            "role": "admin",
            "is_owner": true,
            "invite_code": "XYZ789", 
            "members_count": 3
          }
        ]
      }
    }
    ```

> [!IMPORTANT]
> **Lógica para Households:** 
> - El campo `households` contiene un array con todos los hogares a los que pertenece el usuario.
> - Si `is_owner` es `true`, vendrá adjunto el `invite_code` para que puedas poner un botón de "Compartir Código" en la app.
> - Si `is_owner` es `false`, el `invite_code` vendrá como `null` (por seguridad, solo los dueños pueden invitar).
> - Si el array `households` está vacío (`[]`), significa que debes llevar al usuario a la pantalla de **"Crear o Unirse a un Hogar"**.

---

## 🚦 3. Resumen del Flujo Sugerido en la App

1. **App arranca:**
   - ¿Hay token guardado?
     - **SÍ:** Llama a `GET /api/users/me`.
       - Si devuelve 200 OK: Ve directo al **Home**.
       - Si devuelve 401 (Expirado): Intenta refrescar el token con `POST /api/auth/refresh`. Si falla, ve a la pantalla de **Ingresar Email**.
     - **NO:** Ve a la pantalla de **Ingresar Email**.
2. **Pantalla Ingresar Email:**
   - Usuario ingresa email -> Llama a `POST /api/auth/check-email`.
   - Si `exists: true` -> Pantalla de **Ingresar Contraseña (Login)**.
   - Si `exists: false` -> Pantalla de **Completar Datos (Registro)**.
3. **Login / Registro:**
   - Al ser exitoso, guarda los tokens.
   - Llama a `GET /api/users/me`.
   - Evalúa el array de `households`: si está vacío, llévalo al Onboarding de Hogares; si tiene hogares, llévalo al Home Principal.

---

Cualquier duda adicional, puedes consultar la interfaz de `/docs` interactiva. ¡Feliz código! 🚀
