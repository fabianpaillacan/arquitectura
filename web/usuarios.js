// ===== USUARIOS: ADMINISTRACIÓN DE USUARIOS (ADMIN) =====
import { toastAlert, rolToText } from './utils.js';
import { fetchAuth } from './auth.js';

async function loadUsuarios() {
  const container = document.getElementById('usuariosTableContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-clockwise"></i> Cargando…</div>';
  try {
    const res = await fetchAuth('/usuarios');
    if (!res.ok) throw new Error();
    const usuarios = await res.json();
    if (!usuarios.length) {
      container.innerHTML = '<div class="text-muted">No hay usuarios registrados.</div>';
      return;
    }
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>ID</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td>${u.email}</td>
                <td>${u.nombre}</td>
                <td>${rolToText(u.rol)}</td>
                <td>${u.rol === 'repartidor' ? u.id : ''}</td>
                <td>${u.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
                <td>
                  <button class="btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}" onclick="toggleUsuarioActivo('${u.id}', ${u.activo})">
                    ${u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="text-danger">No se pudo cargar la lista de usuarios.</div>';
  }
}
window.loadUsuarios = loadUsuarios;

async function toggleUsuarioActivo(id, activo) {
  try {
    const res = await fetchAuth(`/usuarios/${id}/activo`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !activo })
    });
    if (!res.ok) throw new Error();
    toastAlert('Usuario actualizado', 'success');
    loadUsuarios();
  } catch (err) {
    toastAlert('No se pudo actualizar el usuario', 'danger');
  }
}
window.toggleUsuarioActivo = toggleUsuarioActivo; 