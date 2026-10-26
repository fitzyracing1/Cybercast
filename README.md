# CYBERCAST

A red-team **state monitor** — a CRT-styled, two-pane security console that
visualizes the lifecycle of a host under adversary activity. It's a UI
demo/simulation, not a real EDR agent: the telemetry is synthetic and driven by
a state machine you can step through manually or watch on auto.

## The state machine

The monitor models a single focus host (`edge-01`) moving between four states:

| State     | Color  | Meaning                                                              |
| --------- | ------ | ------------------------------------------------------------------- |
| `CLEAR`   | green  | Agent nominal, telemetry scrolling — not under attack.              |
| `TRANSIT` | yellow | A red team is probing / passing by (scans, enumeration, sweeps).    |
| `ATTACK`  | red    | Active intrusion on **this** host — the screen blanks (capture).    |
| `UNKNOWN` | grey   | Agent stopped reporting — degraded, no signal (≠ confirmed breach). |

The transition that matters is **`TRANSIT → CLEAR`**: a host going quiet right
after a probe usually means **lateral movement** — the attacker jumped to a
neighbor — not that the host got cleaner. When that fires, a banner names the
neighbor and the network row lights it up.

## Controls

- **SIM RUNNING / PAUSED** — toggle the automatic state walk.
- **0.5× / 1× / 2×** — simulation speed.
- **State strip** (bottom of the left pane) — tap any state to drive it
  manually; this also pauses the sim.

## Running locally

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Stack

- [React 18](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) icons

## Plans

This project is free, and its license stays as is. Support it through [GitHub Sponsors](https://github.com/sponsors/fitzyracing1):

- **Free**: use the code, community support.
- **Pro ($49/month)**: priority issues and support.
- **Team ($199/month)**: priority support for your team plus early access.
