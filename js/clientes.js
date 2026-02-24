function initClientes() {
  console.log("✔ initClientes");

  const token = localStorage.getItem("token");
  if (!token) return;

  const clientesBody = document.getElementById("clientesBody");

  // 1. Usar Delegación de Eventos para los botones de Abrir Modal
  // En lugar de un .forEach que se acumula, buscamos el contenedor o usamos un enfoque limpio
  const container = document.querySelector(".content-header") || document; 
  container.onclick = (e) => {
    const btn = e.target.closest("[data-entity='clientes']");
    if (btn) {
      window.openModal({
        entity: "clientes",
        bulk: btn.dataset.bulk === "true"
      });
    }
  };

  // 2. Definir la función de guardado (se sobrescribe limpiamente)
  window.guardarClientes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("No autenticado");

    try {
      const id = document.getElementById("editClienteId")?.value; // Para edición
      const headers = { "Authorization": `Bearer ${token}` };
      let url = `${window.API_BASE_URL}/admin/clientes/`;
      let method = "POST";
      let body;

      // --- ESCENARIO 1: IMPORTACIÓN MASIVA (BULK) ---
      if (modalState.bulk) {
        if (!modalState.file) return alert("Selecciona un CSV");
        url += "bulk-insert";
        body = new FormData();
        body.append("file", modalState.file);
        // No se define Content-Type en FormData, el navegador lo hace solo
      } 
      
      // --- ESCENARIO 2: MANUAL (CREACIÓN O EDICIÓN) ---
      else {
        const nombre = document.getElementById("clienteNombreInput").value.trim();
        const nit = document.getElementById("clienteNitInput").value.trim();
        
        if (!nombre || !nit) return alert("Nombre y NIT son obligatorios.");

        headers["Content-Type"] = "application/json";
        
        if (id) {
          // Modo Edición
          method = "PUT";
          body = JSON.stringify({ id, nombre, nit });
        } else {
          // Modo Creación
          body = JSON.stringify({ nombre, nit });
        }
      }

      const res = await fetch(url, { method, headers, body });

      if (res.ok) {
        closeModal();
        cargarClientes(); // Refresca la tabla principal de la lista de clientes
        
        
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert("Error: " + (errorData.detail || "No se pudo procesar la solicitud"));
      }
    } catch (e) {
      console.error("Error en guardarClientes:", e);
      alert("Error de red al procesar el cliente");
    }
  };

  // 3. Cargar datos
  async function cargarClientes() {
    if (!clientesBody) return;
    
    try {
      const res = await fetch(`${window.API_BASE_URL}/admin/clientes/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const clientes = await res.json();

      clientesBody.innerHTML = clientes.map(c => `
        <tr class="row-clickable" onclick="window.location.hash='#/cliente?id=${c.id}'">
          <td><strong>${c.nit}</strong></td>
          <td>${c.nombre}</td>
          <td class="text-center">${c.activo ? "✔" : "✖"}</td>
          <td class="text-right"><i class="fa-solid fa-chevron-right"></i></td>
        </tr>
      `).join("");
    } catch (e) {
      console.error("Error cargando clientes:", e);
    }
  }

  cargarClientes();
}

window.openEditClienteModal = () => {
    // 1. Obtener datos de la URL y la pantalla
    const id = new URLSearchParams(window.location.hash.split("?")[1]).get("id");
    const nombre = document.getElementById("clienteNombre")?.innerText || "";
    const nit = document.getElementById("clienteNit")?.innerText || "";

    // 2. Abrir el modal base (esto ya resetea estados según tu openModal)
    window.openModal({ entity: 'clientes', bulk: false });

    // 3. Cambiar a modo EDICIÓN
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.innerText = "Editar Cliente";
    
    // Rellenar los campos
    const idInput = document.getElementById("editClienteId");
    if (idInput) idInput.value = id;

    document.getElementById("clienteNombreInput").value = nombre;
    document.getElementById("clienteNitInput").value = nit;

    // 4. EL FIX: Usar 'guardarBtn' que es el ID real en tu HTML
    const btnGuardar = document.getElementById("guardarBtn");
    const editActions = document.getElementById("editClientActions");

    if (btnGuardar) btnGuardar.style.display = "block";    // Oculta el botón de creación
    if (editActions) editActions.style.display = "block"; // Muestra el botón de actualización y eliminar
};