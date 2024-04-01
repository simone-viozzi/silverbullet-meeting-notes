import { assertEquals } from "https://deno.land/std/assert/assert_equals.ts";
import { sanitizeTitle, parseDateWithFormats, formatTimestamp } from "../utils.ts";

import dayjs from "https://esm.sh/dayjs";
import customParseFormat from "https://esm.sh/dayjs/plugin/customParseFormat.js";
import isToday from "https://esm.sh/dayjs/plugin/isToday.js";


dayjs.extend(customParseFormat);
dayjs.extend(isToday);

Deno.test("sanitizeTitle with special characters and consecutive hyphens", () => {
  assertEquals(sanitizeTitle("--[tag]++meeting1=="), "tag - meeting1");
});

Deno.test("sanitizeTitle with spaces", () => {
  assertEquals(sanitizeTitle("tag  meeting1"), "tag meeting1");
});

Deno.test("sanitizeTitle with a single special character", () => {
  assertEquals(sanitizeTitle("[tag]|meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with multiple spaces", () => {
  assertEquals(sanitizeTitle("[tag]    meeting1"), "tag - meeting1");
});

Deno.test("sanitizeTitle with hyphens without spaces", () => {
  assertEquals(sanitizeTitle("tag-meeting1"), "tag - meeting1");
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



Deno.test("parseDateWithFormats without day component, time after now", () => {
  const now = dayjs('2024-03-27T10:00:00');
  const result = parseDateWithFormats("10:20", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-20");
});

Deno.test("parseDateWithFormats without day component, time before now", () => {
  const now = dayjs('2024-03-27T10:00:00');
  const result = parseDateWithFormats("09:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-28_09-00");
});

Deno.test("parseDateWithFormats with day component, time after current time", () => {
  const now = dayjs('2024-03-27T10:00:00');
  const result = parseDateWithFormats("30_10-00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-30_10-00");
});

Deno.test("parseDateWithFormats with day component, day before today", () => {
  const now = dayjs('2024-03-27T10:00:00');
  const result = parseDateWithFormats("5_16-00", now)!;
  assertEquals(formatTimestamp(result), "2024-04-05_16-00");
});

Deno.test("parseDateWithFormats without day component, exact current time", () => {
  const now = dayjs('2024-03-27T10:00:00');
  const result = parseDateWithFormats("10:00", now)!;
  assertEquals(formatTimestamp(result), "2024-03-27_10-00");
});
