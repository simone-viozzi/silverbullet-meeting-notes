import { editor } from "https://deno.land/x/silverbullet@0.10.4/plug-api/lib/editor.ts";
import { space } from "https://deno.land/x/silverbullet@0.10.4/plug-api/lib/space.ts";
import { system } from "https://deno.land/x/silverbullet@0.10.4/plug-api/lib/system.ts";
import dayjs from "https://esm.sh/dayjs";
import customParseFormat from "https://esm.sh/dayjs/plugin/customParseFormat.js";
import isToday from "https://esm.sh/dayjs/plugin/isToday.js";
import { z, ZodError } from "zod";

import {
  formatTimestamp,
  parseDateWithFormats,
  preprocessDateStr,
  sanitizeTitle,
} from "./utils.ts";

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
  const userConfig = await system.getSpaceConfig(PLUG_NAME, {});

  try {
    return meetingNoteConfigSchema.parse(userConfig || {});
  } catch (error) {
    await showConfigErrorNotification(error);
    // Fallback to the default configuration if parsing fails
    return meetingNoteConfigSchema.parse({});
  }
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

    const dateStr = trimmedUserInput.substring(0, firstSpaceIndex).trim();
    const title = trimmedUserInput.substring(firstSpaceIndex + 1).trim();

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

    if (!sanitizedTitle) {
      console.log("Invalid title.");
      await editor.flashNotification("Invalid title.", "error");
      return;
    }

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
