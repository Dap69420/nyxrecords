document.body.classList.add("page-ready");
document.getElementById("year").textContent = new Date().getFullYear();

const cursorDot = document.getElementById("cursorDot");
const glow = document.getElementById("glow");

window.addEventListener("mousemove", event => {
  const { clientX, clientY } = event;
  cursorDot.style.left = clientX + "px";
  cursorDot.style.top = clientY + "px";
  if (glow){
    glow.style.transform = `translate(${clientX - window.innerWidth / 2}px, ${clientY - window.innerHeight / 2}px) translate(-50%, -50%)`;
  }
});

function wirePageTransitions(){
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank") return;
      const current = window.location.pathname.replace(/\/?$/, "/");
      const next = url.pathname.replace(/\/?$/, "/");
      if (current === next) return;
      event.preventDefault();
      document.body.classList.remove("page-ready");
      document.body.classList.add("page-leaving");
      setTimeout(() => { window.location.href = link.href; }, 160);
    });
  });
}

wirePageTransitions();

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");
const submitCounter = document.getElementById("submitCounter");

function updateSubmitCounter(){
  const count = Number(sessionStorage.getItem("nyx_demo_count") || 0);
  if (count > 0){
    submitCounter.textContent = `You've sent ${count} demo${count > 1 ? "s" : ""} this session — nice.`;
    submitCounter.style.display = "block";
  }else{
    submitCounter.style.display = "none";
  }
}

updateSubmitCounter();

demoForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (document.getElementById("hp").value) return;

  const payload = {
    songTitle: document.getElementById("songTitle").value.trim(),
    artistName: document.getElementById("artistName").value.trim(),
    genre: document.getElementById("genre").value,
    trackLink: document.getElementById("trackLink").value.trim(),
    contactEmail: document.getElementById("contactEmail").value.trim(),
    notes: document.getElementById("notes").value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try{
    const res = await fetch("/api/submit-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.ok) throw new Error(result.error || `request failed with ${res.status}`);

    const count = Number(sessionStorage.getItem("nyx_demo_count") || 0) + 1;
    sessionStorage.setItem("nyx_demo_count", String(count));
    updateSubmitCounter();
    demoForm.reset();
    formStatus.textContent = "Demo sent successfully.";
    formStatus.className = "form-status success";
  }catch(error){
    formStatus.textContent = error.message || "We couldn't send your demo right now.";
    formStatus.className = "form-status error";
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Demo";
  }
});