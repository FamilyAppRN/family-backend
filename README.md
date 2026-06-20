# Family Collab - Backend

Este es el backend oficial del sistema Family Collab, una aplicación diseñada para la gestión familiar colaborativa. Está construido con un enfoque robusto en **Domain-Driven Design (DDD)** y **Clean Architecture** para garantizar escalabilidad, bajo acoplamiento y un tipado fuerte de extremo a extremo.

## 🚀 Tecnologías Principales

- **Framework:** [ElysiaJS](https://elysiajs.com/) (Ejecutándose en Node.js vía `@elysiajs/node`)
- **Validación:** [TypeBox](https://github.com/sinclairzx81/typebox) (Integración nativa con Elysia)
- **Base de Datos:** MongoDB (vía [Mongoose](https://mongoosejs.com/))
- **Caché y Pub/Sub:** Redis
- **Tiempo Real:** Socket.io
- **Lenguaje:** TypeScript estricto

## 🏗 Arquitectura (DDD & Clean Architecture)

El proyecto está modularizado por dominio de negocio. Cada módulo se divide estrictamente en 3 capas, además de contar con un módulo `shared` para utilidades transversales:

1. **Domain (Dominio):** Contiene la lógica de negocio pura, las entidades (interfaces), las excepciones personalizadas (`ApplicationError`), interfaces de los repositorios y servicios de dominio. **No conoce nada sobre bases de datos ni HTTP.**
2. **Application (Aplicación):** Contiene los **Casos de Uso** (clases que extienden `UseCase`) y los **Esquemas de Validación** (`TypeBox`). Orquesta el flujo entre la entrada del usuario y la persistencia.
3. **Infrastructure (Infraestructura):** Implementa las interfaces de dominio (ej. `MongooseAuthRepository`), define los controladores/rutas HTTP (`elysia`), y maneja librerías externas (Loggers, JWT, Bases de datos).

Para instrucciones detalladas sobre cómo crear nuevos módulos o funcionalidades, por favor revisa el directorio `.rules`.

## 🛠 Requisitos

- Node.js `v20.19.6` (definido en `.nvmrc`)
- MongoDB corriendo localmente o en un contenedor
- Redis corriendo localmente o en un contenedor
- Docker (Opcional, para el entorno orquestado)

## 📦 Instalación y Configuración Local

1. Clona el repositorio e instala las dependencias:

   ```bash
   nvm use # Asegura usar la versión de Node correcta
   npm install
   ```

2. Configura las variables de entorno. Duplica `.env.example` y renómbralo a `.env`:

   ```bash
   cp .env.example .env
   ```

   _(Asegúrate de llenar las credenciales de MongoDB, Redis y configurar tu `JWT_SECRET`)._

3. Levanta la aplicación en modo desarrollo (con recarga automática mediante `tsx`):
   ```bash
   npm run dev
   ```

## 🐳 Ejecución con Docker

Si prefieres levantar toda la infraestructura sin instalar servicios en tu máquina (Base de datos, Caché y API), el proyecto está completamente dockerizado.

Solo necesitas ejecutar:

```bash
docker-compose up --build -d
```

Esto levantará:

- El servidor backend en el puerto `3000`
- Instancia de Redis (puerto `6379`) con volumen persistente

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en modo watch.
- `npm run build`: Compila el proyecto TypeScript a la carpeta `dist`.
- `npm start`: Inicia el servidor de producción (requiere compilar primero).

## 🔒 Manejo de Errores y Respuestas

La API sigue un estándar estricto de respuesta a través de la clase `ApiResponse`. Todas las peticiones exitosas o fallidas devuelven un JSON predecible. Cualquier excepción de la clase `ApplicationError` arrojada en un Caso de Uso será automáticamente capturada e interceptada por el manejador global para proveer información clara y un `traceId` seguro para el cliente.
