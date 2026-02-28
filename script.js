// js/auth.js
import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Utilidades
const showToast = (message, type = 'success') => {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const showLoading = (button, text = 'Cargando...') => {
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = text;
};

const hideLoading = (button) => {
  button.disabled = false;
  button.textContent = button.dataset.originalText;
};

// Verificar sesión activa
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (userData) {
      // Redirigir según el tipo
      if (window.location.pathname.includes('index') || window.location.pathname === '/') {
        if (userData.type === 'owner') {
          window.location.href = 'owner-dashboard.html';
        } else {
          window.location.href = 'client-dashboard.html';
        }
      }
    }
  }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  
  try {
    showLoading(btn);
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const userData = userDoc.data();
    
    showToast('¡Bienvenido de vuelta!');
    
    setTimeout(() => {
      if (userData.type === 'owner') {
        window.location.href = 'owner-dashboard.html';
      } else {
        window.location.href = 'client-dashboard.html';
      }
    }, 1000);
    
  } catch (error) {
    hideLoading(btn);
    let message = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
    if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
    showToast(message, 'error');
  }
});

// Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  
  // Validaciones
  const type = document.getElementById('userType').value;
  if (!type) {
    showToast('Selecciona si eres dueño o jugador', 'warning');
    return;
  }
  
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  
  if (password !== confirmPassword) {
    showToast('Las contraseñas no coinciden', 'error');
    return;
  }
  
  try {
    showLoading(btn, 'Creando cuenta...');
    
    const email = document.getElementById('regEmail').value;
    const name = document.getElementById('regName').value;
    const phone = '+54' + document.getElementById('regPhone').value;
    
    // Crear usuario en Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil
    await updateProfile(result.user, {
      displayName: name,
      phoneNumber: phone
    });
    
    // Datos adicionales según tipo
    const userData = {
      uid: result.user.uid,
      type: type,
      name: name,
      email: email,
      phone: phone,
      createdAt: serverTimestamp(),
      rating: 0,
      totalReviews: 0,
      profileImage: null
    };
    
    if (type === 'owner') {
      userData.businessName = document.getElementById('regBusinessName').value;
      userData.courts = [];
    } else {
      userData.reliabilityScore = 100;
      userData.totalReservations = 0;
      userData.attendedReservations = 0;
      userData.missedReservations = 0;
    }
    
    // Guardar en Firestore
    await setDoc(doc(db, 'users', result.user.uid), userData);
    
    showToast('¡Cuenta creada exitosamente!');
    
    setTimeout(() => {
      if (type === 'owner') {
        window.location.href = 'owner-dashboard.html';
      } else {
        window.location.href = 'client-dashboard.html';
      }
    }, 1500);
    
  } catch (error) {
    hideLoading(btn);
    let message = 'Error al crear la cuenta';
    if (error.code === 'auth/email-already-in-use') message = 'Este email ya está registrado';
    if (error.code === 'auth/weak-password') message = 'La contraseña es muy débil';
    showToast(message, 'error');
    console.error(error);
  }
});

// Login con Google
window.loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Verificar si ya existe el usuario
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Primera vez - redirigir a selección de tipo
      showToast('Completa tu perfil para continuar');
      // Aquí podrías mostrar un modal para seleccionar tipo
    } else {
      const userData = userDoc.data();
      showToast('¡Bienvenido!');
      setTimeout(() => {
        window.location.href = userData.type === 'owner' ? 'owner-dashboard.html' : 'client-dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showToast('Error al iniciar con Google', 'error');
  }
};

// Logout global
window.logout = async () => {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    showToast('Error al cerrar sesión', 'error');
  }
};

export { showToast, showLoading, hideLoading };
// js/owner-app.js
import { auth, db, storage } from './firebase-config.js';
import { showToast, logout } from './auth.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

let currentUser = null;
let ownerData = null;

// Inicialización
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  ownerData = userDoc.data();
  
  if (ownerData.type !== 'owner') {
    window.location.href = 'client-dashboard.html';
    return;
  }
  
  document.getElementById('ownerName').textContent = ownerData.name;
  loadDashboard();
  loadCourts();
  loadReservations();
});

// Cargar Dashboard
async function loadDashboard() {
  // Estadísticas
  const courtsQuery = query(collection(db, 'courts'), where('ownerId', '==', currentUser.uid));
  const courtsSnapshot = await getDocs(courtsQuery);
  document.getElementById('statTotalCourts').textContent = courtsSnapshot.size;
  
  // Reservas de hoy
  const today = new Date().toISOString().split('T')[0];
  const reservationsQuery = query(
    collection(db, 'reservations'),
    where('ownerId', '==', currentUser.uid),
    where('date', '==', today)
  );
  
  onSnapshot(reservationsQuery, (snapshot) => {
    document.getElementById('statTodayReservations').textContent = snapshot.size;
    
    const pending = snapshot.docs.filter(d => d.data().status === 'pending').length;
    document.getElementById('statPending').textContent = pending;
    
    // Listado
    const list = document.getElementById('todayReservationsList');
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No hay reservas para hoy</p>';
      return;
    }
    
    list.innerHTML = snapshot.docs.map(doc => {
      const data = doc.data();
      return `
        <div class="reservation-row">
          <div>
            <strong>${data.courtName}</strong>
            <p style="margin: 0; color: var(--gray); font-size: 14px;">${data.clientName}</p>
          </div>
          <div>${data.startTime}</div>
          <div><span class="badge badge-${data.status === 'confirmed' ? 'success' : 'warning'}">${data.status}</span></div>
          <div>$${data.price}</div>
          <div class="client-reliability">
            <span class="reliability-indicator" style="background: ${getReliabilityColor(data.clientReliabilityScore)}"></span>
            <span>${data.clientReliabilityScore}%</span>
          </div>
        </div>
      `;
    }).join('');
  });
  
  // Ingresos del mes
  const monthStart = new Date();
  monthStart.setDate(1);
  const revenueQuery = query(
    collection(db, 'reservations'),
    where('ownerId', '==', currentUser.uid),
    where('status', '==', 'completed')
  );
  
  const revenueSnap = await getDocs(revenueQuery);
  const totalRevenue = revenueSnap.docs.reduce((sum, doc) => sum + doc.data().price, 0);
  document.getElementById('statRevenue').textContent = '$' + totalRevenue.toLocaleString();
}

function getReliabilityColor(score) {
  if (score >= 90) return '#00b894';
  if (score >= 70) return '#fdcb6e';
  return '#d63031';
}

// Cargar Canchas
async function loadCourts() {
  const q = query(collection(db, 'courts'), where('ownerId', '==', currentUser.uid));
  
  onSnapshot(q, (snapshot) => {
    const grid = document.getElementById('courtsGrid');
    
    if (snapshot.empty) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
          <p style="color: var(--gray); margin-bottom: 20px;">Aún no tienes canchas registradas</p>
          <button class="btn btn-primary" onclick="openAddCourtModal()">Agregar primera cancha</button>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = snapshot.docs.map(doc => {
      const court = doc.data();
      return `
        <div class="card court-card">
          <span class="badge ${court.isActive ? 'badge-success' : 'badge-danger'} court-status">
            ${court.isActive ? 'Activa' : 'Inactiva'}
          </span>
          <img src="${court.images?.[0] || 'https://via.placeholder.com/400x200'}" class="court-image" alt="${court.name}">
          <h3 style="margin-bottom: 10px;">${court.name}</h3>
          <p style="color: var(--gray); margin-bottom: 15px; font-size: 14px;">
            📍 ${court.address}
          </p>
          <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
            ${court.amenities?.map(a => `<span class="feature-tag">${a}</span>`).join('') || ''}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 24px; font-weight: 800; color: var(--primary);">
                $${court.pricing?.weekday?.morning || 0}
              </span>
              <span style="color: var(--gray); font-size: 14px;">/hora</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-outline" onclick="editCourt('${doc.id}')">Editar</button>
              <button class="btn btn-primary" onclick="viewCourt('${doc.id}')">Ver</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Agregar Cancha
document.getElementById('addCourtForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Creando...';
  
  try {
    // Subir imágenes
    const files = document.getElementById('courtImages').files;
    const imageUrls = [];
    
    for (let file of files) {
      const storageRef = ref(storage, `courts/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
    }
    
    // Recolectar datos
    const courtData = {
      ownerId: currentUser.uid,
      name: document.getElementById('courtName').value,
      description: document.getElementById('courtDescription').value,
      address: document.getElementById('courtAddress').value,
      sportType: document.getElementById('sportType').value,
      surfaceType: document.getElementById('surfaceType').value,
      amenities: Array.from(document.querySelectorAll('.toggle-switch input:checked')).map(cb => cb.value),
      images: imageUrls,
      isActive: true,
      rating: 0,
      totalReviews: 0,
      createdAt: serverTimestamp(),
      schedule: {
        monday: { open: '08:00', close: '23:00', isOpen: true },
        tuesday: { open: '08:00', close: '23:00', isOpen: true },
        wednesday: { open: '08:00', close: '23:00', isOpen: true },
        thursday: { open: '08:00', close: '23:00', isOpen: true },
        friday: { open: '08:00', close: '23:00', isOpen: true },
        saturday: { open: '08:00', close: '23:00', isOpen: true },
        sunday: { open: '08:00', close: '23:00', isOpen: true }
      },
      pricing: {
        weekday: {
          morning: parseInt(document.getElementById('priceWeekMorning').value) || 0,
          afternoon: parseInt(document.getElementById('priceWeekAfternoon').value) || 0,
          night: parseInt(document.getElementById('priceWeekNight').value) || 0
        },
        weekend: {
          morning: parseInt(document.getElementById('priceWeekendMorning').value) || 0,
          afternoon: parseInt(document.getElementById('priceWeekendAfternoon').value) || 0,
          night: parseInt(document.getElementById('priceWeekendNight').value) || 0
        }
      }
    };
    
    await addDoc(collection(db, 'courts'), courtData);
    
    showToast('Cancha creada exitosamente');
    closeModal('addCourtModal');
    e.target.reset();
    document.getElementById('imagePreviewGrid').innerHTML = '';
    
  } catch (error) {
    console.error(error);
    showToast('Error al crear la cancha', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear Cancha';
  }
});

// Cargar Reservas
async function loadReservations() {
  const q = query(
    collection(db, 'reservations'),
    where('ownerId', '==', currentUser.uid),
    where('date', '>=', new Date().toISOString().split('T')[0])
  );
  
  onSnapshot(q, (snapshot) => {
    const list = document.getElementById('reservationsList');
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No tienes reservas pendientes</p>';
      return;
    }
    
    list.innerHTML = snapshot.docs.map(doc => {
      const r = doc.data();
      return `
        <div class="reservation-row" style="background: white; margin-bottom: 10px; border-radius: 8px; box-shadow: var(--shadow);">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${r.courtImage || 'https://via.placeholder.com/60'}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
            <div>
              <strong>${r.courtName}</strong>
              <p style="margin: 0; font-size: 14px; color: var(--gray);">${r.date} | ${r.startTime}</p>
            </div>
          </div>
          <div>
            <div style="font-weight: 700;">${r.clientName}</div>
            <div class="client-reliability" style="font-size: 12px;">
              <span class="reliability-indicator" style="background: ${getReliabilityColor(r.clientReliabilityScore)}"></span>
              <span>${r.clientReliabilityScore}% confiable</span>
            </div>
          </div>
          <div>
            <span class="badge badge-${r.status === 'confirmed' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}">
              ${r.status}
            </span>
          </div>
          <div style="font-weight: 700;">$${r.price}</div>
          <div style="display: flex; gap: 8px;">
            ${r.status === 'pending' ? `
              <button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;" onclick="confirmReservation('${doc.id}')">✓</button>
              <button class="btn btn-danger" style="padding: 8px 16px; font-size: 14px;" onclick="rejectReservation('${doc.id}')">✕</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  });
}

// Confirmar/Reservar
window.confirmReservation = async (reservationId) => {
  try {
    await updateDoc(doc(db, 'reservations', reservationId), {
      status: 'confirmed',
      confirmedAt: serverTimestamp()
    });
    showToast('Reserva confirmada');
  } catch (error) {
    showToast('Error al confirmar', 'error');
  }
};

window.rejectReservation = async (reservationId) => {
  if (!confirm('¿Rechazar esta reserva?')) return;
  
  try {
    await updateDoc(doc(db, 'reservations', reservationId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    });
    showToast('Reserva rechazada');
  } catch (error) {
    showToast('Error al rechazar', 'error');
  }
};

// Utilidades globales
window.editCourt = (courtId) => {
  console.log('Editar cancha:', courtId);
  // Implementar edición
};

window.viewCourt = (courtId) => {
  console.log('Ver cancha:', courtId);
  // Implementar vista detalle
};

window.savePaymentLink = async () => {
  const link = document.getElementById('paymentLink').value;
  if (!link) return;
  
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      paymentLink: link
    });
    showToast('Link de pago guardado');
  } catch (error) {
    showToast('Error al guardar', 'error');
  }
};

// Exponer funciones necesarias
window.logout = logout;
// js/client-app.js
import { auth, db } from './firebase-config.js';
import { showToast, logout } from './auth.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let currentUser = null;
let clientData = null;
let selectedCourt = null;
let selectedDate = null;
let selectedTime = null;

// Inicialización
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  clientData = userDoc.data();
  
  if (clientData.type !== 'client') {
    window.location.href = 'owner-dashboard.html';
    return;
  }
  
  // Cargar datos del perfil
  document.getElementById('clientName').textContent = clientData.name;
  document.getElementById('clientEmail').textContent = clientData.email;
  
  loadClientStats();
  loadCourts();
  loadMyReservations();
});

// Cargar estadísticas del cliente
async function loadClientStats() {
  const history = await calculateClientHistory(currentUser.uid);
  
  // Actualizar UI
  document.getElementById('reliabilityScore').textContent = history.reliabilityScore + '%';
  document.getElementById('statTotal').textContent = history.totalReservations;
  document.getElementById('statAttended').textContent = history.attendedReservations;
  document.getElementById('statMissed').textContent = history.missedReservations;
  document.getElementById('statCancelled').textContent = history.cancelledReservations;
  
  // Color y estado
  const score = history.reliabilityScore;
  const card = document.getElementById('reliabilityCard');
  const status = document.getElementById('reliabilityStatus');
  
  if (score >= 90) {
    card.style.background = 'linear-gradient(135deg, #00b894 0%, #00a383 100%)';
    status.textContent = '⭐⭐⭐ Cliente Confiable';
  } else if (score >= 70) {
    card.style.background = 'linear-gradient(135deg, #fdcb6e 0%, #e1b12c 100%)';
    status.textContent = '⭐⭐ Cliente Regular';
  } else {
    card.style.background = 'linear-gradient(135deg, #d63031 0%, #b71540 100%)';
    status.textContent = '⭐ Se requiere seña';
  }
  
  // Historial
  loadReservationHistory();
}

async function calculateClientHistory(clientId) {
  const q = query(
    collection(db, 'reservations'),
    where('clientId', '==', clientId),
    where('status', 'in', ['completed', 'no-show', 'cancelled'])
  );
  
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map(d => d.data());
  
  const total = reservations.length;
  const attended = reservations.filter(r => r.status === 'completed').length;
  const missed = reservations.filter(r => r.status === 'no-show').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;
  
  const reliabilityScore = total > 0 ? Math.round((attended / total) * 100) : 100;
  
  return {
    totalReservations: total,
    attendedReservations: attended,
    missedReservations: missed,
    cancelledReservations: cancelled,
    reliabilityScore
  };
}

// Cargar canchas disponibles
async function loadCourts() {
  const q = query(collection(db, 'courts'), where('isActive', '==', true));
  
  onSnapshot(q, (snapshot) => {
    const grid = document.getElementById('courtsGrid');
    
    grid.innerHTML = snapshot.docs.map(doc => {
      const court = doc.data();
      const minPrice = Math.min(
        court.pricing?.weekday?.morning || Infinity,
        court.pricing?.weekday?.afternoon || Infinity,
        court.pricing?.weekday?.night || Infinity
      );
      
      return `
        <div class="card court-card-client" onclick="openCourtDetail('${doc.id}')">
          <img src="${court.images?.[0] || 'https://via.placeholder.com/400x220'}" class="court-image-client" alt="${court.name}">
          <div class="court-info">
            <div class="court-header">
              <div class="court-title">${court.name}</div>
              <div class="court-rating">
                ⭐ ${court.rating?.toFixed(1) || 'Nuevo'}
              </div>
            </div>
            <div class="court-meta">
              <span>⚽ ${formatSportType(court.sportType)}</span>
              <span>📍 ${court.address?.split(',')[0]}</span>
            </div>
            <div class="court-features">
              ${court.amenities?.slice(0, 3).map(a => `<span class="feature-tag">${a}</span>`).join('') || ''}
              ${court.amenities?.length > 3 ? `<span class="feature-tag">+${court.amenities.length - 3}</span>` : ''}
            </div>
            <div class="court-footer">
              <div>
                <div class="price-display">$${minPrice}</div>
                <div class="price-period">desde /hora</div>
              </div>
              <button class="btn btn-primary">Reservar</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

function formatSportType(type) {
  const types = {
    'futbol5': 'Fútbol 5',
    'futbol7': 'Fútbol 7',
    'futbol11': 'Fútbol 11',
    'padel': 'Pádel',
    'tenis': 'Tenis'
  };
  return types[type] || type;
}

// Abrir detalle de cancha
window.openCourtDetail = async (courtId) => {
  const courtDoc = await getDoc(doc(db, 'courts', courtId));
  selectedCourt = { id: courtId, ...courtDoc.data() };
  
  document.getElementById('modalCourtName').textContent = selectedCourt.name;
  document.getElementById('modalCourtImage').src = selectedCourt.images?.[0] || 'https://via.placeholder.com/400';
  
  const infoHtml = `
    <p><strong>📍 Dirección:</strong> ${selectedCourt.address}</p>
    <p><strong>⚽ Deporte:</strong> ${formatSportType(selectedCourt.sportType)}</p>
    <p><strong>🏟️ Superficie:</strong> ${selectedCourt.surfaceType}</p>
    <div style="margin-top: 15px;">
      <strong>Servicios:</strong>
      <div class="court-features" style="margin-top: 8px;">
        ${selectedCourt.amenities?.map(a => `<span class="feature-tag">${a}</span>`).join('') || 'No especificados'}
      </div>
    </div>
  `;
  document.getElementById('modalCourtInfo').innerHTML = infoHtml;
  
  // Verificar si requiere seña
  const history = await calculateClientHistory(currentUser.uid);
  const requiresDeposit = history.reliabilityScore < 70 || history.missedReservations >= 2;
  
  if (requiresDeposit) {
    document.getElementById('depositWarning').style.display = 'block';
  } else {
    document.getElementById('depositWarning').style.display = 'none';
  }
  
  document.getElementById('courtDetailModal').classList.add('active');
};

// Mis reservas
async function loadMyReservations() {
  const q = query(
    collection(db, 'reservations'),
    where('clientId', '==', currentUser.uid),
    orderBy('date', 'desc')
  );
  
  onSnapshot(q, (snapshot) => {
    const list = document.getElementById('myReservationsList');
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No tienes reservas aún</p>';
      return;
    }
    
    list.innerHTML = snapshot.docs.map(doc => {
      const r = doc.data();
      const isPast = new Date(r.date) < new Date();
      
      return `
        <div class="card" style="${isPast ? 'opacity: 0.7;' : ''}">
          <div style="display: flex; gap: 20px; align-items: center;">
            <img src="${r.courtImage || 'https://via.placeholder.com/100'}" style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover;">
            <div style="flex: 1;">
              <h3 style="margin-bottom: 8px;">${r.courtName}</h3>
              <p style="color: var(--gray); margin-bottom: 5px;">
                📅 ${r.date} | 🕐 ${r.startTime} - ${r.endTime}
              </p>
              <p style="color: var(--gray); font-size: 14px;">
                💰 Total: $${r.price} ${r.depositAmount ? `(Seña: $${r.depositAmount})` : ''}
              </p>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-${r.status === 'completed' ? 'success' : r.status === 'confirmed' ? 'info' : r.status === 'pending' ? 'warning' : 'danger'}">
                ${r.status}
              </span>
              ${r.status === 'completed' && !r.clientReview ? `
                <button class="btn btn-outline" style="margin-top: 10px; font-size: 14px;" onclick="openReviewModal('${doc.id}')">
                  Calificar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Historial visual
async function loadReservationHistory() {
  const q = query(
    collection(db, 'reservations'),
    where('clientId', '==', currentUser.uid),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const container = document.getElementById('reservationHistory');
  
  container.innerHTML = snapshot.docs.map(doc => {
    const r = doc.data();
    const statusColors = {
      'completed': '#00b894',
      'no-show': '#d63031',
      'cancelled': '#fdcb6e'
    };
    
    return `
      <div class="history-item">
        <span class="history-status">
          <span class="reliability-indicator" style="background: ${statusColors[r.status] || '#b2bec3'}; width: 16px; height: 16px;"></span>
        </span>
        <strong>${r.courtName}</strong>
        <p style="color: var(--gray); font-size: 14px; margin: 5px 0;">
          ${r.date} | ${r.startTime}hs
        </p>
        <span class="badge badge-${r.status === 'completed' ? 'success' : r.status === 'no-show' ? 'danger' : 'warning'}">
          ${r.status === 'completed' ? '✓ Asistió' : r.status === 'no-show' ? '✗ Faltó' : 'Cancelada'}
        </span>
      </div>
    `;
  }).join('');
}

// Confirmar reserva (simulado)
window.confirmBooking = async () => {
  if (!selectedCourt || !selectedDate || !selectedTime) {
    showToast('Selecciona fecha y horario', 'warning');
    return;
  }
  
  try {
    const history = await calculateClientHistory(currentUser.uid);
    const requiresDeposit = history.reliabilityScore < 70 || history.missedReservations >= 2;
    
    // Calcular precio según día y hora
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hour = parseInt(selectedTime.split(':')[0]);
    
    let period = 'morning';
    if (hour >= 12 && hour < 18) period = 'afternoon';
    else if (hour >= 18) period = 'night';
    
    const price = isWeekend 
      ? selectedCourt.pricing.weekend[period]
      : selectedCourt.pricing.weekday[period];
    
    const reservationData = {
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      courtImage: selectedCourt.images?.[0] || null,
      ownerId: selectedCourt.ownerId,
      clientId: currentUser.uid,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      clientReliabilityScore: history.reliabilityScore,
      date: selectedDate.toISOString().split('T')[0],
      startTime: selectedTime,
      endTime: (parseInt(selectedTime.split(':')[0]) + 1) + ':00',
      duration: 1,
      price: price,
      paymentStatus: 'pending',
      status: 'pending',
      requiredDeposit: requiresDeposit,
      depositAmount: requiresDeposit ? Math.round(price * 0.3) : 0,
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'reservations'), reservationData);
    
    showToast('¡Reserva solicitada! Espera confirmación del dueño.');
    closeModal('courtDetailModal');
    
  } catch (error) {
    console.error(error);
    showToast('Error al crear la reserva', 'error');
  }
};

// Exponer funciones
window.logout = logout;
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
// js/maps.js
let map;
let markers = [];
let userLocation = null;

// Inicializar mapa
function initMap() {
  // Mapa por defecto (Buenos Aires)
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.6037, lng: -58.3816 },
    zoom: 12,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });

  // Intentar obtener ubicación del usuario
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.setCenter(userLocation);
        map.setZoom(14);
        
        // Marcador de ubicación del usuario
        new google.maps.Marker({
          position: userLocation,
          map: map,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          },
          title: 'Tu ubicación'
        });

        // Cargar canchas cercanas
        loadNearbyCourts(userLocation);
      },
      () => {
        console.log('Error al obtener ubicación');
      }
    );
  }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Cargar canchas cercanas
async function loadNearbyCourts(center, radiusKm = 10) {
  const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  const { db } = await import('./firebase-config.js');
  
  // Limpiar marcadores anteriores
  markers.forEach(m => m.setMap(null));
  markers = [];

  const q = query(collection(db, 'courts'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  
  const nearbyCourts = [];
  
  snapshot.forEach(doc => {
    const court = doc.data();
    if (court.location) {
      const distance = calculateDistance(
        center.lat, center.lng,
        court.location.latitude, court.location.longitude
      );
      
      if (distance <= radiusKm) {
        nearbyCourts.push({ id: doc.id, ...court, distance });
        
        // Agregar marcador al mapa
        const marker = new google.maps.Marker({
          position: { 
            lat: court.location.latitude, 
            lng: court.location.longitude 
          },
          map: map,
          title: court.name,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(35, 35)
          }
        });

        // Info window al hacer clic
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h4>${court.name}</h4>
              <p>$${court.pricing?.weekday?.morning || 0}/hora</p>
              <p>⭐ ${court.rating?.toFixed(1) || 'Nuevo'}</p>
              <button onclick="window.openCourtDetail('${doc.id}')" style="background: #00b894; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                Ver detalle
              </button>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markers.push(marker);
      }
    }
  });

  // Ordenar por distancia y actualizar lista
  nearbyCourts.sort((a, b) => a.distance - b.distance);
  updateCourtsList(nearbyCourts);
  
  return nearbyCourts;
}

// Actualizar lista de canchas con distancia
function updateCourtsList(courts) {
  const grid = document.getElementById('courtsGrid');
  
  grid.innerHTML = courts.map(court => `
    <div class="card court-card-client" onclick="openCourtDetail('${court.id}')">
      <div style="position: relative;">
        <img src="${court.images?.[0] || 'https://via.placeholder.com/400x220'}" class="court-image-client" alt="${court.name}">
        <span style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;">
          📍 ${court.distance.toFixed(1)} km
        </span>
      </div>
      <div class="court-info">
        <div class="court-header">
          <div class="court-title">${court.name}</div>
          <div class="court-rating">⭐ ${court.rating?.toFixed(1) || 'Nuevo'}</div>
        </div>
        <div class="court-meta">
          <span>⚽ ${formatSportType(court.sportType)}</span>
          <span>🚗 ${court.distance < 1 ? (court.distance * 1000).toFixed(0) + 'm' : court.distance.toFixed(1) + 'km'}</span>
        </div>
        <div class="court-footer">
          <div>
            <div class="price-display">$${Math.min(
              court.pricing?.weekday?.morning || Infinity,
              court.pricing?.weekday?.afternoon || Infinity
            )}</div>
            <div class="price-period">desde /hora</div>
          </div>
          <button class="btn btn-primary">Reservar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formatSportType(type) {
  const types = {
    'futbol5': 'Fútbol 5',
    'futbol7': 'Fútbol 7',
    'futbol11': 'Fútbol 11',
    'padel': 'Pádel',
    'tenis': 'Tenis'
  };
  return types[type] || type;
}

// Buscar dirección y centrar mapa
async function geocodeAddress(address) {
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: address + ', Argentina' }, (results, status) => {
      if (status === 'OK') {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(14);
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        reject('No se pudo encontrar la dirección');
      }
    });
  });
}

// Agregar input de dirección en formulario de cancha
function initAddressAutocomplete() {
  const input = document.getElementById('courtAddress');
  if (!input) return;
  
  const autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'ar' },
    fields: ['geometry', 'formatted_address']
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      window.selectedCourtLocation = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      };
    }
  });
}

export { initMap, loadNearbyCourts, geocodeAddress, initAddressAutocomplete, calculateDistance };
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mercadopago = require('mercadopago');

admin.initializeApp();

// Configurar MercadoPago
mercadopago.configure({
  access_token: functions.config().mercadopago.token
});

// Crear preferencia de pago
exports.createPaymentPreference = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { reservationId, courtName, price, depositAmount, isDeposit } = data;
  
  const amount = isDeposit ? depositAmount : price;
  const description = isDeposit 
    ? `Seña - Reserva ${courtName}`
    : `Pago total - Reserva ${courtName}`;

  const preference = {
    items: [{
      title: description,
      unit_price: amount,
      quantity: 1,
      currency_id: 'ARS'
    }],
    payer: {
      email: context.auth.token.email
    },
    external_reference: reservationId,
    notification_url: 'https://us-central1-TU_PROYECTO.cloudfunctions.net/webhookMercadoPago',
    back_urls: {
      success: `https://tudominio.com/payment-success?reservation=${reservationId}`,
      failure: `https://tudominio.com/payment-failure?reservation=${reservationId}`,
      pending: `https://tudominio.com/payment-pending?reservation=${reservationId}`
    },
    auto_return: 'approved'
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    
    // Guardar referencia en la reserva
    await admin.firestore().doc(`reservations/${reservationId}`).update({
      mpPreferenceId: response.body.id,
      paymentType: isDeposit ? 'deposit' : 'full',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      initPoint: response.body.init_point,
      sandboxInitPoint: response.body.sandbox_init_point
    };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', 'Error al crear el pago');
  }
});

// Webhook para notificaciones de MercadoPago
exports.webhookMercadoPago = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    
    try {
      // Obtener detalles del pago
      const payment = await mercadopago.payment.findById(paymentId);
      const { status, external_reference, transaction_amount } = payment.body;
      
      const reservationRef = admin.firestore().doc(`reservations/${external_reference}`);
      const reservation = await reservationRef.get();
      
      if (!reservation.exists) {
        res.status(404).send('Reservation not found');
        return;
      }

      const reservationData = reservation.data();

      if (status === 'approved') {
        // Actualizar reserva según tipo de pago
        if (reservationData.paymentType === 'deposit') {
          await reservationRef.update({
            depositPaid: true,
            depositAmount: transaction_amount,
            paymentStatus: 'partial',
            status: 'confirmed',
            mpPaymentId: paymentId,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          await reservationRef.update({
            paymentStatus: 'completed',
            status: 'confirmed',
            mpPaymentId: paymentId,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Notificar al dueño
        await admin.firestore().collection('notifications').add({
          userId: reservationData.ownerId,
          type: 'payment_received',
          title: '💰 Pago recibido',
          message: `Recibiste $${transaction_amount} por una reserva`,
          reservationId: external_reference,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Notificar al cliente
        await admin.firestore().collection('notifications').add({
          userId: reservationData.clientId,
          type: 'payment_confirmed',
          title: '✅ Pago confirmado',
          message: `Tu pago de $${transaction_amount} fue procesado exitosamente`,
          reservationId: external_reference,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

      } else if (status === 'rejected') {
        await reservationRef.update({
          paymentStatus: 'failed',
          mpPaymentId: paymentId
        });
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('OK');
  }
});

// Reembolsar pago
exports.refundPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { reservationId } = data;
  
  const reservation = await admin.firestore().doc(`reservations/${reservationId}`).get();
  if (!reservation.exists) {
    throw new functions.https.HttpsError('not-found', 'Reserva no encontrada');
  }

  const reservationData = reservation.data();
  
  // Verificar que sea el dueño
  if (reservationData.ownerId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'No autorizado');
  }

  try {
    const refund = await mercadopago.refund.create({
      payment_id: reservationData.mpPaymentId
    });

    await reservation.ref.update({
      paymentStatus: 'refunded',
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundId: refund.body.id
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', 'Error al reembolsar');
  }
});
// js/payments.js
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { app } from './firebase-config.js';

const functions = getFunctions(app);

// Inicializar checkout de MercadoPago
export async function initPayment(reservationId, paymentData) {
  try {
    const createPreference = httpsCallable(functions, 'createPaymentPreference');
    const result = await createPreference({
      reservationId,
      ...paymentData
    });

    // Redirigir a MercadoPago
    window.location.href = result.data.initPoint;
    
  } catch (error) {
    console.error(error);
    throw new Error('Error al iniciar el pago');
  }
}

// Verificar estado de pago al volver
export async function checkPaymentStatus(reservationId) {
  const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  const { db } = await import('./firebase-config.js');
  
  const reservation = await getDoc(doc(db, 'reservations', reservationId));
  return reservation.data()?.paymentStatus || 'pending';
}

// Botón de pago en el modal de reserva
export function renderPaymentButtons(reservationData, containerId) {
  const container = document.getElementById(containerId);
  
  const requiresDeposit = reservationData.requiredDeposit;
  const totalPrice = reservationData.price;
  const depositAmount = reservationData.depositAmount || Math.round(totalPrice * 0.3);

  let html = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px;">
      <h4 style="margin-bottom: 15px;">💳 Opciones de pago</h4>
  `;

  if (requiresDeposit) {
    html += `
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
        <strong>⚠️ Seña requerida</strong>
        <p style="margin: 5px 0 0; font-size: 14px;">Tu nivel de confianza requiere una seña del 30% para confirmar.</p>
      </div>
      
      <button onclick="processPayment('${reservationData.id}', true)" class="btn btn-primary" style="width: 100%; margin-bottom: 10px;">
        Pagar seña de $${depositAmount} (30%)
      </button>
      <p style="text-align: center; color: var(--gray); font-size: 14px;">
        Restante al llegar: $${totalPrice - depositAmount}
      </p>
    `;
  } else {
    html += `
      <div style="display: grid; gap: 10px;">
        <button onclick="processPayment('${reservationData.id}', false)" class="btn btn-primary" style="width: 100%;">
          Pagar total $${totalPrice}
        </button>
        <button onclick="processPayment('${reservationData.id}', true)" class="btn btn-outline" style="width: 100%;">
          Solo seña $${depositAmount} (30%)
        </button>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// Procesar pago
window.processPayment = async (reservationId, isDeposit) => {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const { db } = await import('./firebase-config.js');
    
    const reservation = await getDoc(doc(db, 'reservations', reservationId));
    const data = reservation.data();

    await initPayment(reservationId, {
      courtName: data.courtName,
      price: data.price,
      depositAmount: data.depositAmount || Math.round(data.price * 0.3),
      isDeposit
    });
  } catch (error) {
    showToast('Error al procesar el pago', 'error');
  }
};
// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
});

const messaging = firebase.messaging();

// Notificaciones en primer plano (para cuando la app está abierta)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/logo-192x192.png',
    badge: '/assets/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'open' || !action) {
    const url = data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});
// js/notifications.js
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";
import { app } from './firebase-config.js';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from './firebase-config.js';

const messaging = getMessaging(app);
const VAPID_KEY = 'TU_VAPID_KEY'; // De Firebase Console > Cloud Messaging

// Solicitar permiso y obtener token
export async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      // Guardar token en Firestore
      await setDoc(doc(db, 'fcmTokens', userId), {
        token,
        userId,
        platform: 'web',
        createdAt: new Date()
      });
      
      console.log('Token FCM:', token);
      return token;
    } else {
      console.log('Permiso denegado');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
}

// Escuchar mensajes en primer plano
export function initForegroundNotifications() {
  onMessage(messaging, (payload) => {
    console.log('Mensaje recibido:', payload);
    
    // Mostrar notificación custom en la UI
    showInAppNotification(payload.notification, payload.data);
    
    // Reproducir sonido
    playNotificationSound();
  });
}

// Mostrar notificación dentro de la app
function showInAppNotification(notification, data) {
  const container = document.getElementById('inAppNotifications') || createNotificationContainer();
  
  const notif = document.createElement('div');
  notif.className = 'in-app-notification animate-fade-in';
  notif.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    max-width: 350px;
    z-index: 9999;
    border-left: 4px solid var(--primary);
    display: flex;
    gap: 15px;
    align-items: start;
  `;
  
  notif.innerHTML = `
    <div style="font-size: 24px;">${getNotificationIcon(data?.type)}</div>
    <div style="flex: 1;">
      <h4 style="margin: 0 0 5px; font-size: 16px;">${notification.title}</h4>
      <p style="margin: 0; font-size: 14px; color: var(--gray);">${notification.body}</p>
      <div style="margin-top: 10px; display: flex; gap: 10px;">
        <button onclick="this.closest('.in-app-notification').remove(); handleNotificationClick('${data?.type}', '${data?.reservationId}')" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
          Ver
        </button>
        <button onclick="this.closest('.in-app-notification').remove()" style="background: transparent; color: var(--gray); border: 1px solid #dfe6e9; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(notif);
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transform = 'translateX(100%)';
    setTimeout(() => notif.remove(), 300);
  }, 5000);
}

function createNotificationContainer() {
  const div = document.createElement('div');
  div.id = 'inAppNotifications';
  document.body.appendChild(div);
  return div;
}

function getNotificationIcon(type) {
  const icons = {
    'new_reservation': '📅',
    'payment_received': '💰',
    'payment_confirmed': '✅',
    'reservation_reminder': '⏰',
    'review_request': '⭐',
    'reservation_cancelled': '❌'
  };
  return icons[type] || '🔔';
}

function playNotificationSound() {
  const audio = new Audio('/assets/notification.mp3');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('No se pudo reproducir sonido'));
}

// Centro de notificaciones en la UI
export function initNotificationCenter(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(q, (snapshot) => {
    const unreadCount = snapshot.docs.filter(d => !d.data().read).length;
    updateNotificationBadge(unreadCount);
    
    const list = document.getElementById('notificationsList');
    if (list) {
      list.innerHTML = snapshot.docs.map(doc => {
        const n = doc.data();
        return `
          <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="markAsRead('${doc.id}')">
            <div class="notification-icon">${getNotificationIcon(n.type)}</div>
            <div class="notification-content">
              <h4>${n.title}</h4>
              <p>${n.message}</p>
              <small>${formatTime(n.createdAt)}</small>
            </div>
            ${!n.read ? '<span class="unread-dot"></span>' : ''}
          </div>
        `;
      }).join('');
    }
  });
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

window.markAsRead = async (notificationId) => {
  const { updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

window.handleNotificationClick = (type, reservationId) => {
  switch(type) {
    case 'new_reservation':
    case 'payment_received':
      window.location.href = `owner-dashboard.html?section=reservations&id=${reservationId}`;
      break;
    case 'payment_confirmed':
    case 'reservation_reminder':
      window.location.href = `client-dashboard.html?section=reservations&id=${reservationId}`;
      break;
    case 'review_request':
      window.location.href = `client-dashboard.html?section=profile&review=${reservationId}`;
      break;
  }
};

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Hace un momento';
  if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)} h`;
  return date.toLocaleDateString();
}

// Suscribirse a topics (para notificaciones grupales)
export async function subscribeToTopic(topic) {
  // Implementar con Firebase Admin en backend
  console.log('Suscrito a:', topic);
}

export { messaging };
