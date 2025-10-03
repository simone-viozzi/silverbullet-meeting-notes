import { assertEquals } from "https://deno.land/std/assert/assert_equals.ts";
import {
  formatTimestamp,
  parseDateWithFormats,
  sanitizeTitle,
} from "../utils.ts";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(customParseFormat);
dayjs.extend(isToday);

// Tests for forward prefix stripping
Deno.test("sanitizeTitle strips Fw: prefix", () => {
  assertEquals(sanitizeTitle("Fw: Meeting with team"), "Meeting with team");
});

Deno.test("sanitizeTitle strips FW: prefix", () => {
  assertEquals(sanitizeTitle("FW: Project Update"), "Project Update");
});

Deno.test("sanitizeTitle strips Fwd: prefix", () => {
  assertEquals(sanitizeTitle("Fwd: Budget Review"), "Budget Review");
});

Deno.test("sanitizeTitle strips FWD: prefix", () => {
  assertEquals(sanitizeTitle("FWD: Team Sync"), "Team Sync");
});

Deno.test("sanitizeTitle strips fwd: prefix (lowercase)", () => {
  assertEquals(sanitizeTitle("fwd: daily standup"), "daily standup");
});

Deno.test("sanitizeTitle strips Re: prefix", () => {
  assertEquals(sanitizeTitle("Re: Follow up meeting"), "Follow up meeting");
});

Deno.test("sanitizeTitle strips RE: prefix", () => {
  assertEquals(sanitizeTitle("RE: Important Discussion"), "Important Discussion");
});

Deno.test("sanitizeTitle strips prefix with extra spaces", () => {
  assertEquals(sanitizeTitle("Fw:    Meeting Notes"), "Meeting Notes");
});

Deno.test("sanitizeTitle strips prefix with leading spaces", () => {
  assertEquals(sanitizeTitle("  Fw: Meeting"), "Meeting");
});

Deno.test("sanitizeTitle handles Fw: with special characters", () => {
  assertEquals(sanitizeTitle("Fw: [Team] Meeting@10"), "Team - Meeting-10");
});

Deno.test("sanitizeTitle with special characters and consecutive hyphens", () => {
  assertEquals(sanitizeTitle("--[tag]++meeting1=="), "tag - meeting1");
});

Deno.test("sanitizeTitle with spaces", () => {
  assertEquals(sanitizeTitle("tag  meeting1"), "tag meeting1");
});

Deno.test("sanitizeTitle with a single special character", () => {
  assertEquals(sanitizeTitle("[tag]%meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with a special character and dash", () => {
  assertEquals(sanitizeTitle("[tag] - meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with multiple spaces", () => {
  assertEquals(sanitizeTitle("[tag]    meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with hyphens without spaces", () => {
  assertEquals(sanitizeTitle("tag-meeting1"), "tag-meeting1");
});

Deno.test("sanitizeTitle with colon", () => {
  assertEquals(sanitizeTitle("[tag]:meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with leading and trailing spaces", () => {
  assertEquals(sanitizeTitle("  [tag] meeting1  "), "tag - meeting1");
});

Deno.test("sanitizeTitle with @ symbol", () => {
  assertEquals(sanitizeTitle("[tag]@meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with # symbol", () => {
  assertEquals(sanitizeTitle("[tag]#meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with & symbol", () => {
  assertEquals(sanitizeTitle("[tag]&meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with multiple consecutive special characters", () => {
  assertEquals(sanitizeTitle("tag==@#meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with mixed spaces and hyphens", () => {
  assertEquals(sanitizeTitle("tag - -  meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with underscores", () => {
  assertEquals(sanitizeTitle("tag_meeting1"), "tag-meeting1");
});

Deno.test("sanitizeTitle with multiple types of special characters", () => {
  assertEquals(sanitizeTitle("tag&*#(@meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with numbers and special characters", () => {
  assertEquals(sanitizeTitle("tag123@meeting1"), "tag123-meeting1");
});

Deno.test("sanitizeTitle with only special characters", () => {
  assertEquals(sanitizeTitle("###@@@"), "");
});

Deno.test("sanitizeTitle with leading special characters before spaces", () => {
  assertEquals(sanitizeTitle("!!! tag meeting1"), "tag meeting1");
});

Deno.test("sanitizeTitle with trailing special characters after spaces", () => {
  assertEquals(sanitizeTitle("tag meeting1 !!!"), "tag meeting1");
});

Deno.test("sanitizeTitle with special characters between words", () => {
  assertEquals(sanitizeTitle("tag+++meeting+++1"), "tag - meeting - 1");
});

Deno.test("sanitizeTitle with special characters between words v2", () => {
  assertEquals(sanitizeTitle("1-3-$##@meeting+++1"), "1-3 - meeting - 1");
});

Deno.test("sanitizeTitle with alphanumeric and special characters mix", () => {
  assertEquals(sanitizeTitle("1a2b3c@@@meeting"), "1a2b3c - meeting");
});

Deno.test("sanitizeTitle with special characters at the start of words", () => {
  assertEquals(sanitizeTitle("[t-ag] meeting title"), "t-ag - meeting title");
});

Deno.test("sanitizeTitle with special characters inside words", () => {
  assertEquals(sanitizeTitle("[tag] meeting-title"), "tag - meeting-title");
});

Deno.test("parseDateWithFormats without day component, time after now", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("10:20", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-20");
});

Deno.test("parseDateWithFormats without day component, time before now", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("09:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-28_09-00");
});

Deno.test("parseDateWithFormats with day component, time after current time", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("30_10-00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-30_10-00");
});

Deno.test("parseDateWithFormats with day component, day before today", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("5_16-00", now)!;
  assertEquals(formatTimestamp(result), "2024-04-05_16-00");
});

Deno.test("parseDateWithFormats without day component, exact current time", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("10:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-00");
});

Deno.test("parseDateWithFormats with future day component, time before now", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("28_09-00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-28_09-00");
});

Deno.test("parseDateWithFormats with current day component, time far in future", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("27_20-00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_20-00");
});

Deno.test("parseDateWithFormats with past day component, rolls to next month", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("1_12-00", now)!;
  assertEquals(formatTimestamp(result), "2024-04-01_12-00");
});

Deno.test("parseDateWithFormats with invalid date string (missing time)", () => {
  const now = dayjs("2024-03-27T10:00:00");
  let passed = false;
  try {
    const result = parseDateWithFormats("27_", now);
    passed = result === undefined; // Should be true if result is correctly undefined
  } catch (_e) {
    passed = false;
  }
  assertEquals(passed, true);
});

Deno.test("parseDateWithFormats with time exactly 30 minutes before now", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("09:30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_09-30");
});

Deno.test("schedule a meeting for the first of the next month", () => {
  // Assuming the current date is the last day of March
  const now = dayjs("2024-03-31T10:00:00");
  const result = parseDateWithFormats("1_15-00", now)!;
  assertEquals(formatTimestamp(result), "2024-04-01_15-00");
});

Deno.test("schedule a meeting for the first of the next month", () => {
  // Assuming the current date is the last day of March
  const now = dayjs("2024-03-31T17:00:00");
  const result = parseDateWithFormats("15-00", now)!;
  assertEquals(formatTimestamp(result), "2024-04-01_15-00");
});

Deno.test("schedule a meeting at the end of February (common year)", () => {
  // Assuming the current date is the last day of February in a common year
  const now = dayjs("2023-02-28T10:00:00");
  const result = parseDateWithFormats("1_15-00", now)!;
  assertEquals(formatTimestamp(result), "2023-03-01_15-00");
});

Deno.test("schedule a meeting at the end of February (common year)", () => {
  // Assuming the current date is the last day of February in a common year
  const now = dayjs("2023-02-28T17:00:00");
  const result = parseDateWithFormats("15-00", now)!;
  assertEquals(formatTimestamp(result), "2023-03-01_15-00");
});

Deno.test("schedule a meeting at the end of February (leap year)", () => {
  // Assuming the current date is the last day of February in a leap year
  const now = dayjs("2024-02-29T10:00:00");
  const result = parseDateWithFormats("1_15-00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-01_15-00");
});

Deno.test("schedule a meeting for December 15 when it's currently December 15", () => {
  const now = dayjs("2024-12-15T10:00:00");
  const result = parseDateWithFormats("10_15-00", now)!;
  // Since the day is before the current day (considering months roll over),
  // it should schedule for January of the next year, adjusting for the described logic.
  assertEquals(formatTimestamp(result), "2025-01-10_15-00");
});

Deno.test("parseDateWithFormats with non-numeric values", () => {
  const now = dayjs("2024-03-27T10:00:00");
  let passed = false;
  try {
    const result = parseDateWithFormats("XX_YY-ZZ", now);
    passed = result === undefined; // Expecting undefined for invalid input
  } catch (_e) {
    passed = false; // Test fails if an error is thrown
  }
  assertEquals(passed, true);
});

Deno.test("parseDateWithFormats with completely incorrect formats", () => {
  const now = dayjs("2024-03-27T10:00:00");
  let passed = false;
  try {
    const result = parseDateWithFormats("incorrect format", now);
    passed = result === undefined; // Expecting undefined for invalid input
  } catch (_e) {
    passed = false; // Test fails if an error is thrown
  }
  assertEquals(passed, true);
});

Deno.test("parseDateWithFormats with empty string", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("", now);
  assertEquals(result, undefined);
});

Deno.test("parseDateWithFormats with partial inputs - missing minutes", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("10", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-00");
});

Deno.test("parseDateWithFormats at midnight", () => {
  const now = dayjs("2024-03-27T00:00:00");
  const result = parseDateWithFormats("27_00:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_00-00");
});

Deno.test("parseDateWithFormats at midday", () => {
  const now = dayjs("2024-03-27T12:00:00");
  const result = parseDateWithFormats("27_12:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_12-00");
});

Deno.test("parseDateWithFormats at one minute to midnight", () => {
  const now = dayjs("2024-03-27T23:59:00");
  const result = parseDateWithFormats("27_23:59", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_23-59");
});

Deno.test("parseDateWithFormats with different separators - colon", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("27_10:30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-30");
});

Deno.test("parseDateWithFormats with format DD_HH-mm", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("28_11-30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-28_11-30");
});

Deno.test("parseDateWithFormats with format DD_HH:mm", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("28_11:30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-28_11-30");
});

Deno.test("parseDateWithFormats with format DD_HH", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("28_11", now)!;
  // Assumes default minute of "00" if minutes are not specified
  assertEquals(formatTimestamp(result), "2024-03-28_11-00");
});

Deno.test("parseDateWithFormats with format HH:mm", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("11:30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_11-30");
});

Deno.test("parseDateWithFormats with format HH-mm", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("11-30", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_11-30");
});

Deno.test("parseDateWithFormats with format HH", () => {
  const now = dayjs("2024-03-27T10:00:00");
  const result = parseDateWithFormats("12", now)!;
  // Assumes default minute of "00" if minutes are not specified
  assertEquals(formatTimestamp(result), "2024-03-27_12-00");
});
