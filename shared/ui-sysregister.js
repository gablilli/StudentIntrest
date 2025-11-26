// UI functions matching sysregister-reborn exactly
// This file replaces ui-bootstrap.js with the exact sysregister-reborn style

// ==================== Session Management ====================

const SESSION_KEY = "cvv_session";
const DATA_KEY = "cvv_data";

function saveSession(userId, token, studentId, userData = {}) {
  const session = {
    userId,
    token,
    studentId,
    timestamp: Date.now(),
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    expire: userData.expire || "",
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also save username/password for auto-login like sysregister-reborn
  localStorage.setItem("username", userId);
}

function getSession() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  // Session expires after 24 hours
  const expirationTime = 24 * 60 * 60 * 1000;
  if (Date.now() - session.timestamp > expirationTime) {
    clearSession();
    return null;
  }
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  sessionStorage.clear();
}

function saveData(key, data) {
  const storedData = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
  storedData[key] = { data, timestamp: Date.now() };
  localStorage.setItem(DATA_KEY, JSON.stringify(storedData));
}

function getData(key) {
  const storedData = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
  return storedData[key]?.data || null;
}

// ==================== App State ====================

let appState = {
  selectedDay: new Date(),
  agenda: [],
  lessons: [],
  grades: null,
  periods: null,
  session: null,
  completedAgenda: JSON.parse(localStorage.getItem("completedAgenda") || "[]"),
  currentSection: "home",
};

// ==================== Error Handling ====================

function showError(message) {
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = message;
  setTimeout(() => {
    errorElement.textContent = "";
  }, 3000);
}

// ==================== Page Display ====================

function showAuthPage() {
  document.getElementById("authPage").style.display = "flex";
  document.getElementById("mainApp").style.display = "none";
}

function showMainApp() {
  document.getElementById("authPage").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
  initializeDaySelector();
  initializeNavbar();
  loadDayData(appState.selectedDay);
}

// ==================== Day Selector ====================

function getDayInterval() {
  const dayInterval = [];
  const currentDate = new Date();
  for (let i = -50; i <= 50; i++) {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() + i);
    dayInterval.push(day);
  }
  return dayInterval;
}

function initializeDaySelector() {
  const container = document.getElementById("daySelector");
  container.innerHTML = "";

  const days = getDayInterval();
  const today = new Date();

  days.forEach((day) => {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.onclick = () => selectDay(day);

    const dayName = day.toLocaleString("it-IT", { weekday: "short" });
    const formattedDayName = dayName.slice(0, 1).toUpperCase() + dayName.slice(1, 3);

    const isSelected = day.toDateString() === appState.selectedDay.toDateString();
    const isToday = day.toDateString() === today.toDateString();

    btn.innerHTML = `
      <p class="day-name">${formattedDayName}</p>
      <div class="day-number ${isSelected ? 'selected' : ''}">
        ${day.getDate()}
        ${isToday ? '<div class="today-dot"></div>' : ''}
      </div>
    `;

    if (isSelected) {
      btn.id = "selectedDayBtn";
    }

    container.appendChild(btn);
  });

  // Scroll to selected day
  setTimeout(() => {
    const selectedBtn = document.getElementById("selectedDayBtn");
    if (selectedBtn && container) {
      const containerWidth = container.offsetWidth;
      const buttonOffsetLeft = selectedBtn.offsetLeft;
      const buttonWidth = selectedBtn.offsetWidth;
      const scrollPosition = buttonOffsetLeft - containerWidth / 2 + buttonWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, 100);

  // Update navbar date
  document.getElementById("navDateNum").textContent = new Date().getDate();
}

function selectDay(day) {
  appState.selectedDay = day;
  initializeDaySelector();
  loadDayData(day);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== Load Day Data ====================

async function loadDayData(day) {
  const session = getSession();
  if (!session) return;

  // Show loader
  const agendaContent = document.getElementById("agendaContent");
  agendaContent.innerHTML = `
    <div style="display: flex; justify-content: center; margin-top: 1rem;">
      <div class="loader"></div>
    </div>
  `;

  try {
    // Format date for API
    const dateStr = formatDateForAPI(day);
    const agenda = await getAgenda(session.studentId, session.token, dateStr, dateStr);
    
    appState.agenda = (agenda.agenda || []).map(item => ({
      id: item.evtId,
      title: item.notes || "Evento senza titolo",
      autore_desc: item.authorName || "",
      start: item.evtDatetimeBegin,
      end: item.evtDatetimeEnd,
      allDay: item.isFullDay,
      completed: appState.completedAgenda.includes(item.evtId),
    }));

    // Try to get lessons
    try {
      const lessons = await getLessonsForDay(session.studentId, session.token, dateStr);
      appState.lessons = lessons.lessons || [];
      displayLessonsLink(day);
    } catch (e) {
      appState.lessons = [];
      document.getElementById("lessonsLink").classList.add("hidden");
    }

    displayAgenda();
  } catch (error) {
    console.error("Failed to load day data:", error);
    agendaContent.innerHTML = `
      <div class="empty-state">
        <div class="card-bg"></div>
        <p>Errore nel caricamento</p>
      </div>
    `;
  }
}

// ==================== Display Agenda ====================

function displayAgenda() {
  const container = document.getElementById("agendaContent");
  
  if (appState.agenda.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="card-bg"></div>
        <p>Nessun evento su agenda</p>
      </div>
    `;
    return;
  }

  // Sort: uncompleted first, then completed
  const uncompleted = appState.agenda.filter(item => !item.completed);
  const completed = appState.agenda.filter(item => item.completed);
  const sortedAgenda = [...uncompleted, ...completed];

  container.innerHTML = sortedAgenda.map(item => createAgendaItemHTML(item)).join("");

  // Re-initialize lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function createAgendaItemHTML(item) {
  const timeStr = item.allDay 
    ? "Tutto il giorno" 
    : `${formatTime(item.start)} - ${formatTime(item.end)}`;

  return `
    <div class="agenda-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
      <div class="agenda-item-bg"></div>
      <div class="agenda-header">
        <div>
          <p class="agenda-author">${item.autore_desc}</p>
          <div class="agenda-time">
            <span>${timeStr}</span>
          </div>
        </div>
        <div class="checkbox ${item.completed ? 'checked' : ''}" onclick="toggleAgendaItem(${item.id})">
          ${item.completed ? '<i data-lucide="check" style="width: 18px; height: 18px;"></i>' : ''}
        </div>
      </div>
      <div class="agenda-content">
        <div class="agenda-content-bg"></div>
        <span style="white-space: pre-wrap;">${item.title}</span>
      </div>
    </div>
  `;
}

function toggleAgendaItem(evtId) {
  if (appState.completedAgenda.includes(evtId)) {
    appState.completedAgenda = appState.completedAgenda.filter(id => id !== evtId);
  } else {
    appState.completedAgenda.push(evtId);
  }
  localStorage.setItem("completedAgenda", JSON.stringify(appState.completedAgenda));
  
  // Update UI
  appState.agenda = appState.agenda.map(item => {
    if (item.id === evtId) {
      return { ...item, completed: appState.completedAgenda.includes(evtId) };
    }
    return item;
  });
  displayAgenda();
}

// ==================== Display Lessons Link ====================

function displayLessonsLink(day) {
  const link = document.getElementById("lessonsLink");
  
  if (!appState.lessons || appState.lessons.length === 0) {
    link.classList.add("hidden");
    return;
  }

  link.classList.remove("hidden");
  
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", 
                      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  
  const isToday = day.toDateString() === new Date().toDateString();
  const title = isToday 
    ? "Lezioni di oggi" 
    : `Lezioni del giorno ${day.getDate()} ${monthNames[day.getMonth()]}`;
  
  document.getElementById("lessonsTitle").textContent = title;
  document.getElementById("lessonsSubtitle").textContent = `${appState.lessons.length} firme da professori`;
}

// ==================== Navbar ====================

function initializeNavbar() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      const section = link.dataset.section;
      navigateToSection(section);
    });
  });
}

function navigateToSection(section) {
  appState.currentSection = section;
  
  // Update navbar active state
  document.querySelectorAll(".nav-link").forEach(link => {
    const linkSection = link.dataset.section;
    const icon = link.querySelector(".nav-icon");
    const dateEl = link.querySelector(".nav-date");
    
    if (linkSection === section) {
      if (icon) icon.classList.add("active");
      if (dateEl) dateEl.classList.add("active");
    } else {
      if (icon) icon.classList.remove("active");
      if (dateEl) dateEl.classList.remove("active");
    }
  });

  // For now, all sections show the home view
  // This can be expanded later for different views
}

// ==================== Helpers ====================

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// ==================== PWA Install Prompt ====================

let deferredPrompt = null;

function setupPWAPrompt() {
  const isInstalled = localStorage.getItem("isInstalled") === "true";
  if (isInstalled) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show PWA prompts
    document.getElementById("pwaPromptBtn").classList.remove("hidden");
    document.getElementById("pwaPromptMain").classList.remove("hidden");
  });

  // Handle install button clicks
  document.getElementById("pwaPromptBtn").addEventListener("click", installPWA);
  document.getElementById("pwaPromptMain").addEventListener("click", installPWA);
}

async function installPWA() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === "accepted") {
    localStorage.setItem("isInstalled", "true");
    document.getElementById("pwaPromptBtn").classList.add("hidden");
    document.getElementById("pwaPromptMain").classList.add("hidden");
  }
  
  deferredPrompt = null;
}

// ==================== Login ====================

async function handleLogin(e) {
  e.preventDefault();
  
  const userId = document.getElementById("user_id").value;
  const userPass = document.getElementById("user_pass").value;
  const loginButton = document.getElementById("loginButton");
  const loginText = document.getElementById("loginText");
  const loginLoader = document.getElementById("loginLoader");

  // Show loading
  loginButton.disabled = true;
  loginText.classList.add("hidden");
  loginLoader.classList.remove("hidden");

  try {
    const loginResponse = await login(userId, userPass);
    const token = loginResponse.token;

    if (!token || token === "") {
      throw new Error("Token non valido");
    }

    const studentId = userId.replace(/\D/g, "");
    
    // Save session
    saveSession(userId, token, studentId, loginResponse);
    localStorage.setItem("password", userPass); // For auto-login
    
    appState.session = { userId, token, studentId, ...loginResponse };

    // Show main app
    showMainApp();
  } catch (error) {
    console.error("Login error:", error);
    showError(error.message || "Errore di autenticazione");
  } finally {
    loginButton.disabled = false;
    loginText.classList.remove("hidden");
    loginLoader.classList.add("hidden");
  }
}

// ==================== Auto Login ====================

async function tryAutoLogin() {
  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");
  
  if (!username || !password) return false;

  try {
    const loginResponse = await login(username, password);
    const token = loginResponse.token;

    if (!token) return false;

    const studentId = username.replace(/\D/g, "");
    saveSession(username, token, studentId, loginResponse);
    appState.session = { userId: username, token, studentId, ...loginResponse };

    return true;
  } catch (error) {
    console.error("Auto login failed:", error);
    return false;
  }
}

// ==================== Initialize ====================

async function initializeApp() {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Setup PWA
  setupPWAPrompt();

  // Setup login form
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // Try auto login
  const session = getSession();
  if (session) {
    appState.session = session;
    showMainApp();
  } else {
    const autoLoginSuccess = await tryAutoLogin();
    if (autoLoginSuccess) {
      showMainApp();
    } else {
      showAuthPage();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
