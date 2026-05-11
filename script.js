const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwze2m1q7tIIPbWWGh8MiQTG54J5gE7D2a6c-1HEL9eJMQ90FDcCZiv9yjNCwYLw-iA/exec";

const videoWatched = {
  'video-1': false,
  'video-2': false,
  'video-3': false,
};

const savedFormState = {};

function saveFormState() {
  REQUIRED_FIELDS.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if (checked) {
      savedFormState[name] = checked.value;
      return;
    }
    const select = document.querySelector(`select[name="${name}"]`);
    if (select && select.value !== '') {
      savedFormState[name] = select.value;
    }
  });
}

function restoreFormState() {
  Object.entries(savedFormState).forEach(([name, value]) => {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      return;
    }
    const select = document.querySelector(`select[name="${name}"]`);
    if (select) select.value = value;
  });
}

function navigateTo(pageId) {
  const currentActive = document.querySelector('.page.active');

  if (currentActive && currentActive.id === 'page-5') {
    saveFormState();
  }

  if (currentActive) {
    const playingVideo = currentActive.querySelector('video');
    if (playingVideo) playingVideo.pause();
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  setTimeout(() => {
    const target = document.getElementById(pageId);
    if (!target) return;

    target.classList.add('active');

    if (pageId === 'page-5') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      restoreFormState();
    } else {
      target.scrollTop = 0;
    }

    syncVideoButtonState();

    checkWatermark();
  }, 80);
}

function syncVideoButtonState() {
  const videoButtonMap = {
    'video-1': 'btn-next-2',
    'video-2': 'btn-next-3',
    'video-3': 'btn-next-4',
  };

  Object.entries(videoButtonMap).forEach(([videoId, btnId]) => {
    if (videoWatched[videoId]) {
      unlockButton(btnId);
    }
  });
}

const fixedWatermark = document.querySelector('.watermark-fixed');

function isNearBottom(el, threshold = 32) {
  if (!el) return false;
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

function checkWatermark() {
  if (!fixedWatermark) return;

  const activePage = document.querySelector('.page.active');
  if (!activePage) return;

  const isQuestionnaire = activePage.id === 'page-5';
  let atBottom;

  if (isQuestionnaire) {
    atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 32;
  } else {
    atBottom = isNearBottom(activePage);
  }

  fixedWatermark.classList.toggle('watermark-visible', atBottom);
}

window.addEventListener('scroll', checkWatermark, { passive: true });

function unlockButton(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.disabled = false;
  btn.classList.remove('disabled');

  const hint = btn.closest('.nav-row')?.querySelector('.watch-hint');
  if (hint) hint.classList.add('hidden');
}

function onVideoEnded(videoId, btnId) {
  videoWatched[videoId] = true;
  unlockButton(btnId);
}

function onVideoFallback(videoId, btnId) {
  videoWatched[videoId] = true;
  unlockButton(btnId);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.page:not(.questionnaire)').forEach(page => {
    page.addEventListener('scroll', checkWatermark, { passive: true });
  });

  checkWatermark();

  const videoButtonMap = {
    'video-1': 'btn-next-2',
    'video-2': 'btn-next-3',
    'video-3': 'btn-next-4',
  };

  Object.entries(videoButtonMap).forEach(([videoId, btnId]) => {
    const video = document.getElementById(videoId);
    if (!video) return;

    video.addEventListener('timeupdate', () => {
      if (video.duration && video.currentTime >= video.duration - 0.5) {
        onVideoEnded(videoId, btnId);
      }
    });
  });
});

const REQUIRED_FIELDS = [
  'age', 'gender', 'education',
  'track1_emotion', 'track1_realism', 'track1_sync', 'track1_quality',
  'track2_emotion', 'track2_realism', 'track2_sync', 'track2_quality',
  'track3_emotion', 'track3_realism', 'track3_sync', 'track3_quality',
  'preferred_track',
];

function collectFormData() {
  const data = {};
  let allAnswered = true;

  REQUIRED_FIELDS.forEach(name => {
    let element = document.querySelector(`input[name="${name}"]:checked`);

    if (!element) {
      const select = document.querySelector(`select[name="${name}"]`);
      if (select && select.value !== '') element = select;
    }

    if (element) {
      data[name] = element.value;
    } else {
      allAnswered = false;
    }
  });

  return allAnswered ? data : null;
}

async function handleSubmit(event) {
  event.preventDefault();

  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  const data = collectFormData();
  if (!data) {
    errorEl.style.display = 'block';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  errorEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('Submission error:', err);
  }

  navigateTo('page-6');
}