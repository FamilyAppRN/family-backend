# 📐 Arquitectura Backend - Guía de Desarrollo (Know-How)

Si vas a desarrollar en este repositorio, **debes seguir estrictamente los siguientes patrones arquitectónicos**. Este proyecto utiliza **Domain-Driven Design (DDD)** fusionado con los principios de **Clean Architecture**, optimizado para el ecosistema de TypeScript, ElysiaJS, y TypeBox.

## 1. Estructura de Capas (Regla de Dependencia)

Cada módulo (ej. `auth`, `shopping`, `household`) debe aislarse en tres carpetas fundamentales. **La regla de oro es que las dependencias solo pueden apuntar hacia adentro (hacia el Dominio).**

### 🟢 `domain/` (Dominio)
El núcleo de la lógica de negocio. **Prohibido importar librerías de infraestructura aquí (nada de Mongoose, Express, Elysia, HTTP, etc.).**
- **`entities/`**: Interfaces o Clases (ej. `UserEntity`) que definen el formato de los datos agnósticos a la base de datos.
- **`repositories/`**: Interfaces (contratos) que dictan cómo interactuar con los datos (ej. `AuthRepository`).
- **`errors/`**: Errores personalizados que extienden de `ApplicationError` (ej. `UserNotFoundError`).
- **`services/`**: Servicios puros del dominio (ej. `PasswordService`) que orquestan lógica sin tocar bases de datos.

### 🟡 `application/` (Aplicación)
La capa de orquestación. Traduce las intenciones del usuario en interacciones con el Dominio.
- **`Casos de Uso (UseCases)`**: Cada acción del sistema es un archivo único (ej. `loginUseCase.ts`). **Deben heredar de la clase base `UseCase<TInput, TOutput>`** (ubicada en `shared/application/`).
- **`schemas/`**: Esquemas de **TypeBox** que definen qué datos entran y qué datos salen del Caso de Uso. Los UseCases validan e higienizan automáticamente la data en base a estos esquemas.

### 🔴 `infrastructure/` (Infraestructura)
La capa externa que habla con el mundo físico. Es la única capa consciente de HTTP, Elysia, Mongoose, Redis, etc.
- **`http/`**: Archivos de rutas (`.routes.ts`). Aquí defines los endpoints de ElysiaJS. Inyectan los repositorios en los casos de uso.
- **`persistence/`**: Implementaciones concretas de los repositorios definidos en el Dominio (ej. `MongooseAuthRepository.ts`). Aquí sí puedes importar modelos de Mongoose.

---

## 2. Flujo de Trabajo para una Nueva Funcionalidad (Feature)

Si deseas crear, por ejemplo, "Crear Lista de Compras":

1. **Dominio**:
   - Define `ShoppingListEntity` en `domain/entities/`.
   - Crea una interfaz `ShoppingRepository` con el método `createList(data)`.
   - Crea excepciones como `ListLimitExceededError` extendiendo de `ApplicationError`.
2. **Aplicación**:
   - Crea `schemas/shopping.schemas.ts` usando TypeBox (`t.Object(...)`).
   - Crea `createListUseCase.ts` que extienda `UseCase`. Inyéctale en el constructor la interfaz `ShoppingRepository`. Escribe tu lógica en el método `implementation(data)`.
3. **Infraestructura**:
   - Crea `MongooseShoppingRepository.ts` que implemente la interfaz y contenga las llamadas a `ShoppingList.create()`.
   - Crea `shopping.routes.ts` usando Elysia. Llama al middleware, extrae el contexto (body/user), instancia el repositorio concreto y ejecútalo mediante el UseCase.

---

## 3. Respuestas y Manejo de Errores

### 🚫 Errores
**Nunca uses `res.status(400).send(...)`**. 
En su lugar, lanza errores semánticos dentro de tus Casos de Uso o Dominio:
```typescript
if (!user) throw new InvalidCredentialsError(); // Hereda de ApplicationError
```
El middleware global de Elysia (`error.middleware.ts`) capturará tu excepción y le dará formato automáticamente.

### ✅ Éxitos
**Nunca retornes los objetos planos directamente desde la ruta si puedes evitarlo**. Usa el formateador estándar:
```typescript
const result = await useCase.execute(body);
const response = ApiResponse.success(result, "Elemento creado", 201);
set.status = response.status;
return response.body;
```

---

## 4. Tipado Fuerte y Validación (TypeBox)

- Usamos **TypeBox** en lugar de Joi o Zod para obtener el máximo rendimiento (por ser nativo de ElysiaJS) y la inferencia directa de TypeScript (`Static<typeof MiSchema>`).
- Define patrones y expresiones regulares de uso común (como correos o validación de contraseñas) en variables compartidas (`shared/domain/constants.ts`).
- La validación ocurre en dos capas:
  1. **En la capa HTTP (Elysia)**: Puedes inyectar los esquemas al final del endpoint para validación temprana de payloads.
  2. **En la capa Aplicación (Casos de uso)**: El `UseCase` base volverá a ejecutar validación y aplicará limpieza (`Value.Clean`) sobre los outputs, garantizando que nunca devuelvas campos ocultos de la base de datos (como el hash de contraseñas).

---

## 5. Modelos de Base de Datos (Mongoose)

Los modelos de Mongoose permanecen en la carpeta raíz `src/models/` para fácil compartición, pero **sólo los repositorios de infraestructura** tienen derecho a invocarlos e importar de ellos. Los repositorios deben retornar objetos de tipo Entidad (`UserEntity`), no objetos "sucios" de Mongoose (`Document`), para mantener el dominio aislado. 
Usa métodos como `lean()` siempre que hagas consultas de solo-lectura para mejorar el rendimiento.

---

## 6. Convenciones de Nomenclatura

Para mantener consistencia en todo el código fuente:
- **Archivos**: Usa `camelCase` o `kebab-case` para nombres de archivos, pero sé consistente por capa. Para clases específicas, usa `.tipo.ts` (ej. `auth.repository.ts`, `login.use-case.ts` o `loginUseCase.ts`).
- **Interfaces/Tipos**: Usa PascalCase. Preferimos sufijos claros en lugar del prefijo `I` (ej. `UserEntity`, no `IUser`), a excepción de los esquemas directos de Mongoose si conviven en el mismo archivo.
- **Clases**: Usa `PascalCase`.
- **Variables/Funciones**: Usa `camelCase`.
- **Constantes Globales**: Usa `UPPER_SNAKE_CASE` (ej. `PASSWORD_REGEX`).

---

## 7. Logging (Registro de Eventos)

**No uses `console.log` ni `console.error`** en código de producción. 
Utiliza el logger centralizado (`pino`) ubicado en `shared/infrastructure/logger.ts`.
- `logger.info(obj, msg)`: Para flujos felices importantes.
- `logger.warn(obj, msg)`: Para comportamientos extraños pero no fatales (ej. validaciones fallidas).
- `logger.error(obj, msg)`: Para excepciones y fallos del sistema.

*Nota: Asegúrate de pasar el `traceId` en el objeto de log cuando estés dentro del contexto de una petición HTTP para trazabilidad.*

---

## 8. WebSockets y Tiempo Real (Socket.io)

La comunicación en tiempo real no debe saltarse la arquitectura. 
- Los eventos de Socket.io (en `src/config/socket.ts` o controladores dedicados) actúan como la capa de **Infraestructura**.
- Al recibir un evento de WebSockets, este debe extraer la data y llamar a un **UseCase** normal, de la misma manera que lo haría una ruta HTTP.
- Evita poner lógica de negocio directamente dentro de los callbacks de Socket.io.

---

## 9. Caché (Redis)

El uso de Redis debe encapsularse en interfaces de repositorio.
- Si necesitas cachear listas de compras, crea un `ShoppingCacheRepository` (o mételo dentro de la implementación de `MongooseShoppingRepository` como un decorador o proxy).
- El **Dominio** no sabe que Redis existe; solo pide datos a una interfaz, y la **Infraestructura** decide si sacarlos de MongoDB o de Redis.
