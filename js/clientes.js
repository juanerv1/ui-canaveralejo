
function initClientes() {
  console.log("✔ initClientes");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  const clientesBody = document.getElementById("clientesBody");

  // Botones abrir modal
  document.querySelectorAll("[data-entity='clientes']").forEach(btn => {
    btn.onclick = () => {
        window.openModal({
        entity: "clientes",
        bulk: btn.dataset.bulk === "true"
        });
    };
    });


  window.guardarClientes = async () => {
    try {
      if (modalState.bulk) {
        if (!modalState.file) return alert("Selecciona un CSV");

        const fd = new FormData();
        fd.append("file", modalState.file);

        await fetch(`${window.API_BASE_URL}/admin/clientes/bulk-insert`, {
          method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
          body: fd
        });

      } else {
        await fetch(`${window.API_BASE_URL}/admin/clientes/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombre: document.getElementById("clienteNombreInput").value,
            nit: document.getElementById("clienteNitInput").value
          })
        });
      }

      closeModal();
      cargarClientes();

    } catch (e) {
      console.error(e);
      alert("Error al guardar cliente");
    }
  };

    async function cargarClientes() {
    const res = await fetch(`${window.API_BASE_URL}/admin/clientes/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
      
    );
    const clientes = await res.json();

    clientesBody.innerHTML = clientes.map(c => `
        <tr class="row-clickable" data-id="${c.id}">
        <td><strong>${c.nit}</strong></td>
        <td>${c.nombre}</td>
        <td class="text-center">
            ${c.activo ? "✔" : "✖"}
        </td>
        <td class="text-right">
            <i class="fa-solid fa-chevron-right"></i>
        </td>
        </tr>
    `).join("");

    clientesBody.querySelectorAll("tr").forEach(tr => {
        tr.onclick = () => {
        window.location.hash = `#/cliente?id=${tr.dataset.id}`;
        };
    });
    }

  cargarClientes();
}
