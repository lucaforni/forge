# Lessons Learned

> This file captures insights from debugging sessions, failed approaches,
> production incidents, and sprint retrospectives. The `session-knowledge`
> plugin auto-appends entries when sessions involve significant debugging
> or rollbacks. `/forge-retro` also writes here.
>
> **Format**: Each entry records the date, context, and lessons.
>
> **Maintenance**: Archive completed/irrelevant entries per sprint. Review
> before starting work on similar features to avoid repeating mistakes.

---

---

## 2026-06-24 — Epic E01: Frontend Pattern Library

**Lessons learned**:

1. **Parallel task agents work for independent patterns.** Creating 5 patterns
   in parallel (Wizard, Infinite Scroll, Settings, Command Palette, Confirmation)
   worked without conflicts because each pattern is a separate file.

2. **Templates too long = pattern too complex.** Search template is 1044
   lines — sign that Search combines too many sub-components (SearchInput +
   FilterBar + ResultsGrid). Decompose into sub-patterns.

3. **Foundation before the rest = essential.** stack-decisions and design-system
   before the patterns avoided contradictions. You can't write a pattern
   without knowing the spacing/color tokens.

4. **Concrete templates > abstract templates.** "Order List" is more useful than
   `<GenericTable<T> />`. Build copies and adapts more easily from a concrete
   example.

5. **QA Checklist in the pattern reduces review cycles.** If the pattern
   specifies "loading skeleton must match table structure" and the code
   implements it, the review confirms in seconds instead of discovering the
   problem in review.
