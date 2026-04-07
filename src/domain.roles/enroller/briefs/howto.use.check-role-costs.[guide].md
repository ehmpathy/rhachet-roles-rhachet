# howto: check role token costs

## .what

use `npx rhachet roles cost` to see token usage per file in a role.

## .why

- identify which files consume the most tokens
- make informed decisions about say vs ref in boot.yml
- skills show `[docs only]` — boot extracts just headers, not implementation

---

## usage

```sh
# check costs for a role in current repo
npx rhachet roles cost --role enroller

# check costs for a role in another repo
npx rhachet roles cost --repo ehmpathy/rhachet-roles-ehmpathy --role mechanic
```

---

## output

```
🐢 role costs

🐚 rhachet roles cost --role enroller
   ├─ total: 2,811 tokens (~$0.01 at $3/mil)
   └─ files
      ├─ briefs/define.role.[article].md .............. 450 tokens
      ├─ briefs/howto.add-skills.[guide].md ........... 380 tokens
      ├─ briefs/howto.add-briefs.[guide].md ........... 320 tokens
      ├─ skills/example.sh ............................ 180 tokens [docs only]
      └─ ...
```

---

## output legend

| annotation | what it means |
|------------|---------------|
| (none) | full file content is loaded |
| `[docs only]` | only header comments are loaded (skill implementation hidden) |

---

## say vs ref decisions

use costs to decide boot.yml strategy:

| scenario | recommendation |
|----------|----------------|
| brief < 500 tokens | `say` — inline is fine |
| brief > 1000 tokens | consider `ref` — load on demand |
| skill | always `say` — only docs are loaded anyway |

```yaml
# boot.yml example
briefs:
  - say: briefs/small-brief.[guide].md      # inline
  - ref: briefs/large-reference.[ref].md    # load on demand
skills:
  - say: skills/my-skill.sh                 # docs only, always say
```

---

## when to check

- after you add new briefs
- when role feels slow to boot
- before you publish a role package
