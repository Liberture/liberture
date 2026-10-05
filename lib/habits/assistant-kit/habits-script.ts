/**
 * scripts/habits.py inside the Claude skill. Standard library only, so it runs
 * in Claude's code execution without installing anything. The personal kit
 * bakes in the URL and token; the generic download leaves them to env vars.
 */
export function habitsScript(config: { baseUrl: string; token: string | null }): string {
  const tokenLine = config.token
    ? `TOKEN = os.environ.get("LIBERTURE_HABITS_TOKEN", ${JSON.stringify(config.token)})`
    : `TOKEN = os.environ.get("LIBERTURE_HABITS_TOKEN", "")`

  return `#!/usr/bin/env python3
"""Liberture from the command line. Prints JSON (or markdown for summary).

  python3 habits.py today              start here: date, user, today, urgent todos
  python3 habits.py log "meditation"   mark done today (any name the user says)
  python3 habits.py log "meditation" --undo
  python3 habits.py log "walk" --date 2026-10-03
  python3 habits.py create "Running"   new habit: daily, no reminder
  python3 habits.py create "Gym" --days mon,wed,fri --time 07:00
  python3 habits.py create "Swim" --per-week 2
  python3 habits.py add-todo "Call the bank" --due 2026-10-09
  python3 habits.py done-todo "bank"   finish a todo (any name the user says)
  python3 habits.py todos              all open todos
  python3 habits.py stats
  python3 habits.py habits             per-habit streaks and rates
  python3 habits.py search "sleep"     catalog search, with infoUrl links
  python3 habits.py recommendations
  python3 habits.py adopt caffeine-cutoff        add a protocol
  python3 habits.py adopt vegetables-first --habit
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("LIBERTURE_HABITS_URL", ${JSON.stringify(config.baseUrl)}).rstrip("/")
${tokenLine}
TIME_ZONE = os.environ.get("LIBERTURE_HABITS_TZ", "")


def call(method, path, body=None, raw=False):
    if not TOKEN:
        sys.exit("No token. Set LIBERTURE_HABITS_TOKEN, or download your personal skill from Settings > Voice assistants.")
    # Cloudflare's browser integrity check rejects urllib's default
    # "Python-urllib/x.y" user agent with error 1010, so name ourselves.
    headers = {
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/json",
        "User-Agent": "liberture-habits-skill/1.0 (+" + BASE_URL + "/docs)",
    }
    if TIME_ZONE:
        headers["X-Time-Zone"] = TIME_ZONE
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE_URL + "/api/v1" + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            text = res.read().decode()
    except urllib.error.HTTPError as err:
        text = err.read().decode()
        try:
            payload = json.loads(text)
        except ValueError:
            payload = {"error": text}
        payload["status"] = err.code
        if payload.get("say"):
            print(payload["say"])
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        sys.exit(1)
    except urllib.error.URLError as err:
        sys.exit("Can't reach " + BASE_URL + " (" + str(err.reason) + "). If this is Claude's code execution, "
                 "allow the domain " + BASE_URL.split("//")[-1] + " under Settings > Capabilities.")
    return text if raw else json.loads(text)


def out(value):
    if isinstance(value, dict) and value.get("say"):
        print(value["say"])
    print(value if isinstance(value, str) else json.dumps(value, indent=2, ensure_ascii=False))


def flag(args, name):
    if name in args:
        i = args.index(name)
        value = args[i + 1] if i + 1 < len(args) else None
        del args[i:i + 2]
        return value
    return None


def main(argv):
    if not argv:
        sys.exit(__doc__)
    cmd, args = argv[0], argv[1:]

    if cmd in ("today", "summary"):
        out(call("GET", "/summary", raw=True))
    elif cmd == "context":
        out(call("GET", "/assistant"))
    elif cmd == "habits":
        out(call("GET", "/habits"))
    elif cmd == "log":
        undo = "--undo" in args
        args = [a for a in args if a != "--undo"]
        date = flag(args, "--date")
        if not args:
            sys.exit("Which habit?")
        body = {"habit": " ".join(args), "completed": not undo}
        if date:
            body["date"] = date
        out(call("POST", "/completions/toggle", body))
    elif cmd == "create":
        days = flag(args, "--days")
        time = flag(args, "--time")
        per_week = flag(args, "--per-week")
        body = {"name": " ".join(args)}
        if days:
            body["days"] = [d for d in days.replace(" ", ",").split(",") if d]
        if time:
            body["time"] = time
        if per_week:
            body["timesPerWeek"] = int(per_week)
        out(call("POST", "/habits", body))
    elif cmd == "stats":
        out(call("GET", "/stats"))
    elif cmd == "todos":
        out(call("GET", "/todos?status=pending&sort=deadline"))
    elif cmd == "add-todo":
        due = flag(args, "--due")
        priority = flag(args, "--priority")
        body = {"title": " ".join(args)}
        if due:
            body["dueDate"] = due
        if priority:
            body["priority"] = int(priority)
        out(call("POST", "/todos", body))
    elif cmd == "done-todo":
        out(call("POST", "/todos/status", {"todo": " ".join(args), "status": "completed"}))
    elif cmd == "search":
        pillar = flag(args, "--pillar")
        query = urllib.parse.urlencode({k: v for k, v in {"q": " ".join(args), "pillar": pillar, "limit": 5}.items() if v})
        out(call("GET", "/catalog?" + query))
    elif cmd == "recommendations":
        out(call("GET", "/coach/recommendations"))
    elif cmd == "adopt":
        is_habit = "--habit" in args
        slug = [a for a in args if a != "--habit"][0]
        out(call("POST", "/habits/adopt", {"habitSlug" if is_habit else "protocolSlug": slug}))
    else:
        sys.exit("Unknown command " + repr(cmd) + "\\n" + __doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
`
}
