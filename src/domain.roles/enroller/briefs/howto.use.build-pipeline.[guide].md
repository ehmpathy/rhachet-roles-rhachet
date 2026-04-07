# howto: build pipeline

## .what

rhachet roles packages follow a build → link → run pipeline.

## .why

- roles are npm packages that publish skills and briefs
- symlinks in `.agent/` expose roles at runtime
- build compiles typescript and copies assets to `dist/`

---

## the pipeline

```
src/domain.roles/        npm run build      dist/domain.roles/
  └── reviewer/      ─────────────────────►   └── reviewer/
        ├── briefs/                                 ├── briefs/
        ├── skills/                                 ├── skills/
        └── readme.md                               └── readme.md
                                                          │
                                            rhachet roles link
                                                          │
                                                          ▼
                                           .agent/repo=pkg/role=reviewer/
                                             └── skills/ → symlink to dist/
```

---

## npm run build

runs three steps:

1. **build:clean** — removes `dist/`
2. **build:compile** — compiles typescript via `tsc` + `tsc-alias`
3. **build:complete** — copies non-ts assets to `dist/` via rsync

### rsync includes

- `**/briefs/**/*.md` — markdown briefs
- `**/skills/**/*.sh` — shell skills
- `**/readme.md` — role readmes
- `**/boot.yml` — role boot configs
- `**/keyrack.yml` — credential requirements

### rsync excludes

- `**/.route/**` — route scratch directories
- `**/.scratch/**` — scratch directories
- `**/*.test.*` — test files

---

## rhachet roles link

creates symlinks from `.agent/` into `dist/`:

```
.agent/
  repo=my-roles/
    role=reviewer/ → ../../dist/domain.roles/reviewer/
    role=thinker/  → ../../dist/domain.roles/thinker/
```

after link, skills are available via `rhx`.

---

## directory structure

```
src/
  domain.roles/
    reviewer/
      briefs/           ← markdown briefs
      skills/
        review.sh       ← shell skill
        review.ts       ← typescript (if dispatch needed)
      readme.md         ← role description
      getReviewerRole.ts

dist/                   ← built output (gitignored)
  domain.roles/
    reviewer/
      briefs/           ← copied from src
      skills/
        review.sh       ← copied from src
        review.js       ← compiled from ts
      readme.md         ← copied from src

.agent/                 ← symlinks (created by rhachet link)
  repo=my-roles/
    role=reviewer/ → ../../dist/domain.roles/reviewer/
```

---

## skill execution

`rhx review --rules "*.md"` resolves via:

1. scans `.agent/repo=*/role=*/skills/` for `review.sh`
2. executes the matched skill with args

for `.ts` skills:
- source `.ts` file must exist in `dist/` (not just `.js`)
- rhachet imports and executes dynamically

---

## key points

1. **source files in `dist/`** — rhachet executes from `.agent/` symlinks which point to `dist/`
2. **rsync controls assets** — update `build:complete` to include new file types
3. **`.agent/` is generated** — never edit directly; edit `src/` and rebuild
4. **briefs in `src/domain.roles/<role>/briefs/`** — symlinked via rhachet
5. **skills in `src/domain.roles/<role>/skills/`** — entrypoint is `.sh` or `.ts`
