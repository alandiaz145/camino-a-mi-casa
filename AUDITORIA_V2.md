# Auditoría y cambios — 3 de noviembre de 2026

## Punto de partida
Se clonó directamente la rama remota `v2-desarrollo-original`. HEAD confirmado: `c24a820884e6a1c76e9013439178bdda943b52dc`. Se leyeron index.html, quien-soy.html, servicios.html, README.md, el plan de integración y todos los archivos del backend. No se cambió main ni se desplegó.

## Hallazgos resueltos
- Fuente pública dependiente de localStorage: reemplazada por API central, sin importar datos antiguos.
- Edición oculta por CSS en portada: eliminada del HTML público; panel separado autorizado en el Worker.
- Falta de atomicidad entre escrituras y auditoría: ambas operaciones se ejecutan en un único batch.
- Exposición de márgenes en escenarios: usa únicamente precio público y explica que se trata de facturación bruta hipotética.
- Enlaces sociales # presentados como funcionales: convertidos a estados pendientes; se habilitan al configurar URLs reales.
- Precios semilla sin verificar: nuevas instalaciones comienzan en Consultar; INSERT OR IGNORE conserva precios existentes.
- Fechas y cuerpos JSON insuficientemente validados: fechas reales, límites, tipos, URLs HTTPS y lectura acotada del cuerpo.
- Ausencia de respaldo: descarga privada de todas las tablas, independiente del límite del panel.
- Assets privados: autorización antes del archivo, no-store, CSP y lista explícita de rutas públicas.

## Archivos principales
- `backend/worker.js`, `backend/content.js`, `backend/schema.sql`, `backend/migrations/*`, `backend/wrangler.toml`: persistencia, seguridad, contenido y configuración.
- `admin/index.html`, `admin/app.js`, `admin/style.css`: panel móvil con guardado manual.
- `index.html`, `public.js`, `finance.js`, `content.js`: conexión pública, cálculos y contenido con nodos de texto seguros.
- `quien-soy.html`: se agregó la carga opcional de historia administrada; el relato original permanece en el archivo y se conserva si no hay contenido o falla la API.
- `build.mjs`, `.gitignore`, `package.json`: build sin publicar backend/secretos ni añadir dependencias innecesarias.
- `tests/worker.test.js`, `tools/browser-check.mjs`: pruebas reproducibles.
- `README.md`, `backend/README.md`: estado, límites y operación. `servicios.html` no fue modificado.

## Pruebas ejecutadas
- `node --test`: 10 pruebas aprobadas. JWT firmado y validado criptográficamente, rechazo de otros usuarios/issuer/audience/expiración/firma, permisos, validación de datos, rollback con fallo de auditoría, privacidad, saldos con más de 500 movimientos, retiros, productos y misiones, contenido y derechos de imágenes, alias de assets y errores de base.
- `node build.mjs`: aprobado, copia únicamente la lista prevista de assets.
- `node tools/browser-check.mjs`: aprobado en Chromium headless. Escritorio 1440 px y celular 390 px, navegación original, API caída, panel anónimo denegado, sesión firmada, formularios reales, edición de productos, texto con intento de HTML mostrado como texto, misiones, contenido/enlaces/cotización, descarga de respaldo y datos persistidos visibles desde la portada. Sin errores JS ni desbordamiento horizontal en las pantallas comprobadas.
- Capturas inspeccionadas de la portada móvil. Se conservaron paleta, tipografía, tarjetas, degradados y navegación.
- `git diff --check`: aprobado.

Las pruebas de navegador usan un servidor local y una adaptación de D1 sobre SQLite real. No prueban el runtime desplegado de Cloudflare, el inicio de sesión real ni dispositivos físicos.

## Pendientes y datos necesarios
- Cuenta/recursos Cloudflare: D1 real, dominio de staging, Access con correo autorizado y variables de entorno. No se encontraron en el repositorio; el ID de D1 continúa siendo placeholder.
- Aprobar y verificar los datos iniciales: saldo conciliado, precios y costos. No se accedió al localStorage de Alan ni se creó dinero ficticio.
- Enlaces auténticos de aportes/redes y fotos propias/autorizadas. El panel está preparado para cargarlos. No se presume que la propiedad siga disponible.
- Subida binaria directa a R2 e importación/restauración automática: no implementadas. Hay gestión de fotos por URL y exportación JSON; se documenta respaldo SQL y restauración en staging.
- Cotización automática: no implementada. Referencia manual exige fuente y fecha.
- Verificar respaldos/restauración en D1 real, autenticación, persistencia entre dispositivos y rutas de hosting antes de publicar.
- Productos/fotos se ocultan y las misiones se editan o se hacen privadas. No existe borrado físico desde la interfaz. Movimientos se corrigen por compensación.
- El panel limita historial a 500 filas; el respaldo es completo. Ante red incierta, revisar historial antes de repetir una escritura.

Esta entrega es una implementación comprobada localmente y preparada para staging; no una declaración de producción terminada. La publicación y el merge a main requieren aprobación de Alan.
