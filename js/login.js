
if (localStorage.getItem("token")) {
  window.location.href = "/index.html";
}

document.getElementById("btnLogin").onclick = async () => {
  const username = user.value;
  const password = pass.value;




  const res = await fetch(`${window.API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) return alert("Login inválido");

  const data = await res.json();
  localStorage.setItem("token", data.access_token);

  window.location.href = "/index.html";


};
