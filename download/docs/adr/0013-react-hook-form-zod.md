# ADR 0013: react-hook-form + zod + @hookform/resolvers for all forms

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

There are two real forms in the app: the **Add Agent** dialog and the **Dispatch
Order** form (inside the agent detail drawer). Both need validation, error
display, and submit handlers with async mutations.

## Decision

Use **react-hook-form** for form state, **zod** for schema validation, and
**@hookform/resolvers/zod** to bridge them.

- Schema is the single source of truth: e.g. `const schema = z.object({ name:
  z.string().min(2, "Name is too short"), badgeId: z.string().min(2, ...),
  lat: z.string().refine(...), lng: z.string().refine(...) })`.
- `useForm({ resolver: zodResolver(schema), defaultValues })` wires it up.
- Errors render inline under each field as `<p className="text-xs
  text-destructive">`.
- The submit handler calls the TanStack Query mutation (`useCreateAgent`,
  `useSendOrder`); on success it shows a sonner toast and resets the form.
- The login form uses the same stack with zod's `.email()` validator.

## Consequences

**Positive:**
- Type-safe: `z.infer<typeof schema>` gives us the form values type.
- Validation messages live next to the schema, not scattered across JSX.
- Works cleanly with shadcn's `Input`, `Textarea`, `Label`, `Select`.

**Negative:**
- Two ESLint warnings about react-hook-form's `watch()` and the React Compiler
  (informational, see ADR 0014 of the project's `dev.log`); these are
  expected and don't break anything.

**Risks / accepted trade-offs:**
- The `Select` component from shadcn is uncontrolled, so we use
  `setValue("priority", v)` instead of `register("priority")`. This is the
  documented shadcn + RHF pattern but worth noting for future maintainers.

## Alternatives considered

- **Formik** — older, more boilerplate; the skill stack already had RHF.
- **Native form + manual validation** — fine for one form, painful across
  three.
- **Conform / zod-form-data** — newer, less familiar to most readers.

## References

- `src/components/dashboard/add-agent-dialog.tsx`
- `src/components/map/send-order-form.tsx`
- `src/components/auth/login-card.tsx`
