
window.initClienteScreen = async () => {

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }
  
  const params = new URLSearchParams(window.location.hash.split("?")[1]);
  const clienteId = params.get("id");
  if (!clienteId) return;

  // ===== CLIENTE =====
  const c = await fetch(`${window.API_BASE_URL}/admin/clientes/${clienteId}`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
}).then(r => r.json());

  const clienteNombre = document.getElementById("clienteNombre");
  const clienteNit = document.getElementById("clienteNit");
  const breadcrumb = document.getElementById("breadcrumb");

  if (clienteNombre) clienteNombre.innerText = c.nombre;
  if (clienteNit) clienteNit.innerText = c.nit;
  if (breadcrumb) breadcrumb.innerText = `Clientes > ${c.nombre}`;

  // ⚠️ Estos inputs NO existen siempre → proteger
  const editNit = document.getElementById("editNit");
  const editNombre = document.getElementById("editNombre");

  if (editNit) editNit.value = c.nit;
  if (editNombre) editNombre.value = c.nombre;

  // ===== VEHÍCULOS =====
  const vehiculos = await fetch(`${window.API_BASE_URL}/admin/vehiculos/cliente/${clienteId}`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
}).then(r => r.json());
  const vehiculosBody = document.getElementById("vehiculosBody");

  if (vehiculosBody) {
    vehiculosBody.innerHTML = vehiculos.map(v => `
      <tr>
        <td>${v.codigo_vehiculo}</td>
        <td>${v.no_llantas}</td>
        <td>${v.activo ? "✔" : "✖"}</td>
      </tr>
    `).join("");
  }

  // ===== LLANTAS =====
  const llantas = await fetch(`${window.API_BASE_URL}/admin/llantas/cliente/${clienteId}`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
}).then(r => r.json());
  const llantasBody = document.getElementById("llantasBody");

  if (llantasBody) {
    llantasBody.innerHTML = llantas.map(l => `
      <tr>
        <td>${l.codigo}</td>
        <td>${l.marca?.nombre ?? "-"}</td>
        <td>${l.diseno?.nombre ?? "-"}</td>
        <td>${l.dimension?.nombre ?? "-"}</td>
        <td>${l.conv_radial}</td>
        <td>${l.fecha_montaje}</td>
        <td>${l.activo ? "✔" : "✖"}</td>
      </tr>
    `).join("");
  }

  // ===== BOTONES MODAL (CLIENTE → VARIABLES) =====

  document
    .querySelectorAll("[data-entity='clientes_variables']")
    .forEach(btn => {
      btn.onclick = () => {
        window.openModal({
          entity: "clientes_variables",
          tipo: btn.dataset.tipo,
          bulk: btn.dataset.bulk === "true"
        });
      };
    });

  // ===== GUARDAR VARIABLES CLIENTE =====
  window.guardarVariableCliente = async () => {
    const bulkEndpoints = {
      vehiculos: `${window.API_BASE_URL}/admin/vehiculos/bulk-insert/${clienteId}`,
      llantas: `${window.API_BASE_URL}/admin/llantas/bulk-insert/${clienteId}`
    };

    try {
      // ===== BULK =====
      if (modalState.bulk) {
        if (!modalState.file) return alert("Seleccione un CSV");

        const fd = new FormData();
        fd.append("file", modalState.file);

        await fetch(bulkEndpoints[modalState.tipo], {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: fd
        });
      }

      // ===== MANUAL =====
      if (!modalState.bulk) {
        if (modalState.tipo === "vehiculos") {
          await fetch(`${window.API_BASE_URL}/admin/vehiculos/`, {
            method: "POST",
              headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              cliente_id: clienteId,
              codigo_vehiculo: document.getElementById("vehiculoCodigoInput").value,
              no_llantas: parseInt(
                document.getElementById("vehiculoLlantasInput").value || 0
              )
            })
          });
        }

        if (modalState.tipo === "llantas") {

          const marcaId = getIdFromDatalist("marcaInput", "marcasList");
          const disenoId = getIdFromDatalist("disenoInput", "disenosList");
          const dimensionId = getIdFromDatalist("dimensionInput", "dimensionesList");

          if (!marcaId || !disenoId || !dimensionId) {
            alert("Marca, diseño y dimensión deben existir");
            return;
          }

          await fetch(`${window.API_BASE_URL}/admin/llantas/` , {
            method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            body: JSON.stringify({
              cliente_id: clienteId,
              codigo: document.getElementById("llantaCodigoInput").value,
              marca_id: marcaId,
              diseno_id: disenoId,
              dimension_id: dimensionId,
              conv_radial: document.getElementById("convRadialSelect").value,
              fecha_montaje: document.getElementById("fechaMontaje").value
            })
          });

        }
      }

      closeModal();
      await window.initClienteScreen();

    } catch (e) {
      console.error(e);
      alert("Error guardando datos");
    }
  };

  console.log("initClienteScreen OK");
};
