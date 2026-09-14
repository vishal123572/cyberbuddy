# 🔐 CyberBuddy

CyberBuddy is an interactive cybersecurity learning platform designed to help students and beginners understand real-world security concepts through hands-on labs, terminal-style simulations, and AI-powered guidance — all in a safe environment.

Learn cybersecurity by doing, not just reading.

## 🚀 Why CyberBuddy?

Traditional learning often focuses on theory. CyberBuddy bridges the gap between concepts and practice by providing simulated labs that feel real, without risking actual systems.

Whether you're starting out or brushing up on fundamentals, CyberBuddy acts like a personal cybersecurity lab companion.

## ✨ Features

- 🧪 **Interactive Cyber Labs**: Practice cybersecurity concepts through guided hands-on challenges.
- 💻 **Terminal-Style Simulations**: Learn commands, syntax, and workflows without touching real production systems.
- 🧠 **Rule-Based AI Guidance**: Get clear explanations of what happened, why it happened, security impacts, and defensive tips.
- 🎯 **Mission Validation**: Real-time checking of required commands and lab progress.
- 💡 **Hint System**: Built-in hints to assist when you get stuck.
- 📊 **SQLite Progress Tracking**: Persistent user progress tracking locally with SQLite.
- 🎯 **Beginner-Friendly & Safe**: Zero risk to actual infrastructure.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Cyberpunk Theme), Vanilla JavaScript
- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Database**: SQLite3 (`cyberbuddy.db`)
- **AI Logic**: Contextual Rule-Based Security Explanation Engine

## 🧪 Included Labs

1. 🔍 **Reconnaissance Basics (`recon-101`)** – Learn port scanning with `nmap`, domain lookup with `whois` and `dig`, and reachability checks with `ping`.
2. 🔑 **Password & Hashing Basics (`pass-101`)** – Identify hash types with `hashid`, simulate hash cracking with `john`, and compute MD5 digests with `md5sum`.
3. 📜 **Log Analysis Basics (`log-101`)** – Investigate auth logs with `grep`, inspect entries with `cat`/`head`, and extract IP addresses with `awk`.
4. 🌐 **Network Basics (`net-101`)** – Inspect active listening ports with `netstat`, simulate packet sniffing with `tcpdump`, and check local ARP cache with `arp`.

## ▶️ Quick Start & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/vishal123572/cyberbuddy.git
cd cyberbuddy
```

### 2. Set up backend & virtual environment

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Windows (PowerShell / CMD):**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Open CyberBuddy
Navigate to `http://localhost:8000` in your web browser.

---

## 📄 License
This project is licensed under the MIT License.
