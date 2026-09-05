/**
 * dsh-desktop-pet — DSH bundle Node half.
 *
 * Runs inside the DSH web process. Responsibilities:
 * 1. Listen to agent / session events and push signals to the Electron pet
 *    window over a local HTTP POST (127.0.0.1:43991/signal) — celebrate on
 *    task completion, error on failures / request errors, think/wait while a
 *    turn runs or waits for approval, idle when a turn closes, welcome on a
 *    new session.
 * 2. Register the experience-layer config namespace with the DSH settings
 *    service (schemastery schema, hot-applied via scope.watch) and push
 *    { type: 'config' } signals so the pet re-applies size/opacity/character/
 *    behavior without a restart.
 * 3. Spawn the Electron pet window on boot (the pet's own single-instance
 *    lock keeps a manually started window from being duplicated).
 *
 * The pet window also works standalone without this plugin (local autonomous
 * behavior, config from its own config.json); the plugin adds the agent-state
 * sync channel and the settings-backed hot config.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { DEFAULTS, NAMESPACE, buildSchema, validateConfig } from "./config.mjs";

export const name = "dsh-desktop-pet";
export const inject = ["jobs", "sessions", "agents", "settings", "credentials"];

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 43991;
const HOST = "127.0.0.1";

// DSH home（今日已用账本文件所在），与 dsh-whale-widget 使用同一策略。
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");

// ---- DeepSeek 计费换算（与 dsh-whale-widget 完全一致）----
// CNY / 每百万 token：[空闲时段价, 高峰时段价]；高峰 = 工作日 9:00–12:00、14:00–18:00
// （北京时间）；2026-08-23 起周末全天谷价。
const PEAK_HOURS = [[9, 12], [14, 18]];
const BASE_PRICE = { hit: [0.05, 0.1], miss: [1.5, 3.0], out: [4.5, 9.0] };
const PRO_PRICE = { hit: [0.15, 0.3], miss: [4.5, 9.0], out: [13.5, 27.0] };
const PRICING = {
  "deepseek-v4-flash-vision-exp": BASE_PRICE,
  "deepseek-v4-flash": BASE_PRICE,
  "deepseek-v4-pro": PRO_PRICE,
  "deepseek-chat": BASE_PRICE,
  "deepseek-reasoner": BASE_PRICE,
  _default: BASE_PRICE,
};
function priceFor(model) {
  const m = String(model || "").toLowerCase();
  for (const key of Object.keys(PRICING)) {
    if (key === "_default") continue;
    if (m.indexOf(key) !== -1) return PRICING[key];
  }
  return PRICING._default;
}
const WEEKEND_VALLEY_FROM_SEC = Math.floor(Date.UTC(2026, 7, 22, 16, 0, 0) / 1000);
function isPeakTime(timeSec) {
  if (!isFinite(Number(timeSec))) return false;
  const n = Number(timeSec);
  const bj = new Date(n * 1000 + 8 * 3600 * 1000);
  if (n >= WEEKEND_VALLEY_FROM_SEC) {
    const dow = bj.getUTCDay(); // 0=周日 6=周六（按 UTC 读取即为北京日历日）
    if (dow === 0 || dow === 6) return false;
  }
  const hour = bj.getUTCHours();
  for (const [start, end] of PEAK_HOURS) {
    if (hour >= start && hour < end) return true;
  }
  return false;
}

/** Resolve an executable that can run main.js: the electron package when it is
 *  installed anywhere up the node_modules tree (dev setups, local installs),
 *  or the standalone installed app when electron is absent (npm-published
 *  installs — electron is a devDependency, so a plain `npm install` of this
 *  bundle does not ship it). Returns null when neither exists. */
let electronPath = null;
try {
  const mod = await import("electron");
  electronPath = typeof mod.default === "string" ? mod.default : null;
} catch {
  /* not resolvable from this tree */
}
if (!electronPath) {
  try {
    const req = createRequire(import.meta.url);
    const mod = req("electron");
    electronPath = typeof mod === "string" ? mod : null;
  } catch {
    /* electron not installed anywhere up the tree */
  }
}

/** Find the user-installed standalone pet executable (electron-builder NSIS
 *  default per-user install dir, or anywhere under Program Files). */
function findInstalledPetExe() {
  if (process.platform !== "win32") return null;
  const roots = [
    path.join(process.env.LOCALAPPDATA ?? "", "Programs"),
    process.env.PROGRAMFILES ?? "C:\\Program Files",
    process.env.LOCALAPPDATA ?? "",
  ];
  for (const root of roots) {
    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory() || !/dsh[ -]desktop[ -]pet/i.test(e.name)) continue;
      const dir = path.join(root, e.name);
      let files = [];
      try {
        files = fs.readdirSync(dir);
      } catch {
        continue;
      }
      const exe = files.find((f) => /\.exe$/i.test(f) && !/setup|uninstall/i.test(f));
      if (exe) return path.join(dir, exe);
    }
  }
  return null;
}

/** Fire one signal toward the pet window (local HTTP POST). Best-effort. */
async function sendSignal(signal) {
  try {
    const res = await fetch(`http://${HOST}:${PORT}/signal`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...signal, ts: Date.now() }),
    });
    await res.arrayBuffer(); // drain the response
  } catch {
    /* pet offline — signal dropped */
  }
}

// Crash recovery: a spawned pet that dies unexpectedly (non-zero exit) is
// restarted with a small backoff, capped so a hard-failing install does not
// respawn forever. A zero exit is a deliberate quit (tray -> 退出) and never
// resurrects the pet.
let petRespawnTimer = null;
let petRespawnAttempts = 0;
let petRespawnResetTimer = null;

/** Spawn the pet window if a runnable electron / installed exe exists. */
function ensurePet() {
  const exe = electronPath ?? findInstalledPetExe();
  if (!exe) return;
  clearTimeout(petRespawnTimer);
  try {
    const child = spawn(exe, [path.join(ROOT, "main.js")], {
      stdio: "ignore",
      detached: false,
      windowsHide: true,
    });
    child.on("error", () => {});
    child.on("exit", (code) => {
      if (code !== 0 && petRespawnAttempts < 5) {
        petRespawnAttempts++;
        const delay = Math.min(60_000, 10_000 * petRespawnAttempts);
        petRespawnTimer = setTimeout(ensurePet, delay);
      }
    });
    child.unref();
    // a pet that stays alive long enough is healthy — reset the crash counter
    // so a later one-off crash still gets a fresh restart budget
    clearTimeout(petRespawnResetTimer);
    petRespawnResetTimer = setTimeout(() => {
      petRespawnAttempts = 0;
    }, 60_000);
    petRespawnResetTimer.unref?.();
  } catch {
    /* spawn failed — pet stays off, sync messages go nowhere */
  }
}

/**
 * Cordis plugin apply.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  ensurePet();

  // ---- config: register with DSH settings, hot-push on change ----
  const settings = typeof ctx.get === "function" ? ctx.get("settings") : undefined;
  let config = { ...DEFAULTS };
  if (settings !== undefined && typeof settings.register === "function") {
    try {
      const scope = settings.register(NAMESPACE, buildSchema(), {
        applies: "live",
        validate: validateConfig,
      });
      config = { ...DEFAULTS, ...(scope.get() ?? {}) };
      scope.watch((next) => {
        config = { ...DEFAULTS, ...(next ?? {}) };
        sendSignal({ type: "config", config });
      });
    } catch (err) {
      console.error("[dsh-desktop-pet] settings register failed:", err?.message ?? err);
    }
  }

  // ---- 今日已用 + 每轮消耗统计（计费规则与 dsh-whale-widget 一致）----
  const USAGE_FILE = path.join(DSH_HOME, ".dsh-pet-usage.json");
  const beijingDateStr = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  let todayUsage = 0;
  let usageDate = beijingDateStr();
  function loadTodayUsage() {
    try {
      const raw = fs.readFileSync(USAGE_FILE, "utf8");
      const data = JSON.parse(raw);
      if (data && data.date === beijingDateStr()) return Number(data.usage) || 0;
    } catch {
      /* 首次运行或文件损坏 */
    }
    return 0;
  }
  todayUsage = loadTodayUsage();
  function addTodayUsage(cost) {
    if (!(cost > 0)) return;
    const today = beijingDateStr();
    if (today !== usageDate) {
      usageDate = today;
      todayUsage = 0;
    }
    todayUsage += cost;
    try {
      fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
      fs.writeFileSync(USAGE_FILE, JSON.stringify({ date: today, usage: todayUsage }));
    } catch {
      /* best-effort */
    }
  }

  const turnAggs = new Map(); // sessionId -> { turn, cost, tokens }
  function finalizeTurnCost(sessionId) {
    const agg = turnAggs.get(sessionId);
    if (agg && agg.cost > 0) {
      addTodayUsage(agg.cost);
      sendSignal({ type: "turn-cost", turn: agg.turn, amount: agg.cost, tokens: agg.tokens, todayUsage });
    }
    turnAggs.delete(sessionId);
  }
  // assistant/message 事件携带每步真实 usage，按 (session,turn) 分桶聚合；
  // turn/end 时结算该会话本轮并推送 turn-cost（与 dsh-whale-widget 同款，避免主会话与子代理串账）。
  function handleCostEvent(sessionId, event) {
    try {
      const type = event && event.type;
      const d = event && event.data;
      if (!d || typeof d !== "object") return;
      if (type === "turn/end") {
        finalizeTurnCost(sessionId);
        return;
      }
      if (type !== "assistant/message") return;
      const turn = Number(d.turn);
      const usage = d.usage;
      if (!usage || typeof usage !== "object" || !isFinite(turn)) return;
      let agg = turnAggs.get(sessionId);
      if (!agg || agg.turn !== turn) {
        if (agg) finalizeTurnCost(sessionId);
        agg = { turn, cost: 0, tokens: 0 };
        turnAggs.set(sessionId, agg);
      }
      const input = Number(usage.inputTokens) || 0;
      const cache = Number(usage.cacheReadTokens) || 0;
      const output = Number(usage.outputTokens) || 0;
      const reasoning = Number(usage.reasoningTokens) || 0;
      agg.tokens += input + cache + output + reasoning;
      const model = d.message && d.message.source ? d.message.source.model : "";
      const p = priceFor(model);
      const off = isPeakTime(Math.floor(Date.now() / 1000)) ? 1 : 0;
      agg.cost += (cache / 1e6) * p.hit[off] + (input / 1e6) * p.miss[off] + ((output + reasoning) / 1e6) * p.out[off];
    } catch {
      /* 忽略无法解析的事件 */
    }
  }

  // ---- DeepSeek 余额同步：启动即拉一次，之后每 60s 刷新并推给桌宠 ----
  let balanceTimer = null;
  async function pushBalance() {
    let cred = null;
    try {
      cred = await ctx.credentials.resolve("DEEPSEEK_API_KEY");
    } catch {
      cred = null;
    }
    if (!cred || !cred.value) {
      sendSignal({ type: "balance", ok: false, code: "NO_KEY", error: "未配置 DEEPSEEK_API_KEY" });
      return;
    }
    try {
      const res = await fetch("https://api.deepseek.com/user/balance", {
        headers: { Authorization: "Bearer " + cred.value },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        sendSignal({ type: "balance", ok: false, code: "HTTP", error: "HTTP " + res.status });
        return;
      }
      const data = await res.json();
      const infos = Array.isArray(data?.balance_infos) ? data.balance_infos : [];
      if (infos.length === 0) {
        sendSignal({ type: "balance", ok: false, code: "SHAPE", error: "余额接口结构异常" });
        return;
      }
      const num = (x) => (x && x.total_balance !== undefined ? Number(x.total_balance) : NaN);
      const info =
        infos.find((x) => x && x.currency === "CNY" && num(x) > 0) ||
        infos.find((x) => num(x) > 0) ||
        infos.find((x) => x && x.currency === "CNY") ||
        infos[0];
      if (!info || info.total_balance === undefined) {
        sendSignal({ type: "balance", ok: false, code: "SHAPE", error: "余额接口结构异常" });
        return;
      }
      sendSignal({
        type: "balance",
        ok: true,
        totalBalance: Number(info.total_balance),
        grantedBalance: info.granted_balance !== undefined ? Number(info.granted_balance) : 0,
        toppedUpBalance: info.topped_up_balance !== undefined ? Number(info.topped_up_balance) : 0,
        currency: String(info.currency || "CNY"),
        todayUsage: todayUsage,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      sendSignal({
        type: "balance",
        ok: false,
        code: "NET",
        error: "余额请求失败: " + String((err && err.message) || err).slice(0, 120),
      });
    }
  }
  pushBalance();
  balanceTimer = setInterval(pushBalance, 60_000);

  // ---- live state tracking (think/wait/exec) + heartbeat sync ----
  // Signals are fire-and-forget; a pet that starts mid-turn (or reconnects)
  // would miss them. A 5s heartbeat carries the current state so the pet
  // stays aligned even when it missed the edges.
  let thinking = false;
  let waiting = false;
  let activeTools = 0;
  let lastTodo = [];
  // tool arguments arrive as STREAMING chunks (argumentsDelta fragments keyed by
  // callId) — accumulate them so the pet can show the tool's actual target
  const toolArgs = new Map();

  // When several sessions exist (multiple agents in the web UI), concurrent
  // sessions would fight over the pet's one state box. Only the MOST RECENTLY
  // ACTIVE session drives the pet; after it stays quiet for SESSION_STALE_MS,
  // a different session may take over. (jobs/onJobDone stays unfiltered: a
  // completed job celebrating is welcome from any session.)
  const SESSION_STALE_MS = 30_000;
  let activeSessionId = null;
  let activeSessionAt = 0;
  const isCurrentSession = (sid) => {
    const now = Date.now();
    if (sid == null) return true; // unknown identity — don't drop events
    if (activeSessionId === null || sid === activeSessionId) {
      activeSessionId = sid;
      activeSessionAt = now;
      return true;
    }
    if (now - activeSessionAt > SESSION_STALE_MS) {
      activeSessionId = sid;
      activeSessionAt = now;
      return true;
    }
    return false; // another session is currently driving the pet
  };

  const heartbeat = setInterval(() => {
    sendSignal({
      type: "sync",
      think: thinking,
      wait: waiting,
      exec: activeTools > 0,
      todos: lastTodo,
    });
  }, 5000);

  /** Friendly labels for the tool calls shown on the pet. */
  const TOOL_LABELS = {
    read: "📖 读文件",
    write: "✏️ 写文件",
    edit: "🔧 编辑代码",
    glob: "🔍 查找文件",
    grep: "🔎 搜索内容",
    pwsh: "⚡ 执行命令",
    job_output: "📄 读取任务输出",
    job_list: "📋 查看任务",
    job_kill: "🛑 停止任务",
    web_search: "🌐 网络搜索",
    subagent: "🤖 派发子任务",
    subagent_fork: "🤖 子代理接力",
    todo_write: "📝 更新计划",
    skill: "📚 加载技能",
    ask_user_question: "❓ 向你提问",
    read_image: "🖼️ 查看图片",
    create_goal: "🎯 创建目标",
    update_goal: "🎯 更新目标",
    exit_plan_mode: "📐 提交方案",
    workflow: "🚀 运行工作流",
    ralph: "🔄 Ralph 迭代",
  };
  const toolLabel = (name) => TOOL_LABELS[name] ?? `🛠️ ${name}`;

  /** Short human-readable target of a tool call (file path / query / command…)
   *  for the pet's detailed caption. Null when the tool has nothing useful. */
  const toolDetailOf = (name, args) => {
    if (!args || typeof args !== "object") return null;
    const KEY = {
      read: "file_path", write: "file_path", edit: "file_path", read_image: "file_path",
      glob: "pattern", grep: "pattern", pwsh: "command", web_search: "query",
      skill: "name", subagent: "description", subagent_fork: "description",
      job_output: "job_id", workflow: "name",
    };
    const key = KEY[name];
    const picked = key && typeof args[key] === "string" && args[key].trim() ? args[key].trim() : null;
    if (picked) return picked.length > 60 ? picked.slice(0, 60) : picked;
    // generic fallback: first non-empty string argument value
    for (const val of Object.values(args)) {
      if (typeof val === "string" && val.trim()) {
        const s = val.trim();
        return s.length > 60 ? s.slice(0, 60) : s;
      }
    }
    return null;
  };

  const disposers = [
    // Task terminal states: completed -> celebrate, failed -> error.
    ctx.jobs.onJobDone((snapshot) => {
      if (!snapshot) return;
      if (snapshot.status === "completed") {
        sendSignal({ type: "celebrate", label: snapshot.label ?? "任务完成" });
      } else if (snapshot.status === "failed") {
        sendSignal({ type: "error", label: snapshot.label ?? "任务失败" });
      }
    }),

    // LLM request errors (may retry later) -> startled.
    ctx.on("agent/request-error", () => {
      sendSignal({ type: "error", label: "请求出错" });
    }),

    // New session -> welcome.
    ctx.on("agent/session-start", (payload) => {
      if (payload?.source === "startup") sendSignal({ type: "welcome" });
    }),

    // Session log edges drive think / exec / todo / wait / celebrate.
    // Event shape (dsh-session SessionEventMap): { type, seq, time, data }.
    ctx.on("session/event", (session, event) => {
      if (!isCurrentSession(session?.id)) return;
      const type = event?.type;
      if (type === "turn/start") {
        thinking = true;
        waiting = false;
        sendSignal({ type: "think" });
      } else if (type === "turn/end") {
        thinking = false;
        activeTools = 0;
        const reason = event?.data?.reason;
        if (reason?.kind === "blocked") {
          waiting = true;
          sendSignal({ type: "wait" });
        } else {
          waiting = false;
          sendSignal({ type: "celebrate", label: "回合完成" });
        }
      } else if (type === "tool/call") {
        // the model asked for a tool — show what it is doing (codex-pet style).
        // tool/call events are STREAMING chunks: { chunk: { id, name?, argumentsDelta } },
        // so accumulate the argument fragments and attach the parsed target.
        activeTools++;
        const chunk = event?.data?.chunk ?? {};
        const name = event?.data?.name ?? chunk.name;
        const callId = event?.data?.callId ?? chunk.id;
        if (chunk.argumentsDelta && callId) {
          toolArgs.set(callId, (toolArgs.get(callId) ?? "") + chunk.argumentsDelta);
          if (toolArgs.size > 64) toolArgs.clear(); // guard against leaked calls
        }
        let detail = null;
        if (name && callId && toolArgs.has(callId)) {
          try {
            detail = toolDetailOf(name, JSON.parse(toolArgs.get(callId)));
          } catch {
            /* partial JSON mid-stream — keep the previous detail */
          }
        }
        sendSignal({ type: "exec", tool: name, label: toolLabel(name), detail });
      } else if (type === "tool/result") {
        activeTools = Math.max(0, activeTools - 1);
        const callId = event?.data?.message?.source?.callId ?? event?.data?.callId;
        if (callId) toolArgs.delete(callId);
        if (activeTools === 0) sendSignal({ type: "tool-done" });
      } else if (type === "todo/write") {
        // progress snapshot: [{ content, status }]
        lastTodo = Array.isArray(event?.data?.todos) ? event.data.todos : [];
        sendSignal({ type: "todo", todos: lastTodo });
      }
    }),

    // 每轮消耗统计：监听所有会话的 assistant/message + turn/end（与 dsh-whale-widget 同款）
    ctx.on("session/event", (session, event) => {
      handleCostEvent(session?.id ?? "default", event);
    }),
  ];

  // Push the resolved config to the pet shortly after boot (the pet may still
  // be starting; it also re-requests config on boot when the plugin is live).
  setTimeout(() => {
    sendSignal({ type: "config", config });
  }, 1500);

  ctx.effect(() => () => {
    clearInterval(heartbeat);
    clearInterval(balanceTimer);
    clearTimeout(petRespawnTimer);
    clearTimeout(petRespawnResetTimer);
    // note: the spawned pet is NOT killed here — the user may want it to keep
    // running when the plugin unloads (e.g. dsh web restarts)
    for (const dispose of disposers) {
      if (typeof dispose === "function") dispose();
    }
  }, "dsh-desktop-pet: agent-state sync + config");
}
