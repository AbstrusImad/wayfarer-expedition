import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'

const CONTRACT = '0xaC78973442416599Cf366812e9ba7B6d1545445B'
const client = createClient({ chain: testnetBradbury })

const stats = await client.readContract({ address: CONTRACT, functionName: 'get_stats', args: [] })
console.log('get_stats ->', JSON.stringify(stats))

const runs = await client.readContract({ address: CONTRACT, functionName: 'get_runs', args: [0] })
console.log('runs ->', Array.isArray(runs) ? runs.length : runs)
const first = Array.isArray(runs) && runs[0] ? runs[0] : null
console.log('first run ->', first ? `${first.id} day ${first.day} vit ${first.vitality} ${first.status}` : 'none')

const board = await client.readContract({ address: CONTRACT, functionName: 'get_leaderboard', args: [0] })
console.log('leaderboard ->', Array.isArray(board) ? board.length : board)

const sc = await client.readContract({ address: CONTRACT, functionName: 'get_scenarios', args: [] })
console.log('scenarios ->', Array.isArray(sc) ? sc.map((s) => s.key).join(', ') : sc)
