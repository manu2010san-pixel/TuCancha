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
        document.getElementById('indicador-rol').innerText = "ACCESO DUEÑO";
    }
}

function mostrarLogin() {
    document.getElementById('selector-acceso').style.display = 'none';
    document.getElementById('form-login').style.display = 'block';
}

function mostrarRegistro() {
    document.getElementById('selector-acceso').style.display = 'none';
    document.getElementById('flujo-registro').style.display = 'block';
}

function nextStep(step) {
    document.getElementById(`step-${currentStep}`).style.display = 'none';
    document.getElementById(`step-${step}`).style.display = 'block';
    currentStep = step;
}

// --- FIREBASE: REGISTRO CON VERIFICACIÓN ---
async function finalizarRegistroReal() {
    const email = document.getElementById('owner-email').value;
    const pass = document.getElementById('owner-pass').value;
    const nombre = document.getElementById('complex-name').value;

    try {
        // 1. Crear el usuario
        const userCred = await window.createUser(window.auth, email, pass);
        
        // 2. Enviar correo de verificación real
        await window.sendEmailVerif(window.auth.currentUser);
        
        // 3. Guardar datos en la nube
        await window.setDoc(window.doc(window.db, "duenos", userCred.user.uid), {
            nombreComplejo: nombre,
            gananciaNeta: 0,
            comisionAdmin: 0
        });

        alert("¡Cuenta creada! Revisa tu correo para verificar tu cuenta antes de ingresar.");
        location.reload();
    } catch (e) { 
        console.error(e);
        alert("Error: " + e.message); 
    }
}

async function loginDueno() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await window.signIn(window.auth, email, pass);
        
        // Verificar si el correo fue confirmado
        if(!userCred.user.emailVerified) {
            alert("Por favor, verifica tu correo electrónico antes de entrar.");
            return;
        }

        const docSnap = await window.getDoc(window.doc(window.db, "duenos", userCred.user.uid));
        if(docSnap.exists()) {
            document.getElementById('view-dueno-acceso').style.display = 'none';
            document.getElementById('view-dueno-menu').style.display = 'block';
            document.getElementById('total-neto-dueno').innerText = `$${docSnap.data().gananciaNeta.toLocaleString()}`;
            totalGildaComision = docSnap.data().comisionAdmin || 0;
        }
    } catch (e) { alert("Error al ingresar. Revisa tus datos."); }
}

// --- JUGADOR: MARKETPLACE Y DETALLE ---
function renderMarketplace() {
    const list = document.getElementById('pedidosya-list');
    const locales = [
        {nombre: "El Potrero", stars: "4.9", precio: 15000, suelo: "Sintético"},
        {nombre: "San Martín", stars: "4.5", precio: 12000, suelo: "Natural"}
    ];
    list.innerHTML = locales.map(l => `
        <div class="py-card" onclick="verDetalle('${l.nombre}', ${l.precio}, '${l.suelo}')">
            <div class="py-img"><span class="py-tag">Anticipo 30%</span></div>
            <div class="py-info"><h3>${l.nombre}</h3><p>$${l.precio}/hr • ⭐ ${l.stars}</p></div>
        </div>`).join('');
}

function verDetalle(nombre, precio, suelo) {
    canchaSeleccionada = {nombre, precio};
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-cancha-detalle').style.display = 'block';
    document.getElementById('det-nombre').innerText = nombre;
    document.getElementById('det-precio').innerText = `$${precio.toLocaleString()}`;
    document.getElementById('det-suelo').innerText = "Suelo: " + suelo;
    document.getElementById('txt-anticipo').innerText = `Anticipo requerido (30%): $${(precio * 0.3).toLocaleString()}`;
}

function cerrarDetalle() {
    document.getElementById('view-cancha-detalle').style.display = 'none';
    document.getElementById('view-cliente').style.display = 'block';
}

function seleccionarTurno(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

function procesarReserva() {
    if(!document.querySelector('.time-slot.selected')) return alert("Elige un horario.");
    let comision = canchaSeleccionada.precio * 0.05;
    totalGildaComision += comision;
    alert(`¡Reserva confirmada! Debes pagar el anticipo al dueño.`);
}

// --- SECRETO ADMIN GILDA ---
function trucoAdmin() {
    clicksLogo++;
    if(clicksLogo === 5) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById('view-admin-gilda').style.display = 'block';
        document.getElementById('plata-gilda').innerText = `$${totalGildaComision.toLocaleString()}`;
        clicksLogo = 0;
    }
}
