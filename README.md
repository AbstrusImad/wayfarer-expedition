# Wayfarer — On-Chain AI Survival Expeditions

*Survive by your wits, not your luck.* A survival simulator built on [GenLayer](https://genlayer.com) where an AI warden judges every decision under validator consensus, and your fate is settled on-chain where no one can rewrite it.

- **Live dApp:** https://abstrusimad.github.io/wayfarer-expedition/
- **Contract (Bradbury explorer):** https://explorer-bradbury.genlayer.com/address/0xaC78973442416599Cf366812e9ba7B6d1545445B
- **Deployment transaction:** https://explorer-bradbury.genlayer.com/tx/0xab1d4ecf7bd73cef80a31d92920a87bcaf72c9e300ce71dc2d328dc3d4a5faf3

---

## The problem

Survival and decision games hide their dice. A central server (or a single AI call) decides whether your move worked, and you simply trust it. Wayfarer removes that trust assumption: the warden's judgment runs as an Intelligent Contract under GenLayer's validator consensus, so each outcome is reproduced independently by multiple validators and committed to public, tamper-evident state. The fun of an open-ended "what do you do?" simulator, with none of the hidden-server opacity.

## How GenLayer consensus is used

The signature action is `take_action`. When you describe a survival decision, the contract asks an LLM warden to rate its realism and effectiveness for the current scenario and your vitality, returning a vitality delta (from -40 to +20) and a short narrative. Because that output is non-deterministic, it runs through a **custom validator** (`gl.vm.run_nondet_unsafe`):

- The **leader** runs the prompt and proposes an outcome.
- Each **validator independently re-runs the same judgment** on the same inputs.
- Agreement rule: the help/harm **sign must match** (a move can't be helpful to one validator and harmful to another), and the deltas must fall within a tolerance of 10 points. The categorical verdict shown in the UI (`THRIVE` / `STABLE` / `SETBACK` / `PERIL`) is **derived deterministically from the consensus delta after the round** — the prompt deters bad calls, the code enforces the result.

`strict_eq` is deliberately never used around the LLM call (it would land `UNDETERMINED` because validator outputs differ). Starting an expedition (`begin_expedition`) is a deterministic fast path with no AI, so it confirms instantly.

### Architecture boundary

```
                    +-----------------------------------------------+
   Browser (SPA)    |  Intelligent Contract  (the backend)          |
 +---------------+  |  Wayfarer @ 0xaC78...445B                     |
 | Next.js static|  |                                               |
 | + genlayer-js |  |  runs:    TreeMap[str, json]  (per expedition)|
 |               |  |  run_ids: DynArray[str]       (pagination)    |
 |  reads  ------+--+->  get_stats / get_runs / get_run             |
 |  (paged,      |  |      get_leaderboard / get_scenarios          |
 |   95s poll)   |  |                                               |
 |               |  |  begin_expedition(key)   -> deterministic     |
 |  writes ------+--+->  take_action(run_id, decision)              |
 |  (wallet sign)|  |        +- LLM warden under consensus          |
 +---------------+  |           (run_nondet_unsafe + validator)     |
        |           +-----------------------------------------------+
        v
   MetaMask  -->  GenLayer Bradbury Testnet (chain 4221)
```

There is no server and no database. All authoritative state (scenarios, runs, vitality, day count, decision log) is contract storage; the frontend is a pure static SPA that reads paged views and stages the live consensus lifecycle.

## Contract

`contracts/contract.py` — single-file GenVM Python contract, runner pinned on line 1.

| Method | Kind | Signature | Notes |
| --- | --- | --- | --- |
| `begin_expedition` | write (deterministic) | `(scenario_key: str) -> str` | Starts a run at full vitality on day 1. Instant. |
| `take_action` | write (AI consensus) | `(run_id: str, action: str) -> str` | Warden judges the decision under consensus; updates vitality, day, and the log. |
| `abandon_expedition` | write (deterministic) | `(run_id: str) -> None` | Owner ends their own run. |
| `get_stats` | view | `() -> dict` | `{expeditions, turns, active}`. |
| `get_scenarios` | view | `() -> list` | The fixed scenario set (source of truth for the UI). |
| `get_runs` | view | `(start: u256) -> list` | Newest-first page of runs (log omitted for the list). |
| `get_run` | view | `(run_id: str) -> dict` | A single run including its full decision log. |
| `get_leaderboard` | view | `(start: u256) -> list` | Runs ranked by day survived, then vitality. |

Design notes: each run is serialized to a JSON string inside `TreeMap[str, str]` with a parallel `DynArray[str]` of ids for pagination; vitality and counters use `u256`. Deterministic guards (owner check, status check, length bounds) run before the LLM; deterministic backstops clamp vitality to 0-100, mark the run `LOST` at zero, and advance the day after consensus. Decision text is capped at 500 characters both in the prompt and as a guard to limit cost and injection surface. Only the run owner may act on or abandon their expedition.

## Frontend

- **Stack:** Next.js 14 (App Router, static export), TypeScript, Tailwind CSS, Framer Motion, lucide-react, `genlayer-js`.
- **Art direction:** *Neo-terminal field log* — near-black `#0a0c10`, amber phosphor accent `#f0a830` with survival-green/peril-red signal colors, IBM Plex Mono display + IBM Plex Sans body, faint grid and scanline textures, uppercase mono micro-labels. The hero runs a hand-built animated topographic-contour canvas. Chosen to read like a survival field console and to stay distinct from a generic card layout. No emojis; iconography is `lucide-react` and inline SVG.
- **Consensus theater:** because an AI write takes 1-5+ minutes, the deliberation screen stages the real lifecycle (logged -> warden assessing -> validators re-running -> sealed), shows the live network status, and previews the warden's draft delta peeked from the transaction receipt while the round is still sealing.
- **Resilience:** reads are paged and polled slowly (95s), polling pauses while a transaction is in flight, `LEADER_TIMEOUT` / `VALIDATORS_TIMEOUT` are treated as non-terminal (the network rotates the leader), and a failed read swaps only the data section to an error card — the page never white-screens.

## Testing

- **Consensus integration test** (`tests/integration/test_expedition.py`) runs against gasless **StudioNet** with `gltest`, exercising real leader + validator consensus without spending test GEN:
  ```bash
  gltest tests/integration/ -v -s --network studionet
  ```
  It begins an expedition and takes one AI-judged action, asserting `tx_execution_succeeded` and that state advances. This proves the contract's consensus logic before any live deploy.

## Quick start

```bash
git clone https://github.com/AbstrusImad/wayfarer-expedition.git
cd wayfarer-expedition/frontend
npm install
npm run dev      # http://localhost:3000
```

You will need MetaMask and test GEN from the [Bradbury faucet](https://testnet-faucet.genlayer.foundation/) to begin an expedition or take an action. Reading the board needs no wallet.

## Deploy

Contract (uses the [GenLayer CLI](https://docs.genlayer.com)):

```bash
genlayer network set testnet-bradbury
genlayer deploy --contract contracts/contract.py
```

Frontend (static export to GitHub Pages):

```bash
cd frontend
npm run deploy   # builds and publishes ./out to the gh-pages branch
```

If you redeploy the contract, update `CONTRACT_ADDRESS` and `DEPLOY_TX` in `frontend/src/lib/contract.ts`.

## Repository layout

```
wayfarer-expedition/
├── contracts/contract.py        # the Intelligent Contract (the backend)
├── tests/integration/           # gltest consensus test (StudioNet)
├── frontend/                    # Next.js static SPA
│   └── src/{app,components,hooks,lib}
├── scripts/no-emoji.js          # pre-commit emoji gate
├── tools/                       # genlayer-js verification harness
└── README.md
```
