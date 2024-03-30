import { editor, space } from "$sb/syscalls.ts";
import dayjs from "https://esm.sh/dayjs";
import customParseFormat from "https://esm.sh/dayjs/plugin/customParseFormat.js";
import isToday from "https://esm.sh/dayjs/plugin/isToday.js";
import { readSetting } from "$sb/lib/settings_page.ts";
import { z, ZodError } from "zod";

dayjs.extend(customParseFormat);
dayjs.extend(isToday);

export const PLUG_NAME = "meetingNote";

/**
 * Represents the configuration schema for a meeting note.
 */
const meetingNoteConfigSchema = z.object({
  meetingNoteTemplatePath: z.string().optional(),
  meetingNoteBasePath: z.string().optional(),
});

export type MeetingNoteConfig = z.infer<typeof meetingNoteConfigSchema>;

let configErrorShown = false;

/**
 * Displays a notification with an error message related to the configuration.
 * If the error is an instance of ZodError, it extracts and displays the specific field errors.
 *
 * @param error - The error object to display in the notification.
 * @returns A Promise that resolves when the notification is displayed.
 */
async function showConfigErrorNotification(error: unknown) {
  if (configErrorShown) {
    return;
  }

  configErrorShown = true;
  let errorMessage = `${typeof error}: ${String(error)}`;

  if (error instanceof ZodError) {
    const { formErrors, fieldErrors } = error.flatten();
    const fieldErrorMessages = Object.keys(fieldErrors).map((field) =>
      `\`${field}\` - ${fieldErrors[field]!.join(", ")}`
    );

    errorMessage = [...formErrors, ...fieldErrorMessages].join("; ");
  }

  await editor.flashNotification(
    `There was an error with your ${PLUG_NAME} configuration. Check your SETTINGS file: ${errorMessage}`,
    "error",
  );
}

export async function getPlugConfig(): Promise<MeetingNoteConfig> {
  const userConfig = await readSetting(PLUG_NAME);

  try {
    return meetingNoteConfigSchema.parse(userConfig || {});
  } catch (error) {
    await showConfigErrorNotification(error);
    // Fallback to the default configuration if parsing fails
    return meetingNoteConfigSchema.parse({});
  }
}

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
 *   sanitizeTitle("--STM++meeting1==")   // Returns: "STM - meeting1"
 *   sanitizeTitle("STM meeting1")        // Returns: "STM meeting1"
 *   sanitizeTitle("STM|meeting1")        // Returns: "STM - meeting1"
 *   sanitizeTitle("STM    meeting1")     // Returns: "STM meeting1"
 *   sanitizeTitle("STM-meeting1")        // Returns: "STM - meeting1"
 *   sanitizeTitle("STM:meeting1")        // Returns: "STM - meeting1"
 *   sanitizeTitle("  STM meeting1  ")    // Returns: "STM meeting1"
 *   sanitizeTitle("STM@meeting1")        // Returns: "STM - meeting1"
 *   sanitizeTitle("STM#meeting1")        // Returns: "STM - meeting1"
 *   sanitizeTitle("STM&meeting1")        // Returns: "STM - meeting1"
 */
function sanitizeTitle(title: string): string {
  let sanitized = title.replace(/[^a-zA-Z0-9\s]/g, '-');
  sanitized = sanitized.replace(/-+/g, '-'); // Collapse multiple hyphens into a single hyphen
  sanitized = sanitized.replace(/^[\s-]+|[\s-]+$/g, '');
  // Ensure hyphens are surrounded by spaces unless they are already appropriately spaced
  sanitized = sanitized.replace(/(?<! )-(?! )/g, ' - ');
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Formats a timestamp into a string with the format "YYYY-MM-DD_HH-mm".
 * @param date - The timestamp to format.
 * @returns The formatted timestamp string.
 */
function formatTimestamp(date: dayjs.Dayjs): string {
  return date.format("YYYY-MM-DD_HH-mm");
}

async function readNoteContent(pageName: string) {
  try {
    const noteContent = await space.readPage(pageName);
    console.log("Note Content:", noteContent);

    return noteContent;
  } catch (error) {
    console.error("Failed to read page:", error);
    throw error;
  }
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
function preprocessDateStr(dateStr: string): string {
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
function parseDateWithFormats(dateStr: string): dayjs.Dayjs | undefined {
  const now = dayjs();
  for (const format of formats) {
    let d = dayjs(dateStr, format, true); // Using strict parsing

    if (!d.isValid()) {
      continue;
    }

    // Ensure the date is set to today if the format doesn't specify the day
    if (format.startsWith("HH")) {
      d = d.date(now.date()).month(now.month()).year(now.year());
    }

    // If the parsed time is less than now - 30 minutes, add a day
    if (d.isBefore(now.subtract(30, "minute"))) {
      d = d.add(1, "day");
    }

    // If the parsed day is before today, add a month
    // This logic assumes the date is for a monthly recurring event
    if (!d.isToday() && d.isBefore(now, "day")) {
      d = d.add(1, "month");
    }

    return d;
  }
  return undefined;
}

/**
 * Checks if a note with the given page name exists.
 * @param pageName - The name of the page to check.
 * @returns A promise that resolves to a boolean indicating whether the note exists.
 */
async function noteExists(pageName: string): Promise<boolean> {
  try {
    const pageMeta = await space.getPageMeta(pageName);
    return !!pageMeta; // If pageMeta is truthy, return true
  } catch {
    return false; // Assume false if there's an error fetching page metadata
  }
}

/**
 * Creates a meeting note based on the provided template and user input.
 *
 * The function performs the following steps:
 * 1. Retrieves the configuration for the meeting note from the user settings.
 * 2. Checks if both the meetingNoteTemplatePath and meetingNoteBasePath are specified in the configuration. If not, it logs an error message and returns.
 * 3. Reads the content of the meeting note template file.
 * 4. Prompts the user to enter the date and title for the meeting note.
 * 5. Parses the user input to extract the date and title.
 * 6. Preprocesses the date string by adding leading zeros and separating the day and time components.
 * 7. Parses the preprocessed date string using multiple formats and returns a `dayjs` object representing the parsed date.
 * 8. If the parsed date is undefined, logs an error message and returns.
 * 9. Formats the parsed date into a timestamp string with the format "YYYY-MM-DD_HH-mm".
 * 10. Sanitizes the title by removing special characters and extra spaces.
 * 11. Replaces placeholders in the template content with the sanitized title and timestamp.
 * 12. Constructs the note title and path based on the timestamp and sanitized title.
 * 13. Checks if a note with the constructed path already exists. If it does, logs an error message and returns.
 * 14. Creates the meeting note file with the note content at the specified path.
 *
 * @returns {Promise<void>} A promise that resolves when the meeting note is created successfully.
 */
export async function meetingNote(): Promise<void> {
  const config = await getPlugConfig();
  if (!config.meetingNoteTemplatePath || !config.meetingNoteBasePath) {
    console.log(
      "Please enter both a meetingNoteTemplatePath and meetingNoteBasePath.",
    );
    await editor.flashNotification(
      "Please enter both a meetingNoteTemplatePath and meetingNoteBasePath.",
      "error",
    );
    return;
  }

  let templateContent: string;
  try {
    templateContent = await readNoteContent(config.meetingNoteTemplatePath);
  } catch (error) {
    console.error("Failed to read template content:", error);
    await editor.flashNotification("Failed to read template content", "error");
    return;
  }

  const userInput = await editor.prompt(
    "Enter date and title (e.g., 12_14-30 Meeting with team):",
  );

  if (userInput !== undefined) {
    const trimmedUserInput = userInput.trim();

    const firstSpaceIndex = trimmedUserInput.indexOf(" ");

    if (firstSpaceIndex === -1) {
      console.log("Please enter both a date and a title.");
      await editor.flashNotification(
        "Please enter both a date and a title.",
        "error",
      );
      return;
    }

    let dateStr = trimmedUserInput.substring(0, firstSpaceIndex).trim();
    const title = trimmedUserInput.substring(firstSpaceIndex + 1).trim();

    // Preprocess the date string to add leading zeros where necessary
    dateStr = preprocessDateStr(dateStr);

    console.log("dateStr:", dateStr);
    console.log("title:", title);

    const parsedDate = parseDateWithFormats(dateStr);
    if (!parsedDate) {
      console.error("Could not parse date.");
      await editor.flashNotification("Could not parse date.", "error");
      return;
    }

    const timestamp = formatTimestamp(parsedDate);
    const sanitizedTitle = sanitizeTitle(title);

    console.log("timestamp:", timestamp);
    console.log("sanitizedTitle:", sanitizedTitle);

    const noteContent = templateContent
      .replace(/{title}/g, sanitizedTitle)
      .replace(/{timestamp}/g, timestamp);

    console.log("noteContent:", noteContent);

    const noteTitle = `${timestamp} - ${sanitizedTitle}`;

    const notePath = `${config.meetingNoteBasePath}/${noteTitle}`;

    if (await noteExists(notePath)) {
      console.log("Note already exists!");
      await editor.flashNotification("Note already exists!", "error");
      return;
    }

    console.log("notePath:", notePath);

    try {
      await space.writePage(notePath, noteContent);
      console.log("Note created successfully!");
      await editor.flashNotification("Note created successfully!", "info");
    } catch (error) {
      console.error("Failed to create note:", error);
      await editor.flashNotification("Failed to create note", "error");
    }
  } else {
    console.log("User cancelled the input dialog.");
  }
}
