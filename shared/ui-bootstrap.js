// UI functions using Bootstrap
// Enhanced with all features from chemediaho and sysregister-reborn

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
}

// Save fetched data for offline/cached access
function saveData(key, data) {
  const storedData = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
  storedData[key] = { data, timestamp: Date.now() };
  localStorage.setItem(DATA_KEY, JSON.stringify(storedData));
}

function getData(key) {
  const storedData = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
  return storedData[key]?.data || null;
}

// ==================== Color Helpers ====================

function getColorClass(value) {
  if (value < 5) return "danger";
  if (value >= 5 && value < 6) return "warning";
  return "success";
}

function getGradeColor(value) {
  if (value < 5) return "#dc3545";
  if (value >= 5 && value < 6) return "#ffc107";
  return "#198754";
}

// ==================== UI State Management ====================

let appState = {
  gradesAvr: null,
  agenda: null,
  noticeboard: null,
  notes: null,
  absences: null,
  didactics: null,
  periods: null,
  session: null,
};

// ==================== Loading State ====================

function showLoading() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

// ==================== Display Grades ====================

function displayGrades(gradesAvr) {
  appState.gradesAvr = gradesAvr;

  // Display overall average
  const overallAvg = gradesAvr.all_avr;
  const overallAvgElement = document.getElementById("overallAverage");
  overallAvgElement.textContent = overallAvg.toFixed(1);
  overallAvgElement.className = `overall-average text-${getColorClass(overallAvg)}`;

  // Get statistics
  const stats = getGradeStatistics(gradesAvr);

  // Update stats cards
  document.getElementById("totalGradesCount").textContent = stats.totalGrades;
  document.getElementById("totalSubjectsCount").textContent =
    stats.totalSubjects;
  document.getElementById("insufficientCount").textContent =
    stats.insufficientSubjects.length;

  // Build period tabs
  const periodTabs = document.getElementById("periodTabs");
  periodTabs.innerHTML = "";

  const periods = Object.keys(gradesAvr)
    .filter((p) => p !== "all_avr")
    .sort();

  periods.forEach((period, index) => {
    const tab = document.createElement("button");
    tab.className = `custom-tab ${index === 0 ? "active" : ""}`;
    tab.textContent = `Periodo ${period}`;
    tab.dataset.period = period;
    tab.onclick = () => {
      // Use periodTabs reference instead of querySelectorAll for better performance
      Array.from(periodTabs.children).forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      displayPeriodGrades(gradesAvr, period);
    };
    periodTabs.appendChild(tab);
  });

  // Display first period
  if (periods.length > 0) {
    displayPeriodGrades(gradesAvr, periods[0]);
  }

  // Display recent grades
  displayRecentGrades(gradesAvr);

  // Populate goal calculator dropdowns
  populateGoalCalculator(gradesAvr);
}

function displayPeriodGrades(gradesAvr, period) {
  const gradesContent = document.getElementById("gradesContent");
  gradesContent.innerHTML = "";

  const subjects = gradesAvr[period];
  const periodAvr = subjects.period_avr;

  // Period average card
  const periodCard = document.createElement("div");
  periodCard.className = "feature-card mb-3";
  periodCard.innerHTML = `
    <div class="card-body text-center">
      <h6 class="text-muted mb-2">Media Periodo ${period}</h6>
      <div class="period-average text-${getColorClass(periodAvr)}">${periodAvr.toFixed(1)}</div>
    </div>
  `;
  gradesContent.appendChild(periodCard);

  // Subject cards
  for (const subject in subjects) {
    if (subject === "period_avr") continue;

    const data = subjects[subject];
    const subjectCard = document.createElement("div");
    subjectCard.className = "feature-card";

    let neededBadge = "";
    if (data.neededFor6 !== null) {
      neededBadge = `<span class="badge bg-info ms-2">Serve: ${data.neededFor6.toFixed(1)}</span>`;
    }

    subjectCard.innerHTML = `
      <div class="card-header">
        <h5 class="d-flex align-items-center justify-content-between">
          <span>${subject}</span>
          <span class="badge bg-${getColorClass(data.avr)}">${data.avr.toFixed(1)}</span>
        </h5>
      </div>
      <div class="card-body">
        <div class="grades-container"></div>
        ${neededBadge}
      </div>
    `;

    const gradesContainer = subjectCard.querySelector(".grades-container");
    data.grades.forEach((grade) => {
      const badge = document.createElement("span");
      badge.className = `grade-badge bg-${getColorClass(grade.decimalValue)} text-white`;
      badge.textContent = grade.decimalValue;
      badge.style.cursor = "pointer";
      badge.onclick = () => showGradeModal(grade);
      gradesContainer.appendChild(badge);
    });

    gradesContent.appendChild(subjectCard);
  }
}

function displayRecentGrades(gradesAvr) {
  const container = document.getElementById("recentGrades");
  container.innerHTML = "";

  // Get all grades and sort by date
  const allGrades = [];
  for (const period in gradesAvr) {
    if (period === "all_avr") continue;
    for (const subject in gradesAvr[period]) {
      if (subject === "period_avr") continue;
      for (const grade of gradesAvr[period][subject].grades) {
        allGrades.push({ ...grade, subject });
      }
    }
  }

  allGrades.sort((a, b) => new Date(b.evtDate) - new Date(a.evtDate));
  const recentGrades = allGrades.slice(0, 5);

  if (recentGrades.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>Nessun voto recente</p>
      </div>
    `;
    return;
  }

  recentGrades.forEach((grade) => {
    const item = document.createElement("div");
    item.className = "d-flex align-items-center justify-content-between p-2 border-bottom";
    item.innerHTML = `
      <div>
        <strong>${grade.subject}</strong>
        <div class="text-muted small">${grade.evtDate} - ${grade.componentDesc || "N/A"}</div>
      </div>
      <span class="grade-badge bg-${getColorClass(grade.decimalValue)} text-white">${grade.decimalValue}</span>
    `;
    item.style.cursor = "pointer";
    item.onclick = () => showGradeModal(grade);
    container.appendChild(item);
  });
}

// ==================== Display Agenda ====================

function displayAgenda(agenda) {
  appState.agenda = agenda;
  const container = document.getElementById("agendaContent");
  container.innerHTML = "";

  const events = agenda.agenda || [];

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-calendar-x"></i>
        <p>Nessun evento in agenda</p>
      </div>
    `;
    return;
  }

  // Sort by date
  events.sort(
    (a, b) => new Date(b.evtDatetimeBegin) - new Date(a.evtDatetimeBegin)
  );

  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = "agenda-item";

    const startDate = new Date(event.evtDatetimeBegin);
    const dateStr = startDate.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const timeStr = startDate.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    item.innerHTML = `
      <div class="date">${dateStr} - ${timeStr}</div>
      <div class="title">${event.notes || "Evento senza titolo"}</div>
      <div class="author">
        ${event.authorName ? `<i class="bi bi-person"></i> ${event.authorName}` : ""}
        ${event.subjectDesc ? ` - ${event.subjectDesc}` : ""}
      </div>
    `;

    container.appendChild(item);
  });
}

// ==================== Display Noticeboard ====================

function displayNoticeboard(noticeboard) {
  appState.noticeboard = noticeboard;
  const container = document.getElementById("noticeboardContent");
  container.innerHTML = "";

  const items = noticeboard.items || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>Nessun avviso in bacheca</p>
      </div>
    `;
    return;
  }

  items.sort((a, b) => new Date(b.pubDT) - new Date(a.pubDT));

  items.slice(0, 10).forEach((item) => {
    const div = document.createElement("div");
    div.className = `notice-item ${item.readStatus ? "" : "unread"}`;

    const pubDate = new Date(item.pubDT);
    const dateStr = pubDate.toLocaleDateString("it-IT");

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-bold">${item.cntTitle}</div>
          <div class="text-muted small">${item.cntCategory} - ${dateStr}</div>
          ${item.cntHasAttach ? '<span class="badge bg-secondary"><i class="bi bi-paperclip"></i> Allegato</span>' : ""}
        </div>
        ${!item.readStatus ? '<span class="badge bg-primary">Nuovo</span>' : ""}
      </div>
    `;

    container.appendChild(div);
  });
}

// ==================== Display Notes ====================

function displayNotes(notes) {
  appState.notes = notes;
  const container = document.getElementById("notesContent");
  container.innerHTML = "";

  const allNotes = [];

  // Combine all note types
  if (notes.NTTE) allNotes.push(...notes.NTTE.map((n) => ({ ...n, type: "NTTE" })));
  if (notes.NTCL) allNotes.push(...notes.NTCL.map((n) => ({ ...n, type: "NTCL" })));
  if (notes.NTWN) allNotes.push(...notes.NTWN.map((n) => ({ ...n, type: "NTWN" })));
  if (notes.NTST) allNotes.push(...notes.NTST.map((n) => ({ ...n, type: "NTST" })));

  if (allNotes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-check-circle text-success"></i>
        <p>Nessuna nota disciplinare</p>
      </div>
    `;
    return;
  }

  allNotes.sort((a, b) => new Date(b.evtDate) - new Date(a.evtDate));

  allNotes.forEach((note) => {
    const item = document.createElement("div");
    item.className = `notice-item ${note.readStatus ? "" : "unread"}`;

    const noteTypeLabel = {
      NTTE: "Nota",
      NTCL: "Nota di classe",
      NTWN: "Richiamo",
      NTST: "Sanzione",
    };

    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge bg-warning text-dark mb-1">${noteTypeLabel[note.type] || note.type}</span>
          <div class="fw-bold">${note.evtText}</div>
          <div class="text-muted small">${note.evtDate} - ${note.authorName}</div>
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

// ==================== Display Absences ====================

function displayAbsences(absences) {
  appState.absences = absences;
  const container = document.getElementById("absencesContent");
  container.innerHTML = "";

  const events = absences.events || [];

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-check-circle text-success"></i>
        <p>Nessuna assenza registrata</p>
      </div>
    `;
    return;
  }

  events.sort((a, b) => new Date(b.evtDate) - new Date(a.evtDate));

  const absenceLabels = {
    ABA0: "Assenza",
    ABR1: "Ritardo breve",
    ABU0: "Uscita anticipata",
  };

  events.slice(0, 20).forEach((event) => {
    const item = document.createElement("div");
    item.className = `absence-item ${event.isJustified ? "justified" : "not-justified"}`;

    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-bold">${absenceLabels[event.evtCode] || event.evtCode}</div>
          <div class="text-muted small">${event.evtDate}</div>
          ${event.justifReasonDesc ? `<div class="text-muted small">${event.justifReasonDesc}</div>` : ""}
        </div>
        <span class="badge bg-${event.isJustified ? "success" : "danger"}">
          ${event.isJustified ? "Giustificata" : "Non giustificata"}
        </span>
      </div>
    `;

    container.appendChild(item);
  });
}

// ==================== Display Didactics ====================

function displayDidactics(didactics) {
  appState.didactics = didactics;
  const container = document.getElementById("didacticsContent");
  container.innerHTML = "";

  const items = didactics.didacticts || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-folder2-open"></i>
        <p>Nessun materiale didattico</p>
      </div>
    `;
    return;
  }

  items.forEach((teacher) => {
    const div = document.createElement("div");
    div.className = "mb-3";

    let foldersHtml = "";
    if (teacher.folders && teacher.folders.length > 0) {
      foldersHtml = teacher.folders
        .map(
          (folder) => `
          <div class="ms-3 p-2 border-start">
            <i class="bi bi-folder"></i> ${folder.folderName}
            <span class="badge bg-secondary ms-2">${folder.contents?.length || 0} file</span>
          </div>
        `
        )
        .join("");
    }

    div.innerHTML = `
      <div class="fw-bold"><i class="bi bi-person"></i> ${teacher.teacherName}</div>
      ${foldersHtml || '<div class="text-muted small ms-3">Nessuna cartella</div>'}
    `;

    container.appendChild(div);
  });
}

// ==================== Goal Calculator ====================

function populateGoalCalculator(gradesAvr) {
  const periodSelect = document.getElementById("goalPeriod");
  const subjectSelect = document.getElementById("goalSubject");

  periodSelect.innerHTML = '<option value="">Seleziona periodo</option>';
  subjectSelect.innerHTML = '<option value="">Seleziona materia</option>';

  const periods = Object.keys(gradesAvr)
    .filter((p) => p !== "all_avr")
    .sort();

  periods.forEach((period) => {
    const option = document.createElement("option");
    option.value = period;
    option.textContent = `Periodo ${period}`;
    periodSelect.appendChild(option);
  });

  periodSelect.onchange = () => {
    const period = periodSelect.value;
    subjectSelect.innerHTML = '<option value="">Seleziona materia</option>';

    if (period && gradesAvr[period]) {
      for (const subject in gradesAvr[period]) {
        if (subject === "period_avr") continue;
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
      }
    }
  };
}

function handleGoalCalculation() {
  const period = document.getElementById("goalPeriod").value;
  const subject = document.getElementById("goalSubject").value;
  const target = parseFloat(document.getElementById("goalTarget").value);

  if (!period || !subject || isNaN(target)) {
    alert("Compila tutti i campi");
    return;
  }

  const result = calculateGoal(appState.gradesAvr, period, subject, target);
  const resultDiv = document.getElementById("goalResult");

  if (!result.success) {
    resultDiv.innerHTML = `
      <div class="alert alert-danger mt-3">${result.error}</div>
    `;
    resultDiv.style.display = "block";
    return;
  }

  resultDiv.innerHTML = `
    <div class="goal-result">
      <div class="text-uppercase small">Voto necessario</div>
      <div class="required-grade">${result.requiredGrade}</div>
      <p class="mb-0 mt-2">${result.message}</p>
      <div class="mt-3 small">
        Media attuale: ${result.currentAverage} | 
        Obiettivo: ${result.targetAverage} |
        Voti: ${result.currentGradesCount}
      </div>
    </div>
  `;
  resultDiv.style.display = "block";
}

// ==================== Export Functions ====================

function handleExportCSV() {
  if (!appState.gradesAvr) {
    alert("Nessun dato da esportare");
    return;
  }
  downloadGradesCSV(appState.gradesAvr);
}

function handleExportAgenda() {
  if (!appState.agenda || !appState.agenda.agenda) {
    alert("Nessun evento da esportare");
    return;
  }
  if (typeof CalendarSync !== "undefined") {
    CalendarSync.downloadAgendaAsICS(appState.agenda.agenda);
  } else {
    alert("Funzione non disponibile");
  }
}

// ==================== Navigation ====================

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.section === sectionId) {
      item.classList.add("active");
    }
  });
}

// ==================== Error Handling ====================

function showError(message) {
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function hideError() {
  const errorElement = document.getElementById("errorMessage");
  errorElement.style.display = "none";
}

// ==================== Page Display ====================

function showLoginPage() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("mainApp").style.display = "none";
}

function showMainApp() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
}

// ==================== Logout ====================

function logout() {
  clearSession();
  appState = {
    gradesAvr: null,
    agenda: null,
    noticeboard: null,
    notes: null,
    absences: null,
    didactics: null,
    periods: null,
    session: null,
  };
  showLoginPage();
  document.getElementById("loginForm").reset();
  hideError();
}

// ==================== Grade Modal ====================

function showGradeModal(grade) {
  document.getElementById("modalGrade").textContent = grade.decimalValue;
  document.getElementById("modalDate").textContent = grade.evtDate;
  document.getElementById("modalComponent").textContent =
    grade.componentDesc || "N/A";
  document.getElementById("modalTeacher").textContent =
    grade.teacherName || "N/A";
  document.getElementById("modalNotes").textContent =
    grade.notesForFamily || "Nessuna nota";

  const modal = new bootstrap.Modal(document.getElementById("gradeModal"));
  modal.show();
}

// ==================== Data Loading ====================

async function loadAllData(studentId, token) {
  showLoading();

  try {
    // Load grades (required)
    const grades = await getGrades(studentId, token);
    const gradesAvr = calculateAverages(grades);
    displayGrades(gradesAvr);
    saveData("grades", grades);

    // Load periods
    try {
      const periods = await getPeriods(studentId, token);
      appState.periods = periods;
      saveData("periods", periods);
    } catch (e) {
      console.warn("Failed to load periods:", e);
    }

    // Load agenda (current school year)
    try {
      const range = getCurrentSchoolYearRange();
      const beginDate = formatDateForAPI(range.start);
      const endDate = formatDateForAPI(range.end);
      const agenda = await getAgenda(studentId, token, beginDate, endDate);
      displayAgenda(agenda);
      saveData("agenda", agenda);
    } catch (e) {
      console.warn("Failed to load agenda:", e);
    }

    // Load noticeboard
    try {
      const noticeboard = await getNoticeboard(studentId, token);
      displayNoticeboard(noticeboard);
      saveData("noticeboard", noticeboard);
    } catch (e) {
      console.warn("Failed to load noticeboard:", e);
    }

    // Load notes
    try {
      const notes = await getNotes(studentId, token);
      displayNotes(notes);
      saveData("notes", notes);
    } catch (e) {
      console.warn("Failed to load notes:", e);
    }

    // Load absences
    try {
      const absences = await getAbsences(studentId, token);
      displayAbsences(absences);
      saveData("absences", absences);
    } catch (e) {
      console.warn("Failed to load absences:", e);
    }

    // Load didactics
    try {
      const didactics = await getDidactics(studentId, token);
      displayDidactics(didactics);
      saveData("didactics", didactics);
    } catch (e) {
      console.warn("Failed to load didactics:", e);
    }
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
  } finally {
    hideLoading();
  }
}

// ==================== Session Loading ====================

async function loadFromSession() {
  const session = getSession();
  if (!session) return false;

  try {
    showLoading();
    appState.session = session;

    // Update user info
    const userInfo = document.getElementById("userInfo");
    if (session.firstName || session.lastName) {
      userInfo.textContent = `${session.firstName} ${session.lastName}`;
    }

    await loadAllData(session.studentId, session.token);
    showMainApp();
    return true;
  } catch (error) {
    console.error("Session expired or invalid:", error);
    clearSession();
    hideLoading();
    return false;
  }
}

// ==================== Initialize ====================

function initializeUI() {
  // Try to load from session on page load
  loadFromSession().catch((err) =>
    console.error("Failed to load session:", err)
  );

  // Logout button
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const sectionId = item.dataset.section;
      if (sectionId) {
        showSection(sectionId);
      }
    });
  });

  // Goal calculator
  const calculateGoalBtn = document.getElementById("calculateGoalBtn");
  if (calculateGoalBtn) {
    calculateGoalBtn.addEventListener("click", handleGoalCalculation);
  }

  // Export buttons
  const exportCSVBtn = document.getElementById("exportCSVBtn");
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener("click", handleExportCSV);
  }

  const exportAgendaBtn = document.getElementById("exportAgendaBtn");
  if (exportAgendaBtn) {
    exportAgendaBtn.addEventListener("click", handleExportAgenda);
  }

  const exportCalendarBtn = document.getElementById("exportCalendarBtn");
  if (exportCalendarBtn) {
    exportCalendarBtn.addEventListener("click", handleExportAgenda);
  }

  // Login form
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const userId = document.getElementById("user_id").value;
    const userPass = document.getElementById("user_pass").value;
    const loginButton = document.getElementById("loginButton");
    const loginSpinner = document.getElementById("loginSpinner");

    // Show loading state
    loginButton.disabled = true;
    loginSpinner.style.display = "inline-block";

    try {
      // Login
      const loginResponse = await login(userId, userPass);
      const token = loginResponse.token;

      if (!token || token === "") {
        throw new Error("Token non valido");
      }

      // Extract student ID (digits only)
      const studentId = userId.replace(/\D/g, "");

      // Save session
      saveSession(userId, token, studentId, loginResponse);
      appState.session = { userId, token, studentId, ...loginResponse };

      // Update user info
      const userInfo = document.getElementById("userInfo");
      if (loginResponse.firstName || loginResponse.lastName) {
        userInfo.textContent = `${loginResponse.firstName || ""} ${loginResponse.lastName || ""}`;
      }

      // Load all data
      await loadAllData(studentId, token);

      // Show main app
      showMainApp();
    } catch (error) {
      console.error("Error:", error);
      showError(`Errore: ${error.message}`);
    } finally {
      // Hide loading state
      loginButton.disabled = false;
      loginSpinner.style.display = "none";
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI);
} else {
  initializeUI();
}
