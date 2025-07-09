// ===== DASHBOARD Y ACTUALIZACIONES RECIENTES =====
import { pill, toastAlert } from './utils.js';
import { fetchAuth } from './auth.js';

async function loadRecentUpdates() {
  const container = document.getElementById('recentUpdates');
  if (!container) return;
  container.innerHTML = "<div class='text-muted'><i class='bi bi-arrow-clockwise'></i> Cargando…</div>";
  try {
    const res = await fetchAuth("/paquetes?limit=5");
    if (!res.ok) throw new Error();
    const data = await res.json();
    container.innerHTML = data.length
      ? data.map(p => `
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
              <strong>${p.codigo}</strong><br />
              <small class="text-muted"><i class="bi bi-geo-alt"></i> ${p.destinatario} → ${p.ubicacion}${p.cliente ? ` | <i class='bi bi-person'></i> ${p.cliente}` : ''}</small>
            </div>
            ${pill(p.estado)}
          </div>`).join("")
      : `<div class='text-muted'><i class='bi bi-inbox'></i> Sin registros</div>`;
  } catch (err) {
    container.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No disponible</div>`;
  }
}
window.loadRecentUpdates = loadRecentUpdates;

async function loadDashboard() {
  const dash = document.getElementById("dashboardInfo");
  if (!dash) return;
  try {
    const res = await fetchAuth("/dashboard");
    if (!res.ok) throw new Error();
    const d = await res.json();
    dash.innerHTML = `
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-box fs-3 text-primary"></i>
            <h6 class="text-muted mt-2">Paquetes Activos</h6>
            <h2 class="text-primary">${d.total}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-truck fs-3 text-warning"></i>
            <h6 class="text-muted mt-2">En Tránsito</h6>
            <h2 class="text-warning">${d.en_transito}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-house fs-3 text-secondary"></i>
            <h6 class="text-muted mt-2">En Bodega</h6>
            <h2 class="text-secondary">${d.en_bodega}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-check-circle fs-3 text-success"></i>
            <h6 class="text-muted mt-2">Entregados</h6>
            <h2 class="text-success">${d.entregado}</h2>
          </div>
        </div>
      </div>`;
  } catch (err) {
    dash.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No se pudo cargar dashboard</div>`;
  }
}
window.loadDashboard = loadDashboard; 