# TLC Storyworks · Writing Tools

A small collection of customizable browser-based tools for writers and other storytellers.

The goal is to make useful, lightweight tools that can work in several places: standalone in a browser, embedded on a website, used as an OBS/Streamlabs browser source, or adapted for a community. TLC Storyworks provides a shared appearance system so each tool can keep the project’s default look while also being themed by the person using it.

See the [public roadmap](https://tlcstoryworks.github.io/writer-tools/roadmap/) for a quick look at what's brewing, or keep scrolling for the full development roadmap.

TLC Storyworks is also an open community project. If you have ideas, feedback, or questions, join the [GitHub Discussions](https://github.com/tlcstoryworks/writer-tools/discussions). If these tools are useful to you and you'd like to help support their development, you can [sponsor TLC Storyworks](https://github.com/sponsors/tlcstoryworks).

## Current tools

### Writing Stream Timer

A simple Pomodoro timer for writing sprints, body doubling, creative streams, and focused work.

- Fixed Pomodoro presets: 25/5, 15/5, and 50/10
- Includes short breaks and a longer break at the end of each session
- Built-in Web Audio cues for starting writing, ending sprints, breaks, and session completion
- Sound on/off, volume, and test controls saved locally in the browser
- Viewer mode for OBS/Streamlabs
- Appearance themes and configurable colors/typography
- No manuscript integration or writing-content tracking
- Static GitHub Pages-friendly setup

Open it at:

- `/timer/` — public Pomodoro timer and controls
- `/timer/?viewer&theme=<preset>` — transparent viewer/stream overlay using the selected appearance preset

Ceri's configurable stream timer lives at an unlinked direct URL under `/timer/ceri/`. It is not linked from the public toolbox and is intended as a personal workflow tool.

### Countdown

A customizable countdown for writing sessions, events, streams, and focused work.

- Duration countdowns or target date/time
- Optional count-up after zero
- Large display for standalone use
- Viewer mode for OBS/Streamlabs
- Embed mode for websites and other workspaces
- Browser-local settings

Open it at:

- `/countdown/` — full countdown and controls
- `/countdown/?viewer` — transparent viewer/stream display
- `/countdown/?embed` — interactive transparent embed

### Word Tracker

A manual word-count tracker for writers who want to log the words they add without giving the tool access to their manuscript.

- Project name and optional word-count goal
- Starting count for existing projects
- Primary “Add words” workflow
- Optional notes and dates for individual entries
- Current count, today's words, active-day average, and required pace
- Optional start and end dates
- Browser-local history
- Viewer mode for OBS/Streamlabs
- Embed mode for websites and other workspaces
- No manuscript integration or writing-content tracking

Open it at:

- `/word-tracker/` — full tracker and controls
- `/word-tracker/?viewer` — progress display for streams
- `/word-tracker/?embed` — interactive transparent embed

The tracker stores its project data locally in the browser. Appearance settings are shared across TLC Storyworks tools in the same browser, including theme colors, fonts, text size, and line spacing.

## Project structure

```
/
├── index.html          # Writing Tools landing page
├── style.css           # Landing page styles
├── timer/
│   ├── index.html          # public fixed Pomodoro timer
│   ├── public-style.css
│   ├── public-app.js
│   ├── style.css           # private configurable timer styles
│   ├── app.js              # private configurable timer app
│   ├── config.js
│   └── ceri/               # unlinked personal timer page
├── word-tracker/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── countdown/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── project-management/
│   ├── index.html          # scaffolding / future project-management tools
│   ├── style.css
│   ├── app.js
│   ├── config.js
│   └── README.md
├── theme.css         # Shared appearance/theme styles
├── theme.js          # Shared appearance/theme controls
├── links.css         # Shared link and navigation styles
├── embed.js          # Shared viewer/embed mode and URL helpers
└── ...
```

Future tools will live in their own folders so each widget can remain small, understandable, and independently useful.

Possible additions include project/progress tools, countdowns, session notes, prompt tools, writing games, challenge helpers, and small stream widgets.

## Design principles

### Writer-first, not manuscript-first

These tools should not need to read someone's manuscript to be useful. When a tool can work from manual input or configuration, that is the default.

### Platform-neutral

A tool should be useful whether someone is writing in Word, Scrivener, Google Docs, a web editor, Notion, or something else entirely.

### Adaptable

Tools should be easy to customize, fork, theme, and reuse in different communities or creative spaces.

### Small and composable

Rather than building one giant application, this project is a toolbox of focused widgets that can eventually share common infrastructure.

### Accessible by design

Accessibility should be part of the foundation, not a final pass. Tools should aim to support keyboard navigation, screen readers, readable contrast and text, reduced motion, touch-friendly controls, responsive layouts, and users with different physical, sensory, and cognitive needs. Optional effects and displays should stay optional when practical.

## GitHub Pages

This repository is intended to be hosted with GitHub Pages.

The project site will use the repository's GitHub Pages URL with relative links, so the tools can also be forked without rewriting their paths.

## Roadmap

### Foundation
- [x] Move the timer into its own tool directory
- [x] Create a toolbox landing page
- [x] Add viewer and embed URL modes
- [x] Accessibility foundation and testing
- [x] Shared appearance/theme infrastructure
- [x] Theme presets and configurable colors
- [x] Configurable fonts and typography
- [x] Shared embed/display infrastructure
- [ ] Documentation for stream software and embeds

### Writing & Progress
- [x] Word tracker
- [x] Writing session / sprint tools
- [ ] Project and progress tracker — on hold for review
- [ ] Writing goals and deadlines — on hold with project tracker review
- [ ] Writing log / session history — on hold with project tracker review
- [ ] Optional gentle streak tracking
- [x] Chapter tracker
- [x] Scene tracker
- [ ] Book / series tracker

### Prompts & Creative Tools
- [ ] Prompt Generator / Prompt Deck — dice, card, or mixed generation using separate Who / What / When / Where / Why / How prompt pools
- [ ] Character prompt generator
- [ ] Scene prompt generator
- [ ] Conflict generator
- [ ] Sensory-detail and five-senses prompts
- [ ] Random word / object / detail tools
- [ ] Writing challenge generator
- [ ] Book Page Generator — turn pasted excerpts into novel-style page images for sharing

### Challenges & Community
- [ ] Challenge builder
- [ ] Challenge tracker
- [ ] Calendar / challenge progress view
- [ ] Submission and external-link tracking
- [ ] Writing game toolkit
- [ ] Customizable crawl/adventure-style writing games — early prototypes are now in playtesting: [The Midnight Train](https://tlcstoryworks.github.io/writer-tools/prototype/crawl/) and [The Lost Woods](https://tlcstoryworks.github.io/writer-tools/prototype/crawl/lost-woods/)
- [ ] Shareable game configurations

### Stream & Embed Widgets
- [ ] Current activity widget
- [ ] Writing goal widget
- [ ] Session progress widget
- [ ] Break / chat widget
- [ ] Minimal stream display widgets
- [ ] Copyable embed URLs / iframe snippets
- [ ] OBS / Streamlabs display presets

### Utilities & Accessibility
- [ ] Random choice / dice / roll tools
- [ ] Writing math and conversion tools
- [x] Countdown widget
- [ ] Session notes
- [ ] Large-text and low-stimulation display options
- [ ] Reduced-motion and high-contrast options
- [ ] Additional keyboard, screen-reader, and touch testing

### Future / Physical Extensions
- [ ] Design Prompt Deck data so digital cards can also support future printable/physical decks
- [ ] Explore printable Prompt Deck exports once the digital system is established

## License

MIT. See LICENSE.
