# howto: add keyrack to a role

## .what

`keyrack.yml` declares credential requirements for a role.

## .why

- documents which secrets a role needs
- enables automatic credential resolution
- supports environment-specific keys (test, prep, prod)

---

## keyrack.yml structure

create `keyrack.yml` in the role directory:

```
src/domain.roles/
  reviewer/
    keyrack.yml      # credential requirements
    readme.md
    getReviewerRole.ts
    briefs/
    skills/
```

---

## basic keyrack

```yaml
org: ehmpathy

env.prep:
  - XAI_API_KEY
```

| field | what |
|-------|------|
| `org` | organization that owns the credentials |
| `env.*` | environment-specific keys |

---

## environment scopes

```yaml
org: ehmpathy

env.test:
  - XAI_API_KEY

env.prep:
  - XAI_API_KEY
  - ANTHROPIC_API_KEY

env.prod:
  - XAI_API_KEY
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY
```

| scope | when |
|-------|------|
| `env.test` | test/ci environments |
| `env.prep` | development/pre-production |
| `env.prod` | production |
| `env.all` | all environments |

---

## env.all shorthand

for keys needed in all environments:

```yaml
org: ehmpathy

env.all:
  - XAI_API_KEY
```

equivalent to:

```yaml
org: ehmpathy

env.test:
  - XAI_API_KEY
env.prep:
  - XAI_API_KEY
env.prod:
  - XAI_API_KEY
```

---

## add keyrack to a role

1. create `keyrack.yml` in role directory:
   ```
   src/domain.roles/reviewer/keyrack.yml
   ```

2. declare organization and required keys:
   ```yaml
   org: ehmpathy

   env.prep:
     - XAI_API_KEY
   ```

3. register in `Role.build()`:
   ```ts
   // src/domain.roles/reviewer/getReviewerRole.ts
   export const ROLE_REVIEWER: Role = Role.build({
     slug: 'reviewer',
     name: 'Reviewer',
     purpose: 'review artifacts against declared rules',
     readme: { uri: __dirname + '/readme.md' },
     keyrack: { uri: __dirname + '/keyrack.yml' },  // add this
     skills: { dirs: [{ uri: __dirname + '/skills' }] },
     briefs: { dirs: [{ uri: __dirname + '/briefs' }] },
   });
   ```

4. rebuild:
   ```sh
   npm run build
   ```

---

## example: reviewer role keyrack

```yaml
# src/domain.roles/reviewer/keyrack.yml
org: ehmpathy

env.prep:
  - XAI_API_KEY
```

minimal: declares the role needs `XAI_API_KEY` for prep environment.

