# ⚽ CanchasApp - Sistema de Reservas Deportivas

Aplicación web completa para reserva de canchas de fútbol, pádel y tenis con sistema de confianza, pagos integrados y notificaciones en tiempo real.

## 🚀 Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Google Maps API
- **Backend:** Firebase (Auth, Firestore, Storage, Functions, Hosting)
- **Pagos:** MercadoPago Checkout Pro
- **Notificaciones:** Firebase Cloud Messaging

## 📋 Funcionalidades

### Para Dueños de Canchas
- ✅ Gestión completa de canchas (CRUD)
- ✅ Horarios y precios dinámicos
- ✅ Sistema de reservas con confirmación
- ✅ Dashboard de ingresos y estadísticas
- ✅ Recepción de pagos automática
- ✅ Sistema de puntuación de clientes

### Para Jugadores
- ✅ Búsqueda por geolocalización
- ✅ Filtros por deporte, superficie, precio
- ✅ Sistema de confianza (0-100%)
- ✅ Pagos con seña automática según historial
- ✅ Historial de reservas y asistencias
- ✅ Reviews de canchas

## 🛠️ Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/canchas-app.git
cd canchas-app

# Instalar Firebase CLI
npm install -g firebase-tools

# Login en Firebase
firebase login

# Instalar dependencias de functions
cd functions
npm install
cd ..

# Configurar variables de entorno
firebase functions:config:set mercadopago.token="TEST-..."

# Emuladores locales (opcional)
firebase emulators:start
