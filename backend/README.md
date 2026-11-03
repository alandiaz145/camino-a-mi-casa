# Backend V2 — estado y puesta en marcha

Esta carpeta es una **base de implementación**, no un despliegue activo. No se cambió el `index.html` original ni la rama `main`.

## Incluido
- `schema.sql`: D1 para meta, plazo, movimientos, productos, misiones y auditoría.
- `worker.js`: `GET /api/public` solo publica meta, plazo, saldo agregado, productos visibles sin costo y misiones públicas. Los movimientos y costos se entregan únicamente por `GET /api/admin/state` con autenticación.
- Escrituras de meta, movimientos, productos y misiones con validación, auditoría y comprobación de origen.

## Antes de publicar
1. Crear aplicación Cloudflare Access que proteja **todas las rutas** `/api/admin/*` y restrinja el acceso al correo del propietario. No confiar en esconder botones con CSS.
2. Crear D1 y reemplazar `database_id` en `wrangler.toml`. Ejecutar migración: `npx wrangler d1 execute camino-a-mi-casa --remote --file=backend/schema.sql` (desde la raíz; ajustar ruta/config de Wrangler).
3. Configurar como secrets/variables de entorno: `ADMIN_EMAIL`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `FRONTEND_ORIGIN`. Nunca guardar secretos en Git.
4. Probar el JWT real de Access, las políticas, las llamadas desde el dominio definitivo y el aislamiento de datos antes de conectar la portada.
5. Configurar CORS únicamente para el dominio público definitivo si el frontend y la API tienen orígenes diferentes; no habilitar `*` para endpoints privados.
6. Integrar la portada con `/api/public`, eliminar edición y localStorage del HTML público, y crear una página `/admin` separada con guardado manual. **Todavía no está implementado.**
7. Verificar con pruebas que un usuario anónimo no pueda leer movimientos, costos ni modificar nada; revisar datos y migración antes de despliegue.

## Advertencias
- Los precios y costos iniciales son valores de ejemplo recuperados del HTML original. **No** son datos financieros verificados.
- El saldo inicial es cero y no se debe importar automáticamente un saldo de `localStorage`.
- La galería de la propiedad aún enlaza a imágenes externas en el HTML original; reemplazar por imágenes autorizadas y estables.
- Las rutas de administración no están listas para uso público hasta terminar autenticación, configuración y pruebas.
