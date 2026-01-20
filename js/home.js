function initHome() {
  console.log("✔ initHome");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No autenticado");
    return;
  }

  document.querySelectorAll(".home-card").forEach(card => {
    card.onclick = () => {
      const route = card.dataset.route;
      if (route) window.location.hash = route;
    };
  });
}
