# Guía de Despliegue en Render.com

## Problema Resuelto ✅

El problema original era que el comando de build (`npm run build`) estaba ejecutando `node app.js`, lo cual iniciaba el servidor y mantenía el proceso corriendo indefinidamente. Render.com espera que el comando de build termine y salga.

## Cambios Realizados

### 1. Package.json
```json
{
  "scripts": {
    "start": "node app.js",        // Para producción
    "build": "npm install",        // Solo instala dependencias
    "dev": "nodemon app.js"        // Para desarrollo local
  }
}
```

### 2. App.js - Manejo de Variables de Entorno
- Ahora maneja tanto archivos `.env` locales como variables de entorno del sistema
- Soporta `MONGODB_URI_PRODUCTION` para MongoDB Atlas
- Configuración flexible de CORS con `ALLOWED_ORIGINS`

## Configuración en Render.com

### Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `Node`

### Environment Variables
Configura estas variables en el dashboard de Render:

| Variable | Valor |
|----------|-------|
| `PORT` | `10000` (o el que Render asigne) |
| `MONGODB_URI_PRODUCTION` | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | `tu_clave_secreta_muy_segura` |
| `JWT_REFRESH_SECRET` | `tu_clave_refresh_muy_segura` |
| `ALLOWED_ORIGINS` | `https://tu-frontend.vercel.app,https://tu-frontend.netlify.app` |

## Pasos para Desplegar

1. **Push los cambios al repositorio**
2. **En Render.com**:
   - Conecta tu repositorio
   - Crea un nuevo Web Service
   - Configura las variables de entorno
   - Deploy

3. **Verifica el despliegue**:
   - El build debe completarse sin errores
   - El servidor debe iniciar correctamente
   - Prueba el endpoint: `GET https://tu-app.onrender.com/`

## Troubleshooting

### Build no termina
- ✅ **Resuelto**: El build ahora solo instala dependencias
- ✅ **Resuelto**: El servidor se inicia con el comando `start`, no `build`

### Error de MongoDB
- Verifica que `MONGODB_URI_PRODUCTION` esté configurado correctamente
- Asegúrate de que MongoDB Atlas esté accesible desde Render

### Error de CORS
- Configura `ALLOWED_ORIGINS` con las URLs correctas de tu frontend
- Separa múltiples URLs con comas

### Variables de entorno no encontradas
- Verifica que todas las variables estén configuradas en Render
- No uses archivos `.env` en producción 