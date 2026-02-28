let viewStack = ['view-inicio']; 
let totalGildaComision = 0;
let clicksLogo = 0;
let currentUserId = null;

// --- NAVEGACIÓN ---
function cambiarVista(nuevaVista, textoRol = null) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(nuevaVista).style.display = 'block';
    if (viewStack[viewStack.length - 1] !== nuevaVista) viewStack.push(nuevaVista);
    document.getElementById('btn-atras-global').style.visibility = (nuevaVista === 'view-inicio') ? 'hidden' : 'visible';
    if (textoRol) document.getElementById('indicador-rol').innerText = textoRol;
}

function navegarAtras() {
    if (viewStack.length > 1) {
        viewStack.pop(); 
        const anterior = viewStack[viewStack.length - 1];
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
        document.getElementById(anterior).style.display = 'block';
        if(document.querySelector('.menu-grid')) document.querySelector('.menu-grid').style.display = 'grid';
        if (anterior === 'view-inicio') document.getElementById('btn-atras-global').style.visibility = 'hidden';
    }
}

// --- VALIDACIONES ---
function validarPaso(actual, siguiente) {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const nom = document.getElementById('reg-nombre').value;
    const cant = document.getElementById('reg-cantidad').value;

    if (actual === 1 && !email.includes("@")) return alert("Correo inválido.");
    if (actual === 2 && pass.length < 6) return alert("Contraseña corta.");
    if (actual === 3 && (!nom || cant <= 0)) return alert("Datos incompletos.");

    document.getElementById(`step-${actual}`).style.display = 'none';
    document.getElementById(`step-${siguiente}`).style.display = 'block';
}

// --- FIREBASE PROPIETARIO ---
async function finalizarRegistro() {
    if (!document.getElementById('reg-billetera').value) return alert("Falta Alias/CBU.");
    try {
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const userCred = await window.createUser(window.auth, email, pass);
        await window.sendEmailVerif(window.auth.currentUser);
        alert("¡Verificá tu email!");
        location.reload();
    } catch (e) { alert(e.message); }
}

async function loginPropietario() {
    try {
        const userCred = await window.signIn(window.auth, document.getElementById('login-email').value, document.getElementById('login-pass').value);
        if(!userCred.user.emailVerified) return alert("Email no verificado.");
        currentUserId = userCred.user.uid;
        cambiarVista('view-propietario-menu', 'PROPIETARIO');
        cargarCanchasDuenio();
    } catch (e) { alert("Error al entrar."); }
}

// --- CARGA DE CANCHAS ---
async function guardarCancha() {
    const nombre = document.getElementById('nueva-cancha-nombre').value;
    const precio = document.getElementById('nueva-cancha-precio').value;
    const suelo = document.getElementById('nueva-cancha-suelo').value;

    if(!nombre || !precio) return alert("Completá los datos de la cancha.");

    try {
        await window.dbUtils.addDoc(window.dbUtils.collection(window.db, "canchas"), {
            nombre: nombre,
            precio: parseInt(precio),
            suelo: suelo,
            propietarioId: currentUserId,
            complejo: "Mi Complejo"
        });
        alert("Cancha guardada con éxito.");
        document.getElementById('nueva-cancha-nombre').value = '';
        document.getElementById('nueva-cancha-precio').value = '';
        cargarCanchasDuenio();
    } catch (e) { alert("Error al guardar."); }
}

async function cargarCanchasDuenio() {
    const q = window.dbUtils.query(window.dbUtils.collection(window.db, "canchas"), window.dbUtils.where("propietarioId", "==", currentUserId));
    const snap = await window.dbUtils.getDocs(q);
    const cont = document.getElementById('listado-canchas-pro');
    cont.innerHTML = '<h4>Tus Canchas Publicadas:</h4>';
    snap.forEach(doc => {
        const d = doc.data();
        cont.innerHTML += `<div class="card-field" style="margin-bottom:10px; padding:10px;"><b>${d.nombre}</b> - $${d.precio}/hr<br><small>${d.suelo}</small></div>`;
    });
}

// --- JUGADOR ---
function renderMarketplace() {
    const list = document.getElementById('market-list');
    const items = [{n: "El Potrero", p: 15000}, {n: "San Martín", p: 12000}];
    list.innerHTML = items.map(i => `
        <div class="py-card" onclick="verDetalle('${i.n}', ${i.p})">
            <div class="py-img"><span class="py-tag">Seña 30%</span></div>
            <div class="py-info"><h3>${i.n}</h3><p>San Rafael • $${i.p}/hr</p></div>
        </div>`).join('');
}

function verDetalle(n, p) {
    cambiarVista('view-jugador-detalle', 'JUGADOR');
    document.getElementById('det-nombre').innerText = n;
}

function reservarWhatsApp() {
    totalGildaComision += 500; // Ejemplo de comisión
    window.open(`https://wa.me/5492604000000?text=Hola! Quiero reservar.`, '_blank');
}

function abrirSeccion(id) {
    document.querySelector('.menu-grid').style.display = 'none';
    document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';
    if(id === 'canchas') cargarCanchasDuenio();
}

function volverMenu() {
    document.querySelector('.menu-grid').style.display = 'grid';
    document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
}

function seleccionarTurno(el) { document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected')); el.classList.add('selected'); }
function trucoAdmin() { clicksLogo++; if(clicksLogo === 5) { cambiarVista('view-admin-gilda', 'ADMIN'); document.getElementById('txt-gilda').innerText = `$${totalGildaComision}`; clicksLogo = 0; }}
