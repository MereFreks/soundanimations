/* ============================================================
   SCRIPT.JS
   Sound Effects Synthesis — Research Study Website

   Responsibilities:
   1. SPA-style page navigation with fade transitions
   2. Video "must watch" gating before Next button activates
   3. Form validation — all questions required
   4. Data collection and submission to Google Sheets via fetch()
   ============================================================ */


/* ── ❶ CONFIGURATION ─────────────────────────────────────────
   ↓↓ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE ↓↓
   Instructions:
     - Open Google Sheets → Extensions → Apps Script
     - Paste the doPost(e) handler (see README or docs)
     - Deploy as Web App → copy the URL → paste it below
   ──────────────────────────────────────────────────────────── */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwze2m1q7tIIPbWWGh8MiQTG54J5gE7D2a6c-1HEL9eJMQ90FDcCZiv9yjNCwYLw-iA/exec";


/* ── ❷ PAGE NAVIGATION ───────────────────────────────────────
   navigateTo(pageId) — hides current page and shows the target.
   All pages use CSS transitions (opacity + translateY).
   ──────────────────────────────────────────────────────────── */
function navigateTo(pageId) {
  // Hide every page
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  // Small delay so the outgoing fade completes before incoming starts
  setTimeout(() => {
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      // For the questionnaire page (which is in normal flow, not fixed),
      // scroll the window to the top so the heading is visible
      if (pageId === 'page-5') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        // For fixed-position pages, scroll the element itself
        target.scrollTop = 0;
      }
    }
  }, 80);
}


/* ── ❸ VIDEO GATING ──────────────────────────────────────────
   onVideoEnded(videoId, btnId) is called via the video's
   onended attribute. It enables the "Next" button and hides
   the "Please watch the video" hint.
   ──────────────────────────────────────────────────────────── */
function onVideoEnded(videoId, btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  // Enable the button
  btn.disabled = false;
  btn.classList.remove('disabled');

  // Find the sibling hint text and hide it
  // The hint is the next sibling <p> inside .nav-row
  const navRow = btn.parentElement;
  const hint = navRow ? navRow.querySelector('.watch-hint') : null;
  if (hint) hint.classList.add('hidden');
}

/* Optional: also allow the button after seeking to the end
   (user may scrub to end intentionally). We listen to timeupdate
   and check if currentTime is very close to duration. */
document.addEventListener('DOMContentLoaded', () => {
  // Map: video element id → button id
  const videoButtonMap = {
    'video-1': 'btn-next-2',
    'video-2': 'btn-next-3',
    'video-3': 'btn-next-4',
  };

  Object.entries(videoButtonMap).forEach(([videoId, btnId]) => {
    const video = document.getElementById(videoId);
    if (!video) return;

    video.addEventListener('timeupdate', () => {
      // If within 0.5 seconds of the end, count as "watched"
      if (video.duration && video.currentTime >= video.duration - 0.5) {
        onVideoEnded(videoId, btnId);
      }
    });
  });
});


/* ── ❹ FORM VALIDATION & SUBMISSION ─────────────────────────
   All 13 questions (4 per track × 3 tracks + 1 preference)
   must be answered before submission is allowed.
   ──────────────────────────────────────────────────────────── */

/// Add 'age', 'gender', and 'education' to the start of the list
const REQUIRED_FIELDS = [
  'age', 'gender', 'education',
  'track1_emotion', 'track1_realism', 'track1_sync', 'track1_quality',
  'track2_emotion', 'track2_realism', 'track2_sync', 'track2_quality',
  'track3_emotion', 'track3_realism', 'track3_sync', 'track3_quality',
  'preferred_track',
];

// Inside collectFormData(), we need to handle both radio buttons AND selects
function collectFormData() {
  const data = {};
  let allAnswered = true;

  REQUIRED_FIELDS.forEach(name => {
    // Check if it's a radio button
    let element = document.querySelector(`input[name="${name}"]:checked`);
    
    // If not a radio button, check if it's a select dropdown
    if (!element) {
      element = document.querySelector(`select[name="${name}"]`);
      // For selects, make sure a value is actually picked (not the empty placeholder)
      if (element && element.value === "") element = null;
    }

    if (element) {
      data[name] = element.value;
    } else {
      allAnswered = false;
    }
  });

  return allAnswered ? data : null;
}

/**
 * handleSubmit(event) — called on form submit.
 * Validates → sends to Google Sheets → shows thank-you page.
 */
async function handleSubmit(event) {
  event.preventDefault();

  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  // ── Validate ──
  const data = collectFormData();
  if (!data) {
    errorEl.style.display = 'block';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  errorEl.style.display = 'none';

  // ── Disable button to prevent double-submit ──
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    // ── Send to Google Sheets via Apps Script ──
    // The script should accept a POST request with JSON body.
    // See the Google Apps Script setup in the README below.
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // ── Success → show thank-you page ──
    navigateTo('page-6');

  } catch (err) {
    // If network fails, still show thank-you (no-cors = opaque response)
    // because with mode:'no-cors' we can't read the response status.
    // To handle real errors, you'd need a CORS-enabled endpoint.
    console.error('Submission error:', err);
    navigateTo('page-6');
  }
}


/* ============================================================
   GOOGLE APPS SCRIPT SETUP (copy into your Apps Script editor)
   ============================================================

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data  = JSON.parse(e.postData.contents);

  // Write header row if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'track1_emotion', 'track1_realism', 'track1_sync', 'track1_quality',
      'track2_emotion', 'track2_realism', 'track2_sync', 'track2_quality',
      'track3_emotion', 'track3_realism', 'track3_sync', 'track3_quality',
      'preferred_track'
    ]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.track1_emotion, data.track1_realism, data.track1_sync, data.track1_quality,
    data.track2_emotion, data.track2_realism, data.track2_sync, data.track2_quality,
    data.track3_emotion, data.track3_realism, data.track3_sync, data.track3_quality,
    data.preferred_track
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

   ============================================================ */
