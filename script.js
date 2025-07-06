import { verbs } from './verbs.js';

const pronouns = ["I", "You", "He", "We", "You all", "They"];
const spanishPronouns = ["Yo", "Tú", "Él/Ella/Usted", "Nosotros", "Vosotros", "Ellos/Ellas/Ustedes"];
const tenses = [
  "Present", "Preterite", "Imperfect", "Future", "Conditional",
  "Present Perfect", "Past Perfect", "Future Perfect", "Conditional Perfect"
];

const tenseDefinitions = {
  "Present": "Describes actions happening now or regularly.",
  "Preterite": "Describes completed actions in the past.",
  "Imperfect": "Describes ongoing or habitual actions in the past.",
  "Future": "Describes actions that will happen.",
  "Conditional": "Describes actions that would happen under certain conditions.",
  "Present Perfect": "Describes actions that have happened recently or have relevance to the present.",
  "Past Perfect": "Describes actions that had happened before another past action.",
  "Future Perfect": "Describes actions that will have happened by a certain point in the future.",
  "Conditional Perfect": "Describes actions that would have happened under certain conditions."
};

const modeSelect = document.getElementById('modeSelect');
const practiceModeBtn = document.getElementById('practiceModeBtn');
const quizModeBtn = document.getElementById('quizModeBtn');
const practiceSection = document.getElementById('practiceSection');
const quizSection = document.getElementById('quizSection');
const practiceFormEn = document.getElementById('practiceFormEn');
const practiceInputEn = document.getElementById('practiceInputEn');
const practiceFormEs = document.getElementById('practiceFormEs');
const practiceInputEs = document.getElementById('practiceInputEs');
const practiceResults = document.getElementById('practiceResults');
const quizPrompt = document.getElementById('quizPrompt');
const quizForm = document.getElementById('quizForm');
const quizInput = document.getElementById('quizInput');
const quizFeedback = document.getElementById('quizFeedback');

let quizState = null;

function speakSpanish(text) {
  speakWithVoice(text, 'es');
}

function speakEnglish(text) {
  speakWithVoice(text, 'en');
}

function speakWithVoice(text, langPrefix) {
  function doSpeak() {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    let voice = voices.find(v => v.lang && v.lang.startsWith(langPrefix));
    const utter = new SpeechSynthesisUtterance(text);
    if (voice) utter.voice = voice;
    utter.lang = voice ? voice.lang : (langPrefix === 'es' ? 'es-ES' : 'en-US');
    utter.rate = 0.6;    // Slower than normal (1.0 is default)
    utter.volume = 1.0;  // Max volume
    utter.pitch = 1.1;   // Slightly higher pitch for clarity
    synth.speak(utter);
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = doSpeak;
    setTimeout(doSpeak, 200);
  } else {
    doSpeak();
  }
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('speak-btn-en')) {
    speakEnglish(e.target.getAttribute('data-text'));
  }
});

// --- Mode switching ---
practiceModeBtn.onclick = () => {
  modeSelect.style.display = 'none';
  quizSection.style.display = 'none';
  practiceSection.style.display = '';
  practiceResults.innerHTML = '';
  practiceInputEn.value = '';
  practiceInputEs.value = '';
};
quizModeBtn.onclick = () => {
  modeSelect.style.display = 'none';
  practiceSection.style.display = 'none';
  quizSection.style.display = '';
  quizFeedback.innerHTML = '';
  quizInput.value = '';
  startQuiz();
};

// --- Practice Mode: English → Spanish ---
practiceFormEn.onsubmit = e => {
  e.preventDefault();
  const input = practiceInputEn.value.trim();
  if (!input) return;

  const result = parseEnglishPhrase(input);
  const spanishBox = document.getElementById('practiceInputEnSpanish');
  if (!result) {
    spanishBox.value = '';
    practiceResults.innerHTML = `<span style="color:red;">Could not find a matching verb or tense in the local database.</span>`;
    return;
  }
  const {verb, pronounIdx, tense: detectedTense} = result;

  // Find the Spanish phrase for the detected tense (or Present if not detected)
  let tenseToShow = detectedTense || "Present";
  let spanish = verb.conjugations[tenseToShow] ? verb.conjugations[tenseToShow][pronounIdx] : "(not available)";
  spanishBox.value = `${spanishPronouns[pronounIdx]} ${spanish}`;

  let html = `<h3>Spanish conjugations for <b>${verb.english}</b> (${pronouns[pronounIdx]})`;
  if (detectedTense) html += ` <span style="font-size:0.9em;color:#666;">[${detectedTense}]</span>`;
  html += `</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>Spanish</th>
      <th>English</th>
    </tr>`;
    tenses.forEach(t => {
      let conjugation = verb.conjugations[t] ? verb.conjugations[t][pronounIdx] : "(not available)";
      let english = buildEnglishPhrase(verb, t, pronounIdx);
      let highlight = (detectedTense && t === detectedTense) ? ' style="background:#e0e7ff;font-weight:bold;"' : '';
      html += `<tr${highlight}>
        <td>
          ${t}
          <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
        </td>
        <td>
          ${conjugation}
          <button type="button" class="speak-btn" data-text="${spanishPronouns[pronounIdx]} ${conjugation}" title="Hear pronunciation">🔊</button>
        </td>
        <td>
          ${english}
          <button type="button" class="speak-btn-en" data-text="${english}" title="Hear English pronunciation">🔊</button>
        </td>
      </tr>`;
    });
  html += `</table>`;
  practiceResults.innerHTML = html;
};

// --- Practice Mode: Spanish → English ---
practiceFormEs.onsubmit = e => {
  e.preventDefault();
  const input = practiceInputEs.value.trim().toLowerCase();
  if (!input) return;

  let found = null;
  // 1. Try to match full conjugated forms (existing logic)
  for (let verb of verbs) {
    for (let t of tenses) {
      if (!verb.conjugations[t]) continue;
      for (let i = 0; i < spanishPronouns.length; ++i) {
        const sp = verb.conjugations[t][i];
        if (sp && (`${spanishPronouns[i]} ${sp}`.toLowerCase() === input || sp.toLowerCase() === input)) {
          found = {verb, tense: t, pronounIdx: i};
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  // 2. If not found, try to match infinitive (e.g., "aprender")
  if (!found) {
    for (let verb of verbs) {
      if (verb.spanish.toLowerCase() === input) {
        found = {verb, tense: null, pronounIdx: null, isInfinitive: true};
        break;
      }
    }
  }

  const englishBox = document.getElementById('practiceInputEsEnglish');
  if (!found) {
    englishBox.value = '';
    practiceResults.innerHTML = `<span style="color:red;">Could not find a matching Spanish verb in the local database.</span>`;
    return;
  }

  // 3. If infinitive, show all tenses for all pronouns
  if (found.isInfinitive) {
    englishBox.value = verb.english;
    let html = `<h3>English equivalents for <b>${found.verb.spanish}</b> (all pronouns)</h3>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Pronoun</th>
        <th>Tense</th>
        <th>Spanish</th>
        <th>English</th>
      </tr>`;
    for (let i = 0; i < spanishPronouns.length; ++i) {
      for (let t of tenses) {
        let sp = found.verb.conjugations[t] ? found.verb.conjugations[t][i] : "(not available)";
        let eng = buildEnglishPhrase(found.verb, t, i);
        html += `<tr>
          <td>${spanishPronouns[i]}</td>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
          <td>
            ${sp}
            <button type="button" class="speak-btn" data-text="${spanishPronouns[i]} ${sp}" title="Hear pronunciation">🔊</button>
          </td>
          <td>${eng}</td>
        </tr>`;
      }
    }
    html += `</table>`;
    practiceResults.innerHTML = html;
    return;
  }

  // Set the English translation in the output field
  englishBox.value = `${pronouns[found.pronounIdx]} ${buildEnglishPhrase(found.verb, found.tense, found.pronounIdx).replace(pronouns[found.pronounIdx] + ' ', '')}`;

  let html = `<h3>English equivalents for <b>${found.verb.spanish}</b> (${spanishPronouns[found.pronounIdx]})</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>English</th>
      <th>Spanish</th>
    </tr>`;
  tenses.forEach(t => {
    let eng = buildEnglishPhrase(found.verb, t, found.pronounIdx);
    let sp = found.verb.conjugations[t] ? found.verb.conjugations[t][found.pronounIdx] : "(not available)";
    html += `<tr>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>${eng}</td>
      <td>
        ${sp}
        <button type="button" class="speak-btn" data-text="${spanishPronouns[found.pronounIdx]} ${sp}" title="Hear pronunciation">🔊</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  practiceResults.innerHTML = html;
};

// --- Quiz Mode: Spanish → English ---
function startQuiz() {
  // Pick a random verb, tense, and pronoun
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const availableTenses = tenses.filter(t => verb.conjugations[t]);
  const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
  const pronounIdx = Math.floor(Math.random() * pronouns.length);
  const spanish = verb.conjugations[tense][pronounIdx];
  const english = buildEnglishPhrase(verb, tense, pronounIdx);

  quizState = { verb, tense, pronounIdx, spanish, english };

  quizPrompt.innerHTML = `
    <div>
      <b>Translate this Spanish phrase to English:</b>
      <div style="font-size:1.5em;margin:1em 0;">
        <span style="color:#4f46e5;font-weight:bold">${spanishPronouns[pronounIdx]} ${spanish}</span>
      </div>
      <div style="font-size:0.9em;color:#888;">Verb: <b>${verb.spanish}</b> (${verb.english})<br>Tense: <b>${tense}</b></div>
    </div>
  `;
  quizInput.style.display = '';
  quizInput.value = '';
  quizForm.querySelector('button[type="submit"]').style.display = '';
  quizFeedback.innerHTML = '';
}

quizForm.onsubmit = e => {
  e.preventDefault();
  if (!quizState) return;
  const userAnswer = quizInput.value.trim().toLowerCase();
  const correctAnswer = quizState.english.toLowerCase();

  if (userAnswer === correctAnswer) {
    // Show all tenses for this verb and pronoun
    let html = `<div style="color:green;font-weight:bold;">Correct!</div>`;
    html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Tense</th>
        <th>Spanish</th>
        <th>English</th>
      </tr>`;
    tenses.forEach(t => {
      const sp = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
      const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
      html += `<tr>
        <td>
          ${t}
          <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
        </td>
        <td>${sp}</td>
        <td>${en}</td>
      </tr>`;
    });
    html += `</table>`;
    html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
    quizFeedback.innerHTML = html;
    quizInput.style.display = 'none';
    quizForm.querySelector('button[type="submit"]').style.display = 'none';
  } else {
    quizFeedback.innerHTML = `<span style="color:red;">Incorrect. Try again!</span>
      <br>
      <button id="showAnswerBtn" style="margin-top:0.7em;">Show Answer</button>`;
    // Add event listener for Show Answer button
    document.getElementById('showAnswerBtn').onclick = function() {
      let html = `<div style="color:#2563eb;font-weight:bold;">Answer: ${quizState.english}</div>`;
      html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
      html += `<table border="1" style="width:100%;text-align:center;">
        <tr>
          <th>Tense</th>
          <th>Spanish</th>
          <th>English</th>
        </tr>`;
      tenses.forEach(t => {
        const sp = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
        const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
        html += `<tr>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
          <td>${sp}</td>
          <td>${en}</td>
        </tr>`;
      });
      html += `</table>`;
      html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
      quizFeedback.innerHTML = html;
      quizInput.style.display = 'none';
      quizForm.querySelector('button[type="submit"]').style.display = 'none';
    };
  }
};

// --- Tense Info Popup Logic ---
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('tense-info-btn')) {
    const tense = e.target.getAttribute('data-tense');
    const def = tenseDefinitions[tense] || "No definition available.";
    showTensePopup(tense, def, e.target);
  }
});

function showTensePopup(tense, def, anchor) {
  let old = document.getElementById('tense-popup');
  if (old) old.remove();

  const popup = document.createElement('div');
  popup.id = 'tense-popup';
  popup.style.position = 'absolute';
  popup.style.background = '#fff';
  popup.style.border = '1px solid #a78bfa';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 16px rgba(60,60,120,0.12)';
  popup.style.padding = '12px 18px';
  popup.style.zIndex = 1000;
  popup.style.maxWidth = '260px';
  popup.innerHTML = `<b>${tense}</b><br><span style="font-size:0.98em;">${def}</span>`;

  const rect = anchor.getBoundingClientRect();
  popup.style.left = (window.scrollX + rect.right + 8) + 'px';
  popup.style.top = (window.scrollY + rect.top - 8) + 'px';

  document.body.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('mousedown', function handler(ev) {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('mousedown', handler);
      }
    });
  }, 10);
}

// --- Helper: Parse English phrase to verb/tense/pronoun ---
function parseEnglishPhrase(phrase) {
  phrase = phrase.trim().toLowerCase();

  // --- Context-aware handling for ambiguous verbs ---

  // Tener vs. Haber (to have)
  if (/have\s+\w+ed|\bhave\s+\w+en\b/.test(phrase)) {
    // Likely auxiliary "have" (haber)
    for (let verb of verbs) {
      if (verb.spanish === "haber") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  } else if (/have\s+(a|an|the|my|your|his|her|our|their|[0-9]+|some|many|few|no|any|[a-z]+)\b/.test(phrase)) {
    // Likely possession "have" (tener)
    for (let verb of verbs) {
      if (verb.spanish === "tener") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // Ser vs. Estar (to be)
  if (/am|is|are|was|were|will be|would be/.test(phrase)) {
    // Try to guess context: "happy", "in Madrid", "a doctor", etc.
    if (/(in|at|on|here|there|sick|happy|sad|tired|ready|open|closed|alive|dead)/.test(phrase)) {
      // Temporary state/location: estar
      for (let verb of verbs) {
        if (verb.spanish === "estar") {
          for (let t of tenses) {
            if (!verb.conjugations[t]) continue;
            for (let i = 0; i < pronouns.length; ++i) {
              const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
              if (phrase === eng) return {verb, tense: t, pronounIdx: i};
            }
          }
        }
      }
    } else if (/(doctor|student|teacher|man|woman|from|tall|short|smart|rich|poor|mexican|spanish|young|old)/.test(phrase)) {
      // Permanent/identity: ser
      for (let verb of verbs) {
        if (verb.spanish === "ser") {
          for (let t of tenses) {
            if (!verb.conjugations[t]) continue;
            for (let i = 0; i < pronouns.length; ++i) {
              const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
              if (phrase === eng) return {verb, tense: t, pronounIdx: i};
            }
          }
        }
      }
    }
  }

  // Saber vs. Conocer (to know)
  if (/know/.test(phrase)) {
    if (/(how|that|if|when|where|why|what|the answer|the fact|the truth|the time)/.test(phrase)) {
      // saber
      for (let verb of verbs) {
        if (verb.spanish === "saber") {
          for (let t of tenses) {
            if (!verb.conjugations[t]) continue;
            for (let i = 0; i < pronouns.length; ++i) {
              const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
              if (phrase === eng) return {verb, tense: t, pronounIdx: i};
            }
          }
        }
      }
    } else if (/(person|people|place|city|country|him|her|them|you)/.test(phrase)) {
      // conocer
      for (let verb of verbs) {
        if (verb.spanish === "conocer") {
          for (let t of tenses) {
            if (!verb.conjugations[t]) continue;
            for (let i = 0; i < pronouns.length; ++i) {
              const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
              if (phrase === eng) return {verb, tense: t, pronounIdx: i};
            }
          }
        }
      }
    }
  }

  // Poder (can, to be able to)
  if (/can|could|be able to/.test(phrase)) {
    for (let verb of verbs) {
      if (verb.spanish === "poder") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // Querer (to want)
  if (/want(s)? to/.test(phrase)) {
    for (let verb of verbs) {
      if (verb.spanish === "querer") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // Deber (should, ought to, must)
  if (/should|ought to|must/.test(phrase)) {
    for (let verb of verbs) {
      if (verb.spanish === "deber") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // Ir (to go)
  if (/go(es)?|went|going/.test(phrase)) {
    for (let verb of verbs) {
      if (verb.spanish === "ir") {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // Reflexive verbs (basic detection)
  if (/get (up|dressed|married|bored|tired|angry|sick|ready|lost|hurt|upset|divorced)/.test(phrase)) {
    for (let verb of verbs) {
      if (verb.english.includes("(reflexive)")) {
        for (let t of tenses) {
          if (!verb.conjugations[t]) continue;
          for (let i = 0; i < pronouns.length; ++i) {
            const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
            if (phrase === eng) return {verb, tense: t, pronounIdx: i};
          }
        }
      }
    }
  }

  // --- Original matching logic ---

  // Try to match exact phrase first
  for (let verb of verbs) {
    for (let t of tenses) {
      if (!verb.conjugations[t]) continue;
      for (let i = 0; i < pronouns.length; ++i) {
        const eng = buildEnglishPhrase(verb, t, i).toLowerCase();
        if (phrase === eng) {
          return {verb, tense: t, pronounIdx: i};
        }
      }
    }
  }

  // Try to match common English tense patterns
  for (let verb of verbs) {
    let base = verb.english.replace(/^to /, '').split(',')[0].trim();
    for (let i = 0; i < pronouns.length; ++i) {
      const pronoun = pronouns[i].toLowerCase();

      // Present Continuous: "You are speaking"
      if (phrase === `${pronoun} are ${base}ing` || phrase === `${pronoun} is ${base}ing` || phrase === `${pronoun} am ${base}ing`) {
        return {verb, tense: "Present", pronounIdx: i};
      }
      // Future: "We will eat"
      if (phrase === `${pronoun} will ${base}`) {
        return {verb, tense: "Future", pronounIdx: i};
      }
      // Conditional: "They would eat"
      if (phrase === `${pronoun} would ${base}`) {
        return {verb, tense: "Conditional", pronounIdx: i};
      }
      // Present Perfect: "You have eaten"
      if (phrase === `${pronoun} have ${base}ed` || phrase === `${pronoun} has ${base}ed`) {
        return {verb, tense: "Present Perfect", pronounIdx: i};
      }
      // Past Perfect: "We had eaten"
      if (phrase === `${pronoun} had ${base}ed`) {
        return {verb, tense: "Past Perfect", pronounIdx: i};
      }
      // Future Perfect: "They will have eaten"
      if (phrase === `${pronoun} will have ${base}ed`) {
        return {verb, tense: "Future Perfect", pronounIdx: i};
      }
      // Conditional Perfect: "You would have eaten"
      if (phrase === `${pronoun} would have ${base}ed`) {
        return {verb, tense: "Conditional Perfect", pronounIdx: i};
      }
      // Imperfect: "We used to eat"
      if (phrase === `${pronoun} used to ${base}`) {
        return {verb, tense: "Imperfect", pronounIdx: i};
      }
      // Simple Present: "You speak"
      if (phrase === `${pronoun} ${base}`) {
        return {verb, tense: "Present", pronounIdx: i};
      }
      // Simple Past: "You spoke"
      // Try to match preterite form
      const preterite = buildEnglishPhrase(verb, "Preterite", i).toLowerCase().replace(pronoun + " ", "");
      if (phrase === `${pronoun} ${preterite}`) {
        return {verb, tense: "Preterite", pronounIdx: i};
      }
    }
  }

  // Fallback: try to match verb and pronoun
  for (let verb of verbs) {
    if (phrase.includes(verb.english.replace(/^to /, '').toLowerCase())) {
      for (let i = 0; i < pronouns.length; ++i) {
        if (phrase.includes(pronouns[i].toLowerCase())) {
          return {verb, pronounIdx: i};
        }
      }
      return {verb, pronounIdx: 0};
    }
  }
  return null;
}

// --- Helper: Build English phrase for a verb/tense/pronoun ---
function buildEnglishPhrase(verb, tense, pronounIdx) {
  const pronoun = pronouns[pronounIdx];
  let base = verb.english.replace(/^to /, '').split(',')[0].trim();

  // Irregulars lookup
  const irregulars = {
    "to go": { preterite: "went", pastPart: "gone" },
    "to eat": { preterite: "ate", pastPart: "eaten" },
    "to write": { preterite: "wrote", pastPart: "written" },
    "to see": { preterite: "saw", pastPart: "seen" },
    "to do, to make": { preterite: "did", pastPart: "done" },
    "to have": { preterite: "had", pastPart: "had" },
    "to be (permanent)": { preterite: pronoun === "I" ? "was" : (pronoun === "He" ? "was" : "were"), pastPart: "been" },
    "to be (temporary)": { preterite: pronoun === "I" ? "was" : (pronoun === "He" ? "was" : "were"), pastPart: "been" },
    "to bring": { preterite: "brought", pastPart: "brought" },
    "to read": { preterite: "read", pastPart: "read" },
    "to say": { preterite: "said", pastPart: "said" },
    "to put": { preterite: "put", pastPart: "put" },
    "to sleep": { preterite: "slept", pastPart: "slept" },
    "to give": { preterite: "gave", pastPart: "given" },
    "to know (facts, info)": { preterite: "knew", pastPart: "known" },
    "to know (people, places)": { preterite: "met", pastPart: "known" },
    "to take": { preterite: "took", pastPart: "taken" },
    "to find": { preterite: "found", pastPart: "found" },
    "to lose": { preterite: "lost", pastPart: "lost" },
    "to come": { preterite: "came", pastPart: "come" },
    "to run": { preterite: "ran", pastPart: "run" },
    "to buy": { preterite: "bought", pastPart: "bought" },
    "to leave": { preterite: "left", pastPart: "left" },
    "to feel": { preterite: "felt", pastPart: "felt" },
    "to pay": { preterite: "paid", pastPart: "paid" },
    "to understand": { preterite: "understood", pastPart: "understood" },
    "to return": { preterite: "returned", pastPart: "returned" },
    "to play": { preterite: "played", pastPart: "played" },
    "to ask": { preterite: "asked", pastPart: "asked" },
    "to answer": { preterite: "answered", pastPart: "answered" },
    "to help": { preterite: "helped", pastPart: "helped" },
    "to walk": { preterite: "walked", pastPart: "walked" },
    "to study": { preterite: "studied", pastPart: "studied" },
    "to listen": { preterite: "listened", pastPart: "listened" },
    "to teach": { preterite: "taught", pastPart: "taught" },
    "to draw": { preterite: "drew", pastPart: "drawn" },
    "to cook": { preterite: "cooked", pastPart: "cooked" },
    "to swim": { preterite: "swam", pastPart: "swum" },
    "to dance": { preterite: "danced", pastPart: "danced" },
    "to travel": { preterite: "traveled", pastPart: "traveled" },
    "to sell": { preterite: "sold", pastPart: "sold" },
    "to wait": { preterite: "waited", pastPart: "waited" },
    "to need": { preterite: "needed", pastPart: "needed" },
    "to use": { preterite: "used", pastPart: "used" },
    "to call": { preterite: "called", pastPart: "called" },
    "to open": { preterite: "opened", pastPart: "opened" },
    "to close": { preterite: "closed", pastPart: "closed" },
    "to change": { preterite: "changed", pastPart: "changed" },
    "to finish": { preterite: "finished", pastPart: "finished" },
    "to begin": { preterite: "began", pastPart: "begun" },
    // Add more as needed
  };

  // Get irregular forms if available
  let preterite = base + (base.endsWith('e') ? 'd' : 'ed');
  let pastPart = preterite;
  if (irregulars[verb.english]) {
    preterite = irregulars[verb.english].preterite;
    pastPart = irregulars[verb.english].pastPart;
  }

  // Present 3rd person singular
  let present = base;
  if (pronoun === "He") {
    if (base.endsWith('y')) present = base.slice(0, -1) + "ies";
    else if (base.endsWith('o') || base.endsWith('ch') || base.endsWith('s') || base.endsWith('sh') || base.endsWith('x') || base.endsWith('z'))
      present = base + "es";
    else present = base + "s";
  }

  switch (tense) {
    case "Present":
      return `${pronoun} ${present}`;
    case "Preterite":
      return `${pronoun} ${preterite}`;
    case "Imperfect":
      return `${pronoun} used to ${base}`;
    case "Future":
      return `${pronoun} will ${base}`;
    case "Conditional":
      return `${pronoun} would ${base}`;
    case "Present Perfect":
      return `${pronoun} ${["He"].includes(pronoun) ? "has" : "have"} ${pastPart}`;
    case "Past Perfect":
      return `${pronoun} had ${pastPart}`;
    case "Future Perfect":
      return `${pronoun} will have ${pastPart}`;
    case "Conditional Perfect":
      return `${pronoun} would have ${pastPart}`;
    default:
      return `${pronoun} ${base}`;
  }
}

document.getElementById('checkSpanishBtn').onclick = function() {
  const notes = document.getElementById('notesArea').value.trim();
  const feedbackBox = document.getElementById('notesFeedback');
  if (!notes) {
    feedbackBox.textContent = "Please type a Spanish sentence or phrase to check.";
    feedbackBox.style.background = "#fee2e2";
    feedbackBox.style.color = "#ef4444";
    feedbackBox.style.borderLeft = "4px solid #ef4444";
    return;
  }

  const commonSpanishWords = [
    "el", "la", "de", "que", "y", "en", "a", "los", "se", "no", "por", "con", "su", "para", "es", "una", "yo", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas", "usted", "ustedes", "mi", "me", "te", "le", "lo", "la", "nos", "os", "les", "las"
  ];
  const accents = /[áéíóúñü]/i;
  let feedback = "";
  let suggestions = [];
  let score = 0;

  // Encourage if it looks Spanish
  let spanishScore = 0;
  for (let word of commonSpanishWords) {
    if (notes.toLowerCase().includes(word)) spanishScore++;
  }
  if (accents.test(notes)) spanishScore++;

  // Check for punctuation
  if (notes.endsWith(".")) {
    feedback += "¡Bien! Your sentence ends with a period.<br>";
    score += 1;
  } else if (notes.endsWith("!")) {
    feedback += "¡Buen énfasis! Your sentence ends with an exclamation mark.<br>";
    score += 1;
  } else if (notes.endsWith("?")) {
    feedback += "¡Pregunta! Your sentence ends with a question mark.<br>";
    score += 1;
  } else {
    suggestions.push("Try ending your sentence with a period, exclamation, or question mark.");
  }

  // Capitalization
  if (notes[0] && notes[0] === notes[0].toLowerCase()) {
    suggestions.push("Start your sentence with a capital letter.");
  } else {
    score += 1;
  }

  // Inverted punctuation
  if (notes.includes("?") && !notes.includes("¿")) {
    suggestions.push("Spanish questions should start with '¿'.");
  } else if (notes.includes("¿")) {
    score += 1;
  }
  if (notes.includes("!") && !notes.includes("¡")) {
    suggestions.push("Spanish exclamations should start with '¡'.");
  } else if (notes.includes("¡")) {
    score += 1;
  }

  // Detect some common mistakes
  if (notes.toLowerCase().includes("yo es")) {
    suggestions.push("Remember: 'yo soy' or 'yo estoy', not 'yo es'.");
  }
  if (notes.toLowerCase().includes("tu eres") && !notes.includes("tú eres")) {
    suggestions.push("Did you mean 'tú eres'? Don't forget the accent on 'tú' for 'you'.");
  }
  if (notes.toLowerCase().includes("si ") && !notes.includes("sí")) {
    suggestions.push("Did you mean 'sí' (yes) with an accent?");
  }
  if (notes.toLowerCase().includes("el ") && !notes.includes("él")) {
    suggestions.push("Did you mean 'él' (he) with an accent?");
  }

  // Subject-verb agreement (very basic)
  if (notes.match(/\byo eres\b/i)) {
    suggestions.push("It should be 'yo soy' or 'yo estoy', not 'yo eres'.");
  }
  if (notes.match(/\btú soy\b/i)) {
    suggestions.push("It should be 'tú eres' or 'tú estás', not 'tú soy'.");
  }

  // Encourage advanced grammar
  if (notes.includes("hubiera") || notes.includes("hubiese")) {
    feedback += "👏 You're using the past subjunctive! Advanced!";
    score += 1;
  }
  if (notes.match(/\b(me|te|se|nos|os)\s+[a-z]+/i)) {
    feedback += " Reflexive verbs detected, nice!";
    score += 1;
  }

  // Warn about very short sentences
  if (notes.split(" ").length < 3) {
    suggestions.push("Try writing a longer sentence for more practice.");
  } else {
    score += 1;
  }

  // Feedback based on score
  if (spanishScore > 2) {
    feedback += "👍 That looks like a good Spanish sentence!";
    score += 2;
  } else if (spanishScore > 0) {
    feedback += "It looks like you're trying Spanish. Keep practicing!";
    score += 1;
  } else {
    feedback += "This doesn't look like Spanish. Try writing a Spanish sentence!";
  }

  // Clamp score and show stars
  let maxScore = 7;
  let starScore = Math.max(1, Math.min(5, Math.round((score / maxScore) * 5)));
  let stars = "★".repeat(starScore) + "☆".repeat(5 - starScore);
  feedback = `<div style="font-size:1.3em;color:#f59e42;margin-bottom:4px;">${stars}</div>` + feedback;

  // Add suggestions if any
  if (suggestions.length > 0) {
    feedback += "<br><b>Suggestions:</b><ul style='margin:0 0 0 18px;'>";
    for (let s of suggestions) feedback += `<li>${s}</li>`;
    feedback += "</ul>";
    feedbackBox.style.background = "#fef9c3";
    feedbackBox.style.color = "#b45309";
    feedbackBox.style.borderLeft = "4px solid #fde68a";
  } else {
    feedbackBox.style.background = "#e0f2fe";
    feedbackBox.style.color = "#2563eb";
    feedbackBox.style.borderLeft = "4px solid #38bdf8";
  }

  feedbackBox.innerHTML = feedback;
  feedbackBox.style.animation = "fadeIn 0.7s";
};

// --- Check English Button Logic ---
document.getElementById('checkEnglishBtn').onclick = function() {
  const notes = document.getElementById('notesArea').value.trim();
  const feedbackBox = document.getElementById('notesFeedback');
  if (!notes) {
    feedbackBox.textContent = "Please type an English sentence or phrase to check.";
    feedbackBox.style.background = "#fee2e2";
    feedbackBox.style.color = "#ef4444";
    feedbackBox.style.borderLeft = "4px solid #ef4444";
    return;
  }

  let feedback = "";
  let suggestions = [];
  let score = 0;

  // Capitalization
  if (notes[0] && notes[0] === notes[0].toLowerCase()) {
    suggestions.push("Start your sentence with a capital letter.");
  } else {
    score += 1;
  }

  // Punctuation
  if (notes.endsWith(".") || notes.endsWith("!") || notes.endsWith("?")) {
    score += 1;
  } else {
    suggestions.push("End your sentence with a period, exclamation, or question mark.");
  }

  // Length
  if (notes.split(" ").length < 3) {
    suggestions.push("Try writing a longer sentence for more practice.");
  } else {
    score += 1;
  }

  // Common mistakes
  if (notes.match(/\bi amn't\b/i)) {
    suggestions.push("In English, use 'I'm not' instead of 'I amn't'.");
  }
  if (notes.match(/\bhe don't\b/i)) {
    suggestions.push("Use 'he doesn't' instead of 'he don't'.");
  }
  if (notes.match(/\byou was\b/i)) {
    suggestions.push("Use 'you were' instead of 'you was'.");
  }

  // Looks like English?
  let englishWords = ["the", "is", "are", "was", "were", "have", "has", "will", "would", "can", "could", "should", "I", "you", "he", "she", "it", "we", "they"];
  let englishScore = 0;
  for (let word of englishWords) {
    if (notes.toLowerCase().includes(word.toLowerCase())) englishScore++;
  }
  if (englishScore > 2) {
    feedback += "👍 That looks like a good English sentence!";
    score += 2;
  } else if (englishScore > 0) {
    feedback += "It looks like you're trying English. Keep practicing!";
    score += 1;
  } else {
    feedback += "This doesn't look like English. Try writing an English sentence!";
  }

  // Clamp score and show stars
  let maxScore = 5;
  let starScore = Math.max(1, Math.min(5, Math.round((score / maxScore) * 5)));
  let stars = "★".repeat(starScore) + "☆".repeat(5 - starScore);
  feedback = `<div style="font-size:1.3em;color:#f59e42;margin-bottom:4px;">${stars}</div>` + feedback;

  // Add suggestions if any
  if (suggestions.length > 0) {
    feedback += "<br><b>Suggestions:</b><ul style='margin:0 0 0 18px;'>";
    for (let s of suggestions) feedback += `<li>${s}</li>`;
    feedback += "</ul>";
    feedbackBox.style.background = "#fef9c3";
    feedbackBox.style.color = "#b45309";
    feedbackBox.style.borderLeft = "4px solid #fde68a";
  } else {
    feedbackBox.style.background = "#e0f2fe";
    feedbackBox.style.color = "#2563eb";
    feedbackBox.style.borderLeft = "4px solid #38bdf8";
  }

  feedbackBox.innerHTML = feedback;
  feedbackBox.style.animation = "fadeIn 0.7s";
};

// Make startQuiz available for inline onclick
window.startQuiz = startQuiz;

// --- Notes Print Logic ---
document.getElementById('printNotesBtn').onclick = function() {
  const notes = document.getElementById('notesArea').value;
  const win = window.open('', '', 'width=600,height=600');
  win.document.write('<html><head><title>My Notes</title></head><body>');
  win.document.write('<h2>My Notes</h2>');
  win.document.write('<pre style="font-size:1.1em;">' + notes.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre>');
  win.document.write('</body></html>');
  win.document.close();
  win.print();
};

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('speak-btn')) {
    speakSpanish(e.target.getAttribute('data-text'));
  }
});