# @exogee/graphweaver-sql

A database agnostic SQL data provider for Graphweaver that owns its own SQL generation, so entities
are defined once and there is no ORM in the dependency tree.

> **Status: spike.** This is phase 0 of the plan — the filter translation and dialect layer only,
> built to answer one question before the rest is committed to. There is no provider, no driver and
> no connection handling yet. See "Verdict" below.

## What the spike answers

The plan rests on one judgement: that hand-rolling SQL generation across four dialects stays clean
rather than slowly turning into a query builder nobody wanted to write. The place that would go
wrong first is **nested relationship filters** — `{ album: { artist: { name_like: 'x' } } }` with
arbitrary `_and`/`_or`/`_not` nesting, on Postgres, MySQL, SQLite and SQL Server, without
multiplying rows.

So that is all this builds, plus the test harness to see it.

```
src/
  ir/        the query IR. Pure data, no dialect knowledge, no way to hold a SQL string.
  mapping/   what the planner needs to know about an entity. Hand-built in fixtures for now.
  filter/    Graphweaver's Filter -> Predicate IR.
  plan/      Predicate -> a complete SELECT.
  dialect/   the Dialect interface plus the four implementations. The ONLY place SQL is emitted.
  compile/   compile(Statement, Dialect) -> { text, params }.
```

The layering is the point: `filter/` and `plan/` never see a `Dialect` and never produce a string,
which is what makes it possible to compile one corpus of filters four ways and diff the results
side by side without a database anywhere.

## Verdict

**It holds.** ~1,200 lines gets every operator, all three relationship kinds, arbitrary logical
nesting, pagination and COUNT across four dialects, and the generated SQL is legible:

```sql
-- postgres
SELECT ... FROM "track" "t0"
WHERE EXISTS (
  SELECT 1 FROM "album" "s1"
  WHERE ("s1"."album_id" = "t0"."album_id" AND EXISTS (
    SELECT 1 FROM "artist" "s2"
    WHERE ("s2"."artist_id" = "s1"."artist_id" AND "s2"."name" = $1)))
)
ORDER BY "t0"."track_id" ASC
```

Nothing in the four dialect files wants to become a general query builder. They are lookup tables
with four genuinely awkward entries, which matches the estimate in the plan.

## Correlated EXISTS, not JOINs

Nested relationship filters compile to correlated `EXISTS` subqueries. Three reasons, the first
decisive:

1. **Negation is only well defined this way.** Under a join, `_not: { tracks: { name: 'x' } }`
   becomes `NOT (s1.name = 'x')` — "has some track that isn't called x". Under EXISTS it becomes
   `NOT EXISTS (...)` — "has no track called x", which is what was written.
2. **No row multiplication, so no `DISTINCT`.** The MikroORM provider sets `QueryFlag.DISTINCT` on
   every query purely to paper over join duplicates. Dropping joins drops that, which also sidesteps
   SQL Server's ban on `SELECT DISTINCT` over `text`/`ntext` and Postgres's over `json`.
3. Each EXISTS opens a fresh alias scope, so nesting needs no bookkeeping.

The one exception is a many-to-one filtered _only_ on the related primary key — `{ artist: { id: 5 } }`,
which is exactly what access control filters and cross-datasource flattening produce. That collapses
to `t0."artist_id" = $1` with no subquery at all, because it is the hottest path in the system.

## Parameterisation is structural

Three independent mechanisms, none of which rely on anyone remembering to escape something:

1. **The IR cannot hold SQL.** There is no `{ kind: 'raw' }` node and no `sql` tagged template. Adding
   one is a reviewable change, not a convenience.
2. **Identifiers are selected, never escaped.** A filter key can only look a column up in the resolved
   mapping; it can never _become_ one. Unknown keys throw `UnknownFieldError`. Quoting is belt and
   braces, and aliases are generated integers.
3. **Values have one path to the output.** `ParamCollector.bind` is the only thing that appends to
   `params`, and the `param` branch of `compileExpr` is the only thing that reads a value.

`behaviour.test.ts` asserts the invariant directly: compiling with an adversarial value produces SQL
**byte-identical** to compiling with a benign one, on all four dialects.

## Two things the spike found

**A one-shot iterator is consumed by the first compile.** Core used to pass `lookup.keys()` — a
`MapIterator`, not an array — as an `_in` value. The golden tests caught it immediately: Postgres
compiled `IN ($1, $2)` and the other three compiled `1 = 0`, because Postgres ran first and drained
the iterator. Core is fixed now; the filter translator also defensively accepts any iterable, for
anyone on an older core.

**NULLS ordering emulation was firing on non-nullable columns.** MySQL and SQL Server have no `NULLS`
clause, so ordering is emulated with a computed sort term. The planner appends the primary key to
_every_ `ORDER BY`, so every query on those two dialects was carrying a pointless
`CASE WHEN ... IS NULL` term that can stop the sort using an index. `ResolvedColumn` now carries
`nullable`, and the emulation is skipped where it cannot apply.

## Tests

```bash
pnpm test          # watch
npx vitest run     # once
```

- `golden-sql.test.ts` — one corpus of ~39 filters compiled four ways and snapshotted. A dialect
  divergence shows up as four diffs next to each other in review, which is the whole value.
- `behaviour.test.ts` — explicit assertions for the decisions that are easy to regress silently:
  the `NOT EXISTS` reading, the foreign key collapse, ILIKE emulation, SQL Server paging, `IN`
  chunking at the bind-parameter ceiling, and the parameterisation invariant.

## Not built yet

The provider, drivers, connection handling and transactions; the mapping layer that derives
`ResolvedEntity` from Graphweaver metadata (fixtures are hand-built); INSERT/UPDATE/DELETE;
`findByRelatedId`; schema introspection. Dialects will move into their own packages, each with its
driver as a required peer dependency — see the plan.
