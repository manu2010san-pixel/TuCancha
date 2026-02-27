let currentStep = 1;
let totalGildaComision = 0;
let clicksLogo = 0;
let cantCanchasGlobal = 0;
let canchaSeleccionada = {};

// --- NAVEGACIÓN PRINCIPAL ---
function seleccionarRol(rol) {
    document.getElementById('view-inicio').style.display = 'none';
    document.getElementById('app-header').style.display = 'flex';
    if(rol === 'cliente') {
        document.getElementById('view-cliente').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "MODO JUGADOR";
        renderMarketplace();
    } else {
        document.getElementById('view-dueno-acceso').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "ACCESO PROPIETARIO";
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

// --- FIREBASE: PROPIETARIO ---
async function finalizarRegistroReal() {
    const email = document.getElementById('owner-email').value;
    const pass = document.getElementById('owner-pass').value;
    const nombre = document.getElementById('complex-name').value;
    const cant = document.getElementById('complex-qty').value;

    try {
        const userCred = await window.createUser(window.auth, email, pass);
        await window.sendEmailVerif(window.auth.currentUser);
        await window.setDoc(window.doc(window.db, "propietarios", userCred.user.uid), {
            nombreComplejo: nombre,
            cantidadCanchas: parseInt(cant),
            gananciaNeta: 0,
            comisionGilda: 0
        });
        alert("¡Registro exitoso! Verifica tu email para activar tu cuenta.");
        location.reload();
    } catch (e) { alert("Error: " + e.message); }
}

async function loginDueno() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await window.signIn(window.auth, email, pass);
        if(!userCred.user.emailVerified) return alert("Por favor, verifica tu email primero.");
        
        const docSnap = await window.getDoc(window.doc(window.db, "propietarios", userCred.user.uid));
        cantCanchasGlobal = docSnap.data().cantidadCanchas;
        
        document.getElementById('view-dueno-acceso').style.display = 'none';
        document.getElementById('view-dueno-menu').style.display = 'block';
        document.getElementById('total-neto-dueno').innerText = `$${docSnap.data().gananciaNeta.toLocaleString()}`;
        generarCanchasPropietario(cantCanchasGlobal);
    } catch (e) { alert("Error al ingresar. Revisa tus datos."); }
}

function generarCanchasPropietario(cant) {
    const cont = document.getElementById('contenedor-mis-canchas');
    cont.innerHTML = '';
    for(let i=1; i<=cant; i++){
        cont.innerHTML += `
            <div class="setup-card" style="margin-bottom:15px">
                <h4>Cancha #${i}</h4>
                <input placeholder="Nombre de la cancha">
                <input type="number" placeholder="Precio por hora ($)">
            </div>`;
    }
}

// --- JUGADOR: MARKETPLACE ---
function renderMarketplace() {
    const list = document.getElementById('pedidosya-list');
    const locales = [
        {n: "El Potrero", p: 15000, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500", dir: "Av. Balloffet 500"},
        {n: "San Martín Fútbol", p: 12000, img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=500", dir: "Calle San Martín 200"}
    ];
    list.innerHTML = locales.map(l => `
        <div class="py-card" onclick="verDetalle('${l.n}', ${l.p}, '${l.img}', '${l.dir}')">
            <div class="py-img" style="background-image:url('${l.img}')">
                <span class="py-tag">Anticipo 30%</span>
            </div>
            <div class="py-info">
                <h3>${l.n}</h3>
                <p>San Rafael • $${l.p.toLocaleString()}/hr • ⭐ 4.9</p>
            </div>
        </div>`).join('');
}

function verDetalle(n, p, img, dir) {
    canchaSeleccionada = {n, p, dir};
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-cancha-detalle').style.display = 'block';
    document.getElementById('det-nombre').innerText = n;
    document.getElementById('det-precio').innerText = `$${p.toLocaleString()}`;
    document.getElementById('det-anticipo').innerText = `Anticipo 30%: $${(p*0.3).toLocaleString()}`;
    document.querySelector('.detalle-img').style.backgroundImage = `url('${img}')`;
    
    document.getElementById('btn-maps-link').onclick = () => {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(n + " " + dir + " San Rafael")}`, '_blank');
    };
}

function seleccionarTurno(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

function procesarReserva() {
    const hora = document.querySelector('.time-slot.selected');
    if(!hora) return alert("Elige un horario.");
    
    // Tu 5% invisible
    totalGildaComision += (canchaSeleccionada.p * 0.05);
    
    const msj = `¡Hola! Quiero reservar en ${canchaSeleccionada.n} a las ${hora.innerText}. Sé que el anticipo es de $${canchaSeleccionada.p * 0.3}.`;
    window.open(`https://wa.me/5492604000000?text=${encodeURIComponent(msj)}`, '_blank');
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

// UTILIDADES
function abrirSeccion(sec) {
    document.querySelector('.menu-grid').style.display = 'none';
    document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${sec}`).style.display = 'block';
}
function volverMenu() {
    document.querySelector('.menu-grid').style.display = 'grid';
    document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
}
function cerrarDetalle() {
    document.getElementById('view-cancha-detalle').style.display = 'none';
    document.getElementById('view-cliente').style.display = 'block';
}
