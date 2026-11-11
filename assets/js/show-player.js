'use strict';

// The MP4 remains unchanged; each theme adds a browser-rendered reveal layer.
document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('fullscreen-video');
  const audio = document.getElementById('showAudio');
  const overlay = document.getElementById('startOverlay');
  const startButton = document.getElementById('startShowButton');
  const originalButton = document.getElementById('originalAudioButton');
  const pauseButton = document.getElementById('playPauseButton');
  const notice = document.getElementById('audioNotice');
  const effects = document.querySelector('.show-effects');
  let useMusic = true;
  let started = false;
  let busy = false;
  let operation = 0;
  let audioRevision = 0;

  audio.src = selectedMusicPath();
  audio.volume = selectedMusicVolume();
  const backgroundVideo = document.getElementById('video-bg');
  const updateMusicVolume = applyEndingFade(audio, video, () => started);
  const updateOriginalVolume = applyEndingFade(video, video, () => started);

  function setBusy(value) {
    busy = value;
    startButton.disabled = value;
    originalButton.disabled = value;
    pauseButton.disabled = value;
  }

  function pauseAudio() {
    // Invalidates any background resume before pause() rejects its promise.
    audioRevision++;
    audio.pause();
  }

  function pauseAll() {
    pauseAudio();
    video.pause();
    document.body.classList.add('show-paused');
    pauseButton.textContent = 'Weiter';
  }

  function syncAudio() {
    if (!useMusic || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const target = video.currentTime % audio.duration;
    if (Math.abs(audio.currentTime - target) > .35) audio.currentTime = target;
  }

  function syncEffects() {
    if (!started || !document.getAnimations) return;
    for (const animation of document.getAnimations()) {
      const target = animation.effect?.target;
      if (target === video || target === effects) animation.currentTime = video.currentTime * 1000;
    }
  }

  // Never leave the screen waiting indefinitely for a missing/slow audio file.
  function playWithTimeout(media) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject({media, cause:{name:'TimeoutError'}}), 12000);
      const failed = cause => { clearTimeout(timer); reject({media, cause}); };
      try {
        Promise.resolve(media.play()).then(() => { clearTimeout(timer); resolve(); }, failed);
      } catch (cause) { failed(cause); }
    });
  }

  function showError(failure = {}) {
    operation++;
    started = false;
    pauseAll();
    setBusy(false);
    document.body.classList.remove('show-running');
    overlay.classList.remove('hidden');
    pauseButton.hidden = true;
    notice.dataset.state = 'error';
    originalButton.hidden = false;
    const media = failure.media || (video.error ? video : audio.error ? audio : null);
    const name = failure.cause?.name || '';
    const label = media === video ? 'Video' : media === audio ? 'Musik' : 'Show';
    if (name === 'NotAllowedError') {
      notice.textContent = 'Der Browser hat die Wiedergabe blockiert (' + label + '). Bitte erneut auf Start klicken.';
    } else if (name === 'TimeoutError') {
      notice.textContent = label + ' lädt zu lange. Bitte Verbindung prüfen und erneut starten.';
    } else if (name === 'AbortError') {
      notice.textContent = 'Der Start wurde unterbrochen (' + label + '). Bitte erneut starten.';
    } else if (media === video) {
      notice.textContent = 'Video konnte nicht geladen werden. Bitte die Originaldatei auf dem Server prüfen.';
    } else if (media === audio) {
      notice.textContent = 'Musik konnte nicht geladen werden. Bitte die Auswahl prüfen oder „Mit Originalton starten“ wählen.';
    } else {
      notice.textContent = 'Show konnte nicht gestartet werden. Bitte erneut versuchen.';
    }
  }

  async function startShow(withMusic) {
    if (busy) return;
    const request = ++operation;
    started = false;
    setBusy(true);
    pauseAll();
    useMusic = withMusic;
    notice.dataset.state = 'loading';
    notice.textContent = withMusic ? 'Video und Musik werden geladen …' : 'Video wird geladen …';
    video.muted = withMusic; // Do not mix embedded audio and the selected music.
    video.volume = selectedMusicVolume();
    try {
      video.currentTime = 0;
      audio.currentTime = 0;
      audio.volume = 0; // Silent until both media are ready and the reveal is visible.
      await Promise.all([playWithTimeout(video), withMusic ? playWithTimeout(audio) : Promise.resolve()]);
      if (request !== operation) return;
      // Loading speeds can differ; start both timelines at the reveal.
      video.currentTime = 0;
      audio.currentTime = 0;
      audio.volume = selectedMusicVolume();
      started = true;
      updateMusicVolume();
      updateOriginalVolume();
      notice.textContent = '';
      document.body.classList.remove('show-paused', 'show-ended');
      document.body.classList.add('show-running');
      overlay.classList.add('hidden');
      backgroundVideo?.pause();
      pauseButton.hidden = false;
      pauseButton.textContent = 'Pause';
      pauseButton.focus({ preventScroll: true });
    } catch (failure) {
      if (request === operation) showError(failure);
    } finally {
      if (request === operation) { setBusy(false); handleBuffering(); }
    }
  }

  startButton.addEventListener('click', () => startShow(true));
  originalButton.addEventListener('click', () => startShow(false));
  pauseButton.addEventListener('click', async () => {
    if (busy || !started) return;
    if (!video.paused) { pauseAll(); return; }
    const request = ++operation;
    setBusy(true);
    try {
      syncAudio();
      await Promise.all([playWithTimeout(video), useMusic ? playWithTimeout(audio) : Promise.resolve()]);
      if (request !== operation) return;
      document.body.classList.remove('show-paused');
      pauseButton.textContent = 'Pause';
    } catch (failure) { if (request === operation) showError(failure); }
    finally { if (request === operation) { setBusy(false); handleBuffering(); } }
  });

  video.addEventListener('pause', () => {
    // pause/waiting events are queued. Ignore stale events and events during
    // the user-start transaction so they cannot abort its audio.play().
    if (!started || busy || !video.paused || video.ended) return;
    pauseAudio();
    document.body.classList.add('show-paused');
  });
  function handleBuffering() {
    if (!started || busy || video.paused || video.readyState >= 3) return;
    pauseAudio();
    document.body.classList.add('show-paused');
  }
  video.addEventListener('waiting', handleBuffering);
  video.addEventListener('playing', () => {
    if (!started || busy || video.paused || video.readyState < 3) return;
    syncAudio();
    document.body.classList.remove('show-paused');
    if (useMusic && audio.paused) {
      const revision = ++audioRevision;
      playWithTimeout(audio).catch(failure => {
        // A second stall or a user pause deliberately cancels this request.
        if (revision !== audioRevision || !started || busy || video.paused) return;
        showError(failure);
      });
    }
  });
  video.addEventListener('timeupdate', () => { syncEffects(); if (!video.paused) syncAudio(); });
  video.addEventListener('ended', () => {
    // Finish at silence even if the browser skipped the final animation frame.
    audio.volume = 0;
    video.volume = 0;
    operation++;
    started = false;
    pauseAll();
    setBusy(false);
    document.body.classList.remove('show-running');
    document.body.classList.add('show-ended');
    pauseButton.hidden = true;
    notice.textContent = '';
    document.getElementById('feedbackButton').classList.add('show');
    document.getElementById('restartLink').hidden = false;
  });
  video.addEventListener('error', () => showError({media:video, cause:video.error}));
  audio.addEventListener('error', () => {
    if (started && useMusic) showError({media:audio, cause:audio.error});
  });
  function stopForNavigation() {
    operation++;
    started = false;
    setBusy(false);
    pauseAll();
    backgroundVideo?.pause();
  }
  window.addEventListener('pagehide', stopForNavigation);
  window.addEventListener('show-navigation', stopForNavigation);
});
