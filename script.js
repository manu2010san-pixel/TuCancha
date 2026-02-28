let viewStack = ['view-inicio']; 
let totalGildaComision = 0;
let clicksLogo = 0;
let canchaSeleccionada = {};

// --- NAVEGACIÓN ---
function cambiarVista(nuevaVista, textoRol = null) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(nuevaVista).style.display = 'block';
    
    if (viewStack[viewStack.length - 1] !== nuevaVista) {
        viewStack.push(nuevaVista);
    }

    const btnAtras = document.getElementById('btn-atras-global');
    btnAtras.style.visibility = (nuevaVista === 'view-inicio') ? 'hidden' : 'visible';

    if (textoRol) document.getElementById('indicador-rol').innerText = textoRol;
}

function navegarAtras() {
    if (viewStack.length > 1) {
        viewStack.pop(); 
        const anterior = viewStack[viewStack.length - 1];
        
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById(anterior).style.display = 'block';
        
        if (anterior === 'view-inicio') {
            document.getElementById('btn-atras-global').style.visibility = 'hidden';
            document.getElementById('indicador-rol').innerText = "INICIO";
        }
    }
}

// --- VALIDACIÓN ESTRICTA ---
function validarPaso(actual, siguiente) {
    if (actual === 1) {
        const email = document.getElementById('reg-email').value;
        if (!email.includes("@")) return alert("Por favor, introducí un correo válido.");
    }
    if (actual === 2) {
        const pass = document.getElementById('reg-pass').value;
        if (pass.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
    }
    if (actual === 3) {
        const nom = document.getElementById('reg-nombre').value;
        const cant = document.getElementById('reg-cantidad').value;
        if (!nom || cant <= 0) return alert("Completá el nombre del complejo y la cantidad de canchas.");
    }
    document.getElementById(`step-${actual}`).style.display = 'none';
    document.getElementById(`step-${siguiente}`).style.display = 'block';
}

// --- FIREBASE ---
async function finalizarRegistro() {
    const billetera = document.getElementById('reg-billetera').value;
    if (!billetera) return alert("Necesitamos tu Alias o CBU para los pagos.");
    
    try {
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const userCred = await window.createUser(window.auth, email, pass);
        await window.sendEmailVerif(window.auth.currentUser);
        alert("¡Registro enviado! Revisá tu email para verificar la cuenta antes de entrar.");
        location.reload();
    } catch (e) { alert(e.message); }
}

async function loginPropietario() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await window.signIn(window.auth, email, pass);
        if(!userCred.user.emailVerified) return alert("Primero verificá tu email con el link que te enviamos.");
        alert("¡Bienvenido al panel de Propietario!");
    } catch (e) { alert("Datos incorrectos o configuración pendiente."); }
}

async function recuperarClave() {
    const email = document.getElementById('reset-email').value;
    try {
        await window.sendResetEmail(window.auth, email);
        alert("Te enviamos un link para cambiar tu contraseña.");
        cambiarVista('view-propietario-login');
    } catch (e) { alert(e.message); }
}

// --- JUGADOR ---
function renderMarketplace() {
    const list = document.getElementById('market-list');
    const items = [{n: "Canchas El Potrero", p: 15000}, {n: "San Martín Fútbol", p: 12000}];
    list.innerHTML = items.map(i => `
        <div class="py-card" onclick="verDetalle('${i.n}', ${i.p})">
            <div class="py-img"><span class="py-tag">Seña 30%</span></div>
            <div class="py-info"><h3>${i.n}</h3><p>San Rafael • $${i.p}/hr</p></div>
        </div>`).join('');
}

function verDetalle(n, p) {
    canchaSeleccionada = {n, p};
    cambiarVista('view-jugador-detalle', 'JUGADOR');
    document.getElementById('det-nombre').innerText = n;
    document.getElementById('det-anticipo').innerText = `Seña (30%): $${p * 0.3}`;
}

function reservarWhatsApp() {
    const turno = document.querySelector('.time-slot.selected');
    if(!turno) return alert("Elegí un horario.");
    totalGildaComision += (canchaSeleccionada.p * 0.05);
    window.open(`https://wa.me/5492604000000?text=Hola! Quiero reservar en ${canchaSeleccionada.n} a las ${turno.innerText}`, '_blank');
}

// --- OTROS ---
function seleccionarTurno(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

function trucoAdmin() {
    clicksLogo++;
    if(clicksLogo === 5) {
        cambiarVista('view-admin-gilda', 'ADMIN');
        document.getElementById('txt-gilda').innerText = `$${totalGildaComision.toLocaleString()}`;
        clicksLogo = 0;
    }
}
