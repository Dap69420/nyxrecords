const ARTISTS = [
  { name: "Dynamiqs.", role: "Multistyle producer.", tag: "idk", img: "/assets/artists/dynamics.png", link: "https://open.spotify.com/artist/REPLACE_ME" },
  { name: "Tsvki", role: "Funk producer.", tag: "idk", img: "/assets/artists/tsvki.png", link: "https://open.spotify.com/artist/REPLACE_ME" },
  { name: "Artist Three", role: "something cool", tag: "PHONK" },
  { name: "Artist Four", role: "something cool", tag: "PHONK" },
  { name: "Artist Five", role: "something cool", tag: "PHONK" },
];

const STAFF = [
  { name: "VYXN", role: "Founder", img: "/assets/staff/VYXN.png", link: "https://discord.com/users/1237057818763329640" },
  { name: "Omni", role: "Co-Founder", img: "/assets/staff/omni.png", special: true, link: "https://discord.com/users/1187794980119531603" },
  { name: "Vlxnor", role: "Co-Foudner", img: "/assets/staff/vlxnor.png", link: "https://discord.com/users/1453851008957677588" },
  { name: "Dap", role: "Admin", img: "/assets/staff/dap.png", link: "https://discord.com/users/1438540460011552882" },
  { name: "Staff Name", role: "A&R" },
];

const TRACKS = [
  { title: "Santa do fe 2", artist: "NYX Records", src: "/assets/santa-do-fe-2.mp3" },
  { title: "ILLUMINADA", artist: "NYX Records", src: "" },
  { title: "FUNK CRAZY", artist: "NYX Records", src: "" },
];

const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>`;

function initials(name){
  return name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
}

function buildGrid(containerId, items, withTag, linkLabel){
  const el = document.getElementById(containerId);
  el.innerHTML = items.map((item, index) => {
    const hasLink = !!item.link;
    const tagName = hasLink ? "a" : "div";
    const linkAttrs = hasLink ? ` href="${item.link}" target="_blank" rel="noopener noreferrer"` : "";

    return `
      <${tagName} class="card reveal"${linkAttrs}>
        <div class="card-index display">${String(index + 1).padStart(2, '0')}</div>
        ${item.img
          ? `<div class="avatar avatar-photo${item.special ? ' avatar-special' : ''}"><img src="${item.img}" alt="${item.name}" loading="lazy"></div>`
          : `<div class="avatar display">${initials(item.name)}</div>`
        }
        <div class="card-name display">${item.name}</div>
        <div class="card-role">${item.role}</div>
        ${withTag && item.tag ? `<div class="card-tag">${item.tag}</div>` : ``}
        ${hasLink ? `<div class="card-link-label">${linkLabel}${LINK_ICON}</div>` : ``}
      </${tagName}>
    `;
  }).join("");
}

function buildMarquee(){
  const strip = document.getElementById("marqueeStrip");
  const track = document.getElementById("marqueeTrack");
  const group = `<span>NYX RECORDS</span><span class="hollow">SIMPLE</span><span>NYX RECORDS</span><span class="hollow">EFFICIENT</span>`;
  track.style.animation = "none";
  track.innerHTML = group.repeat(10);
  void strip.offsetWidth;
  track.style.animation = "scrollLeft 20s linear infinite";
}

function setupCursor(){
  const dot = document.getElementById("cursorDot");
  const glow = document.getElementById("glow");

  window.addEventListener("mousemove", event => {
    const { clientX, clientY } = event;
    dot.style.left = clientX + "px";
    dot.style.top = clientY + "px";
    if (glow){
      glow.style.transform = `translate(${clientX - window.innerWidth / 2}px, ${clientY - window.innerHeight / 2}px) translate(-50%,-50%)`;
    }
  });
}

function setupHeader(){
  const header = document.getElementById("siteHeader");
  const toTop = document.getElementById("toTop");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    toTop.classList.toggle("show", y > 700);
  });

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function setupNavBubble(){
  const navBubble = document.getElementById("navBubble");
  const navLinksEl = document.querySelectorAll("nav.links a[data-section]");

  function moveBubbleTo(link){
    if (!link){
      navBubble.classList.remove("show");
      navLinksEl.forEach(linkEl => linkEl.classList.remove("active"));
      return;
    }

    navLinksEl.forEach(linkEl => linkEl.classList.remove("active"));
    link.classList.add("active");
    navBubble.style.width = link.offsetWidth + "px";
    navBubble.style.transform = `translate(${link.offsetLeft}px, -50%)`;
    navBubble.classList.add("show");
  }

  const sectionIds = ["about", "artists", "staff"];
  const sectionEls = sectionIds.map(id => document.getElementById(id));
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    if (!visible.length) return;

    const closest = visible.reduce((a, b) => {
      const aDist = Math.abs(a.boundingClientRect.top);
      const bDist = Math.abs(b.boundingClientRect.top);
      return aDist < bDist ? a : b;
    });

    const link = document.querySelector(`nav.links a[data-section="${closest.target.id}"]`);
    moveBubbleTo(link);
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sectionEls.forEach(section => { if (section) navObserver.observe(section); });

  window.addEventListener("resize", () => {
    const activeLink = document.querySelector("nav.links a.active");
    if (activeLink) moveBubbleTo(activeLink);
  });
}

function setupReveal(){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting){
        setTimeout(() => entry.target.classList.add("in"), (index % 6) * 70);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
}

function setupPlayer(){
  const audio = document.getElementById("audio");
  const player = document.getElementById("player");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const trackTitle = document.getElementById("trackTitle");
  const trackArtist = document.getElementById("trackArtist");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");
  const ICON_PLAY = `<path d="M8 5v14l11-7z"/>`;
  const ICON_PAUSE = `<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>`;

  let current = 0;
  let isPlaying = false;

  function findPlayableIndex(startIndex, direction){
    for (let offset = 0; offset < TRACKS.length; offset += 1){
      const candidate = (startIndex + offset * direction + TRACKS.length) % TRACKS.length;
      if (TRACKS[candidate].src) return candidate;
    }
    return -1;
  }

  function loadTrack(index, direction = 1){
    const playableIndex = findPlayableIndex(index, direction);
    if (playableIndex === -1) return false;

    current = playableIndex;
    const track = TRACKS[current];
    trackTitle.innerHTML = `<span>${track.title || "Untitled"} • ${track.artist}</span>`;
    trackArtist.textContent = track.artist;
    audio.src = track.src;
    progressFill.style.width = "0%";
    return true;
  }

  function setPlaying(state){
    isPlaying = state;
    player.classList.toggle("playing", state);
    playIcon.innerHTML = state ? ICON_PAUSE : ICON_PLAY;
    playBtn.setAttribute("aria-label", state ? "Pause" : "Play");
  }

  async function playCurrent(){
    if (!TRACKS[current].src){
      trackTitle.querySelector("span").textContent = "No playable track available";
      setPlaying(false);
      return;
    }

    try{
      await audio.play();
      setPlaying(true);
    }catch(error){
      setPlaying(false);
    }
  }

  window.__nyxPlayCurrent = playCurrent;

  playBtn.addEventListener("click", () => {
    if (isPlaying){
      audio.pause();
      setPlaying(false);
      return;
    }
    playCurrent();
  });

  prevBtn.addEventListener("click", () => {
    if (loadTrack(current - 1, -1) && isPlaying) playCurrent();
  });

  nextBtn.addEventListener("click", () => {
    if (loadTrack(current + 1, 1) && isPlaying) playCurrent();
  });

  audio.addEventListener("ended", () => {
    if (loadTrack(current + 1, 1)) playCurrent();
  });

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) progressFill.style.width = (audio.currentTime / audio.duration * 100) + "%";
  });

  progressBar.addEventListener("click", event => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  loadTrack(0, 1);
}

function setupDemoPopup(){
  const demoOverlay = document.getElementById("demoOverlay");
  const demoClose = document.getElementById("demoClose");
  const demoSkip = document.getElementById("demoSkip");
  const audio = document.getElementById("audio");

  document.body.style.overflow = "hidden";

  function closeDemo(){
    demoOverlay.classList.add("closing");
    document.body.style.overflow = "";
    if (typeof window.__nyxPlayCurrent === "function") window.__nyxPlayCurrent();
    setTimeout(() => { demoOverlay.style.display = "none"; }, 500);
  }

  demoClose.addEventListener("click", closeDemo);
  demoSkip.addEventListener("click", closeDemo);
}

function setupHomePage(){
  document.body.classList.add("page-ready");
  document.getElementById("year").textContent = new Date().getFullYear();
  buildGrid("artistGrid", ARTISTS, true, "Spotify");
  buildGrid("staffGrid", STAFF, false, "Discord");
  buildMarquee();
  setupCursor();
  setupHeader();
  setupNavBubble();
  setupReveal();
  setupPlayer();

  let marqueeResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(marqueeResizeTimer);
    marqueeResizeTimer = setTimeout(buildMarquee, 250);
  });

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

setupHomePage();