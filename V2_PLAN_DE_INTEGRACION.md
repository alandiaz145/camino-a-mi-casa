# Camino a mi casa — V2 sobre diseño original

## Decisión de diseño (aprobada)
La interfaz pública de `main` es la referencia visual definitiva. No reemplazarla por los prototipos Pilo/Emerald24. Conservar el layout, la paleta oscura, degradados verdes/naranjas, tipografía, jerarquía, tarjetas, botones, dos columnas, galería y navegación móvil. El panel privado puede diseñarse aparte.

## Código existente
- `index.html`: portada, progreso, ritmo mensual/semanal/diario, servicios, archivo de trabajo, metas de venta, historia, aportes, galería de casa.
- `quien-soy.html`: relato personal completo; preservar su voz y frases centrales.
- `servicios.html`: siete familias de productos/servicios.
- `README.md`: describe persistencia local, que **no** debe permanecer en producción.

## Reglas de contenido
- Mantener el relato original y la frase «El proyecto no documenta perfección. Documenta transformación».
- Mantener «una pequeña luz para el barrio» y el propósito de generar trabajo y ayudar a otros.
- No presentar aportes como obligación ni la fecha objetivo como promesa.
- No publicar costos, márgenes ni movimientos privados.
- La propiedad de referencia no implica disponibilidad actual.

## Fases de implementación
1. **Congelar referencia**: no tocar `main`; desarrollar aquí y comparar visualmente contra la portada original.
2. **Persistencia central**: API server-side + base de datos (Cloudflare Worker/D1 propuestos). Migración desde `localStorage` solo con respaldo explícito.
3. **Seguridad**: `/admin` autenticado y autorizado del lado del servidor, sesiones seguras, secretos fuera del cliente; nunca basta ocultar HTML con CSS.
4. **Datos**: meta/plazo editables, movimientos auditables, productos con precio/costo/comisiones/ganancia neta, contenido y visibilidad; guardar manualmente.
5. **Misiones**: objetivos privados con título, descripción, estado, fecha y categoría; visibilidad pública optativa por misión.
6. **Portada**: conservar estructura y estilo, sustituir cálculos locales por API; mostrar progreso de fondo verificado, no ingresos brutos.
7. **Archivo de trabajo y casa**: galería con año, leyenda y medios almacenados de forma estable; reemplazar hotlinks a Zonaprop.
8. **Pruebas**: responsive, contraste, navegación, integridad financiera, permisos, respaldo y restauración; desplegar primero staging.
9. **Publicación**: configurar dominio, pagos y redes únicamente con datos reales proporcionados por Alan.

## Pendientes que requieren decisión o configuración
- Hosting/dominio definitivo y acceso Cloudflare.
- Método de autenticación del propietario.
- Enlaces reales Mercado Pago/PayPal/Wise.
- Valor inicial verificado del fondo y política de qué mostrar públicamente.
- Fotos propias para historia, trabajos y propiedad de referencia.

**No introducir datos financieros ficticios como si fueran reales.**
