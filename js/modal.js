
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

  if (modalState.entity === "reportes") {
    await window.guardarReporte();
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
window.openModal = ({ entity, tipo = null, bulk = false }) => {
  // 1. PRIMERO LIMPIAMOS TODO
  resetModalForm();

  console.log("OPEN MODAL:", { entity, tipo, bulk });
  modalState = { entity, tipo, bulk, file: null };

  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle   = document.getElementById("modalTitle");

  // Referencias a secciones
  const manualClientSection   = document.getElementById("manualClientSection");
  const manualVehiculoSection = document.getElementById("manualVehiculoSection");
  const manualLlantaSection   = document.getElementById("manualLlantaSection");
  const catalogoSimpleFields  = document.getElementById("catalogoSimpleFields");
  const fileSection           = document.getElementById("fileSection");
  const manualReporteSection  = document.getElementById("manualReporteSection");

  // ==========================================
  // CASO 1: IMPORTACIÓN MASIVA (CSV)
  // Funciona para tus botones: "📁 CSV" (Vehículos y Llantas)
  // ==========================================
  if (bulk) {
    if (fileSection) fileSection.style.display = "block";
    
    // El título se adaptará: "Importar vehiculos" o "Importar llantas"
    modalTitle.innerText = `Importar ${tipo ?? entity}`;
    modalOverlay.style.display = "flex";
    return; // Terminamos aquí si es bulk
  }

  // ==========================================
  // CASO 2: FORMULARIOS MANUALES
  // ==========================================

  // ---- CLIENTES ----
  if (entity === "clientes") {
    manualClientSection.style.display = "grid";
    modalTitle.innerText = "Nuevo Cliente";
  }

  // ---- VEHÍCULOS (Botón: "+ Vehículo") ----
  // Tu lógica original intacta:
  if (entity === "clientes_variables" && tipo === "vehiculos") {
    manualVehiculoSection.style.display = "grid";
    modalTitle.innerText = "Nuevo Vehículo";
    // Inicializar autocompletado si existe la función
    if (typeof initVehiculoAutocomplete === 'function') initVehiculoAutocomplete();
  }

  // ---- LLANTAS (Botón: "+ Llanta") ----
  // Tu lógica original intacta:
  if (entity === "clientes_variables" && tipo === "llantas") {
    manualLlantaSection.style.display = "grid";
    modalTitle.innerText = "Nueva Llanta";
    // Inicializar autocompletado si existe la función
    if (typeof initLlantaAutocomplete === 'function') initLlantaAutocomplete();
  }

  // ---- VARIABLES GENERALES (Marcas, Diseños, etc.) ----
  if (entity === "variables") {
    catalogoSimpleFields.style.display = "block";
    modalTitle.innerText = `Nueva ${tipo}`; // Simplificado, o usa tu switch original

    // Actualizar el label del input genérico
    const label = document.getElementById("catalogLabel");
    if (label) {
      label.innerText = (tipo === "marcas") ? "Marca" : 
                        (tipo === "disenos") ? "Diseño" : "Nombre";
    }
  }

  // ---- REPORTES ----
  if (entity === "reportes") {
    modalTitle.innerText = "Cargar Nuevo Reporte (Kardex)";
    manualReporteSection.style.display = "grid";
    fileSection.style.display = "block"; 
    cargarClientesDatalist(); 
  }

  // Mostrar el modal
  modalOverlay.style.display = "flex";
};

// Función auxiliar interna para reportes
async function cargarClientesDatalist() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${window.API_BASE_URL}/admin/clientes/`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
        const clientes = await res.json();
        const list = document.getElementById("reporteClientesList");
        if(list) list.innerHTML = clientes.map(c => `<option data-id="${c.id}" value="${c.nombre}">`).join("");
    }
  } catch(e) { console.error(e); }
}

// ================= closeModal =================
window.closeModal = () => {
  // Solo llamamos al reset y cerramos
  resetModalForm();
  document.getElementById("modalOverlay").style.display = "none";
};

// Función auxiliar para limpiar el modal completamente antes de usarlo
const resetModalForm = () => {
  const modal = document.getElementById("modalOverlay");
  
  // 1. Limpiar todos los inputs
  modal.querySelectorAll("input").forEach(input => input.value = "");
  
  // 2. Limpiar textos informativos
  const fileName = document.getElementById("fileName");
  const deleteWarning = document.getElementById("deleteWarning");
  if (fileName) fileName.innerText = "";
  if (deleteWarning) deleteWarning.innerText = "";

  // 3. Ocultar botones de edición/eliminar
  const editActions = document.getElementById("editActions");
  const editClientActions = document.getElementById("editClientActions");
  if (editActions) editActions.style.display = "none";
  if (editClientActions) editClientActions.style.display = "none";

  // 4. Ocultar TODAS las secciones (para luego mostrar solo la correcta)
  [
    "manualClientSection", 
    "manualVehiculoSection", 
    "manualLlantaSection", 
    "catalogoSimpleFields", 
    "fileSection",
    "manualReporteSection"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // 5. Resetear estado
  modalState = { entity: null, tipo: null, bulk: false, file: null };
};


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
  const base = `${window.API_BASE_URL}/admin/catalogos`;

  cargarAutocomplete(`${base}/marcas`, "marcasList", document.getElementById("marcaInput"));
  cargarAutocomplete(`${base}/disenos`, "disenosList", document.getElementById("disenoInput"));
  cargarAutocomplete(`${base}/dimensiones`, "dimensionesList", document.getElementById("dimensionInput"));
  cargarAutocomplete(`${base}/tipo_llanta`, "tipoLlantaList", document.getElementById("llantaTipoInput"));
}

// INIT AUTOCOMPLETE VEHÍCULO
function initVehiculoAutocomplete() {
  const base = `${window.API_BASE_URL}/admin/catalogos`;

  cargarAutocomplete(`${base}/tipos_vehiculos`, "vehiculoTipoList", document.getElementById("vehiculoTipoInput"));
  cargarAutocomplete(`${base}/marcas_vehiculos`, "vehiculoMarcaList", document.getElementById("vehiculoMarcaInput"));
}

function getIdFromDatalist(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return null;

  const option = [...list.options].find(o => o.value === input.value);
  return option?.dataset.id ?? null;
}
