/**
 * tests/smoke/nim-pilot.ts — One-shot live validation of the smoke provider.
 *
 * Default provider is OpenCode Zen; NIM via SMOKE_PROVIDER=nim.
 * Run manually (needs a real key, never in CI):
 *   OPENCODE_ZEN_API_KEY=... npx tsx tests/smoke/nim-pilot.ts
 *   OPENCODE_ZEN_API_KEY=... ZEN_SMOKE_MODEL=mimo-v2.5-free npx tsx tests/smoke/nim-pilot.ts
 *   SMOKE_PROVIDER=nim NVIDIA_API_KEY=nvapi-... npx tsx tests/smoke/nim-pilot.ts
 *
 * Validates, in order:
 *   0. key shape + public connectivity (no auth)
 *   1. key + connectivity (GET /v1/models)
 *   2. chat completions round-trip (/v1/chat/completions)
 *   3. TOOL CALL emission (forced tool_choice)
 *   3b. VOLUNTARY tool call (no tool_choice — the agentic condition)
 *   3c. Voluntary tool call UNDER LOAD (long preamble + 20 tools — predicts smoke)
 *   4. Responses API (/v1/responses — the wire Codex custom providers require)
 *
 * Exits 0 when all checks pass, 1 otherwise. Prints token usage for cost visibility.
 * Zero dependencies (global fetch, Node 20+).
 */

import { smokeProvider } from "./providers"

const cfg = smokeProvider()
if (!cfg) {
  console.error(
    "No provider key set — export OPENCODE_ZEN_API_KEY (or SMOKE_PROVIDER=nim + NVIDIA_API_KEY).",
  )
  process.exit(2)
}
const BASE_URL = cfg.baseUrl
const MODEL = cfg.model
const API_KEY = cfg.apiKey

let failures = 0

function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`)
  if (!ok) failures++
}

async function api(
  path: string,
  body?: unknown,
  opts: { auth?: boolean } = {},
): Promise<{ status: number; json: unknown; raw: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (opts.auth !== false) headers.Authorization = `Bearer ${API_KEY}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  })
  const raw = await res.text().catch(() => "")
  let json: unknown = null
  try {
    json = JSON.parse(raw)
  } catch {
    /* non-JSON error page — raw carries the detail */
  }
  return { status: res.status, json, raw: raw.slice(0, 500) }
}

function usageOf(json: unknown): string {
  const u = (json as { usage?: { prompt_tokens?: number; completion_tokens?: number } })?.usage
  return u ? `${u.prompt_tokens ?? "?"} in / ${u.completion_tokens ?? "?"} out` : "usage n/a"
}

console.log(`Smoke pilot — provider ${cfg.id} — ${BASE_URL} — model ${MODEL}`)
// NOTE: never log API_KEY or anything derived from it (length included) —
// CodeQL js/clear-text-logging flags any secret-derived value in log sinks.
console.log("key: present\n")

// 0. Key shape + public connectivity (no auth) ---------------------------------
{
  const isNim = cfg.id === "nim"
  const sane = isNim
    ? API_KEY.startsWith("nvapi-") && API_KEY.length >= 32 && !/\s/.test(API_KEY)
    : API_KEY.length >= 16 && !/\s/.test(API_KEY)
  check(
    isNim ? "key looks like a build.nvidia.com key" : "key looks usable",
    sane,
    // NOTE: keep env var names as literals — interpolating cfg.apiKeyEnv trips
    // CodeQL js/clear-text-logging (taint on the "Key" identifier).
    isNim ? "expect nvapi-…, 32+ chars, no whitespace" : "from env, 16+ chars, no whitespace",
  )
  if (!sane) {
    console.log(
      isNim
        ? "      hint: regenerate at build.nvidia.com/settings; export with single quotes"
        : "      hint: re-copy the key (opencode.ai/auth) and export with single quotes",
    )
  }
  const { status, raw } = await api("/models", undefined, { auth: false })
  const ok = status === 200
  check("public models endpoint (no auth)", ok, `HTTP ${status}`)
  if (!ok) {
    console.log(`      body: ${raw || "(empty)"}`)
    console.log("      hint: the host itself is unreachable — check proxy env (HTTPS_PROXY), VPN, DNS.")
    console.log("            Authenticated checks below are meaningless until this is green.")
  }
}

// 1. Key + connectivity -------------------------------------------------------
{
  const { status, json, raw } = await api("/models")
  const ids = (json as { data?: { id: string }[] })?.data?.map((m) => m.id) ?? []
  check("models endpoint reachable", status === 200, `HTTP ${status}, ${ids.length} models`)
  if (status !== 200) {
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  if (status === 200 && !ids.includes(MODEL)) {
    console.log(`WARN  model ${MODEL} not listed — continuing anyway`)
  }
}

// 2. Chat round-trip ------------------------------------------------------------
{
  const { status, json, raw } = await api("/chat/completions", {
    model: MODEL,
    messages: [{ role: "user", content: "Reply with exactly: NIM-OK" }],
    max_tokens: 64,
    temperature: 0,
  })
  const text = (json as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message
    ?.content?.trim()
  const ok = status === 200 && text === "NIM-OK"
  check("chat round-trip", ok, `HTTP ${status}, got ${JSON.stringify(text)}`)
  if (!ok) {
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  console.log(`      tokens: ${usageOf(json)}`)
}

// 3. Tool-call emission (critical for agentic harnesses) -----------------------
{
  const { status, json, raw } = await api("/chat/completions", {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "Use the get_file_first_line tool with path=data.txt. Do not guess the answer.",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_file_first_line",
          description: "Return the first line of a project file.",
          parameters: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
          },
        },
      },
    ],
    tool_choice: "required",
    max_tokens: 128,
    temperature: 0,
  })
  const calls = (json as { choices?: { message?: { tool_calls?: { function?: { name?: string } }[] } }[] })
    ?.choices?.[0]?.message?.tool_calls
  const names = calls?.map((c) => c.function?.name) ?? []
  const ok = status === 200 && names.includes("get_file_first_line")
  check("tool call emitted", ok, `HTTP ${status}, calls=${JSON.stringify(names)}`)
  if (!ok) {
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  console.log(`      tokens: ${usageOf(json)}`)
}

// 3b. Voluntary tool call (no tool_choice — the agentic condition) -------------
// Harnesses never force tool_choice; the model must volunteer the call inside
// a normal assistant turn. This is the check that predicts smoke success.
{
  const { status, json, raw } = await api("/chat/completions", {
    model: MODEL,
    messages: [
      {
        role: "user",
        content:
          "What is the first line of data.txt? Use the get_file_first_line tool to find out.",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_file_first_line",
          description: "Return the first line of a project file.",
          parameters: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
          },
        },
      },
    ],
    max_tokens: 256,
    temperature: 0,
  })
  const msg = (json as { choices?: { message?: { tool_calls?: { function?: { name?: string } }[]; content?: string } }[] })
    ?.choices?.[0]?.message
  const names = msg?.tool_calls?.map((c) => c.function?.name) ?? []
  const ok = status === 200 && names.includes("get_file_first_line")
  check("voluntary tool call (no tool_choice)", ok, `HTTP ${status}, calls=${JSON.stringify(names)}`)
  if (!ok) {
    console.log(`      content was: ${JSON.stringify(msg?.content)?.slice(0, 300)}`)
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  console.log(`      tokens: ${usageOf(json)}`)
}

// 3c. Voluntary tool call UNDER LOAD (predicts harness success) ----------------
// Harnesses send a big system prompt + dozens of tools. Small/weaker models
// follow the protocol with 1 tool but leak native formats (raw JSON, DSML)
// under load. Send 20 dummy tools + long preamble and still require a clean
// function call to get_file_first_line.
{
  const dummyTools = Array.from({ length: 19 }, (_, i) => ({
    type: "function",
    function: {
      name: `dummy_helper_${i}`,
      description: `Unrelated helper number ${i} for testing tool selection under load. Does nothing useful.`,
      parameters: {
        type: "object",
        properties: {
          verbose: { type: "boolean" },
          count: { type: "integer" },
          label: { type: "string" },
        },
      },
    },
  }))
  const realTool = {
    type: "function",
    function: {
      name: "get_file_first_line",
      description: "Return the first line of a project file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  }
  const preamble =
    "You are a careful coding assistant operating inside a software project. " +
    "Follow project conventions. Prefer precise tool calls over guessing. " +
    "When you need file contents, always use the provided file tools. ".repeat(40)
  const { status, json, raw } = await api("/chat/completions", {
    model: MODEL,
    messages: [
      { role: "system", content: preamble },
      {
        role: "user",
        content:
          "What is the first line of data.txt? Use the get_file_first_line tool to find out.",
      },
    ],
    tools: [...dummyTools, realTool],
    max_tokens: 256,
    temperature: 0,
  })
  const msg = (json as { choices?: { message?: { tool_calls?: { function?: { name?: string } }[]; content?: string } }[] })
    ?.choices?.[0]?.message
  const names = msg?.tool_calls?.map((c) => c.function?.name) ?? []
  const ok = status === 200 && names.includes("get_file_first_line")
  check("voluntary tool call under load", ok, `HTTP ${status}, calls=${JSON.stringify(names)}`)
  if (!ok) {
    console.log(`      content was: ${JSON.stringify(msg?.content)?.slice(0, 300)}`)
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  console.log(`      tokens: ${usageOf(json)}`)
}

// 4. Responses API (Codex custom-provider wire) ---------------------------------
{
  const { status, json, raw } = await api("/responses", {
    model: MODEL,
    input: "Reply with exactly: NIM-RESP-OK",
    max_output_tokens: 64,
    temperature: 0,
  })
  const out = JSON.stringify(json)
  const ok = status === 200 && out.includes("NIM-RESP-OK")
  check("responses API", ok, `HTTP ${status}`)
  if (!ok) {
    console.log(`      body: ${raw || "(empty)"}`)
    hintForStatus(status, raw)
  }
  console.log(`      tokens: ${usageOf(json)}`)
}

console.log(failures === 0 ? "\nPILOT GREEN — provider is smoke-ready." : `\nPILOT RED — ${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)

/** Map common failure signatures to actionable next steps. */
function hintForStatus(status: number, raw: string): void {
  const nim = cfg.id === "nim"
  if (status === 401) {
    console.log(
      nim
        ? "      hint: key rejected — regenerate it at build.nvidia.com/settings."
        : "      hint: key rejected — re-copy it from opencode.ai/auth and re-export.",
    )
  } else if (status === 403 || /authorization failed/i.test(raw)) {
    console.log(
      "      hint: 403 on integrate.api.nvidia.com usually means the account/org lacks the",
    )
    console.log("            'Public API Endpoints' entitlement — request it (forum/help@build.nvidia.com).")
  } else if (status === 404 || /not found for account/i.test(raw)) {
    if (nim) {
      console.log("      hint: compare with step 0 above — public 200 + authed 404 means the KEY is")
      console.log("            not recognized: regenerate at build.nvidia.com/settings (must be a Build")
      console.log("            key, not an NGC registry key) and re-export with single quotes.")
      console.log("            'Function not found for account' (JSON body) instead means inference is")
      console.log("            not enabled for this account/org — request 'Public API Endpoints' access.")
      console.log("            (Also verify NIM_BASE_URL is unset/default.)")
    } else {
      console.log("      hint: endpoint or model id not found — check the model is listed at")
      console.log("            opencode.ai/zen and ZEN_SMOKE_MODEL for typos.")
    }
  } else if (status === 429) {
    console.log("      hint: free-tier rate limit (~40 RPM) — wait a minute and retry.")
  }
}
