/* =========================================================
   بن السعودي: branded video player for the shop tour
   ========================================================= */
(function () {
  'use strict';

  const player = document.getElementById('player');
  if (!player) return;

  const $ = (id) => document.getElementById(id);
  const video = $('playerVideo');
  const big = $('playerBig');
  const toggleBtn = $('playerToggle');
  const muteBtn = $('playerMute');
  const fullBtn = $('playerFull');
  const track = $('playerTrack');
  const fill = $('playerFill');
  const buffer = $('playerBuffer');
  const thumb = $('playerThumb');
  const timeEl = $('playerTime');
  const durEl = $('playerDur');
  const t = (k) => window.SOODY.t(k);

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  function togglePlay() {
    if (video.paused || video.ended) video.play();
    else video.pause();
  }

  function setLabels() {
    const playing = !video.paused && !video.ended;
    toggleBtn.setAttribute('aria-label', t(playing ? 'player.pause' : 'player.play'));
    muteBtn.setAttribute('aria-label', t(video.muted ? 'player.unmute' : 'player.mute'));
  }

  function paintProgress() {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = pct + '%';
    thumb.style.left = pct + '%';
    track.setAttribute('aria-valuenow', Math.round(pct));
    track.setAttribute('aria-valuetext', `${fmt(video.currentTime)} / ${fmt(video.duration)}`);
    timeEl.textContent = fmt(video.currentTime);
  }

  /* controls auto hide while playing */
  let idle;
  function wake() {
    player.classList.add('show-ui');
    clearTimeout(idle);
    idle = setTimeout(() => { if (!video.paused) player.classList.remove('show-ui'); }, 2500);
  }

  /* ---------------- events ---------------- */
  big.addEventListener('click', () => { video.play(); });
  toggleBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  video.addEventListener('play', () => { player.classList.add('is-playing'); setLabels(); wake(); });
  video.addEventListener('pause', () => { player.classList.remove('is-playing'); player.classList.add('show-ui'); setLabels(); });
  video.addEventListener('ended', () => { player.classList.remove('is-playing'); player.classList.add('show-ui'); setLabels(); });
  video.addEventListener('timeupdate', paintProgress);
  video.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(video.duration); paintProgress(); });
  video.addEventListener('progress', () => {
    if (video.buffered.length && video.duration) {
      buffer.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100 + '%';
    }
  });

  muteBtn.addEventListener('click', () => { video.muted = !video.muted; });
  video.addEventListener('volumechange', () => { player.classList.toggle('is-muted', video.muted); setLabels(); });

  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
  });
  document.addEventListener('fullscreenchange', () => {
    player.classList.toggle('is-full', document.fullscreenElement === player);
  });

  // seeking: drag along the track (always left to right)
  function seekFrom(e) {
    const r = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = ratio * video.duration;
    paintProgress();
  }
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId);
    player.classList.add('is-seeking');
    seekFrom(e);
  });
  track.addEventListener('pointermove', (e) => { if (track.hasPointerCapture(e.pointerId)) seekFrom(e); });
  track.addEventListener('pointerup', () => player.classList.remove('is-seeking'));

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 5); e.preventDefault(); }
  });
  player.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'k') && e.target.tagName !== 'BUTTON') { togglePlay(); e.preventDefault(); }
  });

  player.addEventListener('pointermove', wake);
  player.addEventListener('focusin', wake);

  document.addEventListener('soody:lang', setLabels);
  setLabels();
})();
