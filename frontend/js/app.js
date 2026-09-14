let labs = [];
let currentLab = null;
let currentTerminal = null;
let commandsRun = new Set();
let hintIndex = 0;
let validated = false;
let progressCompleted = new Set();

document.addEventListener("DOMContentLoaded", init);

async function init() {
  document.getElementById("back-btn").addEventListener("click", showLabsView);

  document.getElementById("hint-btn").addEventListener("click", () => {
    const hint = getNextHint();

    if (currentTerminal) {
      currentTerminal.print(hint, "terminal-info");
    }
  });

  document.getElementById("validate-btn").addEventListener("click", validateCurrentLab);
  document.getElementById("complete-btn").addEventListener("click", completeCurrentLab);

  await loadLabs();
  await loadProgress();

  renderLabs();
  renderProgress();
}

async function loadLabs() {
  try {
    const response = await fetch("/api/labs");

    if (!response.ok) {
      throw new Error("API error");
    }

    const data = await response.json();
    labs = data.labs || [];
  } catch (error) {
    console.error(error);
    labs = [];

    document.getElementById("lab-list").innerHTML = `
      <div class="card">
        Could not load labs. Start the FastAPI backend with:
        <br><br>
        <code>cd backend</code><br>
        <code>uvicorn main:app --reload</code>
      </div>
    `;
  }
}

async function loadProgress() {
  try {
    const completed = await fetchProgress();
    progressCompleted = new Set(completed.map((item) => item.lab_id));
  } catch (error) {
    console.error(error);
    progressCompleted = new Set();
  }
}

function renderLabs() {
  const list = document.getElementById("lab-list");

  if (!labs.length) {
    return;
  }

  list.innerHTML = "";

  labs.forEach((lab) => {
    const completed = progressCompleted.has(lab.id);

    const card = document.createElement("article");
    card.className = "card lab-card";

    card.innerHTML = `
      <div class="lab-top">
        <h3>${lab.icon || "🧪"} ${lab.title}</h3>
        <span class="badge">${lab.difficulty || "Beginner"}</span>
      </div>

      <p>${lab.summary}</p>

      <div class="lab-actions">
        <button class="btn small" data-lab="${lab.id}">Start</button>
        ${completed ? '<span class="done">✅ Completed</span>' : ""}
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      openLab(lab.id);
    });

    list.appendChild(card);
  });
}

function showLabsView() {
  document.getElementById("labs").hidden = false;
  document.getElementById("lab-view").hidden = true;

  renderLabs();
  renderProgress();
}

function openLab(labId) {
  currentLab = labs.find((lab) => lab.id === labId);

  if (!currentLab) {
    return;
  }

  commandsRun = new Set();
  hintIndex = 0;
  validated = false;

  document.getElementById("labs").hidden = true;
  document.getElementById("lab-view").hidden = false;

  document.getElementById("lab-header").innerHTML = `
    <h2>${currentLab.icon || "🧪"} ${currentLab.title}</h2>
    <p>${currentLab.summary}</p>
    <p class="scenario">${currentLab.scenario}</p>
  `;

  document.getElementById("lab-objectives").innerHTML = `
    <h3>Objectives</h3>
    <ul>
      ${(currentLab.objectives || [])
        .map((item) => `<li>${item}</li>`)
        .join("")}
    </ul>
  `;

  document.getElementById("hint-panel").classList.add("hidden");
  document.getElementById("hint-text").textContent = "";
  document.getElementById("ai-panel").classList.add("hidden");
  document.getElementById("ai-analysis").innerHTML = "";
  document.getElementById("ai-text").textContent = "";
  document.getElementById("ai-why").textContent = "";
  document.getElementById("ai-tips").innerHTML = "";
  document.getElementById("complete-message").textContent = "";
  document.getElementById("complete-btn").disabled = true;

  updateMissionList();

  currentTerminal = createTerminal({
    outputEl: document.getElementById("terminal-output"),
    inputEl: document.getElementById("terminal-input"),
    lab: currentLab,
    onCommand: (normalized) => {
      commandsRun.add(normalized);
      updateMissionList();
    },
    onHint: getNextHint,
    onMission: getMissionLines,
    onHistory: () => Array.from(commandsRun),
    onExplain: explainCurrentLab,
    onValidate: validateCurrentLab
  });

  currentTerminal.focus();
}

function getNextHint() {
  if (!currentLab || !currentLab.hints || currentLab.hints.length === 0) {
    return "No hints available for this lab.";
  }

  if (hintIndex >= currentLab.hints.length) {
    return "No more hints. Try validating your mission.";
  }

  const hint = currentLab.hints[hintIndex];
  hintIndex += 1;

  document.getElementById("hint-panel").classList.remove("hidden");
  document.getElementById("hint-text").textContent = hint;

  return hint;
}

function getMissionLines() {
  if (!currentLab) {
    return ["No active lab."];
  }

  const required = currentLab.required_commands || [];

  if (!required.length) {
    return ["No mission checklist defined."];
  }

  return required.map((command) => {
    const done = commandsRun.has(normalizeCommand(command));
    return `${done ? "[x]" : "[ ]"} ${command}`;
  });
}

function updateMissionList() {
  const list = document.getElementById("mission-list");

  if (!currentLab) {
    list.innerHTML = "";
    return;
  }

  const required = currentLab.required_commands || [];

  list.innerHTML = required
    .map((command) => {
      const done = commandsRun.has(normalizeCommand(command));
      return `
        <li class="${done ? "mission-done" : "mission-pending"}">
          ${done ? "✅" : "⬜"} ${command}
        </li>
      `;
    })
    .join("");
}

async function validateCurrentLab() {
  if (!currentLab) {
    return false;
  }

  const completeButton = document.getElementById("complete-btn");
  const completeMessage = document.getElementById("complete-message");

  try {
    const response = await fetch(`/api/labs/${currentLab.id}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        commands_run: Array.from(commandsRun)
      })
    });

    if (!response.ok) {
      throw new Error("Validation failed");
    }

    const data = await response.json();

    if (data.complete) {
      validated = true;
      completeButton.disabled = false;
      completeMessage.textContent = "Mission validated.";

      if (currentTerminal) {
        currentTerminal.print(data.message, "terminal-success");
      }
    } else {
      validated = false;
      completeButton.disabled = true;
      completeMessage.textContent = "Mission not complete yet.";

      if (currentTerminal) {
        currentTerminal.print(data.message, "terminal-warning");

        (data.missing_commands || []).forEach((command) => {
          currentTerminal.print(`- ${command}`, "terminal-muted");
        });
      }
    }

    return data.complete;
  } catch (error) {
    console.error(error);

    completeMessage.textContent = "Validation failed.";

    if (currentTerminal) {
      currentTerminal.print("Validation failed. Is the backend running?", "terminal-error");
    }

    return false;
  }
}

async function completeCurrentLab() {
  if (!currentLab) {
    return;
  }

  const completeMessage = document.getElementById("complete-message");

  if (!validated) {
    const isValid = await validateCurrentLab();

    if (!isValid) {
      return;
    }
  }

  try {
    await completeLabAPI(currentLab.id);

    progressCompleted.add(currentLab.id);
    completeMessage.textContent = "Saved to SQLite.";

    if (currentTerminal) {
      currentTerminal.print("Lab completion saved to SQLite.", "terminal-success");
    }

    renderProgress();
  } catch (error) {
    console.error(error);
    completeMessage.textContent = "Could not save progress.";

    if (currentTerminal) {
      currentTerminal.print("Could not save progress. Check the backend.", "terminal-error");
    }
  }
}

async function explainCurrentLab() {
  if (!currentLab) {
    return;
  }

  try {
    const response = await fetch(`/api/labs/${currentLab.id}/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        commands_run: Array.from(commandsRun)
      })
    });

    if (!response.ok) {
      throw new Error("Explanation request failed");
    }

    const data = await response.json();
    renderExplanation(data);
  } catch (error) {
    console.error(error);

    renderExplanation({
      explanation: currentLab.explanation || "No explanation available.",
      why_it_matters: currentLab.why_it_matters || "No context available.",
      defender_tips: currentLab.defender_tips || [],
      insights: ["Using offline explanation because the API request failed."]
    });
  }
}

function renderExplanation(data) {
  const panel = document.getElementById("ai-panel");
  panel.classList.remove("hidden");

  const analysis = document.getElementById("ai-analysis");
  const insights = data.insights || [];

  if (insights.length) {
    analysis.innerHTML = `
      <ul class="analysis-list">
        ${insights.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
  } else {
    analysis.innerHTML = "<p>No additional analysis yet.</p>";
  }

  document.getElementById("ai-text").textContent =
    data.explanation || currentLab?.explanation || "";

  document.getElementById("ai-why").textContent =
    data.why_it_matters || currentLab?.why_it_matters || "";

  const tips = data.defender_tips || currentLab?.defender_tips || [];

  document.getElementById("ai-tips").innerHTML = tips.length
    ? tips.map((tip) => `<li>${tip}</li>`).join("")
    : "<li>No defender tips available yet.</li>";
}

function renderProgress() {
  const summary = document.getElementById("progress-summary");

  if (!labs.length) {
    summary.textContent = "No labs loaded yet.";
    return;
  }

  const completed = labs.filter((lab) => progressCompleted.has(lab.id)).length;
  const percent = Math.round((completed / labs.length) * 100);

  summary.innerHTML = `
    <p><strong>${completed}</strong> of <strong>${labs.length}</strong> labs completed</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
    <p>${percent}% complete</p>
  `;
}
