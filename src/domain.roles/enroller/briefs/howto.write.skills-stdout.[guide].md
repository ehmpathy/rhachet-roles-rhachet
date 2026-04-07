# howto: write skill stdout

## .what

skill stdout follows a two-header structure:

1. **mascot header** — registry-level, sets the vibe
2. **artifact header** — role-level, shows exact inputs after defaults

## .why

- mascot header anchors the skill in its registry's philosophy
- artifact header shows exactly what will execute (no hidden defaults)
- treestruct body presents hierarchical output in scannable form

## .structure

```
🪨 run solid skill repo={registry}/role={role}/skill={skill}

{mascot} {vibe phrase}

{artifact} {skill-name} [--resolved --flags --after --defaults]
   ├─ {input}: {value}
   ├─ {input}: {value}
   └─ {output section}
      ├─ {item}
      └─ {item}
```

### the two headers

| header | emoji | scope | purpose |
|--------|-------|-------|---------|
| mascot | 🐢 🦉 🐙 | registry | set the vibe, anchor philosophy |
| artifact | 🐚 📚 🎭 | role | name the skill, show resolved inputs |

### invocation line

the first line `🪨 run solid skill...` comes from the harness (rhachet). your skill does not emit this — rhachet adds it automatically.

## .mascot header

the mascot header is the first line your skill emits. it sets the tone.

```
{mascot emoji} {vibe phrase}
```

### vibe phrases are mascot-specific

each mascot has its own vocabulary that reflects its character. vibe phrases are **not shared** across registries.

#### 🐢 sea turtle vibes (ehmpathy)

surfer energy, chill, island breeze:

| context | phrases |
|---------|---------|
| plan/preview | `heres the wave...`, `lets check...` |
| success | `cowabunga!`, `righteous!`, `sweet`, `far out` |
| blocked | `bummer dude...`, `crickets...` |
| nudge | `hold up, dude...`, `lets check the meter...` |

#### 🦉 owl vibes (bhrain)

wise, observant, methodical:

| context | phrases |
|---------|---------|
| plan/preview | `perched to observe...`, `eyes on target...` |
| success | `let's review!`, `observed`, `noted`, `wisdom gained` |
| blocked | `path obscured...`, `cannot proceed...` |
| nudge | `consider...`, `one might note...` |

#### 🐙 octopus vibes (rhachet)

curious, adaptive, multi-armed:

| context | phrases |
|---------|---------|
| plan/preview | `arms ready...`, `ink primed...` |
| success | `enrolled!`, `attached!`, `connected!` |
| blocked | `tangled...`, `blocked...` |
| nudge | `one arm suggests...`, `tentacle tip...` |

## .artifact header

the artifact header names the skill and shows **exact inputs after defaults and normalization**.

```
{artifact emoji} {skill-name} [--flag value] [--mode plan|apply]
```

### why show resolved inputs

users invoke with partial flags:
```sh
rhx git.release --from main
```

but the artifact header shows what actually executes:
```
🐚 git.release --into prod --mode plan
```

this reveals:
- `--into prod` was inferred from `--from main`
- `--mode plan` is the default

no hidden behavior — the user sees exactly what runs.

### examples

```
🐚 sedreplace --mode apply
🐚 git.repo.get repos
🐚 globsafe
🐚 git.commit.set --mode plan
🐚 grepsafe
```

## .treestruct body

below the artifact header, use treestruct for hierarchical output.

### elements

| element | purpose |
|---------|---------|
| `├─` | branch with siblings below |
| `└─` | final branch (no siblings below) |
| `│` | continuation line |
| `├─`...`└─` | sub.bucket for multiline content |

### input section

list resolved inputs as key-value pairs:

```
🐚 globsafe
   ├─ pattern: src/**/*.ts
   ├─ path: .
   └─ ...
```

### output section

group results in named sections:

```
   ├─ files: 4
   └─ found
      ├─
      │
      │  src/index.ts
      │  src/domain.ts
      │
      └─
```

### sub.bucket

use sub.bucket for multiline content. requires blank `│` lines for visual space:

```
   └─ results
      ├─
      │
      │  line 1
      │  line 2
      │
      └─
```

## .complete examples

### success — globsafe

```
🐢 sweet

🐚 globsafe
   ├─ pattern: src/**/*.ts
   ├─ path: .
   ├─ files: 4
   └─ found
      ├─
      │
      │  src/contract/registry/index.ts
      │  src/domain.roles/enroller/getEnrollerRole.ts
      │  src/domain.roles/getRoleRegistry.ts
      │  src/index.ts
      │
      └─
```

### success — git.repo.get

```
🐢 far out

🐚 git.repo.get repos
   ├─ repos: ehmpathy/rhachet*
   │
   ├─ ehmpathy
   │  ├─ rhachet              ~/git/ehmpathy/rhachet (local)
   │  ├─ rhachet-artifact     ~/git/ehmpathy/rhachet-artifact (local)
   │  └─ rhachet-roles-bhrain github.com/ehmpathy/rhachet-roles-bhrain (cloud)
   │
   └─ found: 3 repos
```

### plan — git.release

```
🐢 heres the wave...

🐚 git.release --into prod --mode plan

🫧 no open release pr
   └─ latest: chore(release): v0.1.0 🎉

🌊 release: v0.1.0
   ├─ ⚓ 1 check(s) failed
   │  └─ 🔴 publish
   │        ├─ https://github.com/...
   │        └─ failed after 1m 50s
   └─ hint: use --retry to rerun failed workflows
```

### blocked — git.commit.uses

```
🐢 lets check the meter...

🐚 git.commit.uses
   └─ no quota set

ask your human to grant:
  $ git.commit.uses set --quant N --push allow|block
```

### blocked — git.release (no pr)

```
🐢 crickets...

🫧 no open branch pr
   ├─ vlad/fix-mascot-vs-artifact
   └─ hint: use git.commit.push to push and findsert pr
```

## .implementation

### bash pattern

```bash
#!/usr/bin/env bash

# mascot header
echo "🐢 sweet"
echo ""

# artifact header with resolved inputs
echo "🐚 ${SKILL_NAME}"
echo "   ├─ input1: ${INPUT1}"
echo "   ├─ input2: ${INPUT2}"

# output body
echo "   └─ results"
echo "      ├─"
echo "      │"
for item in "${RESULTS[@]}"; do
  echo "      │  ${item}"
done
echo "      │"
echo "      └─"
```

### output.sh pattern

many skills source a shared `output.sh` for consistent format:

```bash
source "$(dirname "$0")/output.sh"

emit_mascot "sweet"
emit_artifact "${SKILL_NAME}"
emit_input "pattern" "${PATTERN}"
emit_input "path" "${PATH}"
emit_results "${RESULTS[@]}"
```

## .see also

- `define.mascots-and-artifacts.[article].md` — mascot vs artifact distinction
- `rule.require.treestruct-output.md` — treestruct format details
- `git.commit/output.sh` — reference implementation
