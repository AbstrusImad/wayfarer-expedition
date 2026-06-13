import { createClient, createAccount } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'

const PK = process.env.GENLAYER_PRIVATE_KEY
const CONTRACT = '0xaC78973442416599Cf366812e9ba7B6d1545445B'
if (!PK) { console.error('Missing GENLAYER_PRIVATE_KEY'); process.exit(1) }

const account = createAccount(PK)
const client = createClient({ chain: testnetBradbury, account })

const STATUS = {
  '1': 'PENDING', '2': 'PROPOSING', '3': 'COMMITTING', '4': 'REVEALING',
  '5': 'ACCEPTED', '6': 'UNDETERMINED', '7': 'FINALIZED', '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT', '13': 'LEADER_TIMEOUT',
}
const name = (s) => STATUS[String(s)] ?? String(s)
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED'])

async function waitFor(hash) {
  for (let i = 0; i < 120; i++) {
    let tx = null
    try { tx = await client.getTransaction({ hash }) } catch {}
    const st = name(tx?.status)
    process.stdout.write(`[${i}] ${st}\n`)
    if (TERMINAL.has(st)) return st
    await new Promise((r) => setTimeout(r, 8000))
  }
  return 'TIMEOUT'
}

console.log('Account:', account.address)

const h1 = await client.writeContract({ address: CONTRACT, functionName: 'begin_expedition', args: ['andes'], value: 0n })
console.log('begin tx:', h1)
const s1 = await waitFor(h1)
console.log('begin ->', s1)

const runs = await client.readContract({ address: CONTRACT, functionName: 'get_runs', args: [0] })
const mine = runs.find((r) => String(r.owner).toLowerCase() === account.address.toLowerCase())
console.log('my run:', mine?.id, 'day', mine?.day, 'vitality', mine?.vitality)

const action = 'Descend below the tree line out of the wind, build a snow shelter, insulate the floor with branches, and melt snow over a small fire before it gets dark.'
const h2 = await client.writeContract({ address: CONTRACT, functionName: 'take_action', args: [mine.id, action], value: 0n })
console.log('action tx:', h2)
const s2 = await waitFor(h2)
console.log('action ->', s2)

const run = await client.readContract({ address: CONTRACT, functionName: 'get_run', args: [mine.id] })
console.log('after: day', run.day, 'vitality', run.vitality, 'turns', run.turns, 'status', run.status)
const last = run.log?.[run.log.length - 1]
console.log('last verdict:', last?.verdict, 'delta', last?.delta)
console.log('narrative:', last?.narrative)
