const LEARNER_KEY = "cyberbuddy_learner_id";

function getLearnerId() {
  let learnerId = localStorage.getItem(LEARNER_KEY);

  if (!learnerId) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      learnerId = window.crypto.randomUUID();
    } else {
      learnerId = "learner-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    localStorage.setItem(LEARNER_KEY, learnerId);
  }

  return learnerId;
}

async function fetchProgress() {
  const learnerId = getLearnerId();

  const response = await fetch(
    `/api/progress?learner_id=${encodeURIComponent(learnerId)}`
  );

  if (!response.ok) {
    throw new Error("Could not fetch progress");
  }

  const data = await response.json();

  return data.completed_labs || [];
}

async function completeLabAPI(labId) {
  const learnerId = getLearnerId();

  const response = await fetch("/api/progress/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      learner_id: learnerId,
      lab_id: labId
    })
  });

  if (!response.ok) {
    throw new Error("Could not save lab completion");
  }

  return response.json();
}
