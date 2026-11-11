# Übergabemoment

A personalized vehicle handover experience for portrait digital signage.

Übergabemoment turns a customer's vehicle collection into a welcoming moment: enter their name, choose an animation style and soundtrack, then present a large welcome screen before playing the handover video. Designed for dealership displays, it runs as a lightweight static website with no backend or build step.

Suggested repository name: `uebergabemoment`.

## Features

- German interface for staff and customers.
- Personalized greetings for individuals and families.
- Large logo and typography designed for portrait displays, including 1080 × 1920.
- Three animation styles: luxurious, cinematic, and dynamic.
- Six selectable music tracks, previews, and volume control.
- Coordinated video and music playback with pause/resume and a six-second ending fade.
- Original video audio as a fallback when music cannot be played.
- Customer feedback link after the video ends.
- Reduced-motion support and keyboard focus indicators.

## Getting started

Open `index.html` in a browser, or serve the project folder using a static web server. A static server is recommended for consistent browser storage and media behavior. No package installation or compilation is required.

1. Enter the customer's salutation and name.
2. Select an animation style, music track, and volume. Use **Vorschau** to preview the music.
3. Select **Weiter zur Begrüßung** to open the customer-facing screen.
4. Put the signage browser into fullscreen mode and select **Show starten**.
5. Use **Pause** / **Weiter** during playback. After playback, open the feedback form or select **Neue Show**.

Playback requires a user interaction; the welcome background video is muted. The main video preserves its aspect ratio, so displays with a different aspect ratio may show black bars. Long names wrap, and the welcome screen can scroll on smaller displays.

## Project structure

```text
index.html                    Staff preparation screen
page2.html                    Welcome screen and video player
assets/css/show-layout.css    Shared layout and signage typography
assets/css/animation-themes.css
assets/css/music-picker.css
assets/js/animation-themes.js Theme selection, settings, and navigation
assets/js/music-picker.js     Music selection, preview, and volume fade
assets/js/show-player.js      Playback coordination and error handling
assets/images/               Dealership logo and background image
assets/videos/               Welcome background and handover video
assets/audio/                Six music tracks and setup notes
ANLEITUNG.txt                German operating and update instructions
```

## Customization

- **Branding:** replace `assets/images/Logo.png` and update its alternative text in both HTML files. The included installation retains Autohaus DIL branding; the project name is Übergabemoment.
- **Welcome video:** replace `assets/videos/your-background-video1.mp4`.
- **Handover video:** replace `assets/videos/your-background-video2.mp4`.
- **Music:** add MP3 files to `assets/audio/` and update `SHOW_MUSIC` in `assets/js/music-picker.js`.
- **Feedback:** update the URL in `goToFeedback()` in `page2.html`. The current URL points to the existing dealership form.
- **Appearance:** adjust the welcome typography and logo sizing in `assets/css/show-layout.css`.

## Deployment

Upload the HTML files and `assets/` directory to a static hosting service. Keep their relative paths and filename capitalization intact. For GitHub Pages, publish the repository root through the repository's Pages settings.

Local editor files, temporary exports, and video-processing tools are excluded through `.gitignore`. Media files remain part of the application and are not excluded.

## Data and dependencies

There is no application backend. The browser stores the name, salutation, theme, music, and volume in local storage when available. Names and salutations also travel between pages in URL fragments; the selected music uses a query parameter. Theme and volume persistence require local storage. Reset the name on shared devices between customers; local storage persists across browser sessions.

The preparation page requests the Inter font from Google Fonts and falls back to system fonts if unavailable. The feedback button opens an external Microsoft Forms page.

## Portfolio context and assets

This project demonstrates a real-world digital-signage workflow using HTML, CSS, and vanilla JavaScript: responsive portrait layouts, DOM-based personalization, animated transitions, browser media coordination, and playback failure handling.

The included dealership branding and media are separate from the generic project identity. This repository does not grant rights to third-party logos, music, or videos. No open-source license has been selected for the project.
