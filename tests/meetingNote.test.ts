import { assertEquals } from "https://deno.land/std/assert/assert_equals.ts";
import { sanitizeTitle, parseDateWithFormats } from "../utils.ts";
// Assuming `dayjs` or similar date utility is used and imported correctly


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
  assertEquals(sanitizeTitle("  [tag] meeting1  "), "tag meeting1");
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
