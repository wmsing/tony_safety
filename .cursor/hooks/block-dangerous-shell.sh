#!/usr/bin/env bash
# Gate high-risk shell commands (LLM03 / ADHD-4D HITL).
set -euo pipefail

input=$(cat)
command=$(COMMAND_JSON="$input" python3 -c 'import json,os; print(json.loads(os.environ["COMMAND_JSON"]).get("command",""))')

deny_re='(^|[[:space:]])(sudo|rm[[:space:]]+-rf|rm[[:space:]]+-fr)($|[[:space:]])|git[[:space:]]+push[[:space:]]+(-f|--force)|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-f|git[[:space:]]+branch[[:space:]]+-D|curl[^|]*\|[[:space:]]*(ba)?sh|wget[^|]*\|[[:space:]]*(ba)?sh|chmod[[:space:]]+777'

ask_re='(^|[[:space:]])(curl|wget|nc|ncat|ssh|scp)($|[[:space:]])|pip[[:space:]]+install|npm[[:space:]]+install|pnpm[[:space:]]+add|yarn[[:space:]]+add|brew[[:space:]]+install'
pytest_re='(^|[[:space:];|&])(pytest|python3 -m pytest|\.venv/bin/pytest)'

if [[ "$command" =~ $deny_re ]]; then
  python3 -c 'import json; print(json.dumps({
    "permission": "deny",
    "user_message": "Blocked dangerous shell command (least privilege).",
    "agent_message": "Hook denied a destructive/high-risk command. Ask the user to run it manually if truly required."
  }))'
  exit 0
fi

if [[ "$command" =~ $ask_re ]]; then
  python3 -c 'import json; print(json.dumps({
    "permission": "ask",
    "user_message": "Network / package command — review before allowing.",
    "agent_message": "HITL required for network or package install."
  }))'
  exit 0
fi

if [[ "$command" =~ $pytest_re ]]; then
  COMMAND_JSON="$input" python3 -c 'import json, os
cmd = json.loads(os.environ["COMMAND_JSON"]).get("command", "")
if "mac_free_space" in cmd:
    user_message = "Run mac_free_space unit tests (read-only pytest, no installs)."
elif "tony_safty" in cmd:
    user_message = "Run tony_safty unit tests (read-only pytest, no installs)."
else:
    user_message = "Run unit tests (read-only pytest, no installs)."
print(json.dumps({
    "permission": "ask",
    "user_message": user_message,
    "agent_message": "HITL for pytest; local test run only."
}))'
  exit 0
fi

echo '{ "permission": "allow" }'
exit 0
