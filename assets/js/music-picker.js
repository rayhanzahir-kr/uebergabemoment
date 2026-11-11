// Add tracks here only after placing their MP3 files in assets/audio/.
const SHOW_MUSIC = [
  { value: 'music1.mp3', label: 'Musik 1' },
  { value: 'music2.mp3', label: 'Musik 2', version: '5a2be0342089' },
  { value: 'music3.mp3', label: 'Musik 3', version: '12f18c6b4c00' },
   { value: 'music4.mp3', label: 'Musik 4' },
   { value: 'music5.mp3', label: 'Musik 5' },
  { value: 'music6.mp3', label: 'Musik 6' }
];

const MUSIC_FOLDER = 'assets/audio/';

function selectedMusicPath() {
  return musicTrackPath(selectedMusicTrack());
}

function musicTrackPath(track) {
  return MUSIC_FOLDER + track.value + (track.version ? '?v=' + encodeURIComponent(track.version) : '');
}

function selectedMusicLabel() {
  return selectedMusicTrack().label;
}

function selectedMusicTrack() {
  const requested = new URLSearchParams(window.location.search).get('music');
  const  requestedTrack = SHOW_MUSIC.find(track => track.value === requested);
  if (requestedTrack) return requestedTrack;
  const selected = readShowSetting('showMusic');
  return SHOW_MUSIC.find(track => track.value === selected) || SHOW_MUSIC[0];
}

function selectedMusicVolume() {
  const stored = readShowSetting('showMusicVolume');
  const value = stored === null ? 70 : Number(stored);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) / 100 : .7;
}

// Follow media time so pauses and buffering also pause the ending fade.
function applyEndingFade(media, timeline = media, enabled = () => true) {
  let frame = null;

  function updateVolume() {
    if (!enabled()) return;
    const duration = timeline.duration;
    let gain = 1;
    if (Number.isFinite(duration) && duration > 0) {
      const remaining = Math.max(0, duration - timeline.currentTime);
      const progress = Math.min(1, remaining / Math.min(6, duration));
      // Smoothstep eases into the fade and reaches silence before stopping.
      gain = progress * progress * (3 - 2 * progress);
    }
    media.volume = selectedMusicVolume() * gain;
  }

  function tick() {
    frame = null;
    updateVolume();
    if (!timeline.paused && !timeline.ended) frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame !== null) cancelAnimationFrame(frame);
    tick();
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    updateVolume();
  }

  timeline.addEventListener('play', start);
  timeline.addEventListener('playing', start);
  for (const event of ['timeupdate', 'loadedmetadata', 'durationchange', 'seeking', 'seeked']) {
    timeline.addEventListener(event, updateVolume);
  }
  timeline.addEventListener('pause', stop);
  timeline.addEventListener('ended', stop);
  window.addEventListener('pagehide', stop);
  return updateVolume;
}

function initialiseMusicPicker() {
  const select = document.getElementById('musicSelect');
  const preview = document.getElementById('musicPreview');
  const status = document.getElementById('musicStatus');
  const volume = document.getElementById('musicVolume');
  const volumeValue = document.getElementById('musicVolumeValue');

  if (!select || !preview) return;

  select.replaceChildren(...SHOW_MUSIC.map(track => new Option(track.label, track.value)));
  const saved = selectedMusicTrack().value;
  select.value = saved;
  const previewAudio = new Audio();
  previewAudio.preload = 'metadata';
  const updatePreviewVolume = applyEndingFade(previewAudio);

  const savedVolume = Math.round(selectedMusicVolume() * 100);
  if (volume) volume.value = savedVolume;
  previewAudio.volume = savedVolume / 100;
  if (volumeValue) volumeValue.textContent = savedVolume + '%';

  let previewRequest = 0;
  function stopPreview() {
    previewRequest++;
    previewAudio.pause();
    try { previewAudio.currentTime = 0; } catch (_) {}
    preview.textContent = '▶ Vorschau';
    if (status) status.textContent = 'Ausgewählt: ' + selectedMusicLabel();
  }

  function saveSelection() {
    writeShowSetting('showMusic', select.value);
    const url = new URL(window.location.href);
    url.searchParams.set('music', select.value);
    try { window.history.replaceState(null, '', url.href); } catch (_) {}
    stopPreview();
    if (status) status.textContent = 'Ausgewählt: ' + select.options[select.selectedIndex].text;
  }

  select.addEventListener('change', saveSelection);
  if (volume) {
    volume.addEventListener('input', function () {
      writeShowSetting('showMusicVolume', volume.value);
      updatePreviewVolume();
      if (volumeValue) volumeValue.textContent = volume.value + '%';
    });
  }
  preview.addEventListener('click', async function () {
    if (!previewAudio.paused) { stopPreview(); return; }
    const request = ++previewRequest;
    previewAudio.src = musicTrackPath(SHOW_MUSIC.find(track => track.value === select.value) || SHOW_MUSIC[0]);
    if (status) status.textContent = 'Musik wird geladen …';
    try {
      await previewAudio.play();
      if (request !== previewRequest) return;
      preview.textContent = '■ Stoppen';
      if (status) status.textContent = 'Vorschau läuft';
    } catch (error) {
      if (request !== previewRequest) return;
      preview.textContent = '▶ Vorschau';
      if (!status) return;
      if (error.name === 'NotAllowedError') {
        status.textContent = 'Wiedergabe blockiert – bitte erneut auf Vorschau klicken.';
      } else if (error.name === 'AbortError') {
        status.textContent = 'Wiedergabe unterbrochen – bitte erneut versuchen.';
      } else if (previewAudio.error?.code === 3) {
        status.textContent = 'Audiodatei konnte nicht dekodiert werden – bitte eine gültige MP3 verwenden.';
      } else {
        status.textContent = 'Musik konnte nicht geladen werden: ' + select.value + '. Bitte Dateipfad und Audioformat prüfen.';
      }
    }
  });

  previewAudio.addEventListener('ended', stopPreview);
  window.addEventListener('pagehide', stopPreview);
  window.addEventListener('show-navigation', stopPreview);
  saveSelection();
}

document.addEventListener('DOMContentLoaded', initialiseMusicPicker);
