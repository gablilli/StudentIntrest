// API functions using the environment-aware fetch
// Based on Classeviva Official Endpoints and chemediaho implementation

// ==================== Authentication ====================

// Login function
async function login(userId, userPass) {
  const body = {
    ident: null,
    pass: userPass,
    uid: userId,
  };

  try {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMsg = `Login failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMsg += ` - ${errorData.error}`;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    // Check for network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Cannot connect to server. Check your internet connection or Cloudflare tunnel configuration."
      );
    }
    throw error;
  }
}

// Get authentication status
async function getAuthStatus(token) {
  const response = await apiFetch("/auth/status", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get auth status: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get user avatar
async function getAvatar(token) {
  const response = await apiFetch("/auth/avatar", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get avatar: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Grades ====================

// Get grades function
async function getGrades(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/grades`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch grades: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Periods ====================

// Get school periods
async function getPeriods(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/periods`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch periods: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Agenda ====================

// Get agenda for date range
async function getAgenda(studentId, token, beginDate, endDate) {
  const response = await apiFetch(
    `/students/${studentId}/agenda/all/${beginDate}/${endDate}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agenda: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Notes (Note disciplinari) ====================

// Get all notes (disciplinary notes, warnings, etc.)
async function getNotes(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/notes/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch notes: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Mark note as read
async function markNoteAsRead(studentId, token, noteType, noteId) {
  const response = await apiFetch(
    `/students/${studentId}/notes/${noteType}/read/${noteId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark note as read: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Noticeboard (Bacheca) ====================

// Get noticeboard items
async function getNoticeboard(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/noticeboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch noticeboard: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Mark noticeboard item as read
async function markNoticeboardAsRead(studentId, token, eventCode, pubId) {
  const response = await apiFetch(
    `/students/${studentId}/noticeboard/read/${eventCode}/${pubId}/101`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark noticeboard item as read: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get noticeboard attachment
async function getNoticeboardAttachment(studentId, token, eventCode, pubId) {
  const response = await apiFetch(
    `/students/${studentId}/noticeboard/attach/${eventCode}/${pubId}/101`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch attachment: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Didactics (Didattica) ====================

// Get didactics (teaching materials)
async function getDidactics(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/didactics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch didactics: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get didactics item content
async function getDidacticsItem(studentId, token, contentId) {
  const response = await apiFetch(
    `/students/${studentId}/didactics/item/${contentId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch didactics item: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Absences (Assenze) ====================

// Get absences
async function getAbsences(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/absences/details`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch absences: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get absences from date
async function getAbsencesFrom(studentId, token, beginDate) {
  const response = await apiFetch(
    `/students/${studentId}/absences/details/${beginDate}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch absences: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get absences for date range
async function getAbsencesRange(studentId, token, beginDate, endDate) {
  const response = await apiFetch(
    `/students/${studentId}/absences/details/${beginDate}/${endDate}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch absences: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Lessons (Lezioni) ====================

// Get today's lessons
async function getLessonsToday(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/lessons/today`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch lessons: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get lessons for a specific day
async function getLessonsForDay(studentId, token, day) {
  const response = await apiFetch(`/students/${studentId}/lessons/${day}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch lessons: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get lessons for date range
async function getLessonsRange(studentId, token, startDate, endDate) {
  const response = await apiFetch(
    `/students/${studentId}/lessons/${startDate}/${endDate}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch lessons: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Subjects (Materie) ====================

// Get subjects
async function getSubjects(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/subjects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch subjects: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Calendar ====================

// Get calendar
async function getCalendar(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/calendar/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch calendar: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Card (Student Info) ====================

// Get student card info
async function getCard(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/card`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch card: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Get all student cards
async function getCards(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/cards`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch cards: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Schoolbooks (Libri di testo) ====================

// Get schoolbooks
async function getSchoolbooks(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/schoolbooks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch schoolbooks: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// ==================== Documents ====================

// Get documents
async function getDocuments(studentId, token) {
  const response = await apiFetch(`/students/${studentId}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Z-Auth-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch documents: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Check document
async function checkDocument(studentId, token, hash) {
  const response = await apiFetch(
    `/students/${studentId}/documents/check/${hash}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to check document: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Read document
async function readDocument(studentId, token, hash) {
  const response = await apiFetch(
    `/students/${studentId}/documents/read/${hash}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Z-Auth-Token": token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to read document: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}
