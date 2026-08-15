/* WHEP smoke test: offer -> 201 answer -> sourceOnDemand pull starts -> cleanup DELETE
   Usage: node scripts/whep-smoke-test.mjs [path]   (default cam_1) */
const path = process.argv[2] || 'cam_1'
const endpoint = `http://localhost:8889/${path}/whep`

const offer = [
  'v=0',
  'o=- 3461703233620589143 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'm=video 9 UDP/TLS/RTP/SAVPF 96',
  'c=IN IP4 0.0.0.0',
  'a=rtcp:9 IN IP4 0.0.0.0',
  'a=ice-ufrag:testuser',
  'a=ice-pwd:testpass',
  'a=ice-options:trickle',
  'a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
  'a=setup:actpass',
  'a=mid:0',
  'a=sendrecv',
  'a=rtcp-mux',
  'a=rtpmap:96 H264/90000',
  'a=rtcp-fb:96 transport-cc',
].join('\r\n') + '\r\n'

async function main() {
  const res = await fetch(endpoint, {
    method: 'POST',
    body: offer,
    headers: { 'Content-Type': 'application/sdp' },
  })
  console.log('POST status:', res.status)
  if (!res.ok) {
    console.log('body:', await res.text())
    process.exit(1)
  }
  const location = res.headers.get('location')
  console.log('Location:', location)
  const answer = await res.text()
  console.log('answer has ice-ufrag:', answer.includes('a=ice-ufrag'), '| answer has candidate:', answer.includes('a=candidate'))
  console.log('answer m-line:', answer.split('\r\n').find((l) => l.startsWith('m=')))

  const resourceUrl = new URL(location, endpoint)
  await new Promise((r) => setTimeout(r, 4000))
  const paths = await (await fetch('http://localhost:9997/v3/paths/list')).json()
  const cam = paths.items.find((p) => p.name === path)
  console.log(`${path} after WHEP: available =`, cam?.available, '| readers =', cam?.readers?.length, '| tracks2 =', cam?.tracks2?.length)

  const del = await fetch(resourceUrl, { method: 'DELETE' })
  console.log('DELETE resource status:', del.status)
  await new Promise((r) => setTimeout(r, 1000))
  const paths2 = await (await fetch('http://localhost:9997/v3/paths/list')).json()
  const cam2 = paths2.items.find((p) => p.name === path)
  console.log(`${path} after DELETE: readers =`, cam2?.readers?.length)
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
