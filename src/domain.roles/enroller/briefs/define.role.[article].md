# define: role

## .what

a 🧢 role is a bundle of 💪 skills and 📚 briefs.

```
🧢 role = 💪 skills + 📚 briefs
```

- **💪 skills** = executable capabilities (shell scripts, typescript modules)
- **📚 briefs** = curated knowledge (rules, guides, lessons, references)

## .why

roles enable portable, composable, and improvable thought:

- **portable** — same role works with any brain (openai, anthropic, xai, etc.)
- **composable** — roles combine via enrollment; actors inherit skills + briefs
- **improvable** — knowledge externalizes into briefs; capabilities crystallize into skills

---

## enrollment

to **enroll** = pair a 🧠 brain with a 🧢 role → produce an 🎭 actor.

```
🧢 role + 🧠 brain = 🎭 actor
```

```ts
import { genActor } from 'rhachet';
import { genBrainRepl } from 'rhachet-brains-openai';
import { ROLE_MECHANIC } from './domain.roles/mechanic/getMechanicRole';

const mechanic = genActor({
  role: ROLE_MECHANIC,
  brains: [genBrainRepl({ slug: 'openai/codex' })],
});
```

actors can:
- `.ask()` → 💧 fluid thought, brain decides the path
- `.act()` → 🔩 rigid thought, harness controls, brain augments
- `.run()` → 🪨 solid execution, no brain needed

---

## role structure

a role is defined via `Role.build()`:

```ts
import { Role } from 'rhachet';

export const ROLE_REVIEWER: Role = Role.build({
  slug: 'reviewer',
  name: 'Reviewer',
  purpose: 'review artifacts against declared rules',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  keyrack: { uri: __dirname + '/keyrack.yml' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
```

| field | what |
|-------|------|
| `slug` | unique identifier (lowercase, no spaces) |
| `name` | display name |
| `purpose` | one-line description of the role's purpose |
| `readme` | path to readme.md |
| `boot` | path to boot.yml (context curation) |
| `keyrack` | path to keyrack.yml (credential requirements) |
| `skills.dirs` | directories with skill files |
| `briefs.dirs` | directories with brief files |

---

## directory structure

```
src/domain.roles/
  reviewer/
    readme.md              # role description
    getReviewerRole.ts     # Role.build() definition
    boot.yml               # context curation (optional)
    keyrack.yml            # credential requirements (optional)
    briefs/                # 📚 curated knowledge
      rules101.[article].md
      lesson.brain-selection.[lesson].md
    skills/                # 💪 executable capabilities
      review.sh
      reflect.sh
```

---

## boot.yml — context curation

`boot.yml` controls which briefs and skills are loaded into context at session start.

### structure

```yaml
always:
  briefs:
    ref:
      - briefs/im_a.reviewer_persona.md
      - briefs/define.review-philosophy.[philosophy].md
    say:
      - briefs/howto.drive-routes.[guide].md
  skills:
    say:
      - skills/route.stone.set.sh
```

### say vs ref

| mode | what | when |
|------|------|------|
| `say` | full content in context | essential knowledge, must be read |
| `ref` | path only, fetch on demand | reference material, read if needed |

use `say` sparingly — context window is finite. use `ref` for material the brain can fetch when needed.

### why boot.yml

- **focus** — load only what's needed for the role
- **efficiency** — reduce context overhead
- **flexibility** — adjust what loads without code changes

---

## keyrack.yml — credential requirements

`keyrack.yml` declares which credentials a role needs per environment.

### structure

```yaml
org: ehmpathy

env.prep:
  - XAI_API_KEY
```

### fields

| field | what |
|-------|------|
| `org` | organization that owns the credentials |
| `env.test` | keys needed for test environment |
| `env.prep` | keys needed for development/pre-production |
| `env.prod` | keys needed for production |
| `env.all` | keys needed in all environments |

### example: reviewer role

```yaml
# src/domain.roles/reviewer/keyrack.yml
org: ehmpathy

env.prep:
  - XAI_API_KEY
```

minimal: declares the role needs `XAI_API_KEY` for prep environment.

### extends

inherit from other keyracks:

```yaml
org: ehmpathy

extends:
  - .agent/repo=ehmpathy/role=mechanic/keyrack.yml

env.all:
  - XAI_API_KEY
```

### null environments

exclude an environment explicitly:

```yaml
org: ehmpathy

env.prod: null   # no prod keys for this role
env.test: null   # no test keys for this role

env.prep:
  - XAI_API_KEY
```

### why keyrack.yml

- **documents** which secrets a role needs
- **enables** automatic credential lookup
- **supports** environment-specific keys
- **allows** extension from other keyracks

see `howto.use.keyrack.[guide].md` for runtime usage.

---

## role registry

roles register via `RoleRegistry`:

```ts
import { RoleRegistry } from 'rhachet';
import { ROLE_REVIEWER } from './reviewer/getReviewerRole';
import { ROLE_DRIVER } from './driver/getDriverRole';

export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'acme',
    readme: { uri: __dirname + '/readme.md' },
    roles: [ROLE_REVIEWER, ROLE_DRIVER],
  });
```

the registry is exported from the package and discovered by rhachet for CLI and SDK use.

---

## cli vs sdk

### cli usage

```sh
# init roles in a repo
npm install rhachet-roles-acme
npx rhachet init --roles reviewer driver

# invoke skills
npx rhachet run --skill review --rules "rules/*.md" --paths "src/*.ts"

# spawn enrolled agent
rhx enroll claude --roles mechanic
```

### sdk usage

```ts
import { genActor } from 'rhachet';

const reviewer = genActor({
  role: ROLE_REVIEWER,
  brains: [genBrainRepl({ slug: 'anthropic/claude-sonnet' })],
});

await reviewer.run({ skill: { review: { rules, paths } } });
```

---

## briefs flavor the brain

📚 briefs change the perspective and preferences of the enrolled 🧠 brain. they suffix the system prompt to flavor how the brain thinks.

briefs supply knowledge about:
- **tone** — e.g., "use lowercase prose"
- **terms** — e.g., "call it 'customer', never 'user'"
- **patterns** — e.g., "always use input-context pattern"
- **rules** — e.g., "never use gerunds"

## skills curate the skillset

💪 skills offload work from imagine-cost to compute-cost:
- **imagine-cost** = time + tokens to imagine how to do a task
- **compute-cost** = deterministic executable, instant and free

skills unlock consistency. brains are probabilistic — skills maximize determinism.
