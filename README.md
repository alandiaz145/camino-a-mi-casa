# Camino a mi casa — V2

Continuación del diseño original sobre `v2-desarrollo-original`. La portada conserva su identidad, las secciones originales y el relato de Alan. `main` no se modifica.

## Implementado
- Portada conectada a `/api/public`; los saldos locales no se leen ni se importan automáticamente.
- Worker con validación server-side del JWT RS256 de Cloudflare Access y autorización por correo.
- Panel `/admin/`: meta/plazo, ingresos/retiros del fondo, productos/precios/costos/visibilidad/orden, misiones/categorías/prioridad/fechas/estado, textos, enlaces, cotización manual fechada y fotografías mediante URL autorizada.
- Costos, márgenes, movimientos y auditoría privados. Escenarios públicos de facturación bruta claramente identificados.
- Escritura y auditoría en un mismo lote transaccional. Correcciones del fondo mediante movimientos compensatorios, conservando registros originales.
- Respaldo JSON completo de D1 y exportación de las claves locales antiguas sin modificarlas.
- Build por lista explícita; código backend, pruebas y secretos nunca se copian a los assets.

## Verificación local
Node 24 o posterior:

```sh
node --test
node build.mjs
```

La suite usa SQLite real y JWT firmados con claves efímeras de prueba. No usa credenciales ni servicios de producción. Para las pruebas de interfaz se requiere Playwright y Chromium instalados:

```sh
node tools/browser-check.mjs
```

Se puede indicar un módulo instalado fuera del proyecto con `PLAYWRIGHT_MODULE` (URL file: al módulo) y un Chromium existente con `PLAYWRIGHT_EXECUTABLE`. El servidor del ensayo escucha exclusivamente en 127.0.0.1 y existe solo en el script de prueba, que no se publica. Las capturas se guardan en `.qa/`, ignorado por Git.

## Estado y límites
Comprobado localmente; no desplegado durante este trabajo. Aún deben configurarse y probarse Cloudflare D1, Access y el dominio de staging. No se garantiza el estado del hosting que pudiera existir fuera del repositorio.

Subida directa de archivos a R2, restauración automática e importación de saldos antiguos: no implementadas. El archivo y la galería admiten imágenes por URL HTTPS estable, con confirmación explícita de derechos. La referencia original de Zonaprop se conserva mientras no existan fotografías autorizadas configuradas; su disponibilidad no está garantizada.

El panel muestra los últimos 500 movimientos y misiones; el respaldo contiene todas las filas. Productos y medios se ocultan; no se borran físicamente desde el panel. Las misiones se editan y pueden hacerse privadas. Los importes se registran en pesos enteros; el costo debe incluir los costos y comisiones que Alan quiera descontar para su margen privado. No existe automatización de ventas ni de aportes. La cotización es manual y requiere fuente y fecha; no se contrató una API externa.

La política Access y los pasos de puesta en marcha están en [backend/README.md](backend/README.md). No desplegar ni hacer merge a main sin aprobación de Alan.
