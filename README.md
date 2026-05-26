
# VectraLogix | Intelligent Logistics Hub

Este es el centro de mando operativo de VectraLogix, diseñado para la gestión inteligente de flotas y análisis táctico.

## 🚀 Despliegue en GitHub

Si te aparece el error de "remote origin already exists" o fallos de autenticación, sigue estos pasos exactos:

1. **Configurar el origen correctamente**:
   Reemplaza `<TU_TOKEN>` con un Personal Access Token de GitHub.
   ```bash
   git remote set-url origin https://vallrack:<TU_TOKEN>@github.com/vallrack/vectralogix.git
   ```

2. **Subir los cambios**:
   ```bash
   git add .
   git commit -m "feat: Desbloqueo total de seguridad y activación de Ejército de IA"
   git push -u origin main
   ```

## 🔐 Configuración de Seguridad (CRÍTICO)

Para resolver el error `auth/unauthorized-domain` y permitir la "Libertad Total":

1. Ve a **Firebase Console** > **Authentication** > **Settings**.
2. En **Authorized domains**, añade el dominio actual:
   `6000-firebase-studio-1779748898386.cluster-mdgxqvvkkbfpqrfigfiuugu5pk.cloudworkstations.dev`
3. Las reglas de Firestore se han configurado para permitir acceso total a operadores autenticados.

## 🤖 Ejército de IA Redundante

El sistema utiliza una cascada de modelos para garantizar 100% de disponibilidad:
- **Gemini 2.5 Flash** (Primario)
- **Gemini 1.5 Flash** (Reserva)
- **Gemini 1.5 Pro** (Potencia Máxima)

Desarrollado con Next.js, Genkit y Firebase.
