/**
 * tests/unit/permission-effect.ts — Test-only model of OpenCode v2
 * permission evaluation.
 *
 * V2 evaluates the ordered rules array and the LAST matching rule wins
 * (see the V2 Permissions guide). This helper resolves the effective effect
 * for a single action/resource pair so tests can assert the *meaning* of a
 * generated or templated permission array, not just its order.
 *
 * Deliberately an approximation, documented here so nobody mistakes it for
 * the runtime:
 * - single resource only — the real engine aggregates multi-resource
 *   operations as "any deny denies, else any ask asks";
 * - no `external_directory` inference from shell text (best-effort
 *   upstream) and no saved-approval or policy layers;
 * - shell ` *`-suffix matching mirrors the documented idiom ("a shell
 *   pattern ending in ` *` also matches the command without arguments").
 *
 * The V2 base policy below is prepended because project rules load after it
 * and can override it — which is exactly why a bare `read * allow` in
 * project config silently swallows the built-in `.env` guard unless the
 * project re-asserts it (spec 010 review).
 */

export interface PermissionRule {
  action: string
  resource: string
  effect: string
}

/** Documented V2 starting policy every agent inherits (Permissions guide). */
export const V2_BASE_POLICY: PermissionRule[] = [
  { action: "*", resource: "*", effect: "allow" },
  { action: "external_directory", resource: "*", effect: "ask" },
  { action: "read", resource: "*.env", effect: "ask" },
  { action: "read", resource: "*.env.*", effect: "ask" },
  { action: "read", resource: "*.env.example", effect: "allow" },
]

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  if (escaped.endsWith(" *")) {
    return new RegExp("^" + escaped.slice(0, -2) + "( .*)?$")
  }
  return new RegExp("^" + escaped.replace(/\*/g, ".*").replace(/\?/g, ".") + "$")
}

/**
 * Resolve the effective effect for one action/resource pair under
 * last-match-wins semantics: base policy first, project rules after.
 * Unmatched actions fall back to `ask`, as the runtime does.
 */
export function resolveEffect(
  projectRules: PermissionRule[],
  action: string,
  resource: string,
): string {
  let effect = "ask"
  for (const rule of [...V2_BASE_POLICY, ...projectRules]) {
    if (!toRegExp(rule.action).test(action)) continue
    if (!toRegExp(rule.resource).test(resource)) continue
    effect = rule.effect
  }
  return effect
}
