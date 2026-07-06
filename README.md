# Wayfarer — On-Chain AI Survival Expeditions

*Survive by your wits, not your luck.* A survival simulator built on [GenLayer](https://genlayer.com) where an AI warden judges every decision under validator consensus, and your fate is settled on-chain where no one can rewrite it.

- **Live dApp:** https://abstrusimad.github.io/wayfarer-expedition/
- **Contract (Bradbury explorer):** https://explorer-bradbury.genlayer.com/address/0x5EadA75Af09a1606f73661E4CAB80489D02ae230
- **Deployment transaction:** https://explorer-bradbury.genlayer.com/tx/0x6ffd574655eb01113d61e1184583102a83836a5d405b51360e054c06168a37f9

---

## The problem

Survival and decision games hide their dice. A central server (or a single AI call) decides whether your move worked, and you simply trust it. Wayfarer removes that trust assumption: the warden's judgment runs as an Intelligent Contract under GenLayer's validator consensus, so each outcome is reproduced independently by multiple validators and committed to public, tamper-evident state. The fun of an open-ended "what do you do?" simulator, with none of the hidden-server opacity.

## How GenLayer consensus is used

The signature action is `take_action`. When you describe a survival decision, the contract asks an LLM warden to rate its realism and effectiveness for the current scenario and your vitality, returning a vitality delta (from -40 to +20) and a short narrative. Because that output is non-deterministic, it runs through a **custom validator** (`gl.vm.run_nondet_unsafe`):

- The **leader** runs the prompt and proposes an outcome.
- Each **validator independently re-runs the same judgment** on the same inputs.
- Agreement rule: the help/harm **sign must match** (a move can't be helpful to one validator and harmful to another), and the deltas must fall within a tolerance of 10 points. The categorical verdict shown in the UI (`THRIVE` / `STABLE` / `SETBACK` / `PERIL`) is **derived deterministically from the consensus delta after the round** — the prompt deters bad calls, the code enforces the result.

`strict_eq` is deliberately never used around the LLM call (it would land `UNDETERMINED` because validator outputs differ). Starting an expedition (`begin_expedition`) is a deterministic fast path with no AI, so it confirms instantly.

## Survival Stakes — real economic consensus

Wayfarer is not just recreational: every expedition carries a **GEN stake**, and the AI's judgment settles real money. This is what makes decentralized consensus *essential* rather than merely nice-to-have — a manipulated single node could otherwise hand itself a payout.

- `begin_expedition` is **payable**. The attached GEN is escrowed in the contract as your stake and counted as `committed`.
- Reach the **rescue day** alive and your run becomes `RESCUED`; you may `claim_rescue`.
- Die (vitality hits 0) or abandon, and your stake is **forfeited into a shared pot**.
- A rescued survivor claims **their stake back plus a bonus** drawn from the pot.

### Safety model (why it cannot be drained)

- **The AI never decides a payout.** It only moves vitality. The win condition (`day >= RESCUE_DAY` and `vitality > 0`) is fully deterministic in contract code. Real GEN therefore settles on a judgment many validators must independently agree on, but no single node — or a jailbroken LLM — can mint a win.
- **The pot is only funded by real forfeits.** A winner's bonus is capped at the current pot balance (`bonus = min(pot, stake)`), so the contract can never pay out more GEN than losers actually forfeited. The escrow is always solvent.
- **Reentrancy-safe claims.** `claim_rescue` marks the run `claimed`, debits the pot, and updates accounting *before* emitting the native transfer (`emit_transfer(on="finalized")`). Only the owner, only once, only for a `RESCUED` run.
- **Atto-scale integer math.** All escrow accounting uses `u256` at atto scale (never floats), with saturating subtraction so balances can never underflow.
- **Prompt-injection hardened.** Decision text is untrusted data, capped at 500 chars; the warden prompt explicitly rejects attempts to claim invulnerability, demand a positive outcome, or mention stakes/rewards/payouts, and treats them as reckless (strongly negative delta).

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
| `begin_expedition` | write (deterministic, **payable**) | `(scenario_key: str) -> str` | Escrows the attached GEN stake and starts a run at full vitality on day 1. Instant. |
| `take_action` | write (AI consensus) | `(run_id: str, action: str) -> str` | Warden judges the decision under consensus; updates vitality, day, and the log. Deterministically settles `RESCUED` at rescue day or `LOST` (stake forfeited) at zero vitality. |
| `claim_rescue` | write (deterministic) | `(run_id: str) -> str` | A rescued owner claims stake + capped pot bonus; reentrancy-safe. |
| `abandon_expedition` | write (deterministic) | `(run_id: str) -> None` | Owner ends their own run; stake is forfeited to the pot. |
| `get_stats` | view | `() -> dict` | `{expeditions, turns, active, rescued, pot}`. |
| `get_economics` | view | `() -> dict` | Live escrow: `{pot, committed, total_staked, total_paid, min_stake, max_stake, rescue_day}`. |
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
