# CONTEXT.md Format

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.

## One context, one glossary

This repo is single-context: one [`CONTEXT.md`](../../../CONTEXT.md) at the root, holding both of
its vocabularies — the site itself, and the machinery that keeps AI-tool configuration in sync.
There is no `CONTEXT-MAP.md` and no per-directory glossary, so every term resolves in one file.

If the root `CONTEXT.md` is ever missing, create it lazily when the first term is resolved rather
than seeding it with headings nothing fills.
