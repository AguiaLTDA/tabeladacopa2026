// src/utils/dateFormatter.js

/**
 * Formats a UTC ISO-8601 kickoff string into a user-friendly Portuguese date & time.
 * Adjusts automatically to the user's local timezone.
 * Example input: "2026-06-11T19:00:00Z"
 * Example output (in Brazil timezone UTC-3): "Qui, 11/06 às 16:00"
 * 
 * @param {string} kickoffUtc - ISO date string in UTC
 * @param {string} fallbackDate - Fallback string if formatting fails
 * @returns {string} Formatted date and time
 */
export function formatKickoff(kickoffUtc, fallbackDate) {
  if (!kickoffUtc) return fallbackDate || '';
  try {
    const date = new Date(kickoffUtc);
    if (isNaN(date.getTime())) return fallbackDate || '';
    
    // Get short weekday name (e.g. "qui", "sex") and clean it
    const weekdayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    const weekday = weekdayStr.replace('.', '');
    
    // Format day/month as DD/MM
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    // Format time as HH:MM
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Capitalize first letter of the weekday
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    
    return `${capitalizedWeekday}, ${dateStr} às ${timeStr}`;
  } catch (e) {
    return fallbackDate || '';
  }
}

/**
 * Translates English stage names to clean Portuguese stage names for display in the bracket.
 * 
 * @param {string} stage - Stage key
 * @returns {string} Translated stage
 */
export function translateStage(stage) {
  if (!stage) return '';
  switch (stage.toLowerCase()) {
    case 'round-of-32':
      return '32 avos';
    case 'round-of-16':
      return 'Oitavas';
    case 'quarter-finals':
      return 'Quartas';
    case 'semi-finals':
      return 'Semifinal';
    case 'third-place':
      return '3º Lugar';
    case 'final':
      return 'Final';
    default:
      return stage;
  }
}
