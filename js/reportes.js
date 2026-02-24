
function initReportes() {
  console.log("✔ initReportes");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  document.querySelectorAll("[data-tipo]").forEach(btn => {
    btn.onclick = () => {
        window.openModal({
        entity: "reportes",
        tipo: btn.dataset.tipo,
        bulk: btn.dataset.bulk === null
        });
    };
  });

  const reportesBody = document.getElementById("reportesBody");

  async function cargarReportes() {
    const res = await fetch(`${window.API_BASE_URL}/admin/reportes/detailed`, {
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
    `${window.API_BASE_URL}/excel/?reporte_id=${reporteSeleccionadoId}`,
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

window.guardarReporte = async () => {
    // 1. Obtener valores de texto/fecha
    const nombre = document.getElementById("reporteNombreInput").value.trim();
    const fecha = document.getElementById("reporteFechaInput").value;
    const token = localStorage.getItem("token");
    const file = modalState.file;

    // 2. Obtener IDs usando tu función utilitaria
    const cliente_id = getIdFromDatalist("reporteClienteInput", "reporteClientesList");

    // Validación
    if (!nombre || !cliente_id || !file || !fecha) {
        return alert("Por favor complete el nombre, la fecha y seleccione un cliente válido de la lista.");
    }

    // 3. Preparar el FormData para el API
    const fd = new FormData();
    fd.append("file", file);
    fd.append("cliente_id", cliente_id); // El UUID obtenido del datalist
    fd.append("nombre", nombre);
    fd.append("fecha_revision", fecha);
    fd.append("observacion", "Carga desde Kartex");

    try {
        const res = await fetch(`${window.API_BASE_URL}/admin/reportes/`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}` 
                // IMPORTANTE: No pongas Content-Type, el navegador lo pondrá con el boundary correcto
            },
            body: fd 
        });

        if (res.ok) {
            const data = await res.json();
            alert(`Reporte "${nombre}" cargado con éxito.`);
            closeModal();
            if (window.initReportes) window.initReportes(); 
        } else {
            const errorData = await res.json();
            console.error("Error API:", errorData);
            alert("Error al cargar el reporte: " + (errorData.detail || "Error desconocido"));
        }
    } catch (e) {
        console.error("Error de conexión:", e);
        alert("Error de conexión con el servidor");
    }
};