import API_BASE_URL from "./config";

// ===============================
// ESTADO GLOBAL DEL MODAL
// ===============================
window.modalState = {
  entity: null,
  tipo: null,       // vehiculos | llantas
  bulk: false,
  file: null
};

// ===============================
// CACHE DOM GLOBAL
// ===============================
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");

const manualClientSection = document.getElementById("manualClientSection");
const manualCatalogSection = document.getElementById("manualCatalogSection");
const fileSection = document.getElementById("fileSection");

const guardarBtn = document.getElementById("guardarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");

// ===============================
// BOTONES MODAL
// ===============================
guardarBtn.onclick = async () => {
  console.log("MODAL STATE:", modalState);

  if (modalState.entity === "clientes" && window.guardarClientes) {
    await window.guardarClientes();
  }

  if (modalState.entity === "variables" && window.guardarVariable) {
    await window.guardarVariable();
  }

  if (modalState.entity === "clientes_variables" && window.guardarVariableCliente) {
    await window.guardarVariableCliente();
  }
};


cancelarBtn.onclick = () => closeModal();

// ===============================
// FILE HANDLING
// ===============================
fileInput.onchange = e => {
  modalState.file = e.target.files[0];
  fileName.innerText = modalState.file?.name || "";
};

dropZone.onclick = () => fileInput.click();
dropZone.addEventListener("dragover", e => e.preventDefault());
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  modalState.file = e.dataTransfer.files[0];
  fileName.innerText = modalState.file?.name || "";
});

// ===============================
// MODAL CONTROL
// ===============================
// modal.js — FIX COMPLETO

// ================= openModal =================

// ================= openModal =================
window.openModal = ({ entity, tipo = null, bulk = false }) => {
  console.log("OPEN MODAL:", { entity, tipo, bulk });

  modalState = { entity, tipo, bulk, file: null };

  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle   = document.getElementById("modalTitle");

  const manualClientSection   = document.getElementById("manualClientSection");
  const manualVehiculoSection = document.getElementById("manualVehiculoSection");
  const manualLlantaSection   = document.getElementById("manualLlantaSection");
  const catalogoSimpleFields  = document.getElementById("catalogoSimpleFields");
  const fileSection           = document.getElementById("fileSection");

  // ---- ocultar todo ----
  manualClientSection   && (manualClientSection.style.display = "none");
  manualVehiculoSection && (manualVehiculoSection.style.display = "none");
  manualLlantaSection   && (manualLlantaSection.style.display = "none");
  catalogoSimpleFields  && (catalogoSimpleFields.style.display = "none");
  fileSection           && (fileSection.style.display = "none");

  // ---- BULK ----
  if (bulk) {
    fileSection && (fileSection.style.display = "block");
    modalTitle.innerText = `Importar ${tipo ?? entity}`;
    modalOverlay.style.display = "flex";
    return;
  }

  // ---- CLIENTES ----
  if (entity === "clientes") {
    manualClientSection.style.display = "grid";
    modalTitle.innerText = "Nuevo Cliente";
  }

  // ---- CLIENTE → VEHÍCULOS ----
  if (entity === "clientes_variables" && tipo === "vehiculos") {
    manualVehiculoSection.style.display = "grid";
    modalTitle.innerText = "Nuevo Vehículo";
  }

  // ---- CLIENTE → LLANTAS ----
  if (entity === "clientes_variables" && tipo === "llantas") {
    manualLlantaSection.style.display = "grid";
    modalTitle.innerText = "Nueva Llanta";
    initLlantaAutocomplete && initLlantaAutocomplete();
  }

  // ---- VARIABLES GENERALES ----
  if (entity === "variables") {
    catalogoSimpleFields.style.display = "block";

    modalTitle.innerText =
      tipo === "marca"     ? "Nueva Marca" :
      tipo === "diseno"    ? "Nuevo Diseño" :
      tipo === "dimension" ? "Nueva Dimensión" :
      "Nueva Variable";

    const label = document.getElementById("catalogLabel");
    if (label) {
      label.innerText =
        tipo === "marca"     ? "Marca" :
        tipo === "diseno"    ? "Diseño" :
        "Dimensión";
    }
  }

  modalOverlay.style.display = "flex";
};



// ================= closeModal =================
window.closeModal = () => {
  const modalOverlay = document.getElementById("modalOverlay");

  const fileInput = document.getElementById("fileInput");
  const fileName  = document.getElementById("fileName");

  [
    "clienteNombreInput",
    "clienteNitInput",
    "vehiculoCodigoInput",
    "vehiculoLlantasInput",
    "llantaCodigoInput",
    "marcaInput",
    "disenoInput",
    "dimensionInput",
    "catalogNombreInput",
    "input-date"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  if (fileInput) fileInput.value = "";
  if (fileName) fileName.innerText = "";

  modalState.file = null;
  modalOverlay.style.display = "none";
};


// ===============================
// CLICK GLOBAL
// ===============================
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-entity]");
  if (!btn) return;

  openModal({
    entity: btn.dataset.entity,
    tipo: btn.dataset.tipo ?? null,
    bulk: btn.dataset.bulk === "true"
  });
});

// AUTOCOMPLETE (CATÁLOGOS) — FIX con data-id
async function cargarAutocomplete(url, datalistId, campo) {

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  const res = await fetch(url, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
});
  const data = await res.json();

  const list = document.getElementById(datalistId);
  list.innerHTML = data
    .map(x => `<option value="${x.nombre}" data-id="${x.id}"></option>`)
    .join("");

  // cache para lookup nombre → id
  campo.dataset.items = JSON.stringify(data);
}

// INIT AUTOCOMPLETE LLANTA
function initLlantaAutocomplete() {
  cargarAutocomplete(
    `${API_BASE_URL}/admin/catalogos/marcas`,
    "marcasList",
    document.getElementById("marcaInput")
  );

  cargarAutocomplete(
    `${API_BASE_URL}/admin/catalogos/disenos`,
    "disenosList",
    document.getElementById("disenoInput")
  );

  cargarAutocomplete(
    `${API_BASE_URL}/admin/catalogos/dimensiones`,
    "dimensionesList",
    document.getElementById("dimensionInput")
  );
}


function getIdFromDatalist(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return null;

  const option = [...list.options].find(o => o.value === input.value);
  return option?.dataset.id ?? null;
}
