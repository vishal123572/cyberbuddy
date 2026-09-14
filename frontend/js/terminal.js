function normalizeCommand(command) {
  return (command || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createTerminal({
  outputEl,
  inputEl,
  lab,
  onExplain,
  onCommand,
  onHint,
  onMission,
  onHistory,
  onValidate
}) {
  outputEl.innerHTML = "";
  inputEl.value = "";

  const print = (text, className = "") => {
    const line = document.createElement("div");
    line.className = `terminal-line ${className}`.trim();
    line.textContent = text;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  print("🔐 CyberBuddy Terminal", "terminal-title");

  if (lab.scenario) {
    print(lab.scenario, "terminal-info");
  }

  print(
    lab.starting_message || "Type help to see available commands.",
    "terminal-muted"
  );

  const commonPasswords = [
    "password",
    "password123",
    "123456",
    "admin",
    "qwerty",
    "letmein"
  ];

  const authLog = [
    "Jan 10 09:12:01 server sshd[101]: Failed password for admin from 203.0.113.77 port 44122 ssh2",
    "Jan 10 09:12:04 server sshd[102]: Failed password for admin from 203.0.113.77 port 44123 ssh2",
    "Jan 10 09:12:08 server sshd[103]: Failed password for admin from 203.0.113.77 port 44124 ssh2",
    "Jan 10 09:12:12 server sshd[104]: Failed password for root from 203.0.113.77 port 44125 ssh2",
    "Jan 10 09:12:18 server sshd[105]: Accepted password for admin from 203.0.113.77 port 44126 ssh2",
    "Jan 10 09:15:44 server sshd[120]: Accepted password for backup from 10.10.10.20 port 51022 ssh2"
  ];

  function fakeHash(text) {
    let hash = 5381;

    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }

    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  function notAvailable(commandName, labName) {
    print(`${commandName} is available in the ${labName} lab.`, "terminal-error");
  }

  function help() {
    print("Available commands:", "terminal-info");
    print("help                     show this help", "terminal-muted");
    print("clear                    clear terminal", "terminal-muted");
    print("hint                     show next hint", "terminal-muted");
    print("mission                  show mission checklist", "terminal-muted");
    print("history                  show commands used", "terminal-muted");
    print("validate                 validate mission completion", "terminal-muted");
    print("explain                  get AI-style explanation", "terminal-muted");

    if (lab.id === "recon-basics") {
      print("scan 10.10.10.5          simulate port scan", "terminal-muted");
      print("inspect <port>           inspect simulated service", "terminal-muted");
      print("banner <port>            collect simulated banner", "terminal-muted");
      print("whois 10.10.10.5         simulated ownership lookup", "terminal-muted");
      print("dns 10.10.10.5           simulated DNS lookup", "terminal-muted");
    }

    if (lab.id === "password-hashing") {
      print("hash <text>              simulate hashing", "terminal-muted");
      print("check <password>         evaluate password strength", "terminal-muted");
      print("breach <password>        simulated breach lookup", "terminal-muted");
      print("policy                   show password policy", "terminal-muted");
    }

    if (lab.id === "log-analysis") {
      print("cat /var/log/auth.log    view simulated log", "terminal-muted");
      print("grep Failed /var/log/auth.log   filter failed logins", "terminal-muted");
      print("analyze                  summarize suspicious activity", "terminal-muted");
      print("timeline                 show event timeline", "terminal-muted");
      print("report                   generate incident report", "terminal-muted");
    }

    if (lab.id === "network-basics") {
      print("netstat -an              show simulated connections", "terminal-muted");
      print("inspect 4444             inspect suspicious port", "terminal-muted");
      print("trace 198.51.100.10      trace suspicious destination", "terminal-muted");
      print("block 198.51.100.10      simulate blocking address", "terminal-muted");
    }
  }

  function scan(target) {
    if (lab.id !== "recon-basics") {
      notAvailable("scan", "Reconnaissance Basics");
      return;
    }

    if (!target || target.toLowerCase() !== "10.10.10.5") {
      print("Simulated target must be 10.10.10.5.", "terminal-error");
      return;
    }

    print(`Starting simulated scan of ${target.toLowerCase()}...`, "terminal-muted");
    print("PORT      STATE    SERVICE", "terminal-info");
    print("22/tcp    open     ssh", "terminal-output");
    print("80/tcp    open     http", "terminal-output");
    print("443/tcp   open     https", "terminal-output");
    print("Scan complete. Try: inspect 80", "terminal-muted");
  }

  function inspect(port) {
    if (lab.id === "recon-basics") {
      const services = {
        "22": "SSH service: remote administration. In real environments, protect it with keys, restricted access, and monitoring.",
        "80": "HTTP service: unencrypted web traffic. If authentication exists, it should redirect to HTTPS.",
        "443": "HTTPS service: encrypted web traffic. Still verify certificates, TLS configuration, and web application security."
      };

      if (services[port]) {
        print(services[port], "terminal-info");
      } else {
        print(`No simulated data for port ${port}. Try 22, 80, or 443.`, "terminal-muted");
      }

      return;
    }

    if (lab.id === "network-basics") {
      if (port === "4444") {
        print("Port 4444 is commonly used in educational examples for reverse shells.", "terminal-warning");
        print("In a real investigation, verify the process, destination address, connection time, and whether the activity is authorized.", "terminal-info");
      } else {
        print(`No simulated data for port ${port}. Try 4444.`, "terminal-muted");
      }

      return;
    }

    notAvailable("inspect", "Reconnaissance Basics or Network Basics");
  }

  function banner(port) {
    if (lab.id !== "recon-basics") {
      notAvailable("banner", "Reconnaissance Basics");
      return;
    }

    const banners = {
      "22": "SSH-2.0-OpenSSH_8.9 (simulated)",
      "80": "HTTP/1.1 200 OK | Server: Apache (simulated)",
      "443": "TLS certificate CN=lab.local | Issuer: CyberBuddy CA (simulated)"
    };

    if (banners[port]) {
      print(banners[port], "terminal-info");
    } else {
      print(`No simulated banner for port ${port}. Try 22, 80, or 443.`, "terminal-muted");
    }
  }

  function whois(target) {
    if (lab.id !== "recon-basics") {
      notAvailable("whois", "Reconnaissance Basics");
      return;
    }

    if (!target || target.toLowerCase() !== "10.10.10.5") {
      print("Simulated whois target must be 10.10.10.5.", "terminal-error");
      return;
    }

    print("NetRange: 10.10.10.0 - 10.10.10.255", "terminal-output");
    print("OrgName: CyberBuddy Lab Network (simulated)", "terminal-output");
    print("Abuse contact: abuse@lab.local", "terminal-output");
    print("Note: real whois lookups require proper authorization and scope.", "terminal-muted");
  }

  function dns(target) {
    if (lab.id !== "recon-basics") {
      notAvailable("dns", "Reconnaissance Basics");
      return;
    }

    if (!target || target.toLowerCase() !== "10.10.10.5") {
      print("Simulated DNS target must be 10.10.10.5.", "terminal-error");
      return;
    }

    print("Name: lab.local", "terminal-output");
    print("Address: 10.10.10.5", "terminal-output");
  }

  function hash(text) {
    if (lab.id !== "password-hashing") {
      notAvailable("hash", "Password & Hashing Basics");
      return;
    }

    if (!text) {
      print("Usage: hash <text>", "terminal-error");
      return;
    }

    print(`Input: ${text}`, "terminal-output");
    print(`Simulated SHA-256: ${fakeHash(text)}`, "terminal-info");

    if (commonPasswords.includes(text.toLowerCase())) {
      print("Warning: this is a very common password.", "terminal-warning");
    }

    print("Note: this hash is simulated for learning and is not cryptographically generated.", "terminal-muted");
  }

  function check(text) {
    if (lab.id !== "password-hashing") {
      notAvailable("check", "Password & Hashing Basics");
      return;
    }

    if (!text) {
      print("Usage: check <password>", "terminal-error");
      return;
    }

    const issues = [];

    if (text.length < 12) {
      issues.push("less than 12 characters");
    }

    if (commonPasswords.includes(text.toLowerCase())) {
      issues.push("commonly used password");
    }

    if (!/[A-Z]/.test(text)) {
      issues.push("no uppercase letter");
    }

    if (!/[a-z]/.test(text)) {
      issues.push("no lowercase letter");
    }

    if (!/[0-9]/.test(text)) {
      issues.push("no number");
    }

    if (!/[^A-Za-z0-9]/.test(text)) {
      issues.push("no symbol");
    }

    if (issues.length === 0) {
      print("This password looks stronger than many weak passwords.", "terminal-success");
      print("In real systems, also use password managers, unique passwords, and multi-factor authentication.", "terminal-info");
    } else {
      print(`Issues found: ${issues.join(", ")}`, "terminal-warning");
    }
  }

  function policy() {
    if (lab.id !== "password-hashing") {
      notAvailable("policy", "Password & Hashing Basics");
      return;
    }

    print("Simulated password policy:", "terminal-info");
    print("- Minimum length: 12 characters", "terminal-muted");
    print("- At least one uppercase letter", "terminal-muted");
    print("- At least one lowercase letter", "terminal-muted");
    print("- At least one number", "terminal-muted");
    print("- At least one symbol", "terminal-muted");
    print("- Must not be a known breached password", "terminal-muted");
  }

  function breach(text) {
    if (lab.id !== "password-hashing") {
      notAvailable("breach", "Password & Hashing Basics");
      return;
    }

    if (!text) {
      print("Usage: breach <password>", "terminal-error");
      return;
    }

    if (commonPasswords.includes(text.toLowerCase())) {
      print(`Simulated breach lookup: "${text}" was found in common breach datasets.`, "terminal-warning");
    } else {
      print(`Simulated breach lookup: "${text}" was not found in this small simulated dataset.`, "terminal-success");
    }
  }

  function cat(file) {
    if (lab.id !== "log-analysis") {
      notAvailable("cat", "Log Analysis Basics");
      return;
    }

    if (file !== "/var/log/auth.log") {
      print(`cat: cannot open ${file}: simulated file not found`, "terminal-error");
      return;
    }

    authLog.forEach((line) => print(line, "terminal-output"));
  }

  function grep(args) {
    if (lab.id !== "log-analysis") {
      notAvailable("grep", "Log Analysis Basics");
      return;
    }

    const parts = args.split(/\s+/);
    const pattern = parts[0];
    const file = parts[1];

    if (!pattern || !file) {
      print("Usage: grep Failed /var/log/auth.log", "terminal-error");
      return;
    }

    if (file !== "/var/log/auth.log") {
      print(`grep: cannot open ${file}: simulated file not found`, "terminal-error");
      return;
    }

    const filtered = authLog.filter((line) =>
      line.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!filtered.length) {
      print("No matches found.", "terminal-muted");
      return;
    }

    filtered.forEach((line) => print(line, "terminal-output"));
  }

  function analyze() {
    if (lab.id !== "log-analysis") {
      notAvailable("analyze", "Log Analysis Basics");
      return;
    }

    print("Analysis: 4 failed password events from 203.0.113.77.", "terminal-warning");
    print("Then a successful login for admin from the same address.", "terminal-warning");
    print("Possible brute-force or credential-stuffing pattern.", "terminal-warning");
    print("Recommended actions: MFA, rate limiting, lockout policy, alerting, and IP reputation checks.", "terminal-info");
  }

  function timeline() {
    if (lab.id !== "log-analysis") {
      notAvailable("timeline", "Log Analysis Basics");
      return;
    }

    print("Timeline:", "terminal-info");
    print("09:12:01 - Failed admin login", "terminal-output");
    print("09:12:04 - Failed admin login", "terminal-output");
    print("09:12:08 - Failed admin login", "terminal-output");
    print("09:12:12 - Failed root login", "terminal-output");
    print("09:12:18 - Successful admin login from same source", "terminal-warning");
    print("09:15:44 - Successful backup login from internal address", "terminal-output");
  }

  function report() {
    if (lab.id !== "log-analysis") {
      notAvailable("report", "Log Analysis Basics");
      return;
    }

    print("Incident Report (simulated)", "terminal-info");
    print("Event: Multiple failed SSH logins followed by successful admin login.", "terminal-output");
    print("Source address: 203.0.113.77", "terminal-output");
    print("Affected account: admin", "terminal-output");
    print("Recommended response: reset credentials, enable MFA, review access logs, and restrict SSH exposure.", "terminal-info");
  }

  function netstat() {
    if (lab.id !== "network-basics") {
      notAvailable("netstat", "Network Basics");
      return;
    }

    print("Proto   Local Address              Foreign Address             State", "terminal-info");
    print("TCP     10.10.10.9:51234          198.51.100.10:4444          ESTABLISHED", "terminal-warning");
    print("TCP     10.10.10.9:50912          10.10.10.1:443              ESTABLISHED", "terminal-output");
    print("TCP     10.10.10.9:50911          10.10.10.1:80               TIME_WAIT", "terminal-output");
    print("Try: inspect 4444", "terminal-muted");
  }

  function trace(ip) {
    if (lab.id !== "network-basics") {
      notAvailable("trace", "Network Basics");
      return;
    }

    if (!ip || ip !== "198.51.100.10") {
      print("Simulated trace target must be 198.51.100.10.", "terminal-error");
      return;
    }

    print(`Tracing route to ${ip}...`, "terminal-muted");
    print("1  10.10.10.1", "terminal-output");
    print("2  192.0.2.10", "terminal-output");
    print("3  198.51.100.10", "terminal-warning");
    print("Trace complete. Destination reached in simulated environment.", "terminal-muted");
  }

  function block(ip) {
    if (lab.id !== "network-basics") {
      notAvailable("block", "Network Basics");
      return;
    }

    if (!ip || ip !== "198.51.100.10") {
      print("Simulated block target must be 198.51.100.10.", "terminal-error");
      return;
    }

    print(`Simulated firewall rule added: block outbound traffic to ${ip}.`, "terminal-success");
    print("In real environments, blocking should follow investigation and organizational policy.", "terminal-info");
  }

  function runCommand(raw) {
    const trimmed = raw.trim();

    if (!trimmed) {
      return;
    }

    const rawParts = trimmed.split(/\s+/);
    const cmd = rawParts[0].toLowerCase();
    const arg = rawParts.slice(1).join(" ");
    const normalized = normalizeCommand(trimmed);

    print(`$ ${raw}`, "terminal-command");

    if (cmd === "help") {
      help();
      return;
    }

    if (cmd === "clear") {
      outputEl.innerHTML = "";
      return;
    }

    if (cmd === "hint") {
      const hint = typeof onHint === "function" ? onHint() : null;

      if (hint) {
        print(hint, "terminal-info");
      } else {
        print("No hints available.", "terminal-muted");
      }

      return;
    }

    if (cmd === "mission") {
      const lines = typeof onMission === "function" ? onMission() : [];

      if (!lines.length) {
        print("No mission checklist available.", "terminal-muted");
        return;
      }

      lines.forEach((line) => print(line, "terminal-muted"));
      return;
    }

    if (cmd === "history") {
      const items = typeof onHistory === "function" ? onHistory() : [];

      if (!items.length) {
        print("No commands yet.", "terminal-muted");
        return;
      }

      items.forEach((item) => print(item, "terminal-output"));
      return;
    }

    if (cmd === "validate") {
      if (typeof onValidate === "function") {
        onValidate();
      } else {
        print("Validation is not available.", "terminal-error");
      }

      return;
    }

    if (cmd === "explain") {
      if (typeof onCommand === "function") {
        onCommand(normalized);
      }

      print("Requesting explanation...", "terminal-muted");

      if (typeof onExplain === "function") {
        onExplain();
      }

      return;
    }

    let count = true;

    if (cmd === "scan") {
      scan(arg);
    } else if (cmd === "inspect") {
      inspect(arg);
    } else if (cmd === "banner") {
      banner(arg);
    } else if (cmd === "whois") {
      whois(arg);
    } else if (cmd === "dns") {
      dns(arg);
    } else if (cmd === "hash") {
      hash(arg);
    } else if (cmd === "check") {
      check(arg);
    } else if (cmd === "policy") {
      policy();
    } else if (cmd === "breach") {
      breach(arg);
    } else if (cmd === "cat") {
      cat(arg);
    } else if (cmd === "grep") {
      grep(arg);
    } else if (cmd === "analyze") {
      analyze();
    } else if (cmd === "timeline") {
      timeline();
    } else if (cmd === "report") {
      report();
    } else if (cmd === "netstat") {
      netstat();
    } else if (cmd === "trace") {
      trace(arg);
    } else if (cmd === "block") {
      block(arg);
    } else if (cmd === "ls") {
      print("simulated-files: auth.log", "terminal-muted");
      count = false;
    } else {
      print(`Command not recognized: ${cmd}. Type help.`, "terminal-error");
      count = false;
    }

    if (count && typeof onCommand === "function") {
      onCommand(normalized);
    }
  }

  inputEl.onkeydown = (event) => {
    if (event.key === "Enter") {
      const value = inputEl.value;
      inputEl.value = "";
      runCommand(value);
    }
  };

  return {
    print,
    focus: () => inputEl.focus()
  };
}
