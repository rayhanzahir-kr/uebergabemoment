const ANIMATION_THEMES = {
  luxury: 'Luxuriös & elegant – sanft, edel und hochwertig',
  cinematic: 'Filmreif & dramatisch – dunkel, groß und emotional',
  modern: 'Modern & dynamisch – lebendig, hell und sportlich'
};

function currentAnimationTheme() {
  const saved = readShowSetting('showAnimationTheme');
  return ANIMATION_THEMES[saved] ? saved : 'luxury';
}

function applyAnimationTheme(theme) {
  const validTheme = ANIMATION_THEMES[theme] ? theme : 'luxury';
  document.body.dataset.animationTheme = validTheme;
  writeShowSetting('showAnimationTheme', validTheme);
  return validTheme;
}

function readShowSetting(key) {
  // Carry the greeting between local files and browsers that block storage.
  if (key === 'Anrede' || key === 'Name') {
    const greeting = new URLSearchParams(window.location.hash.slice(1));
    if (greeting.has(key)) return greeting.get(key);
  }
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function writeShowSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* Site stays usable without storage. */ }
}

function replayThemeAnimation() {
  document.body.classList.add('theme-replaying');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('theme-replaying');
  }));
}

function navigateWithAnimation(target) {
  if (!['index.html', 'page2.html'].includes(target)) return;
  if (document.body.classList.contains('page-leaving')) return;
  const destination = new URL(target, window.location.href);
  const musicSelect = document.getElementById('musicSelect');
  const music = musicSelect ? musicSelect.value :
    (typeof selectedMusicTrack === 'function' ? selectedMusicTrack().value : null);
  if (music) destination.searchParams.set('music', music);
  const greeting = new URLSearchParams();
  for (const key of ['Anrede', 'Name']) {
    const input = document.getElementById(key);
    const value = input ? input.value.trim() : readShowSetting(key);
    if (value !== null) greeting.set(key, value);
  }
  // Fragments keep customer names out of HTTP requests to the web server.
  destination.hash = greeting.toString();
  window.dispatchEvent(new Event('show-navigation'));
  document.body.classList.add('page-leaving');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => { window.location.href = destination.href; }, reduceMotion ? 0 : 520);
}

window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));

document.addEventListener('DOMContentLoaded', function () {
  const theme = applyAnimationTheme(currentAnimationTheme());
  const select = document.getElementById('animationThemeSelect');
  const description = document.getElementById('animationThemeDescription');

  if (select) {
    select.value = theme;
    if (description) description.textContent = ANIMATION_THEMES[theme];
    select.addEventListener('change', function () {
      const selected = applyAnimationTheme(select.value);
      if (description) description.textContent = ANIMATION_THEMES[selected];
      replayThemeAnimation();
    });
  }

  document.getElementById('animationPreview')?.addEventListener('click', replayThemeAnimation);

  requestAnimationFrame(() => document.body.classList.add('page-ready'));
});
