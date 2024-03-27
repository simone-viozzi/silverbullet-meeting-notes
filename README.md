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

Assuming the current date and time is `2024-03-27 10:00`, the following examples illustrate how to employ the `meetingNote` function:

- `meetingNote("28_14:30 Project Kickoff")` generates a note titled "2024-03-28_14-30 - Project Kickoff".
- `meetingNote("9 Review Meeting")` schedules a note for the following day at 9:00 titled "2024-03-28_09-00 - Review Meeting".
- `meetingNote("10 Strategy Session")` creates a note for the current day at 10:00 titled "2024-03-27_10-00 - Strategy Session".
- `meetingNote("30_10 Budget Planning")` results in a note for the specified day at 10:00 titled "2024-03-30_10-00 - Budget Planning".
- `meetingNote("5_16 Vendor Discussion")` adjusts to the next month, creating a note titled "2024-04-05_16-00 - Vendor Discussion".

Ensure your meeting titles are meaningful. The logic for date and time parsing will manage the details, generating your meeting note based on the provided template.

## Note

This plug-in aims to boost your productivity by streamlining the creation of meeting notes. It respects your configurations and offers helpful feedback in case of errors or misconfigurations. Ensure your settings are accurate and current to fully benefit from this tool.

## Build and Installation

To build this plug-in, ensure [SilverBullet is installed](https://silverbullet.md/install). Build the plug-in with:

```shell
deno task build
```

Or, to automatically rebuild upon changes:

```shell
deno task watch
```

Then, copy the resulting `.plug.js` file into your space's `_plug` folder. For convenience, you can build and copy in one command:

```shell
deno task build && cp *.plug.js /path/to/your/space/_plug/
```

SilverBullet will automatically recognize and load the new version of the plug-in. You can expedite this process by executing the {[Sync: Now]} command.

To install directly from GitHub, ensure the `.js` file is committed to your repo and add the following to your `PLUGS` file:

```yaml
- github:simone-viozzi/silverbullet-meeting-notes/meetingNote.plug.js
```

Run the `Plugs: Update` command to complete the installation.
