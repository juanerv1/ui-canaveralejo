
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
      marca: "/admin/catalogos/marcas",
      diseno: "/admin/catalogos/disenos",
      dimension: "/admin/catalogos/dimensiones"
    };

    try {
      if (modalState.bulk) {
        if (!modalState.file) return alert("Seleccione un CSV");

        const fd = new FormData();
        fd.append("file", modalState.file);

        await fetch(`${window.API_BASE_URL}${endpoints[modalState.tipo]}/bulk-upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fd
        });

      } else {
        await fetch(`${window.API_BASE_URL}${endpoints[modalState.tipo]}`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: document.getElementById("catalogNombreInput").value
          })
        });
      }

      closeModal();
      cargarTodo();

    } catch (e) {
      console.error(e);
      alert("Error guardando variable");
    }
  };

  function cargarTodo() {
    cargar(`${window.API_BASE_URL}/admin/catalogos/marcas`, "marcasBody");
    cargar(`${window.API_BASE_URL}/admin/catalogos/disenos`, "disenosBody");
    cargar(`${window.API_BASE_URL}/admin/catalogos/dimensiones`, "dimensionesBody");
  }

  async function cargar(endpoint, tbodyId) {
    const res = await fetch(endpoint,{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    document.getElementById(tbodyId).innerHTML =
      data.map(i => `<tr><td>${i.nombre}</td></tr>`).join("");
  }

  cargarTodo();
}
