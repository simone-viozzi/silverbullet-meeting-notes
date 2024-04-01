import dayjs from "https://esm.sh/dayjs";
import customParseFormat from "https://esm.sh/dayjs/plugin/customParseFormat.js";
import isToday from "https://esm.sh/dayjs/plugin/isToday.js";

dayjs.extend(customParseFormat);
dayjs.extend(isToday);

/**
 * Sanitizes a given title by applying a series of formatting rules to ensure consistency.
 * This includes replacing special characters with hyphens, collapsing multiple hyphens into a single hyphen,
 * ensuring hyphens are surrounded by spaces, and collapsing multiple spaces into a single space.
 * Leading and trailing spaces or hyphens are removed.
 *
 * @param title - The title string to be sanitized.
 * @returns The sanitized title, with special characters and consecutive hyphens replaced by a single hyphen,
 *          excess spaces removed, and hyphens properly spaced.
 *
 * Example usage:
 *   sanitizeTitle("--tag ++meeting1==")  // Returns: "tag  - meeting1"
 *   sanitizeTitle("[tag]  meeting1")     // Returns: "tag - meeting1"
 *   sanitizeTitle("[tag]|meeting1")      // Returns: "tag - meeting1"
 *   sanitizeTitle("tag    meeting1")     // Returns: "tag meeting1"
 *   sanitizeTitle("tag-meeting1")        // Returns: "tag - meeting1"
 *   sanitizeTitle("tag:meeting1")        // Returns: "tag - meeting1"
 *   sanitizeTitle("  tag meeting1  ")    // Returns: "tag meeting1"
 *   sanitizeTitle("tag@meeting1")        // Returns: "tag - meeting1"
 *   sanitizeTitle("tag#meeting1")        // Returns: "tag - meeting1"
 *   sanitizeTitle("tag&meeting1")        // Returns: "tag - meeting1"
 */
export function sanitizeTitle(title: string): string {
  let sanitized = title.replace(/[^a-zA-Z0-9\s]/g, "-");
  sanitized = sanitized.replace(/-+/g, "-");
  sanitized = sanitized.replace(/^[\s-]+|[\s-]+$/g, "");
  sanitized = sanitized.replace(/-/g, " - ");
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Formats a timestamp into a string with the format "YYYY-MM-DD_HH-mm".
 * @param date - The timestamp to format.
 * @returns The formatted timestamp string.
 */
export function formatTimestamp(date: dayjs.Dayjs): string {
  return date.format("YYYY-MM-DD_HH-mm");
}

const formats = [
  "DD_HH-mm",
  "DD_HH:mm",
  "DD_HH",
  "HH:mm",
  "HH-mm",
  "HH",
];

/**
 * Preprocesses a date string by separating the day and time components and formatting them.
 * If the date string includes a day component, it is separated from the time component and padded if necessary.
 * The time component is processed by splitting it into parts and padding each part if necessary.
 * The day and time components are then rejoined and returned as a formatted date string.
 *
 * @param dateStr - The date string to preprocess.
 * @returns The preprocessed and formatted date string.
 */
export function preprocessDateStr(dateStr: string): string {
  // First, identify if the format includes a day component by checking for an underscore
  const hasDayComponent = dateStr.includes("_");
  let dayPart = "";
  let timePart = dateStr;

  // If there's a day component, separate the day from the time
  if (hasDayComponent) {
    const parts = dateStr.split("_");
    dayPart = parts[0].padStart(2, "0") + "_"; // Pad the day part
    timePart = parts[1];
  }

  // Process the time part for hours and minutes
  // Split the string by delimiters known to be used in the time formats
  const timeParts = timePart.split(/[-:]/);
  const delimiter = timePart.includes(":")
    ? ":"
    : timePart.includes("-")
    ? "-"
    : ":"; // Maintain the original delimiter

  // Reconstruct the time part with padded values
  const processedTimePart = timeParts.map((part) => part.padStart(2, "0")).join(
    delimiter,
  );

  // Rejoin the day and time parts if necessary
  return dayPart + processedTimePart;
}

/**
 * Parses a date string using multiple formats and returns a `dayjs` object representing the parsed date.
 * If the date string cannot be parsed using any of the formats, `undefined` is returned.
 *
 * The logic of parsing involves iterating through each format in the `formats` array and attempting to parse the date string using `dayjs`.
 * If the parsing is successful, the parsed date is returned.
 * If the format includes a day component, the parsed date is checked against the current date and adjusted if necessary.
 * If the parsed time is less than 30 minutes before the current time, the parsed date is adjusted to the next day.
 * If the parsed day is before the current day, the parsed date is adjusted to the next month.
 *
 * Examples with today as 2024-03-27 10:00:
 * - parseDateWithFormats("10:20") => 2024-03-27 10:20
 *     This example represents a time without a day component.
 *     The parsed date will have the same day as the current date (2024-03-27) and the specified time (10:20).
 * - parseDateWithFormats("9") => 2024-03-28 09:00
 *   This example represents a time without a day component.
 *     The parsed date will have the next day (2024-03-28) and the specified time (09:00)
 *     since it is less than 30 minutes before the current time (10:00).
 * - parseDateWithFormats("10") => 2024-03-27 10:00
 *     This example represents a time without a day component.
 *     The parsed date will have the same day as the current date (2024-03-27) and the specified time (10:00).
 * - parseDateWithFormats("30_10") => 2024-03-30 10:00
 *   This example represents a date with a day component.
 *     The parsed date will have the specified day (30) and time (10:00).
 * - parseDateWithFormats("5_16") => 2024-04-05 16:00
 *     This example represents a date with a day component.
 *     The parsed date will have the specified day (5) and time (16:00).
 *     Since the parsed day (5) is before the current day (27), the parsed date is adjusted to the next month (April).
 *
 * @param dateStr - The date string to parse.
 * @returns A `dayjs` object representing the parsed date, or `undefined` if the date string cannot be parsed.
 */
export function parseDateWithFormats(
  dateStr: string,
  now: dayjs.Dayjs = dayjs(),
): dayjs.Dayjs | undefined {
  //const now = dayjs();
  for (const format of formats) {
    let d = dayjs(dateStr, format, true); // Using strict parsing

    if (!d.isValid()) {
      continue;
    }

    let i = 1;

    console.log("now: ", now.format("YYYY-MM-DD HH:mm"));
    console.log("date: ", dateStr);
    console.log("format used: ", format);

    console.log(`step ${i}: `, d.format("YYYY-MM-DD HH:mm"));
    i += 1;

    if (!format.includes("DD")) {
      d = d.month(now.month()).year(now.year()); // Adjust this line to set month and year
    }

    console.log(`step ${i}: `, d.format("YYYY-MM-DD HH:mm"));
    i += 1;

    // Ensure the date is set to today if the format doesn't specify the day
    if (format.startsWith("HH")) {
      d = d.date(now.date()).month(now.month()).year(now.year());
    }

    console.log(`step ${i}: `, d.format("YYYY-MM-DD HH:mm"));
    i += 1;

    // If the parsed time is less than now - 30 minutes, add a day
    if (d.isBefore(now.subtract(30, "minute"))) {
      d = d.add(1, "day");
    }

    console.log(`step ${i}: `, d.format("YYYY-MM-DD HH:mm"));
    i += 1;

    // If the parsed day is before today, add a month
    // This logic assumes the date is for a monthly recurring event
    if (!d.isToday() && d.isBefore(now, "day")) {
      d = d.add(1, "month");
    }

    console.log(`step ${i}: `, d.format("YYYY-MM-DD HH:mm"));
    i += 1;

    return d;
  }
  return undefined;
}
