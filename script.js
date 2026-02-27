let currentStep = 1;
let totalGildaComision = 0;
let clicksLogo = 0;
let canchaSeleccionada = {};

// --- NAVEGACIÓN ---
function seleccionarRol(rol) {
    document.getElementById('view-inicio').style.display = 'none';
    document.getElementById('app-header').style.display = 'flex';
    if(rol === 'cliente') {
        document.getElementById('view-cliente').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "JUGADOR";
        renderMarketplace();
    } else {
        document.getElementById('view-dueno-acceso').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "DUEÑO";
    }
}

// --- MARKETPLACE ESTILO PEDIDOSYA ---
function renderMarketplace() {
    const list = document.getElementById('pedidosya-list');
    const canchas = [
        {id: 1, nombre: "El Potrero", stars: "4.9", precio: 15000, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500", direccion: "Av. Balloffet 500"},
        {id: 2, nombre: "San Martín Fútbol", stars: "4.5", precio: 12000, img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=500", direccion: "Calle San Martín 200"}
    ];

    list.innerHTML = canchas.map(c => `
        <div class="py-card" onclick="verDetalleCancha('${c.nombre}', ${c.precio}, '${c.direccion}', '${c.img}')">
            <div class="py-img" style="background-image: url('${c.img}')">
                <span class="py-tag">Anticipo 30%</span>
            </div>
            <div class="py-info">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:800; font-size:1.1rem">${c.nombre}</span>
                    <span class="py-rating">⭐ ${c.stars}</span>
                </div>
                <p style="color:gray; font-size:0.8rem; margin:5px 0;">San Rafael • $${c.precio.toLocaleString()}/hr</p>
            </div>
        </div>
    `).join('');
}

// --- VISTA DETALLE JUGADOR ---
function verDetalleCancha(nombre, precio, direccion, img) {
    canchaSeleccionada = { nombre, precio, direccion };
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-cancha-detalle').style.display = 'block';
    
    document.getElementById('det-nombre').innerText = nombre;
    document.getElementById('det-precio').innerText = `$${precio.toLocaleString()}`;
    document.getElementById('det-anticipo').innerText = `$${(precio * 0.3).toLocaleString()}`;
    document.querySelector('.detalle-img').style.backgroundImage = `url('${img}')`;
    
    // Configurar botón Google Maps
    document.getElementById('btn-google-maps').onclick = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombre + " " + direccion + " San Rafael")}`, '_blank');
    };

    renderCalendarioReserva();
}

function renderCalendarioReserva() {
    const cal = document.getElementById('calendario-reserva');
    const horas = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
    cal.innerHTML = horas.map(h => `<div class="time-slot" onclick="seleccionarHora(this)">${h}</div>`).join('');
}

function seleccionarHora(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

// --- PROCESAR RESERVA (GILDA 5%) ---
function procesarReservaJugador() {
    const hora = document.querySelector('.time-slot.selected');
    if(!hora) return alert("Por favor, selecciona un horario.");

    let montoTotal = canchaSeleccionada.precio;
    let comisionGilda = montoTotal * 0.05; // TU PARTE INVISIBLE

    totalGildaComision += comisionGilda; // Se suma a tu panel secreto

    alert(`¡Reserva confirmada en ${canchaSeleccionada.nombre} a las ${hora.innerText}!\n\nDeberás pagar el anticipo al dueño para asegurar tu lugar.`);
    cerrarDetalle();
}

function cerrarDetalle() {
    document.getElementById('view-cancha-detalle').style.display = 'none';
    document.getElementById('view-cliente').style.display = 'block';
}

// --- PANEL SECRETO GILDA ---
function trucoAdmin() {
    clicksLogo++;
    if(clicksLogo === 5) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById('view-admin-gilda').style.display = 'block';
        document.getElementById('plata-gilda').innerText = `$${totalGildaComision.toLocaleString()}`;
        clicksLogo = 0;
    }
}
