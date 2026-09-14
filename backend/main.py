from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timezone
from typing import List
import json
import sqlite3


BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
LABS_FILE = BACKEND_DIR / "data" / "labs.json"
DB_FILE = BACKEND_DIR / "data" / "cyberbuddy.db"

app = FastAPI(title="CyberBuddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ValidateRequest(BaseModel):
    commands_run: List[str] = []


class ExplainRequest(BaseModel):
    commands_run: List[str] = []


class ProgressCompleteRequest(BaseModel):
    learner_id: str
    lab_id: str


def load_labs():
    if not LABS_FILE.exists():
        return []

    with LABS_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return data.get("labs", [])


def normalize_command(command: str) -> str:
    if not command:
        return ""

    return " ".join(command.strip().lower().split())


def lab_exists(lab_id: str) -> bool:
    labs = load_labs()

    for lab in labs:
        if lab.get("id") == lab_id:
            return True

    return False


def get_db():
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)

    conn = get_db()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id TEXT NOT NULL,
            lab_id TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            UNIQUE(learner_id, lab_id)
        )
        """
    )

    conn.commit()
    conn.close()


init_db()


def build_insights(lab: dict, commands: set):
    lab_id = lab.get("id")
    insights = []

    if lab_id == "recon-basics":
        if "scan 10.10.10.5" not in commands:
            insights.append(
                "You have not run the simulated scan yet. Start with: scan 10.10.10.5"
            )
        else:
            insights.append(
                "You discovered open ports. Every open port is a possible entry point."
            )

        if "inspect 80" in commands:
            insights.append(
                "You inspected HTTP. Check whether it should redirect to HTTPS."
            )

        if "banner 80" in commands:
            insights.append(
                "You collected simulated banner data. Service banners can reveal versions and help defenders prioritize patching."
            )

        if "whois 10.10.10.5" in commands:
            insights.append(
                "You looked up ownership information. In real environments, always verify scope and authorization."
            )

    if lab_id == "password-hashing":
        if "hash password123" in commands:
            insights.append(
                "You hashed a weak common password. Weak passwords are easy to guess."
            )

        if "check password123" in commands:
            insights.append(
                "You checked a weak password. Real attackers often test common password lists first."
            )

        if "breach password123" in commands:
            insights.append(
                "You checked whether the password appeared in a simulated breach dataset."
            )

        if "policy" in commands:
            insights.append(
                "You reviewed the password policy. Policies help enforce stronger credential choices."
            )

    if lab_id == "log-analysis":
        if "cat /var/log/auth.log" in commands:
            insights.append(
                "You viewed the simulated authentication log."
            )

        if "grep failed /var/log/auth.log" in commands:
            insights.append(
                "You filtered failed logins. Repeated failures can indicate brute-force activity."
            )

        if "analyze" in commands:
            insights.append(
                "You analyzed the log pattern. Failed logins followed by success can be suspicious."
            )

        if "timeline" in commands:
            insights.append(
                "You built a timeline. Timelines help defenders understand the order of events."
            )

    if lab_id == "network-basics":
        if "netstat -an" in commands:
            insights.append(
                "You listed simulated network connections."
            )

        if "inspect 4444" in commands:
            insights.append(
                "You inspected port 4444. This port is commonly used in educational reverse-shell examples."
            )

        if "trace 198.51.100.10" in commands:
            insights.append(
                "You traced the suspicious destination address."
            )

        if "block 198.51.100.10" in commands:
            insights.append(
                "You simulated blocking the suspicious address. In real environments, blocking should follow investigation and policy."
            )

    required = lab.get("required_commands", [])
    missing = []

    for command in required:
        if normalize_command(command) not in commands:
            missing.append(command)

    if missing:
        insights.append(
            "Remaining mission commands: " + ", ".join(missing)
        )

    if not insights:
        insights.append(
            "Run the lab commands, then use explain again for a personalized rule-based explanation."
        )

    return insights


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "project": "CyberBuddy",
        "message": "Safe cybersecurity learning environment",
    }


@app.get("/api/labs")
def get_labs():
    return {
        "labs": load_labs()
    }


@app.get("/api/labs/{lab_id}")
def get_lab(lab_id: str):
    labs = load_labs()

    for lab in labs:
        if lab.get("id") == lab_id:
            return lab

    raise HTTPException(status_code=404, detail="Lab not found")


@app.post("/api/labs/{lab_id}/validate")
def validate_lab(lab_id: str, payload: ValidateRequest):
    labs = load_labs()
    lab = None

    for item in labs:
        if item.get("id") == lab_id:
            lab = item
            break

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    required_commands = lab.get("required_commands", [])
    commands_run = {
        normalize_command(command) for command in payload.commands_run
    }

    missing_commands = []

    for command in required_commands:
        if normalize_command(command) not in commands_run:
            missing_commands.append(command)

    complete = len(missing_commands) == 0

    if complete:
        message = "Mission validated. You can complete this lab."
    else:
        message = "Mission not complete yet. Run the missing commands."

    return {
        "lab_id": lab_id,
        "complete": complete,
        "missing_commands": missing_commands,
        "message": message,
    }


@app.post("/api/labs/{lab_id}/explain")
def explain_lab(lab_id: str, payload: ExplainRequest):
    labs = load_labs()
    lab = None

    for item in labs:
        if item.get("id") == lab_id:
            lab = item
            break

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    commands_run = {
        normalize_command(command) for command in payload.commands_run
    }

    insights = build_insights(lab, commands_run)

    return {
        "lab_id": lab_id,
        "explanation": lab.get(
            "explanation",
            "No explanation available for this lab yet.",
        ),
        "why_it_matters": lab.get(
            "why_it_matters",
            "No additional context available yet.",
        ),
        "defender_tips": lab.get("defender_tips", []),
        "insights": insights,
    }


@app.get("/api/progress")
def get_progress(learner_id: str = Query(...)):
    if not learner_id:
        raise HTTPException(status_code=400, detail="learner_id is required")

    conn = get_db()

    rows = conn.execute(
        """
        SELECT lab_id, completed_at
        FROM progress
        WHERE learner_id = ?
        ORDER BY completed_at DESC
        """,
        (learner_id,),
    ).fetchall()

    conn.close()

    completed_labs = []

    for row in rows:
        completed_labs.append(
            {
                "lab_id": row["lab_id"],
                "completed_at": row["completed_at"],
            }
        )

    return {
        "learner_id": learner_id,
        "completed_labs": completed_labs,
    }


@app.post("/api/progress/complete")
def complete_progress(payload: ProgressCompleteRequest):
    learner_id = payload.learner_id.strip()
    lab_id = payload.lab_id.strip()

    if not learner_id:
        raise HTTPException(status_code=400, detail="learner_id is required")

    if not lab_id:
        raise HTTPException(status_code=400, detail="lab_id is required")

    if not lab_exists(lab_id):
        raise HTTPException(status_code=404, detail="Lab not found")

    completed_at = datetime.now(timezone.utc).isoformat()

    conn = get_db()

    conn.execute(
        """
        INSERT OR REPLACE INTO progress (learner_id, lab_id, completed_at)
        VALUES (?, ?, ?)
        """,
        (learner_id, lab_id, completed_at),
    )

    conn.commit()
    conn.close()

    return {
        "status": "saved",
        "learner_id": learner_id,
        "lab_id": lab_id,
        "completed_at": completed_at,
    }


if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )
else:
    @app.get("/")
    def root():
        return {
            "message": "Frontend folder missing. Create frontend/index.html first."
        }
