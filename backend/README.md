# Backend V2 — configuración, migración y operación

## Arquitectura
Un único Worker sirve la web y la API en el mismo origen. No requiere CORS. `/admin`, `/admin/*` y `/api/admin/*` requieren JWT RS256 de Access, audience/issuer válidos, vencimiento válido y el correo del propietario autorizado. Todas las escrituras requieren además Origin exacto y JSON. No hay bypass de desarrollo en el Worker.

Los assets ejecutan el Worker primero (`run_worker_first = true`), para que un archivo del panel nunca se sirva antes de autorizar. El build copia únicamente los archivos públicos y del panel; no apunta a la raíz del repositorio. El panel lleva `Cache-Control: no-store` y CSP restrictiva.

Referencia oficial: https://developers.cloudflare.com/workers/static-assets/binding/
Transacciones D1: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

## Preparación — NO ejecutada en producción
Desde la raíz del repositorio, con Wrangler instalado y una cuenta autorizada:

1. Ejecutar `node --test` y `node build.mjs`.
2. Crear primero un entorno de staging independiente. Crear D1 con `wrangler d1 create camino-a-mi-casa-staging`; poner el ID REAL en la configuración de staging. El `database_id` del repositorio continúa siendo un placeholder y no permite un despliegue terminado.
3. Elegir un dominio HTTPS para staging. Configurar Access para `/admin`, `/admin/*` y `/api/admin/*`, incluyendo las URLs alternativas de workers.dev si se habilitan. Usar una política que solo permita el correo de Alan. La validación del Worker también rechaza solicitudes directas sin token, pero Access debe proporcionar el inicio de sesión.
4. Configurar mediante variables/secrets de Wrangler: `ADMIN_EMAIL`, `CF_ACCESS_TEAM_DOMAIN` (dominio del equipo Access), `CF_ACCESS_AUD` (audience de la aplicación), `FRONTEND_ORIGIN` (origen HTTPS exacto, sin barra final). No pegar valores secretos en Git.
5. Instalar o fijar una versión de Wrangler compatible en el entorno de despliegue y registrar la versión utilizada. Este cambio no instala dependencias globales.

## D1 nueva
Con la configuración que apunte a staging:

```sh
wrangler d1 execute camino-a-mi-casa-staging --config backend/wrangler.toml --remote --file backend/schema.sql
```

Ajustar `database_name` de la configuración a ese entorno. `schema.sql` incluye todas las tablas y la prioridad para instalaciones nuevas. No ejecutar 0003 sobre una base ya creada con este schema: la columna ya existe. Los precios iniciales son 0 (Consultar), no tarifas verificadas. Los `INSERT OR IGNORE` nunca cambian precios existentes ni importan saldos.

## D1 preexistente con el esquema anterior
Antes de cualquier cambio, exportar desde Wrangler:

```sh
wrangler d1 export NOMBRE_REAL --config backend/wrangler.toml --remote --output respaldo-previo.sql
wrangler d1 execute NOMBRE_REAL --config backend/wrangler.toml --remote --file backend/migrations/0002_content.sql
wrangler d1 execute NOMBRE_REAL --config backend/wrangler.toml --remote --file backend/migrations/0003_mission_priority.sql
```

Las migraciones no eliminan movimientos, precios ni ajustes. 0002 es idempotente; 0003 se ejecuta UNA sola vez. Inspeccionar `PRAGMA table_info(missions)` antes de ejecutarla. No inicializar una base existente con un archivo destructivo. Guardar los respaldos fuera de Git; contienen datos privados.

Para desarrollo local usar `--local` en lugar de `--remote`, crear dist con `node build.mjs` y arrancar `wrangler dev --config backend/wrangler.toml`. El Worker exige Access también localmente; el ensayo de navegador proporciona una sesión firmada únicamente dentro de su servidor de prueba. No eliminar la validación para facilitar desarrollo.

## Recuperación de datos del navegador anterior
No se puede acceder desde este clon al localStorage del navegador/dispositivo donde se usó el sitio. No se presume saldo cero como dato verificado del propietario: una base nueva empieza sin movimientos y debe conciliarse.

1. En el origen anterior, respaldar las claves `caminoCasaV2` y `caminoCasaFX` antes de reemplazar el sitio. El botón del panel puede exportarlas cuando se usa el mismo origen, perfil y dispositivo. Para otro origen se necesita exportarlas allí.
2. Conservar la copia original intacta, revisar movimientos y comparar contra comprobantes. Los valores predeterminados del HTML no son evidencia de ingresos.
3. Registrar en D1 solo movimientos reales y conciliados. No sumar un saldo inicial y además todos los movimientos que ya lo componen. Documentar referencias y correcciones en el concepto. No hay importador automático.

## Respaldos y restauración
El panel descarga JSON completo con settings, movements, products, missions, audit, content y media en una lectura de lote. No incluye archivos externos ni objetos R2. El export SQL de Wrangler es el respaldo destinado a recuperación de D1.

Probar la restauración del SQL en una base D1 local o de staging vacía antes de depender del respaldo. Comparar recuentos y saldo calculado con `SUM(CASE WHEN kind='in' THEN amount ELSE -amount END)`. El JSON no tiene restauración automática; no prometerla. No restaurar encima de producción sin revisión, respaldo nuevo y aprobación.

## Verificación previa a publicación
- Ejecutar las pruebas automatizadas y las de navegador.
- Verificar login REAL de Access con Alan y rechazo de otro correo; token vencido y falta de token.
- Probar desde un navegador anónimo que no se obtienen costos, conceptos, auditoría ni panel.
- Crear y editar registros en staging; comprobar D1 después de recargar y desde otro dispositivo. Completar una misión no debe modificar el saldo.
- Verificar que los enlaces oficiales pertenecen a Alan. Cargar precios reales y medios de pago confirmados.
- Sustituir fotos externas por imágenes propias/autorizadas en un origen estable. Subida directa a R2 pendiente; no se crearon buckets ni se descargaron fotos ajenas.
- Probar respaldo/restauración real de D1 y las rutas alternativas del dominio.
- Pedir aprobación final antes del despliegue productivo o merge a main.

## Límites conocidos
No se han ejecutado Wrangler ni D1/Access reales en esta sesión. Las pruebas usan el Worker importado en Node con SQLite real y una adaptación del binding D1; comprueban SQL y lógica, pero no sustituyen una prueba en el runtime de Cloudflare. Certificados JWT de prueba se sirven con un fixture de red en las pruebas; el Worker de producción consulta los certificados de Access.

Los certificados se consultan en cada verificación; se puede incorporar caché con rotación controlada en otra iteración. No existe borrado físico ni edición destructiva de movimientos. Ante una escritura con resultado de red incierto, revisar el historial antes de volver a registrar para evitar duplicados. Los errores se muestran explícitamente y no se anuncia guardado sin respuesta de éxito del servidor.
