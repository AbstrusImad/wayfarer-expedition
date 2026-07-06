import { createClient, createAccount } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import { readFileSync } from 'node:fs'

// Load account 0 private key from the root .env
const envText = readFileSync('d:/proyectos/genlayer/agent_proyect_creator/.env', 'utf8')
const pkLine = envText.split(/\r?\n/).find((l) => l.startsWith('GENLAYER_PRIVATE_KEY_0='))
const PK = pkLine?.split('=')[1]?.trim()?.replace(/^["']|["']$/g, '')
if (!PK) { console.error('NO_PK'); process.exit(1) }

const code = readFileSync(new URL('../contracts/contract.py', import.meta.url), 'utf8')
const account = createAccount(PK.startsWith('0x') ? PK : '0x' + PK)
const client = createClient({ chain: testnetBradbury, account })

const STATUS = { '5': 'ACCEPTED', '6': 'UNDETERMINED', '7': 'FINALIZED', '8': 'CANCELED', '12': 'VALIDATORS_TIMEOUT', '13': 'LEADER_TIMEOUT' }
const name = (s) => STATUS[String(s)] ?? String(s)
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED'])

console.log('Deployer:', account.address)
const hash = await client.deployContract({ code, args: [] })
console.log('DEPLOY_TX:', hash)

let recipient = null
for (let i = 0; i < 150; i++) {
  let tx = null
  try { tx = await client.getTransaction({ hash }) } catch {}
  const st = name(tx?.status)
  process.stdout.write(`[${i}] ${st}\n`)
  if (tx?.recipient) recipient = tx.recipient
  if (TERMINAL.has(st)) break
  await new Promise((r) => setTimeout(r, 8000))
}
console.log('CONTRACT_ADDRESS:', recipient)
