# TakeAway Manager - TODO

## Base de datos y autenticación
- [x] Esquema de base de datos: users, categories, products, orders, order_items, callers
- [x] Autenticación propia con usuario y contraseña (bcrypt, sin OAuth externo)
- [x] Roles: admin, seller (vendedor), kitchen (cocina)
- [x] Seed de datos iniciales (productos de ejemplo, usuarios por defecto)

## Backend API (tRPC)
- [x] Auth: login, logout, me (con JWT propio)
- [x] Categorías: CRUD completo
- [x] Productos: CRUD completo con campos precio, cocina, precio_fijo
- [x] Pedidos: crear, listar pendientes, marcar entregado, historial
- [x] Llamadores: gestión del 1 al 16, disponibilidad
- [x] Items de pedido: marcar línea completada en cocina

## Pantalla de Vendedor
- [x] Layout con categorías en tabs/botones grandes
- [x] Grid de productos por categoría con precio
- [x] Teclado numérico grande para categorías de precio variable (Patatas, Helados, Chocolates, Otros)
- [x] Input para tipo de pizza
- [x] Carrito lateral con resumen del pedido
- [x] Modal de cobro con total y asignación de llamador
- [x] Selector de llamador disponible (1-16)
- [x] Confirmación de pago

## Vista de Cocina
- [x] Tarjetas de pedidos con bocadillos y pizzas
- [x] Número de llamador destacado
- [x] Nombre del vendedor
- [x] Contador de tiempo en espera
- [x] Alertas de color: amarillo >6min, naranja >10min, rojo >15min
- [x] Click en línea para tachar (completada)
- [x] Botón "Entregar" manual por pedido
- [x] Actualización automática cada 8 segundos (polling)
- [x] Actualización optimista para respuesta instantánea

## Pedidos Pendientes
- [x] Lista de pedidos pagados con llamador
- [x] Botón marcar como entregado
- [x] Indicador de tiempo transcurrido con colores

## Historial de Pedidos
- [x] Lista de pedidos entregados agrupados por fecha
- [x] Expandir/colapsar detalles
- [x] Resumen de totales

## Panel de Administración
- [x] Gestión de categorías (nombre, orden, color)
- [x] Gestión de productos (nombre, precio, cocina, precio_fijo/variable, pide tipo)
- [x] Gestión de usuarios (crear, cambiar contraseña, rol)

## UI/UX
- [x] Diseño elegante con paleta oscura profesional (amber/naranja)
- [x] Fuente moderna (Inter/Poppins)
- [x] Botones grandes optimizados para táctil
- [x] Responsive para tablets y pantallas de TPV
- [x] Indicador de versión en footer del panel admin
- [x] Navegación clara entre secciones por rol
- [x] Toasts de confirmación de acciones
- [x] Sidebar colapsable (iconos en móvil, texto en escritorio)

## Tests
- [x] Test de autenticación login/logout
- [x] Test de creación de pedido
- [x] Test de flujo de cocina (items, deliver)
- [x] Test de categorías y productos
- [x] Test de control de roles (admin vs seller)
- [x] 11 tests pasando en total

## Bug fixes
- [x] Eliminar redirección OAuth del framework - el login debe usar solo usuario/contraseña propio
- [x] Bug: auth.me lanza UNAUTHED_ERR_MSG en lugar de devolver null cuando no hay sesión
- [x] Bug: popup de error en pantalla de login por console.error de errores de autenticación esperados
- [x] Bug: getUserByOpenId devuelve undefined porque busca por openId vacío en lugar de ID numérico
- [x] Bug: queries protegidas se disparaban sin sesión activa (añadido enabled: !!user)
- [x] Rediseño Vendedor: layout mobile-first sin scroll, botones grandes táctiles para móvil/tablet
- [ ] Modal de cobro: opción "sin llamador" para pedidos con cocina cuando no se quiere asignar llamador
- [ ] Pantalla Pendientes del vendedor: mostrar pedidos en cocina (con tiempo) y pendientes de entrega al cliente, permitir marcar entregado
- [ ] Cocina: actualización automática en tiempo real (polling o websocket) para nuevos pedidos
- [x] Producto "Otros" con precio libre en cada categoría (botón automático en cada categoría)
- [x] Modal cobro: opción "sin llamador" para pedidos que van a cocina
- [x] Pantalla Pendientes vendedor: estados "En cocina" y "Listo para entregar", marcar entregado
- [x] Cocina: polling automático cada 5s para nuevos pedidos
- [x] Cocina: cambiar botón "Entregado" por "Pedido Preparado" (marca estado ready, no delivered)
- [x] Vendedor: aviso parpadeante en barra superior cuando hay pedidos en estado ready
- [x] Vendedor/Pendientes: solo el vendedor puede marcar "Entregado al cliente"
- [x] Cocina: mostrar también pedidos preparados (ready) debajo de los pendientes, primero pending luego ready
- [x] Cocina: tarjetas en estado ready con fondo verde y etiqueta "Pendiente de entrega al cliente"
- [x] Personalización de productos: icono en esquina del botón abre popup con modificadores y nota libre
- [x] Modificadores configurables por producto en panel de administración (pestaña Modificadores)
- [x] Notas de personalización visibles en carrito, cocina, pendientes e historial
- [x] Bug iOS: barra blanca de autocompletado en campo de nota personalizada del popup de modificadores
- [x] Bug iOS: barra de herramientas del teclado Safari (llave/tarjeta/ubicación) en inputs de la app
- [x] Bug iOS: barra blanca de contraseñas/tarjetas sigue apareciendo sobre el teclado en Safari — aplicadas técnicas avanzadas: inputmode dinámico (none→text en onFocus), honeypot fields en login, data-form-type=other, meta tags PWA, ids/names no reconocibles por iOS

## PWA (Progressive Web App)
- [x] Generar icono de la app (512x512 y 192x192)
- [x] Crear manifest.json con nombre, colores y iconos
- [x] Añadir service worker básico para funcionamiento offline
- [x] Configurar meta tags PWA en index.html (apple-touch-icon, theme-color, manifest)
- [x] Añadir banner de instalación en la pantalla de login (iOS: instrucciones paso a paso; Android: botón instalar directo)
- [x] Bug PWA: orientación bloqueada en vertical — manifest.json orientation cambiado a "any", viewport sin user-scalable=no

## Mejoras v2
- [x] Pendientes: ordenar por tiempo desde que cocina marcó como preparado (campo ready_at), no por tiempo total del pedido
- [x] Historial: mostrar número de llamador en cada pedido
- [x] Historial: botón para reenviar pedido a estado "pendiente de entrega" (deshacer entrega por error)
- [x] Editar pedido ya enviado a cocina (añadir/quitar productos, modificadores)
