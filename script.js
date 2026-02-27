let currentStep = 1;
let clicksLogo = 0;
let comisionAcumulada = 0;

// NAVEGACIÓN
function seleccionarRol(rol) {
    document.getElementById('view-inicio').style.display = 'none';
    document.getElementById('app-header').style.display = 'flex';
    if(rol === 'cliente') {
        document.getElementById('view-cliente').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "MODO JUGADOR";
        renderMarketplace();
    } else {
        document.getElementById('view-dueno-acceso').style.display = 'block';
        document.getElementById('indicador-rol').innerText = "MODO DUEÑO";
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

// FIREBASE: REGISTRO REAL + VERIFICACIÓN POR MAIL
async function finalizarRegistroReal() {
    const email = document.getElementById('owner-email').value;
    const pass = document.getElementById('owner-pass').value;
    const nombre = document.getElementById('complex-name').value;

    try {
        // 1. Crear usuario
        const userCred = await window.createUser(window.auth, email, pass);
        
        // 2. ENVIAR CORREO DE VERIFICACIÓN
        await window.sendEmailVerif(window.auth.currentUser);
        
        // 3. Guardar en Firestore
        await window.setDoc(window.doc(window.db, "duenos", userCred.user.uid), {
            nombre: nombre,
            ganancia: 0,
            comision: 0
        });

        alert("¡Cuenta creada! Te hemos enviado un link a tu correo. Debes confirmarlo para poder entrar.");
        location.reload();

    } catch (e) {
        alert("Error de Firebase: " + e.message);
    }
}

async function loginDueno() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    try {
        const userCred = await window.signIn(window.auth, email, pass);
        
        // Verificar si el correo fue confirmado
        if(!userCred.user.emailVerified) {
            alert("Por favor, verifica tu correo antes de ingresar.");
            return;
        }

        const docSnap = await window.getDoc(window.doc(window.db, "duenos", userCred.user.uid));
        document.getElementById('view-dueno-acceso').style.display = 'none';
        document.getElementById('view-dueno-menu').style.display = 'block';
        document.getElementById('ganancia-total').innerText = `$${docSnap.data().ganancia}`;
        comisionAcumulada = docSnap.data().comision;

    } catch (e) {
        alert("Error al entrar: " + e.message);
    }
}

// MARKETPLACE
function renderMarketplace() {
    const list = document.getElementById('pedidosya-list');
    const items = [{n: "El Potrero", p: 15000}, {n: "Cancha San Martín", p: 12000}];
    list.innerHTML = items.map(i => `
        <div class="py-card" onclick="alert('Reserva iniciada en ${i.n}')">
            <div class="py-img"></div>
            <div class="py-info"><h3>${i.n}</h3><p>$${i.p}/hr</p></div>
        </div>
    `).join('');
}

// PANEL GILDA
function trucoAdmin() {
    clicksLogo++;
    if(clicksLogo === 5) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById('view-admin-gilda').style.display = 'block';
        document.getElementById('plata-gilda').innerText = `$${comisionAcumulada}`;
        clicksLogo = 0;
    }
}
