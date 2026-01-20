
function initReportes() {
  console.log("✔ initReportes");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  const reportesBody = document.getElementById("reportesBody");

  async function cargarReportes() {
    const res = await fetch(`${API_BASE_URL}/admin/reportes/detailed`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const reportes = await res.json();

    reportesBody.innerHTML = reportes.map(r => `
      <tr class="row-clickable" data-id="${r.id}">
        <td><strong>${r.nombre}</strong></td>
        <td><strong>${r.cliente_nombre}</strong></td>
        <td>${r.vehiculos_revisado}</td>
        <td class="text-center">${r.llantas_revisadas}</td>
        <td class="text-center">${r.fecha_revision}</td>
      </tr>
    `).join("");

    // 🔑 CLICK → ABRIR MODAL EXPORTAR
    reportesBody.querySelectorAll("tr").forEach(tr => {
      tr.onclick = () => {
        openExportModal(tr.dataset.id);
      };
    });
  }

  cargarReportes();
}


let reporteSeleccionadoId = null;

function openExportModal(reporteId) {
  reporteSeleccionadoId = reporteId;
  document.getElementById("exportReporteModal").style.display = "flex";
}

function closeExportModal() {
  reporteSeleccionadoId = null;
  document.getElementById("exportReporteModal").style.display = "none";
}

document.getElementById("cancelExportBtn").onclick = closeExportModal;

document.getElementById("confirmExportBtn").onclick = async () => {
  if (!reporteSeleccionadoId) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API_BASE_URL}/excel/?reporte_id=${reporteSeleccionadoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    alert("No autorizado o error al exportar");
    return;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte.xlsx";
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);

  closeExportModal();
};
