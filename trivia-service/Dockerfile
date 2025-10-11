# Usar Node.js 20
FROM node:20-alpine

# Información del mantenedor
LABEL maintainer="tu-email@ejemplo.com"
LABEL description="Microservicio de Trivia con IA usando OpenAI"

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio
RUN chown -R nodejs:nodejs /app

# Copiar archivos de dependencias
COPY --chown=nodejs:nodejs package*.json ./

# Cambiar a usuario no-root
USER nodejs

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY --chown=nodejs:nodejs . .

# Exponer puerto 4001
EXPOSE 4001

# Variable de entorno por defecto
ENV NODE_ENV=development
ENV PORT=4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar el servicio
CMD ["npm", "run", "dev"]