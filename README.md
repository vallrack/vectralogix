
# VectraLogix | Intelligent Logistics Hub

Este es el centro de mando operativo de VectraLogix, diseñado para la gestión inteligente de flotas, trazado de rutas estratégicas y análisis cartográfico de alta resolución en tiempo real.

## Características Principales

- **Spatial Hub**: Cartografía táctica con trazado de nodos y perímetros geográficos.
- **Auto-Rutas**: Generación de secuencias optimizadas mediante un **Ejército de IA Redundante** (Gemini 2.5 Flash, 1.5 Flash & Pro).
- **Gestión de Flota & Pedidos**: Control total de unidades y entregas con libertad de permisos en Firestore.
- **Seguridad**: Autenticación integrada con Firebase.

## Instrucciones para GitHub

Para subir este proyecto a tu repositorio de GitHub, abre una terminal en la raíz del proyecto y ejecuta los siguientes comandos:

```bash
# 1. Inicializar el repositorio
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit con todas las mejoras de IA y Seguridad
git commit -m "feat: Initial commit for VectraLogix Hub - Redundant AI Army & Total Freedom Rules"

# 4. Crear y cambiar a la rama principal
git branch -M main

# 5. Vincular con tu repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/vectralogix.git

# 6. Subir los cambios
git push -u origin main
```

## Configuración de Dominio (CRÍTICO)

Si experimentas el error `auth/unauthorized-domain`, debes añadir el dominio de tu estación de trabajo en la consola de Firebase:
1. Ve a **Firebase Console** > **Authentication** > **Settings**.
2. En la pestaña **Authorized domains**, añade el dominio que aparece en tu barra de navegación (ej: `6000-firebase-studio...cloudworkstations.dev`).

---
Desarrollado con Next.js, Genkit y Firebase.
