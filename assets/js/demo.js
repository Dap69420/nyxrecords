const CONFIG = {
  SPOTIFY_CLIENT_ID: "6e558a4157af434887d2f4277651f8b4",
  REDIRECT_URI: new URL(".", window.location.href).href,
  SCOPES: "user-read-private user-read-email user-top-read",
};

const state = {
  profile: null,
  accessToken: "",
  tokenExpiresAt: 0,
};

document.getElementById("year").textContent = new Date().getFullYear();

const dot = document.getElementById("cursorDot");
window.addEventListener("mousemove", event => {
  dot.style.left = event.clientX + "px";
  dot.style.top = event.clientY + "px";
});

function generateRandomString(length){
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  let output = "";
  values.forEach(value => output += possible[value % possible.length]);
  return output;
}

async function sha256(plain){
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
}

function base64UrlEncode(buffer){
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function generateCodeChallenge(verifier){
  return base64UrlEncode(await sha256(verifier));
}

const connectView = document.getElementById("connectView");
const dashboardView = document.getElementById("dashboardView");
const connectNote = document.getElementById("connectNote");
const portalTitle = document.getElementById("portalTitle");
const portalSub = document.getElementById("portalSub");
const headerUserChip = document.getElementById("headerUserChip");
const headerAvatar = document.getElementById("headerAvatar");
const headerName = document.getElementById("headerName");

function renderHeaderChip(profile){
  const img = profile.images && profile.images.length ? profile.images[0].url : null;
  headerAvatar.innerHTML = img
    ? `<img src="${img}" alt="${profile.display_name || "Spotify avatar"}">`
    : (profile.display_name || "?").slice(0, 2).toUpperCase();
  headerName.textContent = profile.display_name || "Unnamed Artist";
  headerUserChip.style.display = "flex";
}

function hideHeaderChip(){
  headerUserChip.style.display = "none";
}

function showConnect(message){
  dashboardView.style.display = "none";
  connectView.style.display = "flex";
  portalTitle.textContent = "SUBMIT A DEMO";
  portalSub.textContent = "Connect your Spotify account to verify who you are, then send us your track.";
  connectNote.textContent = message || "";
  connectNote.classList.toggle("error", !!message);
  hideHeaderChip();
}

function renderUserCard(profile){
  const avatarEl = document.getElementById("userAvatar");
  const img = profile.images && profile.images.length ? profile.images[0].url : null;
  avatarEl.innerHTML = img
    ? `<img src="${img}" alt="${profile.display_name || "Spotify avatar"}">`
    : (profile.display_name || "?").slice(0, 2).toUpperCase();
  document.getElementById("userName").textContent = profile.display_name || "Unnamed Artist";
  document.getElementById("spotifyProfileLink").href = (profile.external_urls && profile.external_urls.spotify) || "https://open.spotify.com";
  const emailField = document.getElementById("contactEmail");
  if (profile.email && !emailField.value) emailField.value = profile.email;
  const artistField = document.getElementById("artistName");
  if (!artistField.value) artistField.value = profile.display_name || "";
}

function updateSubmitCounter(){
  const count = Number(sessionStorage.getItem("nyx_demo_count") || 0);
  const counterEl = document.getElementById("submitCounter");
  if (count > 0){
    counterEl.textContent = `You've sent ${count} demo${count > 1 ? "s" : ""} this session — nice.`;
    counterEl.style.display = "block";
  }else{
    counterEl.style.display = "none";
  }
}

function showDashboard(profile){
  state.profile = profile;
  connectView.style.display = "none";
  dashboardView.style.display = "block";
  portalTitle.textContent = `WELCOME, ${(profile.display_name || "ARTIST").toUpperCase()}`;
  portalSub.textContent = "Pick an option below, or scroll down to send us your track.";
  renderUserCard(profile);
  renderHeaderChip(profile);
  updateSubmitCounter();
}

async function exchangeCodeForToken(code, verifier){
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: CONFIG.REDIRECT_URI,
    client_id: CONFIG.SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("token exchange failed");
  return res.json();
}

async function fetchProfile(accessToken){
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("profile fetch failed");
  return res.json();
}

async function fetchTopTrack(accessToken){
  const card = document.getElementById("topTrackCard");
  const body = document.getElementById("topTrackBody");
  const art = document.getElementById("topTrackArt");

  if (!accessToken){
    card.style.display = "none";
    return;
  }

  try{
    const res = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("top track fetch failed");

    const data = await res.json();
    const track = data.items && data.items[0];

    if (!track){
      art.style.display = "none";
      body.innerHTML = "Not enough listening history yet — go play something!";
      card.style.display = "flex";
      return;
    }

    const artistNames = track.artists.map(artist => artist.name).join(", ");
    body.innerHTML = `<strong>${track.name}</strong> by ${artistNames}`;

    const images = track.album && track.album.images;
    const thumb = images && images.length ? images[images.length - 1].url : null;
    if (thumb){
      art.style.display = "block";
      art.innerHTML = `<img src="${thumb}" alt="">`;
    }else{
      art.style.display = "none";
    }

    card.style.display = "flex";
  }catch(error){
    card.style.display = "none";
  }
}

async function handleRedirectCallback(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const stateParam = params.get("state");
  const error = params.get("error");

  if (error){
    window.history.replaceState({}, document.title, CONFIG.REDIRECT_URI);
    showConnect("Spotify login was cancelled. Please try again.");
    return true;
  }

  if (!code) return false;

  const storedState = sessionStorage.getItem("nyx_state");
  const verifier = sessionStorage.getItem("nyx_verifier");
  window.history.replaceState({}, document.title, CONFIG.REDIRECT_URI);

  if (!verifier || stateParam !== storedState){
    showConnect("Your login session expired. Please try again.");
    return true;
  }

  try{
    const tokenData = await exchangeCodeForToken(code, verifier);
    state.accessToken = tokenData.access_token;
    state.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;
    sessionStorage.setItem("nyx_access_token", tokenData.access_token);
    sessionStorage.setItem("nyx_token_expires", String(state.tokenExpiresAt));
    sessionStorage.removeItem("nyx_verifier");
    sessionStorage.removeItem("nyx_state");

    const profile = await fetchProfile(tokenData.access_token);
    showDashboard(profile);
    fetchTopTrack(tokenData.access_token);
  }catch(error){
    showConnect("Spotify said no — this account may not be on the approved list yet.");
  }

  return true;
}

async function loadExistingSession(){
  const token = sessionStorage.getItem("nyx_access_token");
  const expires = Number(sessionStorage.getItem("nyx_token_expires") || 0);

  if (!token || expires <= Date.now()){
    sessionStorage.removeItem("nyx_access_token");
    sessionStorage.removeItem("nyx_token_expires");
    return false;
  }

  try{
    state.accessToken = token;
    state.tokenExpiresAt = expires;
    const profile = await fetchProfile(token);
    showDashboard(profile);
    fetchTopTrack(token);
    return true;
  }catch(error){
    sessionStorage.removeItem("nyx_access_token");
    sessionStorage.removeItem("nyx_token_expires");
    return false;
  }
}

document.getElementById("connectBtn").addEventListener("click", async () => {
  if (CONFIG.SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID"){
    showConnect("This portal isn't configured yet — add a Spotify Client ID in the demo page.");
    return;
  }

  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  const stateValue = generateRandomString(16);

  sessionStorage.setItem("nyx_verifier", verifier);
  sessionStorage.setItem("nyx_state", stateValue);

  const params = new URLSearchParams({
    client_id: CONFIG.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: CONFIG.REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: CONFIG.SCOPES,
    state: stateValue,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  state.profile = null;
  state.accessToken = "";
  state.tokenExpiresAt = 0;
  sessionStorage.removeItem("nyx_access_token");
  sessionStorage.removeItem("nyx_token_expires");
  sessionStorage.removeItem("nyx_verifier");
  sessionStorage.removeItem("nyx_state");
  showConnect();
});

async function init(){
  const handled = await handleRedirectCallback();
  if (handled) return;

  const restored = await loadExistingSession();
  if (!restored) showConnect();
}

init();

const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyLinkDesc = document.getElementById("copyLinkDesc");
copyLinkBtn.addEventListener("click", async () => {
  const shareUrl = new URL(".", window.location.href).href;
  try{
    await navigator.clipboard.writeText(shareUrl);
    copyLinkDesc.textContent = "Copied to clipboard!";
  }catch(error){
    copyLinkDesc.textContent = shareUrl;
  }
  setTimeout(() => {
    copyLinkDesc.textContent = "Copy the link to send to a friend";
  }, 2500);
});

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

demoForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (document.getElementById("hp").value) return;

  if (!state.profile){
    formStatus.textContent = "Connect Spotify first before sending a demo.";
    formStatus.className = "form-status error";
    return;
  }

  const songTitle = document.getElementById("songTitle").value.trim();
  const artistName = document.getElementById("artistName").value.trim();
  const genre = document.getElementById("genre").value;
  const trackLink = document.getElementById("trackLink").value.trim();
  const contactEmail = document.getElementById("contactEmail").value.trim();
  const notes = document.getElementById("notes").value.trim();

  const payload = {
    songTitle,
    artistName,
    genre,
    trackLink,
    contactEmail,
    notes,
    spotifyDisplayName: state.profile.display_name || "",
    spotifyProfileUrl: (state.profile.external_urls && state.profile.external_urls.spotify) || "",
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