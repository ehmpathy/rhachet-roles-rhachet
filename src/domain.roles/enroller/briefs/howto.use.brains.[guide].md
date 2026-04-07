# howto: use brains

## .what

🧠 brains are inference providers that enable probabilistic thought.

## .why

brains power skills that require language inference:
- structured extraction from text
- content generation from templates
- classification and sentiment analysis
- code review against rules

---

## install a brain package

brain packages provide inference capabilities. install at least one:

```sh
# examples (more available)
npm install rhachet-brains-xai         # grok models
npm install rhachet-brains-anthropic   # claude models
npm install rhachet-brains-openai      # codex models
npm install rhachet-brains-google      # gemini models
npm install rhachet-brains-chutes      # chutes.ai proxy
npm install rhachet-brains-togetherai  # together.ai models
npm install rhachet-brains-bhrain      # bhrain repl wrapper
```

| package | provider | atoms | repls | cli |
|---------|----------|-------|-------|-----|
| `rhachet-brains-xai` | xai (grok) | ✓ | - | - |
| `rhachet-brains-anthropic` | anthropic (claude) | ✓ | ✓ | ✓ |
| `rhachet-brains-openai` | openai (codex) | ✓ | ✓ | ✓ |
| `rhachet-brains-google` | google (gemini) | ✓ | ✓ | ✓ |
| `rhachet-brains-chutes` | chutes.ai | ✓ | - | - |
| `rhachet-brains-togetherai` | together.ai | ✓ | - | - |
| `rhachet-brains-bhrain` | bhrain | - | ✓ | - |
| `rhachet-brains-opencode` | opencode | - | ✓ | ✓ |
| ... | other providers | varies | varies | varies |

search npm for `rhachet-brains-*` to discover all available providers.

---

## brain discovery

`genContextBrain` auto-discovers installed brain packages:

```ts
import { genContextBrain } from 'rhachet/brains';

const context = await genContextBrain({ choice: 'xai/grok/code-fast-1' });
```

**how discovery works:**

1. scans `node_modules` for packages named `rhachet-brains-*`
2. loads each package and registers its brain providers
3. resolves `choice` string to the correct provider

the `choice` format is `provider/model` (e.g., `xai/grok/code-fast-1`, `anthropic/claude-sonnet`).

if the chosen provider's package is not installed, discovery throws an error.

---

## brain grains

| grain | symbol | what | characteristics |
|-------|--------|------|-----------------|
| brain.atom | ○ | single inference | stateless, one-shot, no tool use |
| brain.repl | ↻ | read-eval-print-loop | stateful, multi-turn, tool use |

○ atoms are for single-turn operations (fast, cheap).
↻ repls loop until complete (agentic, tool use).

---

## brain.choice.ask — the core pattern

invoke a brain via `context.brain.choice.ask`:

```ts
import { z } from 'zod';
import { genContextBrain } from 'rhachet/brains';

const context = await genContextBrain({ choice: 'xai/grok/code-fast-1' });

const result = await context.brain.choice.ask({
  role: { briefs: [] },
  prompt: 'your prompt here',
  schema: { output: z.object({ /* your schema */ }) },
});

// result.output is typed to your schema
// result.metrics contains usage info
```

---

## examples

### sentiment analysis

```ts
import { z } from 'zod';
import { genContextBrain } from 'rhachet/brains';

const schemaOfSentiment = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number(),
  reason: z.string(),
});

const context = await genContextBrain({ choice: 'xai/grok/code-fast-1' });

const result = await context.brain.choice.ask({
  role: { briefs: [] },
  prompt: `analyze the sentiment of this customer feedback: "${feedback}"`,
  schema: { output: schemaOfSentiment },
});

console.log(result.output.sentiment); // 'positive' | 'negative' | 'neutral'
console.log(result.output.confidence); // 0.95
```

### classification

```ts
import { z } from 'zod';
import { genContextBrain } from 'rhachet/brains';

const schemaOfClassification = z.object({
  category: z.enum(['bug', 'feature', 'question', 'docs']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  summary: z.string(),
});

const context = await genContextBrain({ choice: 'xai/grok/code-fast-1' });

const result = await context.brain.choice.ask({
  role: { briefs: [] },
  prompt: `classify this github issue: "${issueBody}"`,
  schema: { output: schemaOfClassification },
});

console.log(result.output.category); // 'bug'
console.log(result.output.priority); // 'high'
```

### content generation

```ts
import { z } from 'zod';
import { genContextBrain } from 'rhachet/brains';

const schemaOfEmail = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.enum(['formal', 'casual', 'friendly']),
});

const context = await genContextBrain({ choice: 'anthropic/claude-sonnet' });

const result = await context.brain.choice.ask({
  role: { briefs: [] },
  prompt: `draft a follow-up email for this call: ${callNotes}`,
  schema: { output: schemaOfEmail },
});

console.log(result.output.subject);
console.log(result.output.body);
```

### structured extraction

```ts
import { z } from 'zod';
import { genContextBrain } from 'rhachet/brains';

const schemaOfContact = z.object({
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
});

const context = await genContextBrain({ choice: 'xai/grok/code-fast-1' });

const result = await context.brain.choice.ask({
  role: { briefs: [] },
  prompt: `extract contact info from this email signature: "${signature}"`,
  schema: { output: schemaOfContact },
});

console.log(result.output.name);
console.log(result.output.email);
```

---

## brain operations

### brain.atom.ask

single-turn inference (no tool use):

```ts
const result = await context.brain.atom.ask({
  brain: 'xai/grok/code-fast-1',
  role: { briefs: [] },
  prompt: 'summarize the changes',
  schema: { output: z.object({ summary: z.string() }) },
});
```

### brain.repl.ask

multi-turn conversation (read-only tools):

```ts
const result = await context.brain.repl.ask({
  brain: 'anthropic/claude-sonnet',
  role: { briefs: [] },
  prompt: 'analyze this codebase',
  schema: { output: z.object({ findings: z.array(z.string()) }) },
});
```

### brain.repl.act

multi-turn with write access (file edits, bash):

```ts
const result = await context.brain.repl.act({
  brain: 'anthropic/claude-sonnet',
  role: { briefs: [] },
  prompt: 'refactor this function',
  plugs: { tools: [...] },
  schema: { output: z.object({ success: z.boolean() }) },
});
```

---

## brain.choice vs brain.atom/repl

| method | resolves brain | use case |
|--------|---------------|----------|
| `context.brain.choice.ask` | via `choice` param | most common |
| `context.brain.atom.ask` | via `brain` input | explicit atom |
| `context.brain.repl.ask` | via `brain` input | explicit repl |
| `context.brain.repl.act` | via `brain` input | repl with writes |

---

## brain inputs

| input | what | required |
|-------|------|----------|
| `role` | role context (briefs) | yes |
| `prompt` | the prompt to send | yes |
| `schema` | zod schema for structured output | yes |
| `plugs` | tools, memory | no |
| `on` | episode/series continuation | no |

---

## brain outputs

| field | what |
|-------|------|
| `output` | structured response (typed to schema) |
| `metrics.size.tokens.input` | input tokens |
| `metrics.size.tokens.output` | output tokens |
| `metrics.size.tokens.cache.set` | cache write tokens |
| `metrics.size.tokens.cache.get` | cache read tokens |
| `metrics.cost.cash.total` | total cost |
| `metrics.cost.time` | duration |

---

## credentials

brains need API keys. options:

### environment variables

```sh
export XAI_API_KEY=xai-...
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
```

### keyrack (recommended)

see `howto.use-keyrack.[guide].md` for credential management.

---

## brain selection guidance

| brain | best for | characteristics |
|-------|----------|-----------------|
| `xai/grok/code-fast-1` | code tasks, fast inference | fast, cheap, good for code |
| `xai/grok-3-mini-fast` | simple tasks | very fast, very cheap |
| `anthropic/claude-sonnet` | complex analysis | capable, balanced |
| `anthropic/claude-opus` | difficult tasks | most capable, expensive |

---

## common errors

### "brain provider not found"

the brain package for your chosen provider is not installed.

```sh
# if choice starts with 'xai/'
npm install rhachet-brains-xai

# if choice starts with 'anthropic/'
npm install rhachet-brains-anthropic

# if choice starts with 'openai/'
npm install rhachet-brains-openai
```

### "API key not set"

the provider requires credentials. set the environment variable:

```sh
export XAI_API_KEY=xai-...
# or
export ANTHROPIC_API_KEY=sk-...
```

### "brain.repl required for this operation"

some operations need multi-turn capabilities. use a provider that supports repl (anthropic or openai, not xai).
