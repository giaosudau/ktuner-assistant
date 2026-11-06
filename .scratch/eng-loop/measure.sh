#!/usr/bin/env bash
# The engineering loop's scoreboard: real numbers for this repo, before and after a round.
#   .scratch/eng-loop/measure.sh          counts only (seconds)
#   .scratch/eng-loop/measure.sh --tests  also times npm test and pytest (~90 s)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

lines() { git ls-files "$@" | xargs cat 2>/dev/null | wc -l | tr -d ' '; }
echo "lines   engine=$(lines 'engine/*.js')  server=$(lines 'server/kta_server/*.py' server/kta_worker/worker.js)  web=$(lines 'web/app/*' 'web/components/*' 'web/lib/*')"
echo "tests   js=$(lines 'test/*.js')  py=$(lines 'server/tests/*.py' 'server/tests/**/*.py')"

echo "homes   engine_procs=$(( 1 + $(grep -c 'subprocess.run' server/kta_server/copy.py || true) ))" \
     " stage_in_python=$(grep -c '^def stage_of' server/kta_server/desk.py || true)" \
     " llm_callers=$(grep -l 'chat/completions' server/kta_server/*.py | xargs grep -c 'chat/completions' | awk -F: '{s+=$2} END {print s}')" \
     " py_step_branches=$(grep -E '(key|"key"\)) *(==|!=) *"(undo|logger|habit|channels|baseline|install|downpipe|tooShort|none)"|"key"\) (not )?in ' server/kta_server/*.py | wc -l | tr -d ' ')" \
     " py_tuning_consts=$(grep -cE '^[A-Z_]{3,} *(: *[a-z]+)? *= *[0-9]' server/kta_server/copy.py || true)" \
     " lim_fallbacks=$(grep -cE 'lim\([^)]*, *[0-9.]+\)' server/kta_server/copy.py || true)"

echo "deps    py=$(sed -n '/^dependencies/,/^]/p' server/pyproject.toml | grep -c '^ *"')  web=$(node -p 'Object.keys(require("./web/package.json").dependencies).length')"
echo "stack   runtimes=$(( 2 + $(git ls-files server/pyproject.toml | wc -l) ))  deploy_files=$(git ls-files | grep -ciE '(^|/)(dockerfile|vercel\.json|netlify\.toml|procfile)$' || true)  owner_columns=$(grep -c 'owner_id' server/kta_server/db.py 2>/dev/null || true)"
echo "debt    $(git ls-files | xargs grep -nE '(#|//) ?ponytail:' 2>/dev/null | wc -l | tr -d ' ') ponytail: markers"

# Engine exports nothing in production calls (the worker and the engine itself).
node -e '
const fs=require("fs"),cp=require("child_process");
const own=["kta-engine","kta-car","kta-drive","kta-build","kta-ask","kta-picture"].map(f=>"engine/"+f+".js");
const prod=cp.execSync("git ls-files engine server/kta_worker | grep -E \"\\.js$\" | grep -v engine/text").toString().trim().split("\n").map(f=>fs.readFileSync(f,"utf8")).join("\n");
const dead=[];
for(const f of own){ if(!fs.existsSync(f)) continue;
  for(const m of fs.readFileSync(f,"utf8").matchAll(/^\s*KTA\.([A-Za-z_]\w*)\s*=/gm)){
    const re=new RegExp("(KTA|K|api)\\."+m[1]+"\\b|\\b"+m[1]+"\\s*\\(","g");
    if((prod.match(re)||[]).length<=1) dead.push(m[1]); } }
console.log("dead    "+dead.length+" engine exports with no production caller"+(dead.length?": "+dead.join(" "):""));'

if [[ "${1:-}" == "--tests" ]]; then
  t() { local s=$(date +%s); "$@" >/dev/null 2>&1; echo $(( $(date +%s) - s )); }
  echo "speed   npm_test=$(t npm test)s  pytest=$( (cd server && t uv run pytest -q) )s"
fi
