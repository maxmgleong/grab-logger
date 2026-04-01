// ====== State ======
let trips = [];
let deferredPrompt = null;

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  loadTrips();
  render();
  registerSW();
  setupInstallBanner();
});

// ====== Storage ======
function loadTrips() {
  try { trips = JSON.parse(localStorage.getItem('grab_trips') || '[]'); }
  catch { trips = []; }
}

function saveTrips() {
  localStorage.setItem('grab_trips', JSON.stringify(trips));
}

// ====== Add trip ======
function addTrip() {
  const input = document.getElementById('fareInput');
  const val = parseFloat(input.value);

  if (isNaN(val) || val <= 0) {
    input.style.borderColor = '#e74c3c';
    setTimeout(() => { input.style.borderColor = ''; }, 1000);
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  trips.push({ fare: val, time: timeStr });
  saveTrips();
  render();

  input.value = '';
  input.focus();
}

// ====== Delete trip ======
function deleteTrip(index) {
  trips.splice(index, 1);
  saveTrips();
  render();
}

// ====== Clear all ======
function clearAll() {
  if (!confirm(`Delete all ${trips.length} trips?`)) return;
  trips = [];
  saveTrips();
  render();
}

// ====== Render ======
function render() {
  const list = document.getElementById('tripList');
  const total = trips.reduce((s, t) => s + t.fare, 0);
  const count = trips.length;

  // Update summary
  document.getElementById('totalFare').textContent = count === 0 ? '0' : total.toFixed(2);
  document.getElementById('tripCount').textContent = count;
  document.getElementById('avgFare').textContent = count === 0 ? '0' : (total / count).toFixed(2);

  // Render list
  if (trips.length === 0) {
    list.innerHTML = '<div class="empty-state">No trips yet.<br>Add your first fare above.</div>';
    return;
  }

  list.innerHTML = [...trips].reverse().map((t, i) => {
    const idx = trips.length - 1 - i;
    return `
      <li class="trip-item">
        <span class="trip-num">#${idx + 1}</span>
        <span class="trip-fare">${Number(t.fare).toFixed(2)}</span>
        <span class="trip-time">${t.time}</span>
        <button class="trip-del" onclick="deleteTrip(${idx})">✕</button>
      </li>
    `;
  }).join('');
}

// ====== Quick amount ======
function setQuick(amount) {
  document.getElementById('fareInput').value = amount;
}

// ====== Service Worker ======
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      // offline fallback — ok
    }
  }
}

// ====== PWA Install Banner ======
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').style.display = 'block';
});

document.getElementById('installBanner').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner').style.display = 'none';
});

// ====== Enter key ======
document.getElementById('fareInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTrip();
});
