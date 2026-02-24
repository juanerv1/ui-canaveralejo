const contentArea = document.getElementById("content-area");
const viewTitle = document.getElementById("view-title");

function isLogged() {
  return !!localStorage.getItem("token");
}

function redirectToLogin() {
  window.location.href = "views/login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

async function loadUserSidebar() {
  const user = await getCurrentUser();
  if (!user) return;

  const initials = user.nombre
    .split(" ")
    .map(x => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  document.querySelector(".sidebar-footer").innerHTML = `
    <div class="user-info">
      <div class="avatar">${initials}</div>
      <div class="details">
        <p class="name">${user.nombre}</p>
        <p class="role">${user.rol}</p>
      </div>
    </div>
  `;
}


logOutBtn.onclick = () => {
  logout();
  redirectToLogin();
};

async function loadPage(page) {
  try {
    // 🔐 protección
    if (!isLogged()) {
      redirectToLogin();
      return;
    }

    const res = await fetch(`views/${page}.html`);
    if (!res.ok) throw new Error("Vista no encontrada");

    contentArea.innerHTML = await res.text();

    viewTitle.innerText =
      page === "cliente"
        ? "Detalles Cliente"
        : page.charAt(0).toUpperCase() + page.slice(1);

    if (page === "home" && window.initHome) initHome();
    if (page === "clientes" && window.initClientes) initClientes();
    if (page === "variables" && window.initVariables) initVariables();
    if (page === "cliente" && window.initClienteScreen) initClienteScreen();
    if (page === "reportes" && window.initReportes) initReportes();

  } catch (err) {
    console.error(err);
    contentArea.innerHTML = "<p>Error cargando vista</p>";
  }
}

function handleHashRoute() {
  // 🔐 si no está logeado → login
  if (!isLogged()) {
    redirectToLogin();
    return;
  }

  let hash = window.location.hash.replace("#/", "");

  if (!hash) {
    loadPage("home");
    return;
  }

  const [page] = hash.split("?");
  loadPage(page);
}

// Navegación
document.addEventListener("click", e => {
  const link = e.target.closest(".nav-link");
  if (!link) return;

  // 🔐 bloquear si no hay token
  if (!isLogged()) {
    redirectToLogin();
    return;
  }

  e.preventDefault();
  window.location.hash = `#/${link.dataset.page}`;
});


// Variable para evitar doble ejecución
let isInitialLoad = true;

document.addEventListener("DOMContentLoaded", async () => {
    if (!isLogged()) {
        redirectToLogin();
        return;
    }

    await loadUserSidebar();

    // Si no hay hash, ponemos el home
    if (!window.location.hash || window.location.hash === "#/") {
        window.location.hash = "#/home";
    } else {
        // Si YA hay un hash (ej: refrescaste en la ficha de cliente)
        // ejecutamos la ruta UNA SOLA VEZ
        handleHashRoute();
    }
    
    // Bajamos la bandera después de un pequeño delay para ignorar rebotes de eventos
    setTimeout(() => { isInitialLoad = false; }, 100);
});

// Modifica tu listener de hashchange para que respete el semáforo
window.addEventListener("hashchange", () => {
    if (isInitialLoad) return; 
    handleHashRoute();
});