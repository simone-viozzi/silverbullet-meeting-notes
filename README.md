# SilverBullet Meeting Notes

This SilverBullet plug-in facilitates the creation of meeting notes from a template, utilizing user-specified dates and titles. It incorporates features such as dynamic date parsing, title sanitization, configuration validation, and error handling to enhance user experience and efficiency.

## Features

- **Dynamic Date Parsing**: Supports flexible date and time formats, intelligently adjusting to future dates if the entered time has already passed.
- **Title Sanitization**: Removes special characters and excessive spaces from meeting titles, ensuring valid and clean file names.
- **Configuration Validation**: Validates user settings against a schema to ensure necessary configurations are in place, enhancing reliability.
- **Error Handling**: Offers descriptive error messages for various failure scenarios, including configuration errors and input validation failures.

## Configuration

Before utilizing the plug-in, you must configure the `meetingNoteTemplatePath` and `meetingNoteBasePath` in your settings. These paths dictate where the template is located and where the meeting notes are saved, respectively.

```yaml
meetingNote:
  meetingNoteTemplatePath: "/path/to/template"
  meetingNoteBasePath: "/path/to/meeting/notes"
```

## Usage

To generate a new meeting note, invoke the `meetingNote` function with a date and title in the input string. The function will parse the date and time, format it alongside the title, and utilize the specified template to create the meeting note.

### Input Format

The input format is `<date> <title>`, where `<date>` can vary (e.g., `DD_HH-mm`, `HH:mm`, `DD_HH`), and `<title>` is a descriptive string of the meeting's focus.

### Examples

#### Date Parsing Logic

Assuming today is 2024-03-27_14-00, and the meeting title is "meeting":

1. `meetingNote("28_14:30 meeting")` -> `2024-03-28_14-30 - meeting` because the specified date and time are in the future relative to the current date and time.
2. `meetingNote("9 meeting")` -> `2024-03-28_09-00 - meeting` because specifying only an hour ("9") sets the meeting for the next occurrence of 9:00 AM, which is the next day due to the current time being past 9:00 AM.
3. `meetingNote("1_16:45 meeting")` -> `2024-04-01_16-45 - meeting` When the user inputs "1_16:45 meeting", the script interprets "1" as the day of the month and "16:45" as the time. Since the current date is 2024-03-27, and the day "1" is in the future relative to the current day of the month, the meeting is scheduled for the next occurrence of the 1st day, which is April 1st, 2024, at 16:45.
4. `meetingNote("15_09 meeting")` -> `2024-04-15_09-00 - meeting` The user inputs "15_09 meeting", indicating the meeting should be scheduled for the 15th day of the month at 09:00. Given the script's logic and the current date of 2024-03-27, the 15th day of the current month has already passed. Therefore, the script schedules the meeting for the next occurrence of the 15th day, which is on April 15th, 2024, at 09:00. The script's logic adjusts based on whether the specified day has already passed within the current month, without considering if today's date is after the specified date within the same month.
5. `meetingNote("23:59 meeting")` -> `2024-03-27_23-59 - meeting` because specifying a time without a day sets the meeting for today at the specified time, unless it's already past that time.
6. `meetingNote("12 meeting")` -> `2024-03-28_12-00 - meeting` When the input is "12 meeting," it indicates the user intends to schedule a meeting at 12:00 in the 24-hour clock format, which is noon. The script interprets "12" as 12:00. Given that the script's current reference time is past 12:00 on March 27th, 2024, it schedules the meeting for the next day, March 28th, 2024, at 12:00.
7. `meetingNote("05:30 meeting")` -> `2024-03-28_05-30 - meeting` because the time is in the future relative to the current time, setting the meeting for the next occurrence of 5:30 AM.
8. `meetingNote("20_18:00 meeting")` -> `2024-04-20_18-00 - meeting` if today is April 21st or later, scheduling the meeting for the 20th of the next month at 6:00 PM.
9. `meetingNote("30 meeting")` -> "Error" because "30" is not a valid time format and would be caught by user input validation, demonstrating the importance of correct format adherence.

#### Title Sanitization Logic

Assuming today is 2024-03-27_14-00:

1. `meetingNote("10 Team Meeting @ 10:00")` -> `2024-03-28_10-00 - Team Meeting - 10 - 00` When the title "Team Meeting @ 10:00" undergoes sanitization, the script replaces special characters like "@" with hyphens and ensures that these hyphens are surrounded by spaces if not already. Therefore, the sanitized title becomes "Team Meeting - 10:00". It's important to note that the script does not include the "10" at the beginning in the title; it represents part of the date input and is not involved in the title sanitization process. Hence, the correct format after parsing the date and sanitizing the title would be `2024-03-28_10-00 - Team Meeting - 10 - 00`.
2. `meetingNote("10 Project---Kickoff")` -> `2024-03-28_10-00 - Project - Kickoff` because consecutive hyphens are collapsed into a single hyphen.
3. `meetingNote("10  Strategy & Planning  ")` -> `2024-03-28_10-00 - Strategy - Planning` The input title "Strategy & Planning" will be processed by the script to replace special characters and symbols with hyphens and to remove any leading or trailing spaces. The ampersand ("&") is a special character and is thus replaced with a hyphen. However, the script also collapses multiple spaces and hyphens into single instances and ensures proper spacing around hyphens. As a result, the sanitized title is "Strategy - Planning", demonstrating the script's approach to creating clean and consistent titles suitable for filenames or note titles.
4. `meetingNote("10 Budget_Review|2024")` -> `2024-03-28_10-00 - Budget - Review - 2024` because underscores and vertical bars are replaced with hyphens.
5. `meetingNote("10 Q4#Sales>Results")` -> `2024-03-28_10-00 - Q4 - Sales - Results` bIn the case of "Q4#Sales>Results", the title sanitization process involves replacing both the hash ("#") and the greater-than sign (">") with hyphens, as these are considered special characters according to the script's logic. Moreover, the script ensures that these replacements result in only single instances of hyphens and that there are no consecutive hyphens. Therefore, after sanitization, the title becomes "Q4 - Sales - Results".
6. `meetingNote("10 EndOfYear!Celebration")` -> `2024-03-28_10-00 - EndOfYear - Celebration` because exclamation marks are replaced with hyphens.
7. `meetingNote("10 New--Product Launch++")` -> `2024-03-28_10-00 - New - Product Launch` because extra hyphens and pluses are removed for clarity.
8. `meetingNote("10 Client:Feedback Session")` -> `2024-03-28_10-00 - Client - Feedback Session` because colons are replaced with hyphens.
9. `meetingNote("10 Quarterly Review/2024")` -> `2024-03-28_10-00 - Quarterly Review - 2024`


## Note

This plug-in aims to boost your productivity by streamlining the creation of meeting notes. It respects your configurations and offers helpful feedback in case of errors or misconfigurations. Ensure your settings are accurate and current to fully benefit from this tool.

## Build and Installation

To build this plug-in, ensure [SilverBullet is installed](https://silverbullet.md/install). Build the plug-in with:

```shell
deno task build
```

Or to watch for changes and rebuild automatically

```shell
deno task watch
```

Then, copy the resulting `.plug.js` file into your space's `_plug` folder. Or build and copy in one command:

```shell
deno task build && cp *.plug.js /my/space/_plug/
```

SilverBullet will automatically sync and load the new version of the plug (or speed up this process by running the {[Sync: Now]} command).

## Installation

If you would like to install this plug straight from Github, make sure you have the `.js` file committed to the repo and simply add

```yaml
- github:simone-viozzi/silverbullet-meeting-notes/meetingNote.plug.js
```

to your `PLUGS` file, run `Plugs: Update` command and off you go!
