import { editor, space } from "$sb/syscalls.ts";
import dayjs from "https://esm.sh/dayjs";
import customParseFormat from "https://esm.sh/dayjs/plugin/customParseFormat.js";
import isToday from "https://esm.sh/dayjs/plugin/isToday.js";
import { readSetting } from "$sb/lib/settings_page.ts";
import { z, ZodError } from "zod";

dayjs.extend(customParseFormat);
dayjs.extend(isToday);

export const PLUG_NAME = "meetingNote";

// Define the configuration schema with only the meetingNoteTemplatePath setting
const treeViewConfigSchema = z.object({
  meetingNoteTemplatePath: z.string().optional(),
  meetingNoteBasePath: z.string().optional(),
});

export type TreeViewConfig = z.infer<typeof treeViewConfigSchema>;

let configErrorShown = false;

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

export async function getPlugConfig(): Promise<TreeViewConfig> {
  const userConfig = await readSetting(PLUG_NAME);

  try {
    return treeViewConfigSchema.parse(userConfig || {});
  } catch (error) {
    await showConfigErrorNotification(error);
    // Fallback to the default configuration if parsing fails
    return treeViewConfigSchema.parse({});
  }
}

// Utility to sanitize and format the title
function sanitizeTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, " ")
    .replace(/[\s-]+/g, " ")
    .trim();
}

// Utility to format date to the desired string format
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

export async function meetingNote() {
  const config = await getPlugConfig();
  if (!config.meetingNoteTemplatePath || !config.meetingNoteBasePath) {
    console.log(
      "Please enter both a meetingNoteTemplatePath and meetingNoteBasePath.",
    );
    return;
  }

  console.log(
    "config.meetingNoteTemplatePath:",
    config.meetingNoteTemplatePath,
  );
  console.log("config.meetingNoteBasePath:", config.meetingNoteBasePath);

  // Correctly await the content of the template
  let templateContent;
  try {
    templateContent = await readNoteContent(config.meetingNoteTemplatePath);
  } catch (error) {
    console.error("Failed to read template content:", error);
    return;
  }

  const userInput = await editor.prompt(
    "Enter date and title (e.g., 12_14-30 Meeting with team):",
  );

  if (userInput !== undefined) {
    // Strip leading and trailing whitespace from the userInput
    const trimmedUserInput = userInput.trim();

    // Find the index of the first space after the date to separate date from title
    // Assuming the date does not contain spaces and is followed by a space
    const firstSpaceIndex = trimmedUserInput.indexOf(" ");

    // If there's no space, it might be only a date or title was entered without a date
    if (firstSpaceIndex === -1) {
      console.log("Please enter both a date and a title.");
      return; // Exit the function if the format is incorrect
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

    console.log("notePath:", notePath);

    try {
      await space.writePage(notePath, noteContent);
      console.log("Note created successfully!");
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  } else {
    console.log("User cancelled the input dialog.");
  }
}
