let currentStep = 1;
let totalGildaComision = 0;
let clicksLogo = 0;
let canchaSeleccionada = {};

// --- NAVEGACIÓN Y VALIDACIÓN ESTRICTA ---
function seleccionarRol(rol) {
    document.getElementById('view-inicio').style.display = 'none';
    document.getElementById('app-header').style.display = 'flex';
    if(rol === 'cliente') {
        document.getElementById('view-cliente').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "JUGADOR";
        renderMarketplace();
    } else {
        document.getElementById('view-dueno-acceso').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "PROPIETARIO";
    }
}

function nextStep(step) {
    // VALIDACIÓN PASO 1: Correo
    if (currentStep === 1) {
        const email = document.getElementById('owner-email').value;
        if (email === "" || !email.includes("@")) {
            alert("Por favor, introduce un correo electrónico válido para San Rafael.");
            return; // Bloquea el avance
        }
    }

    // VALIDACIÓN PASO 3: Contraseña (en el paso 3 se define la clave)
    if (currentStep === 3) {
        const pass = document.getElementById('owner-pass').value;
        if (pass.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres por seguridad.");
            return;
        }
    }

    // VALIDACIÓN PASO 4: Nombre y Cantidad de Canchas
    if (currentStep === 4) {
        const nombre = document.getElementById('complex-name').value;
        const cantidad = document.getElementById('complex-qty').value;
        if (nombre.trim() === "" || cantidad === "" || cantidad <= 0) {
            alert("Debes poner el nombre de tu complejo y cuántas canchas tenés.");
            return;
        }
    }

    document.getElementById(`step-${currentStep}`).style.display = 'none';
    document.getElementById(`step-${step}`).style.display = 'block';
    currentStep = step;
}

// --- REGISTRO FINAL CON ENVÍO DE CORREO REAL ---
async function finalizarRegistroReal() {
    const email = document.getElementById('owner-email').value;
    const pass = document.getElementById('owner-pass').value;
    const nombre = document.getElementById('complex-name').value;
    const billetera = document.getElementById('billetera-dato').value;

    // Validación final de billetera
    if (billetera.trim() === "") {
        alert("Falta el dato de cobro (Alias o CBU) para que puedas recibir tus pagos.");
        return;
    }

    try {
        // 1. Crear el usuario en la base de datos
        const userCred = await window.createUser(window.auth, email, pass);
        
        // 2. ENVIAR EL CORREO DE VERIFICACIÓN (Link real de Firebase)
        await window.sendEmailVerif(window.auth.currentUser);
        
        // 3. Guardar perfil en la nube
        await window.setDoc(window.doc(window.db, "propietarios", userCred.user.uid), {
            nombreComplejo: nombre,
            email: email,
            billetera: billetera,
            gananciaNeta: 0,
            comisionGilda: 0,
            verificado: false
        });

        alert("¡Excelente! Se envió un correo de verificación a " + email + ". Debes confirmar el link en tu correo para poder entrar al panel.");
        location.reload(); // Reinicia para que se loguee ya verificado

    } catch (error) {
        console.error("Error detallado:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert("Este correo ya está registrado. Intentá iniciar sesión.");
        } else {
            alert("Error al registrar: " + error.message);
        }
    }
}

// --- LOGIN CON CHEQUEO DE VERIFICACIÓN ---
async function loginDueno() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (email === "" || pass === "") {
        alert("Completá tus datos de propietario para ingresar.");
        return;
    }

    try {
        const userCred = await window.signIn(window.auth, email, pass);
        
        // SI EL USUARIO NO HIZO CLIC EN EL MAIL, NO ENTRA
        if (!userCred.user.emailVerified) {
            alert("Tu cuenta aún no está verificada. Buscá el mail que te enviamos (revisá Spam).");
            return;
        }

        const docSnap = await window.getDoc(window.doc(window.db, "propietarios", userCred.user.uid));
        if (docSnap.exists()) {
            document.getElementById('view-dueno-acceso').style.display = 'none';
            document.getElementById('view-dueno-menu').style.display = 'block';
            document.getElementById('total-neto-dueno').innerText = `$${docSnap.data().gananciaNeta.toLocaleString()}`;
        }
    } catch (e) {
        alert("Correo o contraseña incorrectos.");
    }
}

// --- FUNCIONES DE JUGADOR (MERCADO ESTILO PEDIDOSYA) ---
function renderMarketplace() {
    const list = document.getElementById('pedidosya-list');
    // Esto simula las canchas que estarían en San Rafael
    const locales = [
        {n: "Canchas El Potrero", p: 15000, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500"},
        {n: "San Martín Fútbol", p: 12000, img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=500"}
    ];

    list.innerHTML = locales.map(l => `
        <div class="py-card" onclick="verDetalle('${l.n}', ${l.p}, '${l.img}')">
            <div class="py-img" style="background-image:url('${l.img}')">
                <span class="py-tag">Anticipo 30%</span>
            </div>
            <div class="py-info">
                <h3>${l.n}</h3>
                <p>San Rafael • $${l.p.toLocaleString()}/hr • ⭐ 4.9</p>
            </div>
        </div>`).join('');
}

function verDetalle(n, p, img) {
    canchaSeleccionada = {n, p};
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-cancha-detalle').style.display = 'block';
    document.getElementById('det-nombre').innerText = n;
    document.getElementById('det-precio').innerText = `$${p.toLocaleString()}`;
    document.getElementById('det-anticipo').innerText = `Anticipo 30%: $${(p * 0.3).toLocaleString()}`;
    document.querySelector('.detalle-img').style.backgroundImage = `url('${img}')`;
}

function procesarReserva() {
    const hora = document.querySelector('.time-slot.selected');
    if(!hora) return alert("Por favor, selecciona un horario para tu partido.");
    
    // Suma a tu panel secreto (5%)
    totalGildaComision += (canchaSeleccionada.p * 0.05);
    
    const msj = `¡Hola! Quiero reservar en ${canchaSeleccionada.n} a las ${hora.innerText}. Sé que el anticipo es de $${canchaSeleccionada.p * 0.3}.`;
    window.open(`https://wa.me/5492604000000?text=${encodeURIComponent(msj)}`, '_blank');
}

// --- PANEL SECRETO GILDA MARIANA ---
function trucoAdmin() {
    clicksLogo++;
    if(clicksLogo === 5) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById('view-admin-gilda').style.display = 'block';
        document.getElementById('plata-gilda').innerText = `$${totalGildaComision.toLocaleString()}`;
        clicksLogo = 0;
    }
}

// --- UTILIDADES ---
function mostrarLogin() { document.getElementById('selector-acceso').style.display = 'none'; document.getElementById('form-login').style.display = 'block'; }
function mostrarRegistro() { document.getElementById('selector-acceso').style.display = 'none'; document.getElementById('flujo-registro').style.display = 'block'; }
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
function seleccionarTurno(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}
