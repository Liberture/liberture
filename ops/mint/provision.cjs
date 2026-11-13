// Run once as root on the mint host. Key material stays on the host.
const fs = require("node:fs")
const crypto = require("node:crypto")
const { createRequire } = require("node:module")
const { finalizeEvent, generateSecretKey } = createRequire("/srv/zaps-provision/package.json")("nostr-tools/pure")
const dir = "/etc/nostrwot-mint"
const keyFile = dir + "/provision.key"
const digest = value => crypto.createHash("sha256").update(value).digest("hex")
async function main() {
  process.umask(0o077)
  fs.mkdirSync(dir, {recursive:true, mode:0o700})
  if (!fs.existsSync(keyFile)) fs.writeFileSync(keyFile, Buffer.from(generateSecretKey()).toString("hex"), {flag:"wx"})
  const path = "/api/v2/provision"
  const body = JSON.stringify({ name: "Nostr WoT Cashu Mint" })
  const url = "https://zaps.nostr-wot.com" + path
  const post = async (route, data, headers={}) => {
    const response = await fetch("http://127.0.0.1:3003" + route, {method:"POST", headers:{"Content-Type":"application/json", ...headers}, body:data})
    if (!response.ok) throw new Error("Wallet provisioning returned HTTP " + response.status)
    return response.json()
  }
  const issued = await post(path+"/challenge", JSON.stringify({url,method:"POST",payload:digest(body)}))
  const event = finalizeEvent({kind:27235, created_at:Math.floor(Date.now()/1000), content:"",
    tags:[["u",url],["method","POST"],["payload",digest(body)],["challenge",issued.challenge],["transaction",digest(issued.transactionToken)]]}, Buffer.from(fs.readFileSync(keyFile,"utf8"),"hex"))
  const wallet = await post(path,body,{Authorization:"Nostr "+Buffer.from(JSON.stringify(event)).toString("base64"),"X-Nostr-Transaction":issued.transactionToken})
  if (!/^[a-f0-9]{32}$/.test(wallet.adminkey)) throw new Error("Wallet key missing")
  const settings = [
    'NAME="Nostr WoT Mint"', 'DESCRIPTION="Bitcoin Lightning ecash for Liberture challenges"',
    'NETWORK="mainnet"', 'MINT_LIGHTNING_BACKEND="LNbitsWallet"',
    'MINT_LNBITS_ENDPOINT="http://127.0.0.1:3003"', 'MINT_LNBITS_KEY='+JSON.stringify(wallet.adminkey),
    'PEG_IN_LIMIT_SATS=10000','PEG_OUT_LIMIT_SATS=20000','PEG_OUT_ONLY=false',
  ]
  fs.writeFileSync(dir+"/config.toml",settings.join("\n")+"\n",{mode:0o600})
  if (!fs.existsSync(dir+"/service.env")) fs.writeFileSync(dir+"/service.env", [
    "MINT_PRIVATE_KEY="+crypto.randomBytes(32).toString("hex"), "SIGNER_TYPE=memory","PORT=3348",
    "DATABASE_URL=postgresql:///nostrwotmint?host=/var/run/postgresql", "XDG_CONFIG_HOME=/var/lib/nostrwotmint"
  ].join("\n")+"\n",{flag:"wx",mode:0o600})
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
