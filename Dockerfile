# ==========================================
# Etapa 1: Builder (Compilación de TypeScript)
# ==========================================
FROM node:20-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDependencies para tsc)
RUN npm install

# Copiar el código fuente
COPY tsconfig.json ./
COPY src/ ./src/

# Compilar TypeScript a JavaScript (salida en /dist)
RUN npm run build

# ==========================================
# Etapa 2: Producción (Ejecución optimizada)
# ==========================================
FROM node:20-alpine AS runner

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo el package.json
COPY package.json package-lock.json* ./

# Instalar SOLO las dependencias de producción (más ligero y seguro)
RUN npm install --production

# Copiar la carpeta compilada desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Crear un usuario no root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/index.js"]
