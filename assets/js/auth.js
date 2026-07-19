import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

let supabase;

// UI Elements
const loginNavBtn = document.getElementById('loginNavBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');

const authOverlay = document.getElementById('authOverlay');
const authClose = document.getElementById('authClose');
const btnDiscordLogin = document.getElementById('btnDiscordLogin');

// --- Initialization Logic ---
async function initAuth() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.warn("Supabase configuration is missing from environment variables.");
      return;
    }

    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    
    // Auth State Observer
    supabase.auth.onAuthStateChange((event, session) => {
      updateUI(session);
    });

    // Initial session check
    const { data: { session } } = await supabase.auth.getSession();
    updateUI(session);
  } catch (error) {
    console.error("Failed to initialize authentication:", error);
  }
}

function updateUI(session) {
  if (session && session.user) {
    const user = session.user;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
    const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    
    loginNavBtn.style.display = 'none';
    userMenu.style.display = 'flex';
    userAvatar.src = avatarUrl;
    userAvatar.title = name;
    
    // Close modal if it's open
    if (authOverlay.style.display === 'flex') {
        authClose.click();
    }
  } else {
    // User is signed out.
    loginNavBtn.style.display = 'block';
    userMenu.style.display = 'none';
    userAvatar.src = '';
  }
}

// Start initialization
initAuth();


// --- UI Event Listeners ---

// Open Modal
loginNavBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!supabase) {
    alert("Authentication is not configured yet.");
    return;
  }
  authOverlay.style.display = 'flex';
});

// Close Modal
authClose.addEventListener('click', () => {
  authOverlay.classList.add('closing');
  setTimeout(() => {
    authOverlay.style.display = 'none';
    authOverlay.classList.remove('closing');
  }, 400); // Matches CSS transition duration
});

// Close on outside click
authOverlay.addEventListener('click', (e) => {
  if (e.target === authOverlay) {
    authClose.click();
  }
});

// --- Auth Login Logic ---

// Discord Login
btnDiscordLogin.addEventListener('click', async () => {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });
    if (error) throw error;
  } catch (error) {
    console.error("Discord Auth Error:", error.message);
    alert("Error logging in with Discord. See console for details.");
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Logout Error:", error.message);
  }
});
