window.initClienteScreen = async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("No autenticado");

  const params = new URLSearchParams(window.location.hash.split("?")[1]);
  const clienteId = params.get("id");
  if (!clienteId) return;

  const headers = { "Authorization": `Bearer ${token}` };

  /**
   * Sub-función para refrescar solo las tablas sin re-ejecutar toda la pantalla
   */
  async function renderTablas() {
    const [resV, resL] = await Promise.all([
      fetch(`${window.API_BASE_URL}/admin/vehiculos/cliente/${clienteId}`, { headers }),
      fetch(`${window.API_BASE_URL}/admin/llantas/cliente/${clienteId}`, { headers })
    ]);

    const vehiculos = await resV.json();
    const llantas = await resL.json();

    const vehiculosBody = document.getElementById("vehiculosBody");
    if (vehiculosBody) {
      vehiculosBody.innerHTML = vehiculos.map(v => `
        <tr>
          <td>${v.codigo_vehiculo}</td>
          <td>${v.no_llantas}</td>
          <td>${v.tipo_rel?.nombre || "N/A"}</td>
          <td>${v.marca_rel?.nombre || "N/A"}</td>
          <td>${v.activo ? "✔" : "✖"}</td>
        </tr>
      `).join("");
    }

    const llantasBody = document.getElementById("llantasBody");
    if (llantasBody) {
      llantasBody.innerHTML = llantas.map(l => `
        <tr>
          <td>${l.codigo || "-"}</td>
          <td>${l.marca?.nombre ?? "-"}</td>
          <td>${l.diseno?.nombre ?? "-"}</td>
          <td>${l.dimension?.nombre ?? "-"}</td>
          <td>${l.tipo_rel?.nombre ?? "-"}</td>
          <td>${l.fecha_montaje}</td>
          <td>${l.activo ? "✔" : "✖"}</td>
        </tr>
      `).join("");
    }
  }

  // ===== CARGA INICIAL (CLIENTE + TABLAS) =====
  try {
    const [clienteData] = await Promise.all([
      fetch(`${window.API_BASE_URL}/admin/clientes/${clienteId}`, { headers }).then(r => r.json()),
      renderTablas()
    ]);

    // UI Cliente
    const clienteNombre = document.getElementById("clienteNombre");
    const clienteNit = document.getElementById("clienteNit");
    const breadcrumb = document.getElementById("breadcrumb");
    if (clienteNombre) clienteNombre.innerText = clienteData.nombre;
    if (clienteNit) clienteNit.innerText = clienteData.nit;
    if (breadcrumb) breadcrumb.innerText = "";

    // Inputs Edición (Proteger existencia)
    const editNit = document.getElementById("editNit");
    const editNombre = document.getElementById("editNombre");
    if (editNit) editNit.value = clienteData.nit;
    if (editNombre) editNombre.value = clienteData.nombre;

  } catch (err) {
    console.error("Error cargando pantalla cliente:", err);
  }

  // ===== GUARDAR VARIABLES CLIENTE =====
  window.guardarVariableCliente = async () => {
    try {
      const isBulk = modalState.bulk;
      const tipo = modalState.tipo;
      
      if (isBulk) {
        if (!modalState.file) return alert("Seleccione un CSV");
        const fd = new FormData();
        fd.append("file", modalState.file);

        const endpoint = `${window.API_BASE_URL}/admin/${tipo}/bulk-insert/${clienteId}`;
        await fetch(endpoint, { method: "POST", headers, body: fd });
      } 
      else {
        // MODO MANUAL
        let payload = { cliente_id: clienteId };
        let endpoint = "";

        if (tipo === "vehiculos") {
          const codigo = document.getElementById("vehiculoCodigoInput").value.trim();
          const noLlantas = document.getElementById("vehiculoLlantasInput").value.trim();
          if (!codigo || !noLlantas) return alert("Campos obligatorios faltantes");

          endpoint = `${window.API_BASE_URL}/admin/vehiculos/`;
          Object.assign(payload, {
            codigo_vehiculo: codigo,
            no_llantas: parseInt(noLlantas),
            tipo: getIdFromDatalist("vehiculoTipoInput", "vehiculoTipoList"),
            marca: getIdFromDatalist("vehiculoMarcaInput", "vehiculoMarcaList")
          });
        } 
        else if (tipo === "llantas") {
          const marca_id = getIdFromDatalist("marcaInput", "marcasList");
          const diseno_id = getIdFromDatalist("disenoInput", "disenosList");
          const dimension_id = getIdFromDatalist("dimensionInput", "dimensionesList");
          const tipoLlanta = getIdFromDatalist("llantaTipoInput", "tipoLlantaList");
          const fecha = document.getElementById("fechaMontaje").value.trim();

          if (!marca_id || !diseno_id || !dimension_id || !tipoLlanta || !fecha) {
            return alert("Faltan campos obligatorios para la llanta.");
          }

          endpoint = `${window.API_BASE_URL}/admin/llantas/`;
          Object.assign(payload, {
            codigo: document.getElementById("llantaCodigoInput").value.trim() || null,
            marca_id, diseno_id, dimension_id,
            tipo: tipoLlanta,
            fecha_montaje: fecha
          });
        }

        await fetch(endpoint, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      closeModal();
      await renderTablas(); // Refresca datos sin recargar lógica de cliente

    } catch (e) {
      console.error(e);
      alert("Error guardando datos");
    }
  };

  console.log("initClienteScreen OK");
};

window.prepararEdicionCliente = (id, nombre, nit) => {
  // 1. Abrimos el modal base de clientes
  window.openModal({ entity: 'clientes', bulk: false });

  // 2. Cambiamos a modo EDICIÓN
  modalTitle.innerText = "Editar Cliente";
  document.getElementById("editClienteId").value = id;
  document.getElementById("clienteNombreInput").value = nombre;
  document.getElementById("clienteNitInput").value = nit;

  // 3. Mostramos el botón de eliminar (acciones de edición)
  const editActions = document.getElementById("editClientActions");
  if (editActions) editActions.style.display = "block";

  // 4. Configurar botón eliminar (ajusta la URL según tu API)
  document.getElementById("eliminarClienteBtn").onclick = async () => {
    if (!confirm(`¿Eliminar al cliente ${nombre}?`)) return;
    
    const token = localStorage.getItem("token");
    const res = await fetch(`${window.API_BASE_URL}/admin/clientes/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Cliente eliminado");
      window.location.hash = "#/clientes"; // Volver a la lista
      closeModal();
    }
  };
};