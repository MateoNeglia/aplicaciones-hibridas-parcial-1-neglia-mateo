# Relicario Backend

Bienvenido al backend de **Relicario**, una plataforma para gestionar reliquias con categorización por nichos, autenticación de usuarios y carga de imágenes. Este backend está construido con **Node.js**, **Express** y **MongoDB**, proporcionando una API RESTful para la aplicación frontend.

El frontend está alojado en un repositorio separado: [Relicario Frontend](https://github.com/MateoNeglia/aplicaciones-hibridas-parcial1-front-de-prueba.git) .

## Tabla de Contenidos
- [Descripción del Proyecto](#descripción-del-proyecto)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecutar la Aplicación](#ejecutar-la-aplicación)
- [Endpoints de la API](#endpoints-de-la-api)
- [Notas Adicionales](#notas-adicionales)
- [Solución de Problemas](#solución-de-problemas)



## Descripción del Proyecto
El backend de Relicario es el componente del lado del servidor para un sistema de gestión de reliquias. Maneja la autenticación de usuarios, la creación, actualización y eliminación de reliquias, y la validación de nichos. Utiliza **MongoDB** para el almacenamiento de datos, **Joi** para la validación de entradas y **JWT** para la autenticación.

## Características
- **Autenticación de Usuarios**: Registro, inicio de sesión y gestión de usuarios con autenticación basada en JWT (tokens de acceso y refresco).
- **Gestión de Reliquias**: Crear, actualizar y eliminar reliquias con campos como `name`, `niche`, `condition`, `year`, `description`, `set` y `picture`.
- **Validación de Nichos**: Asegura que las reliquias estén asociadas con nichos válidos almacenados en la colección `Niche`.
- **Validación de Entradas**: Usa Joi para una validación robusta de datos de reliquias y usuarios.
- **Modo de Mantenimiento**: Modo de mantenimiento activable/desactivable mediante variable de entorno.

## Tecnologías
- **Node.js**: v16.x o superior
- **Express**: Framework web para construir la API
- **MongoDB**: Base de datos NoSQL para almacenar usuarios, reliquias y nichos
- **Mongoose**: ODM para MongoDB
- **Joi**: Validación de esquemas para entradas de la API
- **jsonwebtoken**: Autenticación basada en JWT
- **dotenv**: Gestión de variables de entorno

## Requisitos Previos
Asegurarse de tener lo siguiente insalado:
- **Node.js**: v16.x o superior (`node --version`)
- **npm**: v8.x o superior (`npm --version`)
- **MongoDB**: Instancia local o en la nube (por ejemplo, MongoDB Atlas)
- **Git**: Para clonar el repositorio

## Instalación
1. **Clonar el Repositorio**
   ```bash
   git clone https://github.com/MateoNeglia/aplicaciones-hibridas-parcial-1-neglia-mateo.git
   cd DW4-W0D44-parcial-1-neglia-mateo
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   ```

3. **Configurar MongoDB**
   - Podes instalar mongo localmente o usarlo en la nube.
   - Asegurarse de que MongoDB esté corriendo en `mongodb://127.0.0.1:27017` (o actualiza `MONGODB_URI_LOCAL` en `.env`).


5. **Configurar Variables de Entorno**
   - Creá un archivo `.env` en el directorio raíz:
     ```bash
     touch .env
     ```
   - Agregá las siguientes variables (ver [Variables de Entorno](#variables-de-entorno) para detalles):
     ```env
     # Configuración de puerto y base de datos
     PORT=8081
     MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/main_relicario_db

     # Configuración de JWT
     JWT_SECRET=secret
     JWT_EXPIRES_IN=1h
     JWT_REFRESH_SECRET=secret
     JWT_REFRESH_EXPIRES_IN=7d

     # Configuración de gestión
     MAINTENANCE_MODE=false
     ```

## Variables de Entorno
El backend utiliza las siguientes variables de entorno definidas en `.env`:

| Variable                  | Descripción                                                                | Valor por Defecto                 |
|---------------------------|----------------------------------------------------------------------------|-----------------------------------|
| `PORT`                    | Puerto donde corre el servidor                                             | `8081`                            |
| `MONGODB_URI_LOCAL`       | Cadena de conexión a MongoDB                                               | `mongodb://127.0.0.1:27017/main_relicario_db` |
| `JWT_SECRET`              | Clave secreta para firmar tokens de acceso                                 | `secret` (reemplaza con un valor seguro) |
| `JWT_EXPIRES_IN`          | Tiempo de expiración de los tokens de acceso                               | `1h`                              |
| `JWT_REFRESH_SECRET`      | Clave secreta para firmar tokens de refresco                               | `secret` (reemplaza con un valor seguro) |
| `JWT_REFRESH_EXPIRES_IN`  | Tiempo de expiración de los tokens de refresco                             | `7d`                              |
| `MAINTENANCE_MODE`        | Habilita/deshabilita el modo de mantenimiento (bloquea acceso a la API si `true`) | `false`                           |

**Nota de Seguridad**: Reemplazá `JWT_SECRET` y `JWT_REFRESH_SECRET` con valores fuertes y únicos en producción. No uses `secret`.

## Ejecutar la Aplicación
1. **Iniciar MongoDB**
   - Local: `mongod` (asegurarse de que corra en `127.0.0.1:27017`).   

2. **Ejecutar el Backend**
   - Modo de desarrollo:
     ```bash
     npm run start
     ```

3. **Acceder a la API**
   - El servidor corre en `http://localhost:8081` (o el puerto especificado en `PORT`).   

## Endpoints de la API
A continuación, se listan los endpoints principales (ajusta según tus rutas):

- **Usuarios y Auth**
  - `POST /api/auth/register`: Registrar un nuevo usuario.
  - `POST /api/auth/login`: Iniciar sesión y recibir tokens JWT.
  - `POST /api/auth/profile`: Ver detalles del usuario (autenticado).
  - `POST /api/auth/refresh`: Refresh token.
  - `PATCH /api/auth/profile`: Update de Usuario. 
  - `DELETE /api/auth/users/:id`: Borrar Usuario.

- **Reliquias**
  - `POST /api/relics/add`: Crear una nueva reliquia (autenticado, soporta JSON o multipart/form-data).
  - `PUT /api/relics/:relicId`: Actualizar una reliquia existente (autenticado, solo propietario).
  - `DELETE /api/relics/:relicId`: Eliminar una reliquia (autenticado, solo propietario).
  - `GET /api/relics/:relicId`: Obtener una reliquia por ID.


**Nota**: Todos los endpoints que requieren autenticación esperan un `Bearer <token>` en el encabezado `Authorization`.


## Notas Adicionales
- **Validación de Nichos**: Las reliquias se validan contra la colección `Niche` para asegurar que `niche.category` y `niche.specific` sean válidos.
- **Seguridad**:
  - Usá valores fuertes para `JWT_SECRET` y `JWT_REFRESH_SECRET` en producción.
  - Sanitizá las entradas para prevenir ataques de inyección (manejado por Joi).  
- **Modo de Mantenimiento**: Cuando `MAINTENANCE_MODE=true`, la API puede configurarse para devolver una respuesta 503 Servicio No Disponible.


## Solución de Problemas
- **Error de Conexión a MongoDB**:
  - Asegurate de que MongoDB esté corriendo (`mongod`).
  - Verificá que `MONGODB_URI_LOCAL` sea correcto.
- **Error Interno del Servidor (500)**:
  - Revisá los registros del servidor para detalles (`console.error(err)`).
  - Asegurate de que la colección `Niche` esté poblada para la validación de nichos.
- **Errores de JWT**:  
  - Revisa las configuraciones de expiración de tokens.


# aplicaciones-hibridas-parcial-1-neglia-mateo
