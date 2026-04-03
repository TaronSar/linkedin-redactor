// --- DOM References ---
const onboarding = document.getElementById("onboarding");
const appScreen = document.getElementById("app");
const apiKeyInput = document.getElementById("api-key-input");
const startBtn = document.getElementById("start-btn");
const achievementInput = document.getElementById("achievement");
const generateBtn = document.getElementById("generate-btn");
const resultDiv = document.getElementById("result");
const errorDiv = document.getElementById("error");
const toneBtns = document.querySelectorAll(".tone-btn");
const settingsBtn = document.getElementById("settings-btn");
const lengthSlider = document.getElementById("length-slider");
const lengthValue = document.getElementById("length-value");
const inputLabel = document.getElementById("input-label");
const modeBtns = document.querySelectorAll(".mode-btn");
const themeToggle = document.getElementById("theme-toggle");

// --- State ---
let selectedTone = "professional";
let cachedApiKey = "";
let currentMode = "write";
let activeTemplate = null;
let variants = [];
let activeVariant = 0;

// --- Constants ---
const LINKEDIN_CHAR_LIMIT = 3000;
const NUM_VARIANTS = 3;
const MAX_HISTORY = 50;

const MOON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
const SUN_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const PENCIL_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
const REFRESH_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>';

const LENGTH_LABELS = { 1: "Very Short", 2: "Short", 3: "Medium", 4: "Long", 5: "Very Long" };
const LENGTH_INSTRUCTIONS = {
  1: "Write exactly 2-3 sentences. Be extremely concise.",
  2: "Write 1 short paragraph (4-5 sentences).",
  3: "Write 2 short paragraphs.",
  4: "Write 3 paragraphs with some detail.",
  5: "Write 4-5 paragraphs with rich detail and storytelling.",
};

const SYSTEM_PROMPTS = {
  professional:
    "You are a LinkedIn post ghostwriter. You take a simple, casual description " +
    "of something someone did and transform it into a polished, professional LinkedIn post.\n\n" +
    "Rules:\n- Write in first person\n- Start with a compelling hook line\n" +
    "- Be confident and enthusiastic but genuine and believable\n" +
    "- Use industry-appropriate terminology naturally\n" +
    "- Frame the achievement impressively but realistically\n" +
    "- Add 2-3 relevant hashtags at the end\n" +
    "- End with a call to engagement (e.g. a question to the audience)\n" +
    "- Do NOT use any emojis at all\n" +
    "- The post should be suitable for actually publishing on LinkedIn",
  satirical:
    "You are a LinkedIn post ghostwriter who writes ABSURDLY over-the-top, satirical LinkedIn posts. " +
    "You take a simple, casual description of something someone did and transform it into a hilariously " +
    "grandiose LinkedIn post that parodies typical LinkedIn culture.\n\n" +
    "Rules:\n- Write in first person\n- Start with an outrageously dramatic hook line\n" +
    "- Be WILDLY enthusiastic and over-the-top — treat every small thing as a life-changing achievement\n" +
    "- Overload with buzzwords: synergy, thought leadership, growth mindset, disruption, leverage, " +
    "paradigm shift, move the needle, circle back, deep dive, etc.\n" +
    "- Include a humble-brag element\n- Do NOT use any emojis at all\n" +
    "- Add 4-6 hashtags at the end, some absurd ones mixed with real ones\n" +
    "- End with an exaggerated call to engagement\n" +
    "- Make it funny and entertaining — this is a loving parody of LinkedIn culture\n" +
    "- The more mundane the original achievement, the more grandiose you should make it",
  improve_professional:
    "You are a LinkedIn post editor. You take an existing LinkedIn post draft and improve it — " +
    "fix awkward phrasing, strengthen the hook, improve flow, and make it more engaging and professional.\n\n" +
    "Rules:\n- Preserve the original voice and key points\n- Improve clarity and impact\n" +
    "- Fix grammar and awkward phrasing\n- Strengthen the opening hook\n" +
    "- Ensure proper paragraph breaks\n- Keep or improve hashtags\n" +
    "- Do NOT use any emojis at all\n- Do NOT dramatically change the content, just polish it\n" +
    "- The improved post should be suitable for actually publishing on LinkedIn",
  improve_satirical:
    "You are a LinkedIn post editor who takes an existing LinkedIn post draft and cranks it up to ABSURDLY " +
    "over-the-top satirical levels that parody typical LinkedIn culture.\n\n" +
    "Rules:\n- Keep the core message but make it hilariously grandiose\n" +
    "- Overload with buzzwords: synergy, thought leadership, growth mindset, disruption, etc.\n" +
    "- Add humble-brag elements\n- Do NOT use any emojis at all\n" +
    "- Add 4-6 hashtags at the end, mixing absurd with real\n" +
    "- End with an exaggerated call to engagement\n" +
    "- Make it funny and entertaining — this is a loving parody of LinkedIn culture",
};

const TEMPLATES = [
  {
    id: "new-job",
    label: "New Job",
    prefill: "Started a new role as [Job Title] at [Company]",
    systemAddendum: "The user is announcing a new job. Make it celebratory and forward-looking. Thank previous colleagues/company if appropriate.",
  },
  {
    id: "promotion",
    label: "Promotion",
    prefill: "Got promoted to [New Title] at [Company]",
    systemAddendum: "The user is announcing a promotion. Emphasize growth, gratitude, and excitement for new challenges.",
  },
  {
    id: "project-launch",
    label: "Project Launch",
    prefill: "Launched [Project/Product Name] that [what it does]",
    systemAddendum: "The user is announcing a project or product launch. Highlight the impact, the team effort, and what problem it solves.",
  },
  {
    id: "conference",
    label: "Conference/Event",
    prefill: "Attended/spoke at [Event Name] about [Topic]",
    systemAddendum: "The user is sharing a conference or event experience. Include key takeaways, networking highlights, or speaking experience.",
  },
  {
    id: "certification",
    label: "Learning/Cert",
    prefill: "Completed [Certification/Course] in [Subject]",
    systemAddendum: "The user earned a certification or completed a learning milestone. Emphasize continuous learning and how it applies to their career.",
  },
  {
    id: "team-win",
    label: "Team Win",
    prefill: "Our team [achievement] resulting in [impact]",
    systemAddendum: "The user is celebrating a team achievement. Emphasize collaboration, shared effort, and collective impact. Give credit to the team.",
  },
  {
    id: "milestone",
    label: "Milestone",
    prefill: "Reached [X years/months] at [Company] or [career milestone]",
    systemAddendum: "The user is celebrating a career or company milestone. Be reflective, grateful, and forward-looking.",
  },
];

// --- Theme Management ---

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.innerHTML = theme === "dark" ? SUN_SVG : MOON_SVG;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#1B1F23" : "#0A66C2");
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    applyTheme(e.matches ? "dark" : "light");
  }
});

// --- API key persistence ---

async function loadApiKey() {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch("/config");
      if (res.ok) {
        const data = await res.json();
        if (data.gemini_api_key) {
          cachedApiKey = data.gemini_api_key.trim();
          return;
        }
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  cachedApiKey = (localStorage.getItem("gemini_api_key") || "").trim();
}

async function saveApiKey(key) {
  cachedApiKey = key.trim();
  localStorage.setItem("gemini_api_key", key.trim());
  try {
    await fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gemini_api_key: key }),
    });
  } catch {}
}

function getApiKey() {
  return cachedApiKey;
}

// --- Gemini API ---

async function callGemini(apiKey, systemPrompt, userMessage) {
  if (window.GeminiBridge) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = JSON.parse(GeminiBridge.callGemini(apiKey, systemPrompt, userMessage));
          if (result.error) reject(new Error(result.error));
          else resolve(result.text);
        } catch (e) {
          reject(e);
        }
      }, 50);
    });
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "API request failed. Check your API key.");
  const candidates = data.candidates || [];
  if (!candidates.length || candidates[0].finishReason === "SAFETY") {
    throw new Error("Content was flagged by the AI. Try rephrasing your achievement.");
  }
  return candidates[0].content.parts[0].text;
}

// --- Screen management ---

function showApp() {
  onboarding.classList.add("hidden");
  appScreen.classList.remove("hidden");
}

function showOnboarding() {
  appScreen.classList.add("hidden");
  onboarding.classList.remove("hidden");
  apiKeyInput.value = cachedApiKey;
}

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hidden");
}

// --- Templates ---

function renderTemplates() {
  const container = document.getElementById("templates");
  container.innerHTML = "";
  TEMPLATES.forEach((tpl) => {
    const btn = document.createElement("button");
    btn.className = "template-chip";
    btn.textContent = tpl.label;
    btn.dataset.templateId = tpl.id;
    btn.addEventListener("click", () => {
      if (activeTemplate === tpl.id) {
        activeTemplate = null;
        btn.classList.remove("active");
        return;
      }
      container.querySelectorAll(".template-chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      activeTemplate = tpl.id;
      achievementInput.value = tpl.prefill;
      achievementInput.focus();
      const bracketPos = tpl.prefill.indexOf("[");
      if (bracketPos !== -1) {
        const endBracket = tpl.prefill.indexOf("]", bracketPos);
        achievementInput.setSelectionRange(bracketPos, endBracket + 1);
      }
    });
    container.appendChild(btn);
  });
}

// --- Variants UI ---

function buildVariantUI() {
  const tabsContainer = document.getElementById("variant-tabs");
  const panelsContainer = document.getElementById("variant-panels");
  tabsContainer.innerHTML = "";
  panelsContainer.innerHTML = "";
  variants = [];

  for (let i = 0; i < NUM_VARIANTS; i++) {
    const tab = document.createElement("button");
    tab.className = "variant-tab" + (i === 0 ? " active loading" : " loading");
    tab.dataset.variant = i;
    tab.textContent = "Option " + (i + 1);
    tab.addEventListener("click", () => switchVariant(i));
    tabsContainer.appendChild(tab);

    const panel = document.createElement("div");
    panel.className = "variant-panel" + (i === 0 ? " active" : "");
    panel.dataset.variant = i;
    panel.innerHTML =
      '<div class="output-header">' +
        '<span class="edit-hint">' + PENCIL_SVG + " Click to edit</span>" +
        '<button class="regen-btn" data-variant="' + i + '">' + REFRESH_SVG + " Redo</button>" +
      "</div>" +
      '<div class="output-card variant-output" contenteditable="true" spellcheck="true" data-variant="' + i + '"></div>' +
      '<div class="char-count" data-variant="' + i + '"></div>' +
      '<button class="secondary-btn copy-variant-btn" data-variant="' + i + '">Copy to Clipboard</button>';
    panelsContainer.appendChild(panel);

    const outputEl = panel.querySelector(".variant-output");
    variants.push({ text: "", element: outputEl });

    panel.querySelector(".copy-variant-btn").addEventListener("click", function () {
      copyToClipboard(outputEl.innerText, this);
    });

    panel.querySelector(".regen-btn").addEventListener("click", () => {
      regenerateVariant(i);
    });

    outputEl.addEventListener("input", () => {
      updateVariantCharCount(i);
    });
  }
}

function switchVariant(index) {
  activeVariant = index;
  document.querySelectorAll(".variant-tab").forEach((t) =>
    t.classList.toggle("active", parseInt(t.dataset.variant) === index)
  );
  document.querySelectorAll(".variant-panel").forEach((p) =>
    p.classList.toggle("active", parseInt(p.dataset.variant) === index)
  );
  updateVariantCharCount(index);
}

function updateVariantCharCount(index) {
  const outputEl = variants[index].element;
  const countEl = document.querySelector('.char-count[data-variant="' + index + '"]');
  if (!countEl) return;
  const len = outputEl.innerText.length;
  countEl.textContent = len.toLocaleString() + " / " + LINKEDIN_CHAR_LIMIT.toLocaleString() + " characters";
  countEl.className = "char-count " + (len > LINKEDIN_CHAR_LIMIT ? "over-limit" : "under-limit");
}

function buildPrompt() {
  const lengthInstr = LENGTH_INSTRUCTIONS[lengthSlider.value];
  const promptKey = currentMode === "improve" ? "improve_" + selectedTone : selectedTone;
  let prompt = SYSTEM_PROMPTS[promptKey] + "\n- LENGTH: " + lengthInstr;
  if (activeTemplate && currentMode === "write") {
    const tpl = TEMPLATES.find((t) => t.id === activeTemplate);
    if (tpl) prompt += "\n- CONTEXT: " + tpl.systemAddendum;
  }
  return prompt;
}

async function regenerateVariant(index) {
  const apiKey = getApiKey();
  const achievement = achievementInput.value.trim();
  if (!apiKey || !achievement) return;

  const tab = document.querySelector('.variant-tab[data-variant="' + index + '"]');
  tab.classList.add("loading");
  try {
    const text = await callGemini(apiKey, buildPrompt(), achievement);
    variants[index].text = text;
    variants[index].element.textContent = text;
    updateVariantCharCount(index);
  } catch (err) {
    variants[index].element.textContent = "Error: " + (err.message || "Failed to generate");
  } finally {
    tab.classList.remove("loading");
  }
}

// --- Clipboard ---

function copyToClipboard(text, btn) {
  const done = () => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = orig; }, 2000);
    addToHistory({
      id: Date.now().toString(),
      text: text,
      tone: selectedTone,
      achievement: achievementInput.value.trim(),
      timestamp: Date.now(),
      mode: currentMode,
    });
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {
      fallbackCopy(text);
      done();
    });
  } else {
    fallbackCopy(text);
    done();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// --- Post History ---

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("post_history") || "[]");
  } catch {
    return [];
  }
}

function saveHistoryData(history) {
  localStorage.setItem("post_history", JSON.stringify(history));
}

function addToHistory(entry) {
  const history = loadHistory();
  // Avoid duplicate if same text was just copied
  if (history.length > 0 && history[0].text === entry.text) return;
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  saveHistoryData(history);
  renderHistory();
}

function deleteFromHistory(id) {
  const history = loadHistory().filter((h) => h.id !== id);
  saveHistoryData(history);
  renderHistory();
}

function clearHistory() {
  if (!confirm("Delete all post history?")) return;
  localStorage.removeItem("post_history");
  renderHistory();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderHistory() {
  const history = loadHistory();
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  const clearBtn = document.getElementById("clear-history-btn");

  list.innerHTML = "";

  if (history.length === 0) {
    empty.classList.remove("hidden");
    clearBtn.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  clearBtn.classList.remove("hidden");

  history.forEach((item) => {
    const el = document.createElement("div");
    el.className = "history-item";
    const date = new Date(item.timestamp);
    const timeStr =
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    el.innerHTML =
      '<div class="history-item-content">' +
        '<div class="history-preview">' + escapeHtml(item.text) + "</div>" +
        '<div class="history-meta">' +
          '<span class="tone-badge ' + (item.tone || "professional") + '">' + (item.tone || "professional") + "</span>" +
          "<span>" + timeStr + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="history-actions">' +
        '<button class="history-use-btn">Use</button>' +
        '<button class="history-delete-btn">Delete</button>' +
      "</div>";

    el.querySelector(".history-use-btn").addEventListener("click", () => {
      buildVariantUI();
      variants[0].text = item.text;
      variants[0].element.textContent = item.text;
      resultDiv.classList.remove("hidden");
      updateVariantCharCount(0);
      // Mark the first tab as loaded
      const tab = document.querySelector('.variant-tab[data-variant="0"]');
      if (tab) tab.classList.remove("loading");
      resultDiv.scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".history-delete-btn").addEventListener("click", () => {
      deleteFromHistory(item.id);
    });

    list.appendChild(el);
  });
}

// --- Init ---

async function init() {
  initTheme();
  renderTemplates();
  await loadApiKey();
  if (cachedApiKey) {
    showApp();
  } else {
    showOnboarding();
  }
  renderHistory();
}

document.addEventListener("DOMContentLoaded", init);

// --- Onboarding ---

startBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.style.borderColor = "var(--error)";
    apiKeyInput.focus();
    return;
  }
  if (!key.startsWith("AIza") || key.length < 35 || key.length > 45) {
    apiKeyInput.style.borderColor = "var(--error)";
    alert('That doesn\'t look like a valid Gemini API key. It should be ~39 characters starting with "AIza". You may have pasted it twice.');
    apiKeyInput.value = "";
    apiKeyInput.focus();
    return;
  }
  apiKeyInput.style.borderColor = "";
  await saveApiKey(key);
  showApp();
});

apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startBtn.click();
});

settingsBtn.addEventListener("click", showOnboarding);

// --- Mode Toggle ---

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    if (currentMode === "improve") {
      inputLabel.textContent = "Paste your draft";
      achievementInput.placeholder = "Paste your existing LinkedIn post here to improve it...";
      achievementInput.rows = 8;
      document.getElementById("templates").classList.add("hidden");
      // Clear active template
      activeTemplate = null;
      document.querySelectorAll(".template-chip").forEach((c) => c.classList.remove("active"));
    } else {
      inputLabel.textContent = "What did you achieve?";
      achievementInput.placeholder = "e.g. fixed a bug in our api, got promoted, shipped a new feature, learned Python...";
      achievementInput.rows = 4;
      document.getElementById("templates").classList.remove("hidden");
    }
  });
});

// --- Tone Toggle ---

toneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    toneBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// --- Length Slider ---

lengthSlider.addEventListener("input", () => {
  lengthValue.textContent = LENGTH_LABELS[lengthSlider.value];
});

// --- Generate ---

generateBtn.addEventListener("click", async () => {
  const achievement = achievementInput.value.trim();
  if (!achievement) {
    showError("Please describe what you achieved first!");
    return;
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    showOnboarding();
    return;
  }

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="spinner"></span>Redacting...';
  resultDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");

  const prompt = buildPrompt();

  buildVariantUI();
  resultDiv.classList.remove("hidden");
  activeVariant = 0;

  const promises = [];
  for (let i = 0; i < NUM_VARIANTS; i++) {
    const p = callGemini(apiKey, prompt, achievement)
      .then((text) => {
        variants[i].text = text;
        variants[i].element.textContent = text;
        document.querySelector('.variant-tab[data-variant="' + i + '"]').classList.remove("loading");
        if (i === activeVariant) updateVariantCharCount(i);
      })
      .catch((err) => {
        variants[i].element.textContent = "Error: " + (err.message || "Failed to generate");
        document.querySelector('.variant-tab[data-variant="' + i + '"]').classList.remove("loading");
      });
    promises.push(p);
  }

  try {
    await Promise.allSettled(promises);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Redact for LinkedIn";
  }
});

// --- History clear button ---

document.getElementById("clear-history-btn").addEventListener("click", clearHistory);
