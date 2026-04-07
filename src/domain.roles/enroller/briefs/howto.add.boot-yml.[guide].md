# howto: add boot.yml to a role

## .what

`boot.yml` controls which briefs and skills load into context at session start.

## .why

- **focus** — load only what's needed for the role
- **efficiency** — reduce context overhead
- **flexibility** — adjust what loads without code changes

---

## boot.yml structure

create `boot.yml` in the role directory:

```
src/domain.roles/
  reviewer/
    boot.yml         # context curation
    keyrack.yml
    readme.md
    getReviewerRole.ts
    briefs/
    skills/
```

---

## basic boot.yml

```yaml
always:
  briefs:
    say:
      - briefs/core-rules.[guide].md
    ref:
      - briefs/reference-material.[ref].md
  skills:
    say:
      - skills/review.sh
```

---

## say vs ref

| mode | what | when |
|------|------|------|
| `say` | full content in context | essential knowledge, must be read |
| `ref` | path only, fetch on demand | reference material, read if needed |

use `say` sparingly — context window is finite. use `ref` for material the brain can fetch when needed.

---

## add boot.yml to a role

1. create `boot.yml` in role directory:
   ```
   src/domain.roles/reviewer/boot.yml
   ```

2. declare which briefs to load:
   ```yaml
   always:
     briefs:
       say:
         - briefs/im_a.reviewer_persona.md
         - briefs/howto.review.[guide].md
       ref:
         - briefs/reference-rules.[ref].md
   ```

3. declare which skills to load:
   ```yaml
     skills:
       say:
         - skills/review.sh
         - skills/reflect.sh
   ```

4. register in `Role.build()`:
   ```ts
   // src/domain.roles/reviewer/getReviewerRole.ts
   export const ROLE_REVIEWER: Role = Role.build({
     slug: 'reviewer',
     name: 'Reviewer',
     purpose: 'review artifacts against declared rules',
     readme: { uri: __dirname + '/readme.md' },
     boot: { uri: __dirname + '/boot.yml' },  // add this
     keyrack: { uri: __dirname + '/keyrack.yml' },
     skills: { dirs: [{ uri: __dirname + '/skills' }] },
     briefs: { dirs: [{ uri: __dirname + '/briefs' }] },
   });
   ```

5. rebuild:
   ```sh
   npm run build
   ```

---

## complete example

```yaml
# src/domain.roles/reviewer/boot.yml

always:
  briefs:
    # essential — always in context
    say:
      - briefs/im_a.reviewer_persona.md
      - briefs/howto.review.[guide].md
      - briefs/rule.review-standards.[rule].md

    # reference — fetch on demand
    ref:
      - briefs/examples.[ref].md
      - briefs/edge-cases.[ref].md

  skills:
    # skills always use say (only docs are loaded)
    say:
      - skills/review.sh
      - skills/reflect.sh
```

---

## token cost considerations

use `npx rhachet roles cost` to see token usage per file:

```sh
npx rhachet roles cost --role reviewer
```

if a brief is large (>1000 tokens), consider `ref` instead of `say`.

see `howto.use.check-role-costs.[guide].md` for details.

---

## without boot.yml

if no `boot.yml` exists, rhachet loads all briefs and skills from their directories. boot.yml is optional but recommended for control over context size.
