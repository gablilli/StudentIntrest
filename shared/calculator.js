// Grade calculation logic
// Based on chemediaho implementation with enhancements

// ==================== Average Calculations ====================

// Calculate averages from grades data
function calculateAverages(grades) {
  const gradesAvr = {};

  for (const grade of grades.grades) {
    const period = String(grade.periodPos); // Convert to string for consistent keys

    // Skip grades that should not be averaged
    if (
      grade.noAverage === true ||
      grade.color === "blue" ||
      grade.decimalValue === null
    ) {
      continue;
    }

    // Initialize period if not exists
    if (!gradesAvr[period]) {
      gradesAvr[period] = {};
    }

    // Initialize subject if not exists
    if (!gradesAvr[period][grade.subjectDesc]) {
      gradesAvr[period][grade.subjectDesc] = {
        count: 0,
        avr: 0,
        grades: [],
        subjectId: grade.subjectId,
      };
    }

    gradesAvr[period][grade.subjectDesc].count += 1;
    gradesAvr[period][grade.subjectDesc].grades.push({
      decimalValue: grade.decimalValue,
      displayValue: grade.displayValue,
      evtDate: grade.evtDate,
      notesForFamily: grade.notesForFamily,
      componentDesc: grade.componentDesc,
      teacherName: grade.teacherName,
      color: grade.color,
      weightFactor: grade.weightFactor || 1,
    });
  }

  // Calculate average per subject
  for (const period in gradesAvr) {
    for (const subject in gradesAvr[period]) {
      if (subject === "period_avr") continue;

      const subjectGrades = gradesAvr[period][subject].grades.map(
        (g) => g.decimalValue
      );
      const average =
        subjectGrades.length > 0
          ? subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length
          : 0;

      gradesAvr[period][subject].avr = average;

      // Calculate minimum grade needed to reach 6.0
      if (average < 6.0 && subjectGrades.length > 0) {
        const currentSum = subjectGrades.reduce((a, b) => a + b, 0);
        const targetSum = 6.0 * (subjectGrades.length + 1);
        const neededGrade = targetSum - currentSum;
        gradesAvr[period][subject].neededFor6 = Math.max(
          0,
          Math.min(10, neededGrade)
        );
      } else {
        gradesAvr[period][subject].neededFor6 = null;
      }
    }
  }

  // Calculate period averages
  for (const period in gradesAvr) {
    const periodGrades = [];
    for (const subject in gradesAvr[period]) {
      if (subject === "period_avr") continue;
      periodGrades.push(
        ...gradesAvr[period][subject].grades.map((g) => g.decimalValue)
      );
    }
    gradesAvr[period].period_avr =
      periodGrades.length > 0
        ? periodGrades.reduce((a, b) => a + b, 0) / periodGrades.length
        : 0;
  }

  // Calculate overall average
  const periodAverages = Object.keys(gradesAvr)
    .filter((period) => period !== "all_avr")
    .map((period) => gradesAvr[period].period_avr);
  gradesAvr.all_avr =
    periodAverages.length > 0
      ? periodAverages.reduce((a, b) => a + b, 0) / periodAverages.length
      : 0;

  return gradesAvr;
}

// ==================== Goal Calculator (from chemediaho) ====================

/**
 * Calculate what grade is needed to reach a target average
 * @param {Object} gradesAvr - The calculated averages object
 * @param {string} period - The period number
 * @param {string} subject - The subject name
 * @param {number} targetAverage - The target average to achieve
 * @returns {Object} Calculation result with required grade and message
 */
function calculateGoal(gradesAvr, period, subject, targetAverage) {
  // Validate inputs
  if (!gradesAvr[period] || !gradesAvr[period][subject]) {
    return {
      success: false,
      error: "Subject or period not found",
    };
  }

  if (targetAverage < 1 || targetAverage > 10) {
    return {
      success: false,
      error: "Target average must be between 1 and 10",
    };
  }

  const subjectData = gradesAvr[period][subject];
  const currentGrades = subjectData.grades
    .filter((g) => g.decimalValue !== null)
    .map((g) => g.decimalValue);

  if (currentGrades.length === 0) {
    return {
      success: false,
      error: "No grades available for this subject",
    };
  }

  const currentCount = currentGrades.length;
  const currentSum = currentGrades.reduce((a, b) => a + b, 0);
  const currentAverage = subjectData.avr;

  // Calculate required grade
  // Formula: (current_sum + required_grade) / (current_count + 1) = target_average
  // required_grade = target_average * (current_count + 1) - current_sum
  const requiredGrade = targetAverage * (currentCount + 1) - currentSum;

  // Determine if it's achievable
  const achievable = requiredGrade >= 1 && requiredGrade <= 10;

  return {
    success: true,
    currentAverage: Math.round(currentAverage * 100) / 100,
    targetAverage: targetAverage,
    requiredGrade: Math.round(requiredGrade * 100) / 100,
    currentGradesCount: currentCount,
    achievable: achievable,
    message: getGoalMessage(requiredGrade, targetAverage, currentAverage),
  };
}

/**
 * Generate a helpful message based on the calculation result
 */
function getGoalMessage(requiredGrade, targetAverage, currentAverage) {
  if (requiredGrade < 1) {
    return `Ottimo! La tua media attuale è già sopra l'obiettivo. Anche con un voto minimo raggiungerai ${targetAverage}.`;
  } else if (requiredGrade > 10) {
    return `Purtroppo non è possibile raggiungere ${targetAverage} con un solo voto. Prova a impostare un obiettivo più realistico!`;
  } else if (requiredGrade >= 9) {
    return `Devi impegnarti, ti serve almeno un ${requiredGrade.toFixed(1)} per raggiungere l'obiettivo.`;
  } else if (requiredGrade >= 7) {
    return `È fattibile: Con un buon ${requiredGrade.toFixed(1)} puoi raggiungere ${targetAverage}.`;
  } else if (requiredGrade >= 6) {
    return `Ci sei quasi! Un ${requiredGrade.toFixed(1)} ti permetterà di raggiungere l'obiettivo.`;
  } else {
    return `Ottimo! Anche con un voto modesto (${requiredGrade.toFixed(1)}) raggiungerai ${targetAverage}.`;
  }
}

// ==================== CSV Export (from chemediaho) ====================

/**
 * Export grades to CSV format
 * @param {Object} gradesAvr - The calculated averages object
 * @returns {string} CSV formatted string
 */
function exportGradesToCSV(gradesAvr) {
  const rows = [];
  rows.push(["Periodo", "Materia", "Voto", "Data", "Tipo", "Docente", "Note"]);

  const periods = Object.keys(gradesAvr)
    .filter((p) => p !== "all_avr")
    .sort();

  for (const period of periods) {
    for (const subject in gradesAvr[period]) {
      if (subject === "period_avr") continue;

      const data = gradesAvr[period][subject];
      for (const grade of data.grades) {
        rows.push([
          `Periodo ${period}`,
          subject,
          grade.decimalValue || "",
          grade.evtDate || "",
          grade.componentDesc || "",
          grade.teacherName || "",
          grade.notesForFamily || "",
        ]);
      }
    }
  }

  // Convert to CSV string
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

/**
 * Download grades as CSV file
 * @param {Object} gradesAvr - The calculated averages object
 */
function downloadGradesCSV(gradesAvr) {
  const csv = exportGradesToCSV(gradesAvr);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `voti_${timestamp}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Statistics Helpers ====================

/**
 * Get statistics for grades
 * @param {Object} gradesAvr - The calculated averages object
 * @returns {Object} Statistics including counts, averages, etc.
 */
function getGradeStatistics(gradesAvr) {
  const stats = {
    totalGrades: 0,
    totalSubjects: 0,
    periodStats: {},
    bestSubject: null,
    worstSubject: null,
    insufficientSubjects: [],
    sufficientSubjects: [],
  };

  let allSubjects = [];

  for (const period in gradesAvr) {
    if (period === "all_avr") continue;

    stats.periodStats[period] = {
      subjects: 0,
      grades: 0,
      average: gradesAvr[period].period_avr,
    };

    for (const subject in gradesAvr[period]) {
      if (subject === "period_avr") continue;

      const data = gradesAvr[period][subject];
      stats.periodStats[period].subjects += 1;
      stats.periodStats[period].grades += data.grades.length;
      stats.totalGrades += data.grades.length;

      allSubjects.push({
        name: subject,
        period: period,
        average: data.avr,
        count: data.grades.length,
      });

      if (data.avr < 6) {
        stats.insufficientSubjects.push({
          name: subject,
          period: period,
          average: data.avr,
          neededFor6: data.neededFor6,
        });
      } else {
        stats.sufficientSubjects.push({
          name: subject,
          period: period,
          average: data.avr,
        });
      }
    }
  }

  stats.totalSubjects = allSubjects.length;

  if (allSubjects.length > 0) {
    allSubjects.sort((a, b) => b.average - a.average);
    stats.bestSubject = allSubjects[0];
    stats.worstSubject = allSubjects[allSubjects.length - 1];
  }

  return stats;
}

// ==================== Date Helpers for Agenda ====================

/**
 * Format date for ClasseViva API (YYYYMMDD)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get current school year date range
 * @returns {Object} Start and end dates for current school year
 */
function getCurrentSchoolYearRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // School year typically starts in September
  let startYear, endYear;
  if (month >= 8) {
    // September to December
    startYear = year;
    endYear = year + 1;
  } else {
    // January to August
    startYear = year - 1;
    endYear = year;
  }

  return {
    start: new Date(startYear, 8, 1), // September 1st
    end: new Date(endYear, 7, 31), // August 31st
  };
}
