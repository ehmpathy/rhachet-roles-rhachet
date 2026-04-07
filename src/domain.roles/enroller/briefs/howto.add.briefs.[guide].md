# howto: add briefs

## .what

📚 briefs are curated knowledge files that flavor how enrolled brains think.

## .why

briefs externalize institutional knowledge:
- survive brain upgrades and swaps
- accumulate iteratively over time
- encode lessons, rules, and patterns durably

---

## directory structure

briefs live in `src/domain.roles/<role>/briefs/`:

```
src/domain.roles/
  reviewer/
    briefs/
      rules101.[article].md
      review.tactics.md
      lessons/
        lesson.brain-selection.[lesson].md
      on.rules/
        rules101.content.[article].md
        rules101.content.[demo].forbid.gerunds.md
```

nest directories for organization. rhachet loads all `.md` files recursively.

---

## naming conventions

use descriptive names with type suffixes:

| suffix | purpose | example |
|--------|---------|---------|
| `[article]` | explanatory content | `rules101.[article].md` |
| `[guide]` | how-to instructions | `howto.drive-routes.[guide].md` |
| `[lesson]` | learned insight | `lesson.brain-selection.[lesson].md` |
| `[ref]` | reference material | `howto.create-routes.[ref].md` |
| `[demo]` | example/demonstration | `rules101.content.[demo].forbid.gerunds.md` |
| `[philosophy]` | conceptual framing | `define.routes-are-gardened.[philosophy].md` |

name prefixes indicate content type:

| prefix | what |
|--------|------|
| `define.*` | definitions and explanations |
| `howto.*` | procedural guides |
| `lesson.*` | lessons learned |
| `rule.*` | rules and constraints |
| `research.*` | research discoveries |
| `im_a.*` | persona definitions |

---

## brief structure

use `.what` and `.why` headers:

```markdown
# howto: drive routes

## .what
guide for drive thought routes: status commands, reviews, and the road ahead.

## .why
enable drivers to navigate routes without hit dead ends or wait for help unnecessarily.

---

## the road ahead 🦉

> a route is a paved path — worn smooth by those who walked before.
```

### key elements

- **`.what`** — one-line summary of the brief's content
- **`.why`** — one-line summary of why it matters
- **`---`** — horizontal rules separate sections
- **tables** — use for comparisons and quick reference
- **code blocks** — use for commands and examples

---

## brief types

### articles — explain concepts

```markdown
# define: thought routes

## .what
thought routes describe the determinism profile of an execution path

## .why
clarifies reliability, reproducibility, and testability tradeoffs
```

### guides — instruct how-to

```markdown
# howto: drive routes

## .what
guide for drive thought routes

## when you've completed the work

| command | when to use |
|---------|-------------|
| `--as passed` | signal work complete |
| `--as blocked` | stuck, need help |
```

### lessons — capture insights

```markdown
# lesson: brain selection for review

## .what
discoveries on which brains perform best for code review tasks

## .context
tested claude-sonnet, gpt-4o, grok-code across 50 review samples
```

### demos — show examples

```markdown
# demo: forbid gerunds

## .what
demonstration of the forbid-gerunds rule

## before (bad)
```ts
const extant = await findUser(); // gerund in name
```

## after (good)
```ts
const userFound = await findUser(); // past participle
```
```

---

## add a brief

1. create file in `briefs/` directory:
   ```
   src/domain.roles/enroller/briefs/howto.scaffold-role.[guide].md
   ```

2. add `.what` and `.why` headers

3. add content with clear sections

4. rebuild to include in dist:
   ```sh
   npm run build
   ```

briefs are copied to `dist/` via rsync and symlinked via `rhachet init`.

---

## brief load order

briefs load at enrollment time:
- rhachet reads all `.md` files from `briefs/` directories
- content suffixes the system prompt
- briefs survive context compaction

order is alphabetical by filename. use numeric prefixes for explicit order:
```
01.context.[article].md
02.rules.[article].md
03.examples.[demo].md
```
