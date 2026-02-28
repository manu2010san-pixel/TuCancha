let viewStack = ['view-inicio']; // Historial para el botón atrás
let totalGildaComision = 0;
let clicksLogo = 0;
let canchaSeleccionada = {};

// --- NAVEGACIÓN ---
function cambiarVista(nuevaVista, textoRol = null) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    
    // Mostrar la nueva
    document.getElementById(nuevaVista).style.display = 'block';
    
    // Guardar en el historial si no es la misma que la anterior
    if (viewStack[viewStack.length - 1] !== nuevaVista) {
        viewStack.push(nuevaVista);
    }

    // Botón atrás visible solo si no estamos en el inicio
    const btnAtras = document.getElementById('btn-atras-global');
    btnAtras.style.visibility = (nuevaVista === 'view-inicio') ? 'hidden' : 'visible';

    // Actualizar Badge
    if (textoRol) document.getElementById('indicador-rol').innerText = textoRol;
}

function navegarAtras() {
    if (viewStack.length > 1) {
        viewStack.pop(); // Sacar la actual
        const anterior = viewStack[viewStack.length - 1];
        
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById(anterior).style.display = 'block';
        
        // Ocultar botón si volvimos al inicio
        if (anterior === 'view-inicio') {
            document.getElementById('btn-atras-global').style.visibility = 'hidden';
            document.getElementById('indicador-rol').innerText = "INICIO";
        }
    }
}

// --- VALIDACIONES ESTRICTAS REGISTRO ---
function validarPaso(actual, siguiente) {
    if (actual === 1) {
        const email = document.getElementById('reg-email').value;
        if (!email.includes("@")) return alert("Introduce un correo válido.");
    }
    if (actual === 2) {
        const pass = document.getElementById('reg-pass').value;
        if (pass.length < 6) return alert("La contraseña debe tener 6 caracteres.");
    }
    if (actual === 3) {
        const nom = document.getElementById('reg-nombre').value;
        const cant = document.getElementById('reg-cantidad').value;
        if (!nom || cant <= 0) return alert("Nombre y cantidad obligatorios.");
    }
    
    document.getElementById(`step-${actual}`).style.display = 'none';
    document.getElementById(`step-${siguiente}`).style.display = 'block';
}

// --- FIREBASE: PROPIETARIO ---
async function finalizarRegistro() {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const nombre = document.getElementById('reg-nombre').value;
    const billetera = document.getElementById('reg-billetera').value;

    if (!billetera) return alert("Dato de cobro obligatorio.");

    try {
        const userCred = await window.createUser(window.auth, email, pass);
        await window.sendEmailVerif(window.auth.currentUser);
        await window.setDoc(window.doc(window.db, "propietarios", userCred.user.uid), {
            nombreComplejo: nombre,
            cantidadCanchas: parseInt(document.getElementById('reg-cantidad').value),
            gananciaNeta: 0
        });
        alert("¡Éxito! Verifica tu email para activar la cuenta.");
        location.reload();
    } catch (e) { alert(e.message); }
}

async function loginPropietario() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await window.signIn(window.auth, email, pass);
        if(!userCred.user.emailVerified) return alert("Verifica tu email primero.");
        
        const docSnap = await window.getDoc(window.doc(window.db, "propietarios", userCred.user.uid));
        cambiarVista('view-propietario-menu', 'PROPIETARIO');
        document.getElementById('txt-ganancia').innerText = `$${docSnap.data().gananciaNeta.toLocaleString()}`;
        generarCanchas(docSnap.data().cantidadCanchas);
    } catch (e) { alert("Error al ingresar."); }
}

async function recuperarClave() {
    const email = document.getElementById('reset-email').value;
    try {
        await window.sendResetEmail(window.auth, email);
        alert("Correo enviado.");
        cambiarVista('view-propietario-login');
    } catch (e) { alert(e.message); }
}

// --- JUGADOR ---
function renderMarketplace() {
    const list = document.getElementById('market-list');
    const locales = [{n: "El Potrero", p: 15000, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500"}, {n: "San Martín", p: 12000, img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=500"}];
    list.innerHTML = locales.map(l => `
        <div class="py-card" onclick="verDetalle('${l.n}', ${l.p}, '${l.img}')">
            <div class="py-img" style="background-image:url('${l.img}')"><span class="py-tag">Seña 30%</span></div>
            <div class="py-info"><h3>${l.n}</h3><p>San Rafael • $${l.p}/hr</p></div>
        </div>`).join('');
}

function verDetalle(n, p, img) {
    canchaSeleccionada = {n, p};
    cambiarVista('view-jugador-detalle', 'JUGADOR');
    document.getElementById('det-nombre').innerText = n;
    document.getElementById('det-anticipo').innerText = `Seña (30%): $${(p * 0.3).toLocaleString()}`;
    document.getElementById('det-img').style.backgroundImage = `url('${img}')`;
}

function reservarWhatsApp() {
    const turno = document.querySelector('.time-slot.selected');
    if(!turno) return alert("Elige un horario.");
    totalGildaComision += (canchaSeleccionada.p * 0.05);
    window.open(`https://wa.me/5492604000000?text=Hola! Quiero reservar en ${canchaSeleccionada.n} a las ${turno.innerText}`, '_blank');
}

// --- UTILIDADES ---
function generarCanchas(cant) {
    const cont = document.getElementById('listado-canchas');
    cont.innerHTML = '';
    for(let i=1; i<=cant; i++) cont.innerHTML += `<div class="card-field" style="margin-bottom:10px"><h4>Cancha #${i}</h4><input placeholder="Nombre"><input type="number" placeholder="Precio"></div>`;
}
function abrirSeccion(id) {
    document.querySelector('.menu-grid').style.display = 'none';
    document.querySelectorAll('.seccion-detalle').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';
}
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
