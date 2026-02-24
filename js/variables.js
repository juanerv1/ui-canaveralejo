
function initVariables() {
  console.log("✔ initVariables");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  document.querySelectorAll("[data-tipo]").forEach(btn => {
    btn.onclick = () => {
        window.openModal({
        entity: "variables",
        tipo: btn.dataset.tipo,
        bulk: btn.dataset.bulk === "true"
        });
    };
  });

  window.guardarVariable = async () => {
    const endpoints = {
      marcas: "/admin/catalogos/marcas",          // Antes decía 'marca'
      disenos: "/admin/catalogos/disenos",        // Antes decía 'diseno'
      dimensiones: "/admin/catalogos/dimensiones",
      tipo_llanta: "/admin/catalogos/tipo_llanta",
      tipos_vehiculos: "/admin/catalogos/tipos_vehiculos",
      marcas_vehiculos: "/admin/catalogos/marcas_vehiculos"
    };

    const token = localStorage.getItem("token");

    try {
      // ===== LÓGICA BULK (IMPORTACIÓN) =====
      if (modalState.bulk) {
        if (!modalState.file) return alert("Seleccione un CSV");

        const fd = new FormData();
        fd.append("file", modalState.file);

        await fetch(`${window.API_BASE_URL}${endpoints[modalState.tipo]}/bulk-upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });

      } 
      // ===== LÓGICA MANUAL (CREACIÓN O EDICIÓN) =====
      else {
        const nombreValue = document.getElementById("catalogNombreInput").value.trim();
        const idValue = document.getElementById("catalogIdInput").value; 

        if (!nombreValue) {
          alert("El nombre no puede estar vacío.");
          return;
        }

        // Si hay un ID, es una edición (PUT), de lo contrario es creación (POST)
        const metodo = idValue ? "PUT" : "POST";
        const urlBase = `${window.API_BASE_URL}${endpoints[modalState.tipo]}`;
        const finalUrl = idValue ? `${urlBase}/${idValue}` : urlBase;

        const res = await fetch(finalUrl, {
          method: metodo,
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ nombre: nombreValue })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Error en la petición");
        }
      }

      closeModal();
      cargarEspecifico(modalState.tipo)

    } catch (e) {
      console.error(e);
      alert("Error guardando variable: " + e.message);
    }
  };

  async function eliminarVariable(recurso, id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro? Esto afectará a los datos asociados.")) return;

    const token = localStorage.getItem("token");
    await fetch(`${window.API_BASE_URL}/admin/catalogos/${recurso}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    closeModal();
    cargarTodo();
  }

  function cargarTodo() {
    const base = `${window.API_BASE_URL}/admin/catalogos`;

    // Llantas
    cargar(`${base}/marcas`, "marcasBody");
    cargar(`${base}/disenos`, "disenosBody");
    cargar(`${base}/dimensiones`, "dimensionesBody");
    cargar(`${base}/tipo_llanta`, "tipoLlantaBody");

    // Vehículos
    cargar(`${base}/tipos_vehiculos`, "tipoVehiculoBody");
    cargar(`${base}/marcas_vehiculos`, "marcaVehiculoBody");
  }

  function cargarEspecifico(catalogo) {
    const base = `${window.API_BASE_URL}/admin/catalogos`;
    switch(catalogo) {
      case "marcas":
        cargar(`${base}/marcas`, "marcasBody");
        break;
      case "disenos":
        cargar(`${base}/disenos`, "disenosBody");
        break;
      case "dimensiones":
        cargar(`${base}/dimensiones`, "dimensionesBody");
        break;
      case "tipo_llanta":
        cargar(`${base}/tipo_llanta`, "tipoLlantaBody");
        break;
      case "tipos_vehiculos":
        cargar(`${base}/tipos_vehiculos`, "tipoVehiculoBody");
        break;
      case "marcas_vehiculos":
        cargar(`${base}/marcas_vehiculos`, "marcaVehiculoBody");
        break;
    }
  }

  async function cargar(endpoint, tbodyId) {
    const res = await fetch(endpoint, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    
    // Extraemos el nombre del recurso de la URL (ej: /marcas)
    const recurso = endpoint.split('/').pop();

    document.getElementById(tbodyId).innerHTML = data.map(i => `
      <tr class="clickable-row" onclick="prepararEdicionVariable('${recurso}', '${i.id}', '${i.nombre}')">
        <td>${i.nombre}</td>
        <td style="text-align:right"><i class="fas fa-edit"></i></td>
      </tr>
    `).join("");
  }

  // Función para abrir el modal en modo edición
  window.prepararEdicionVariable = (recurso, id, nombre) => {
    // Usamos la función openModal que ya tienes para preparar el entorno
    window.openModal({ entity: 'variables', tipo: recurso, bulk: false });
    
    // Cambiamos el comportamiento a modo EDICIÓN
    modalTitle.innerText = "Editar";
    document.getElementById("catalogIdInput").value = id;
    document.getElementById("catalogNombreInput").value = nombre;
    
    // Mostramos acciones de edición
    const editActions = document.getElementById("editActions");
    editActions.style.display = "block";
    
    // Configurar botón eliminar
    document.getElementById("eliminarVariableBtn").onclick = () => eliminarVariable(recurso, id);
  };

  cargarTodo();
}
