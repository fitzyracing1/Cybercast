import React, { useState, useEffect, useRef, useCallback } from "react";
import { Activity, Radio, ShieldAlert, AlertTriangle, CircleHelp, Power, Play, Pause, Gauge } from "lucide-react";

// ── State machine ──────────────────────────────────────────────
// CLEAR   (green)  agent running, typescript scrolling — not under attack
// TRANSIT (yellow) a red team is probing / passing by
// ATTACK  (blank)  active intrusion on THIS host — screen goes dark
// UNKNOWN (grey)   agent stopped reporting — degraded, no signal (not the same as breach)
// TRANSIT → CLEAR  = lateral movement: attacker jumped to a neighbor

const STATES = {
  CLEAR:   { key: "CLEAR",   word: "CLEAR",        sub: "agent nominal — not under attack",   ink: "#3DF07A", glow: "rgba(61,240,122,0.55)", field: "rgba(61,240,122,0.07)", Icon: Activity },
  TRANSIT: { key: "TRANSIT", word: "TRANSIT",      sub: "hostile probing — red team passing", ink: "#F5C518", glow: "rgba(245,197,24,0.55)", field: "rgba(245,197,24,0.09)", Icon: AlertTriangle },
  ATTACK:  { key: "ATTACK",  word: "UNDER ATTACK", sub: "active intrusion on this host",       ink: "#FF4D4D", glow: "rgba(255,77,77,0.5)",   field: "rgba(8,2,2,0.0)",     Icon: ShieldAlert },
  UNKNOWN: { key: "UNKNOWN", word: "NO SIGNAL",    sub: "agent not reporting — state unknown", ink: "#7A8A86", glow: "rgba(122,138,134,0.4)", field: "rgba(122,138,134,0.05)", Icon: CircleHelp },
};

const HOSTS = ["edge-01", "core-db", "app-07", "vault", "ops-mon", "dmz-gw"];

const FEED_LINES = {
  CLEAR: [
    "svc/agent heartbeat ok",
    "tcp 443 ▸ 10.0.2.14 established",
    "proc node[2231] cpu 4%",
    "auth session renewed uid=ops",
    "edr scan complete — 0 findings",
    "kvstore flush 18ms",
  ],
  TRANSIT: [
    "syn scan ▸ ports 22,80,445,3389",
    "icmp sweep from 10.0.9.x",
    "ldap enum attempt blocked",
    "smb null-session probe",
    "dns ▸ unexpected TXT lookup",
  ],
  ATTACK: [
    "!! lsass read attempt",
    "!! powershell -enc <obfuscated>",
    "!! new svc 'wuauclt2' registered",
    "!! outbound 4444 ▸ 91.x.x.x",
    "!! agent telemetry tampered",
  ],
  UNKNOWN: [
    "··· heartbeat missed (1/3)",
    "··· heartbeat missed (2/3)",
    "··· last beacon 47s ago",
    "··· awaiting agent reconnect",
  ],
};

export default function Cybercast() {
  const [state, setState] = useState("CLEAR");
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [feed, setFeed] = useState([]);
  const [hostStates, setHostStates] = useState(() =>
    Object.fromEntries(HOSTS.map((h, i) => [h, i === 0 ? "CLEAR" : "CLEAR"]))
  );
  const [lateral, setLateral] = useState(null); // { to } when yellow→green fires
  const [beat, setBeat] = useState(0);
  const prev = useRef("CLEAR");
  const focus = HOSTS[0];

  const S = STATES[state];

  // agent heartbeat
  useEffect(() => {
    const t = setInterval(() => setBeat((b) => b + 1), state === "UNKNOWN" ? 2600 : 900);
    return () => clearInterval(t);
  }, [state]);

  // feed ticker
  useEffect(() => {
    const lines = FEED_LINES[state];
    const t = setInterval(() => {
      setFeed((f) => {
        const line = lines[Math.floor(Math.random() * lines.length)];
        const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
        return [{ id: Math.random(), ts, line, st: state }, ...f].slice(0, 40);
      });
    }, (state === "ATTACK" ? 480 : 1100) / speed);
    return () => clearInterval(t);
  }, [state, speed]);

  // detect lateral movement on TRANSIT → CLEAR
  useEffect(() => {
    if (prev.current === "TRANSIT" && state === "CLEAR") {
      const neighbor = HOSTS[1 + Math.floor(Math.random() * (HOSTS.length - 1))];
      setLateral({ to: neighbor });
      setHostStates((hs) => ({ ...hs, [neighbor]: "TRANSIT" }));
      setTimeout(() => setHostStates((hs) => ({ ...hs, [neighbor]: "CLEAR" })), 4200);
      setTimeout(() => setLateral(null), 4200);
    }
    setHostStates((hs) => ({ ...hs, [focus]: state }));
    prev.current = state;
  }, [state]);

  // auto state walk
  useEffect(() => {
    if (!auto) return;
    const order = ["CLEAR", "CLEAR", "TRANSIT", "CLEAR", "TRANSIT", "ATTACK", "CLEAR", "UNKNOWN", "CLEAR"];
    let i = order.indexOf(state);
    const t = setTimeout(() => {
      const next = order[(i + 1) % order.length];
      setState(next);
    }, (state === "ATTACK" ? 3200 : state === "TRANSIT" ? 2600 : 3600) / speed);
    return () => clearTimeout(t);
  }, [auto, state, speed]);

  const trigger = useCallback((k) => { setAuto(false); setState(k); }, []);

  const isAttack = state === "ATTACK";

  return (
    <div className="min-h-screen w-full text-[#C9D6D2] font-mono"
         style={{ background: "radial-gradient(120% 90% at 50% -10%, #0d1412 0%, #070a09 55%, #050706 100%)" }}>
      <style>{`
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
        @keyframes flick { 0%,97%,100%{opacity:1} 98%{opacity:.82} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes dash { to { stroke-dashoffset: -24; } }
        .crt::after{content:"";position:absolute;inset:0;pointer-events:none;
          background:repeating-linear-gradient(0deg,rgba(0,0,0,0.16) 0px,rgba(0,0,0,0.16) 1px,transparent 2px,transparent 3px);}
        .sweep{position:absolute;left:0;right:0;height:38%;
          background:linear-gradient(180deg,transparent,rgba(255,255,255,0.05),transparent);animation:scan 5.5s linear infinite;}
      `}</style>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5">
        {/* ── header ─────────────────────────────── */}
        <header className="flex items-end justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-[#3DF07A]" style={{ textShadow: `0 0 14px ${S.glow}` }}>
              <Radio className="inline w-5 h-5 -mt-1" strokeWidth={2.2} />
            </span>
            <h1 className="text-xl sm:text-2xl tracking-[0.45em] font-bold text-white">CYBERCAST</h1>
            <span className="hidden sm:inline text-[11px] tracking-[0.3em] text-white/35 uppercase">red-team state monitor</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button onClick={() => setAuto((a) => !a)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/15 hover:border-white/35 transition-colors">
              {auto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {auto ? "SIM RUNNING" : "SIM PAUSED"}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/15">
              <Gauge className="w-3.5 h-3.5" />
              {[0.5, 1, 2].map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-1 ${speed === s ? "text-[#3DF07A]" : "text-white/40 hover:text-white/70"}`}>{s}×</button>
              ))}
            </div>
          </div>
        </header>

        {/* ── network row (where lateral movement lands) ── */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {HOSTS.map((h) => {
            const hs = STATES[hostStates[h]];
            const isFocus = h === focus;
            return (
              <div key={h}
                className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded border ${isFocus ? "border-white/40" : "border-white/10"}`}
                style={{ background: hs.field }}>
                <span className="w-2 h-2 rounded-full" style={{ background: hs.ink, boxShadow: `0 0 8px ${hs.glow}`,
                  animation: hostStates[h] === "ATTACK" ? "pulse2 0.7s infinite" : "none" }} />
                <span className={`text-[11px] tracking-wider ${isFocus ? "text-white" : "text-white/55"}`}>{h}</span>
              </div>
            );
          })}
        </div>

        {/* ── lateral movement banner ── */}
        {lateral && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded border border-[#F5C518]/40"
               style={{ background: "rgba(245,197,24,0.08)" }}>
            <AlertTriangle className="w-4 h-4 text-[#F5C518]" />
            <span className="text-[13px] text-[#F5C518]">
              LATERAL MOVEMENT — attacker left <b className="text-white">{focus}</b> and moved toward <b className="text-white">{lateral.to}</b>
            </span>
            <svg className="ml-auto hidden sm:block" width="90" height="14" viewBox="0 0 90 14">
              <line x1="2" y1="7" x2="80" y2="7" stroke="#F5C518" strokeWidth="2" strokeDasharray="6 6"
                    style={{ animation: "dash 0.6s linear infinite" }} />
              <polygon points="80,2 88,7 80,12" fill="#F5C518" />
            </svg>
          </div>
        )}

        {/* ── two-pane console ── */}
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-4">

          {/* LEFT — host state panel (the "feel" of the host) */}
          <section className="crt relative rounded-lg overflow-hidden border min-h-[360px] flex flex-col"
            style={{
              borderColor: isAttack ? "rgba(255,77,77,0.35)" : "rgba(255,255,255,0.12)",
              background: isAttack
                ? "radial-gradient(120% 100% at 50% 30%, #150404 0%, #0a0202 60%, #060101 100%)"
                : `radial-gradient(120% 100% at 50% 20%, ${S.field}, transparent 70%), #070a09`,
              animation: "flick 6s infinite",
            }}>
            <div className="sweep" style={{ opacity: isAttack ? 0.04 : 0.5 }} />

            <div className="relative px-4 pt-3 flex items-center justify-between text-[11px] tracking-[0.25em] text-white/40">
              <span>HOST ▸ {focus.toUpperCase()}</span>
              <span className="flex items-center gap-1.5">
                AGENT
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: state === "UNKNOWN" ? "#7A8A86" : S.ink,
                           boxShadow: `0 0 6px ${S.glow}`,
                           opacity: beat % 2 ? 1 : 0.25 }} />
              </span>
            </div>

            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
              {isAttack ? (
                // screen goes (near) blank on active attack
                <div className="flex flex-col items-center" style={{ animation: "pulse2 1.1s infinite" }}>
                  <ShieldAlert className="w-9 h-9 mb-3" style={{ color: S.ink }} />
                  <div className="text-[10px] tracking-[0.5em] mb-1" style={{ color: S.ink }}>{S.word}</div>
                  <div className="text-[10px] tracking-[0.3em] text-white/30">screen blanked · capture host</div>
                </div>
              ) : (
                <>
                  <S.Icon className="w-8 h-8 mb-4" style={{ color: S.ink, filter: `drop-shadow(0 0 10px ${S.glow})` }} />
                  <div className="text-3xl sm:text-4xl font-bold tracking-[0.18em]"
                       style={{ color: S.ink, textShadow: `0 0 22px ${S.glow}` }}>
                    {S.word}
                  </div>
                  <div className="mt-3 text-[12px] tracking-[0.2em] text-white/45 uppercase">{S.sub}</div>
                </>
              )}
            </div>

            {/* state legend strip */}
            <div className="relative grid grid-cols-4 border-t border-white/10 text-[10px] tracking-wider">
              {Object.values(STATES).map((st) => (
                <button key={st.key} onClick={() => trigger(st.key)}
                  className="py-2 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
                  style={{ background: state === st.key ? st.field : "transparent" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: st.ink, boxShadow: `0 0 6px ${st.glow}` }} />
                  <span style={{ color: state === st.key ? st.ink : "rgba(255,255,255,0.4)" }}>{st.word.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* RIGHT — second monitor: what's in the system */}
          <section className="rounded-lg border border-white/12 bg-[#060908] overflow-hidden flex flex-col min-h-[360px]">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.3em] text-white/45">SYSTEM FEED ▸ DATA VIEW</span>
              <span className="text-[11px]" style={{ color: S.ink }}>● {state}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 text-[12.5px] leading-relaxed">
              {feed.length === 0 && <div className="text-white/30">awaiting telemetry…</div>}
              {feed.map((row) => (
                <div key={row.id} className="flex gap-3 whitespace-nowrap">
                  <span className="text-white/25 shrink-0">{row.ts}</span>
                  <span style={{ color: STATES[row.st].ink, opacity: 0.95 }} className="truncate">{row.line}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-white/10 text-[10px] tracking-wider text-white/30 flex items-center gap-2">
              <Power className="w-3 h-3" /> blank = capture · yellow = transit · yellow→green = jumped hosts · grey = no signal
            </div>
          </section>
        </div>

        <p className="mt-4 text-[11px] text-white/30 leading-relaxed">
          Tap a state in the left strip to drive it manually, or leave SIM running to watch transitions.
          The <span style={{ color: "#F5C518" }}>yellow→green</span> transition is the one that matters:
          a host going quiet right after a probe usually means the attacker moved on, not that you got cleaner.
        </p>
      </div>
    </div>
  );
}
