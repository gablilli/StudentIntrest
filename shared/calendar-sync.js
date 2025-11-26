// Google Calendar Sync functionality
// Based on CVVCalendarSync implementation
// Note: This module requires google-api integration for full functionality

// Event ID prefix to identify events created by this sync
const CALENDAR_EVENT_ID_PREFIX = "cvv_sync_";

// ==================== Calendar Sync Configuration ====================

const CalendarSyncConfig = {
  timeZone: "Europe/Rome",
  eventColor: "9", // Blue color for ClasseViva events
};

// ==================== Event Generation ====================

/**
 * Generate a unique event ID based on ClasseViva event data
 * @param {Object} cvvEvent - ClasseViva event object
 * @returns {string} Unique event ID
 */
function generateEventId(cvvEvent) {
  if (cvvEvent.evtId) {
    return `${CALENDAR_EVENT_ID_PREFIX}${cvvEvent.evtId}`;
  }

  // Fallback: create ID from event details
  const eventStr = `${cvvEvent.evtCode || ""}${cvvEvent.evtDatetimeBegin || ""}${cvvEvent.notes || ""}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < eventStr.length; i++) {
    const char = eventStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CALENDAR_EVENT_ID_PREFIX}${Math.abs(hash)}`;
}

/**
 * Convert ClasseViva agenda event to Google Calendar event format
 * @param {Object} cvvEvent - ClasseViva event object
 * @returns {Object} Google Calendar event format
 */
function convertToGoogleCalendarEvent(cvvEvent) {
  const eventId = generateEventId(cvvEvent);

  return {
    id: eventId,
    summary: cvvEvent.notes || "ClasseViva Event",
    location: "",
    description: buildEventDescription(cvvEvent),
    start: {
      dateTime: cvvEvent.evtDatetimeBegin,
      timeZone: CalendarSyncConfig.timeZone,
    },
    end: {
      dateTime: cvvEvent.evtDatetimeEnd,
      timeZone: CalendarSyncConfig.timeZone,
    },
    extendedProperties: {
      private: {
        [`${CALENDAR_EVENT_ID_PREFIX}id`]: eventId,
        [`${CALENDAR_EVENT_ID_PREFIX}source`]: "classeviva",
        [`${CALENDAR_EVENT_ID_PREFIX}evtCode`]: cvvEvent.evtCode || "",
      },
    },
    colorId: CalendarSyncConfig.eventColor,
  };
}

/**
 * Build event description from ClasseViva event data
 * @param {Object} cvvEvent - ClasseViva event object
 * @returns {string} Formatted description
 */
function buildEventDescription(cvvEvent) {
  const parts = [];

  if (cvvEvent.authorName) {
    parts.push(`Author: ${cvvEvent.authorName}`);
  }
  if (cvvEvent.classDesc) {
    parts.push(`Class: ${cvvEvent.classDesc}`);
  }
  if (cvvEvent.subjectDesc) {
    parts.push(`Subject: ${cvvEvent.subjectDesc}`);
  }
  if (cvvEvent.notes) {
    parts.push(`Notes: ${cvvEvent.notes}`);
  }

  parts.push("", "Synced from ClasseViva");

  return parts.join("\n");
}

// ==================== ICS Generation ====================

/**
 * Generate ICS (iCalendar) content from agenda events
 * This can be used for download or external calendar import
 * @param {Array} agendaEvents - Array of ClasseViva agenda events
 * @param {string} calendarName - Name for the calendar
 * @returns {string} ICS formatted content
 */
function generateICS(agendaEvents, calendarName = "ClasseViva Agenda") {
  const now = new Date();
  const timestamp = formatICSDate(now);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudentIntrest//ClasseViva Sync//IT",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:Europe/Rome",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of agendaEvents) {
    if (!event.evtDatetimeBegin || !event.evtDatetimeEnd) {
      continue;
    }

    const eventId = generateEventId(event);
    const uid = `${eventId}@studentintrest.classeviva`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART:${formatICSDateTime(event.evtDatetimeBegin)}`);
    lines.push(`DTEND:${formatICSDateTime(event.evtDatetimeEnd)}`);
    lines.push(`SUMMARY:${escapeICSText(event.notes || "ClasseViva Event")}`);

    const description = buildEventDescription(event);
    lines.push(`DESCRIPTION:${escapeICSText(description)}`);

    if (event.authorName) {
      lines.push(`ORGANIZER;CN=${escapeICSText(event.authorName)}:mailto:noreply@classeviva.it`);
    }

    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Format date for ICS (basic format: YYYYMMDDTHHMMSSZ)
 * @param {Date} date - Date object
 * @returns {string} ICS formatted date
 */
function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Format ISO datetime to ICS format
 * @param {string} isoDateTime - ISO 8601 datetime string
 * @returns {string} ICS formatted datetime
 */
function formatICSDateTime(isoDateTime) {
  // Parse ISO datetime and convert to ICS format
  const date = new Date(isoDateTime);
  return formatICSDate(date);
}

/**
 * Escape text for ICS format
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeICSText(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

// ==================== Download Functions ====================

/**
 * Download agenda as ICS file
 * @param {Array} agendaEvents - Array of ClasseViva agenda events
 * @param {string} filename - Optional filename
 */
function downloadAgendaAsICS(agendaEvents, filename = null) {
  const ics = generateICS(agendaEvents);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const downloadFilename = filename || `classeviva_agenda_${timestamp}.ics`;

  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Google Calendar Integration ====================

/**
 * Google Calendar Sync Manager
 * Note: This requires Google API client to be loaded and configured
 */
class GoogleCalendarSync {
  constructor(apiKey, clientId) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.isInitialized = false;
    this.calendarId = null;
  }

  /**
   * Initialize the Google API client
   * @returns {Promise<void>}
   */
  async initialize() {
    if (typeof gapi === "undefined") {
      throw new Error(
        "Google API client not loaded. Please include the Google API script."
      );
    }

    return new Promise((resolve, reject) => {
      gapi.load("client:auth2", async () => {
        try {
          await gapi.client.init({
            apiKey: this.apiKey,
            clientId: this.clientId,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
            ],
            scope: "https://www.googleapis.com/auth/calendar",
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Sign in to Google
   * @returns {Promise<Object>} User profile
   */
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signIn();
    return authInstance.currentUser.get().getBasicProfile();
  }

  /**
   * Sign out from Google
   */
  signOut() {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut();
  }

  /**
   * Check if user is signed in
   * @returns {boolean}
   */
  isSignedIn() {
    if (!this.isInitialized) return false;
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  /**
   * Set the calendar ID to sync to
   * @param {string} calendarId - Google Calendar ID (or 'primary')
   */
  setCalendarId(calendarId) {
    this.calendarId = calendarId;
  }

  /**
   * Get list of user's calendars
   * @returns {Promise<Array>} List of calendars
   */
  async getCalendarList() {
    const response = await gapi.client.calendar.calendarList.list();
    return response.result.items;
  }

  /**
   * Sync ClasseViva agenda to Google Calendar
   * @param {Array} agendaEvents - Array of ClasseViva agenda events
   * @returns {Promise<Object>} Sync results
   */
  async syncAgenda(agendaEvents) {
    if (!this.calendarId) {
      throw new Error("Calendar ID not set. Call setCalendarId() first.");
    }

    const results = {
      added: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [],
    };

    // Get existing events created by this sync
    const existingEvents = await this.getExistingClasseVivaEvents();
    const existingEventsMap = new Map();
    for (const event of existingEvents) {
      const cvvId =
        event.extendedProperties?.private?.[`${CALENDAR_EVENT_ID_PREFIX}id`];
      if (cvvId) {
        existingEventsMap.set(cvvId, event);
      }
    }

    const seenEventIds = new Set();

    // Process each ClasseViva event
    for (const cvvEvent of agendaEvents) {
      if (!cvvEvent.evtDatetimeBegin || !cvvEvent.evtDatetimeEnd) {
        results.skipped++;
        continue;
      }

      if (cvvEvent.evtDatetimeBegin >= cvvEvent.evtDatetimeEnd) {
        results.skipped++;
        continue;
      }

      const eventId = generateEventId(cvvEvent);
      seenEventIds.add(eventId);

      const eventBody = convertToGoogleCalendarEvent(cvvEvent);

      try {
        if (existingEventsMap.has(eventId)) {
          // Update existing event
          const existingEvent = existingEventsMap.get(eventId);
          if (this.needsUpdate(existingEvent, eventBody)) {
            await gapi.client.calendar.events.update({
              calendarId: this.calendarId,
              eventId: existingEvent.id,
              resource: eventBody,
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Create new event
          await gapi.client.calendar.events.insert({
            calendarId: this.calendarId,
            resource: eventBody,
          });
          results.added++;
        }
      } catch (error) {
        results.errors.push({
          event: cvvEvent,
          error: error.message,
        });
      }
    }

    // Delete events that are no longer in ClasseViva
    for (const [eventId, existingEvent] of existingEventsMap) {
      if (!seenEventIds.has(eventId)) {
        try {
          await gapi.client.calendar.events.delete({
            calendarId: this.calendarId,
            eventId: existingEvent.id,
          });
          results.deleted++;
        } catch (error) {
          results.errors.push({
            event: existingEvent,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get existing ClasseViva events from Google Calendar
   * @returns {Promise<Array>} List of events
   */
  async getExistingClasseVivaEvents() {
    const events = [];
    let pageToken = null;

    do {
      const response = await gapi.client.calendar.events.list({
        calendarId: this.calendarId,
        privateExtendedProperty: `${CALENDAR_EVENT_ID_PREFIX}source=classeviva`,
        maxResults: 250,
        pageToken: pageToken,
      });

      events.push(...response.result.items);
      pageToken = response.result.nextPageToken;
    } while (pageToken);

    return events;
  }

  /**
   * Check if an event needs to be updated
   * @param {Object} existingEvent - Existing Google Calendar event
   * @param {Object} newEvent - New event data
   * @returns {boolean} Whether the event needs updating
   */
  needsUpdate(existingEvent, newEvent) {
    return (
      existingEvent.summary !== newEvent.summary ||
      existingEvent.start?.dateTime !== newEvent.start?.dateTime ||
      existingEvent.end?.dateTime !== newEvent.end?.dateTime ||
      existingEvent.description !== newEvent.description
    );
  }

  /**
   * Clear all ClasseViva events from the calendar
   * @returns {Promise<number>} Number of events deleted
   */
  async clearAllClasseVivaEvents() {
    const events = await this.getExistingClasseVivaEvents();
    let deleted = 0;

    for (const event of events) {
      try {
        await gapi.client.calendar.events.delete({
          calendarId: this.calendarId,
          eventId: event.id,
        });
        deleted++;
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }

    return deleted;
  }
}

// ==================== Exports ====================

// Make functions available globally for browser usage
if (typeof window !== "undefined") {
  window.CalendarSync = {
    generateEventId,
    convertToGoogleCalendarEvent,
    generateICS,
    downloadAgendaAsICS,
    GoogleCalendarSync,
    CALENDAR_EVENT_ID_PREFIX,
    CalendarSyncConfig,
  };
}
