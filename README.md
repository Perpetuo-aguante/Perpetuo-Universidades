# Perpetuo para universidades

Sales room del piloto gratuito de un año para universidades. Se manda a cada universidad con quien hablamos.

La llamada se agenda con el enlace de Apollo del botón "Agendar llamada" (última sección).

## Archivos
- `index.html`: la página (HTML, CSS y JS en un solo archivo, sin compilación). Mismo sistema visual que `mesa-ia-literatura` y `escribe-con-nosotros`, sobre el off-white de la marca.
- `admin.html`: el panel para editar el contenido sin tocar código (en `/admin`; no aparece en buscadores).
- `assets/comun.js`: `CONFIG` (aquí va la URL del backend), la API, el modo demostración y el contenido inicial (`SEMILLA`).
- `assets/logo.webp` y `assets/partes/`: logo y muñecos animados del brandbook (copiados de `mesa-ia-literatura`).
- `assets/personajes/`: los personajes de Perpetuo en sus poses, recortados de `marca-fuente/perpetuo-personajes.png` del repo `Boveda`.
- `assets/img/`: ilustraciones sacadas del press kit.
- `Universidades.gs`: el backend en Apps Script. No se publica: va en script.google.com y está en `.gitignore`, igual que `Eventos.gs`.
- `CNAME`: `universidades.perpetuo.global` para GitHub Pages.

## Liga personalizada
Agrega `?u=` con el nombre de la universidad y la portada cambia:

    https://universidades.perpetuo.global/?u=UNAM

Cambia el título ("…en UNAM.") y el de la pestaña.

## Secciones
La página es una presentación: se avanza con los botones fijos de la derecha, las flechas del teclado o deslizando en el teléfono.

0. Portada y cifras
1. ¿Quién nos lee hoy?
2. La propuesta (el piloto)
3. Qué van a leer (las tarjetas abren el texto en un panel lateral)
4. Por qué Perpetuo (con la línea del tiempo a escala real)
5. Premios de nuestros autores
6. Cómo funciona
7. Con el respaldo de (logos) y siguiente paso

## Panel `/admin`
Mismo patrón que eventos.perpetuo.global: sitio estático + Apps Script que guarda en una hoja de Google y sube las imágenes a Drive. Desde el panel se editan las cifras, la frecuencia de los pódcasts, los textos destacados, los premios, los logos de respaldo y las fotos.

### Instalación
1. En script.google.com (desde jl@perpetuo.global), crea el proyecto "Perpetuo · Universidades" y pega `Universidades.gs`.
2. Zona horaria `America/Mexico_City`. En Propiedades de la secuencia de comandos agrega `ADMIN_CLAVE` con **la misma clave del panel de eventos**.
3. Ejecuta `instalar()`: crea la hoja "Perpetuo · Universidades" (pestañas Metricas, Textos, Premios, Logos y Ajustes) y la carpeta "Perpetuo · Universidades · Imágenes".
4. Implementar → Nueva implementación → Aplicación web, con Ejecutar como: **yo** y Quién tiene acceso: **cualquier usuario**.
5. Pega la URL `/exec` en `CONFIG.API_URL` de `assets/comun.js`.
6. Entra a `/admin`. Como la hoja está vacía, el panel carga el contenido actual: dale **Guardar**.

Cada vez que cambie `Universidades.gs`, entra a Implementar → Administrar implementaciones → editar → **Nueva versión**, para que la URL siga siendo la misma.

### Modo demostración
Con `CONFIG.API_URL` vacío (así viene), la página muestra el contenido inicial y el panel guarda en `localStorage` de ese navegador. La clave es `perpetuo`. `localStorage.removeItem("perpetuo-universidades-demo")` vuelve a los datos iniciales.

### Caché
El contenido público se guarda 60 segundos en `CacheService` y se borra con cada "Guardar". En el navegador se guarda la última versión, para que la página aparezca al instante.

## Leer los textos ahí mismo
perpetuo.global vive en Substack. Cada tarjeta abre un panel con la portada, el extracto y el botón "Leer en Perpetuo". Si se confirma que Substack deja mostrar los posts dentro de otra página, cambia `CONFIG.LEER_EN_IFRAME` a `true` y el panel mostrará el texto completo en un iframe.
