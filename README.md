# AOTY Score Hider

A Tampermonkey userscript that adds a toggle button to hide/show scores on Album of the Year (AOTY).

## Features

- Toggle button in the top-right corner to hide/show all scores
- Hides album scores, user scores, critic scores, track ratings, and must-hear badges
- Persistent state (remembers your preference across sessions)
- Works on all AOTY pages
- Clean, minimal interface

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on the Tampermonkey icon and select "Create a new script"
3. Copy the contents of `aoty-score-hider.user.js` and paste it into the editor
4. Save the script (Ctrl+S or Cmd+S)
5. Visit [Album of the Year](https://www.albumoftheyear.org/)

Alternatively, drag the `.user.js` file directly into your browser to install.

## Usage

Click the "Hide Scores" / "Show Scores" button in the top-right corner to toggle score visibility.

- Red button = Scores are hidden
- Green button = Scores are visible

## Inspector Tool

If the script is not hiding all scores, use the inspector tool to discover additional score elements:

1. Visit albumoftheyear.org
2. Open browser console (F12 > Console tab)
3. Copy and paste the contents of `inspector.js` into the console
4. Press Enter
5. The tool will output all score-related selectors found on the page
6. Copy the selectors and add them to the SCORE_SELECTORS array in the userscript

## Comprehensive Score Hiding

The script targets multiple types of score elements:

- Main rating displays
- Album and artist scores (critic and user)
- Track ratings
- Color-coded score indicators (red, yellow, green)
- Must-hear badges
- Review rows with scores
- Critic reviews section
- Elements with score/rating data attributes

## Credits

Inspired by the score hiding feature in [Rice's AOTY Add-ons](https://greasyfork.org/en/scripts/462348-rice-s-aoty-add-ons).

## License

MIT
