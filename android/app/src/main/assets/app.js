const onboarding = document.getElementById("onboarding");
const appScreen = document.getElementById("app");
const apiKeyInput = document.getElementById("api-key-input");
const startBtn = document.getElementById("start-btn");
const achievementInput = document.getElementById("achievement");
const generateBtn = document.getElementById("generate-btn");
const resultDiv = document.getElementById("result");
const outputDiv = document.getElementById("output");
const copyBtn = document.getElementById("copy-btn");
const errorDiv = document.getElementById("error");
const toneBtns = document.querySelectorAll(".tone-btn");
const settingsBtn = document.getElementById("settings-btn");
const lengthSlider = document.getElementById("length-slider");
const lengthValue = document.getElementById("length-value");

let selectedTone = "professional";
let cachedApiKey = "";

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
};

// --- API key persistence (file-backed via server, with localStorage fallback) ---

async function loadApiKey() {
  try {
    const res = await fetch("/config");
    if (res.ok) {
      const data = await res.json();
      if (data.gemini_api_key) {
        cachedApiKey = data.gemini_api_key;
        return;
      }
    }
  } catch {}
  // Fallback to localStorage (Android / standalone)
  cachedApiKey = localStorage.getItem("gemini_api_key") || "";
}

async function saveApiKey(key) {
  cachedApiKey = key;
  localStorage.setItem("gemini_api_key", key);
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

// --- Gemini API (direct call, no backend) ---

async function callGemini(apiKey, systemPrompt, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
  onboarding.classList.remove("hidden");
  appScreen.classList.add("hidden");
  apiKeyInput.value = getApiKey();
}

async function init() {
  await loadApiKey();
  if (getApiKey()) {
    showApp();
  } else {
    showOnboarding();
  }
}

// --- Onboarding ---

startBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.style.borderColor = "var(--error)";
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

// --- Tone toggle ---

toneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    toneBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// --- Length slider ---

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

  try {
    const lengthInstr = LENGTH_INSTRUCTIONS[lengthSlider.value];
    const prompt = SYSTEM_PROMPTS[selectedTone] + "\n- LENGTH: " + lengthInstr;
    const postText = await callGemini(apiKey, prompt, achievement);
    outputDiv.textContent = postText;
    resultDiv.classList.remove("hidden");
  } catch (err) {
    showError(err.message || "Something went wrong. Check your internet connection.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Redact for LinkedIn";
  }
});

// --- Copy ---

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputDiv.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 2000);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = outputDiv.textContent;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 2000);
  }
});

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hidden");
}

init();
