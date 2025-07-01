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
  if (!result) {
    practiceResults.innerHTML = `<span style="color:red;">Could not find a matching verb or tense in the local database.</span>`;
    return;
  }
  const {verb, pronounIdx} = result;

  let html = `<h3>Spanish conjugations for <b>${verb.english}</b> (${pronouns[pronounIdx]})</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>Spanish</th>
      <th>English</th>
    </tr>`;
  tenses.forEach(t => {
    let conjugation = verb.conjugations[t] ? verb.conjugations[t][pronounIdx] : "(not available)";
    let english = buildEnglishPhrase(verb, t, pronounIdx);
    html += `<tr>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>${conjugation}</td>
      <td>${english}</td>
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

  if (!found) {
    practiceResults.innerHTML = `<span style="color:red;">Could not find a matching Spanish phrase in the local database.</span>`;
    return;
  }

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
      <td>${sp}</td>
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
    quizFeedback.innerHTML = `<span style="color:red;">Incorrect. Try again!</span>`;
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
  if (verb.examples && verb.examples.length > 0) {
    for (let ex of verb.examples) {
      const pronoun = pronouns[pronounIdx];
      if (ex.toLowerCase().startsWith(pronoun.toLowerCase())) {
        return ex.split('(')[0].trim();
      }
    }
  }

  const pronoun = pronouns[pronounIdx];
  let base = verb.english.replace(/^to /, '').split(',')[0].trim();
  let pastPart = null, preterite = null;
  if (verb.examples) {
    for (let ex of verb.examples) {
      if (/has|have|had/.test(ex)) {
        let m = ex.match(/has|have|had\s+([a-zA-Z]+)/);
        if (m) pastPart = m[1];
      }
      if (/He |She |I |You |We |They /.test(ex) && /(ed|ew|ought|ade|oke|en|id|wn|elt|pt|nt|t|d|ght|ld|st|rt|lt|ss|ught|ed)\b/.test(ex)) {
        let m = ex.match(/^\w+\s+([a-zA-Z]+)/);
        if (m) preterite = m[1];
      }
    }
  }
  if (!pastPart) {
    if (base.endsWith('e')) pastPart = base + 'd';
    else pastPart = base + 'ed';
  }
  if (!preterite) {
    if (base.endsWith('e')) preterite = base + 'd';
    else preterite = base + 'ed';
  }

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
  if (irregulars[verb.english]) {
    preterite = irregulars[verb.english].preterite;
    pastPart = irregulars[verb.english].pastPart;
  }

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

// Make startQuiz available for inline onclick
window.startQuiz = startQuiz;