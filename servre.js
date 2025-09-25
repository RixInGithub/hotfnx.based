net = require("net")
void({readFileSync:read}=require("fs"))

localhost = !(process.argv[2]) // only use real hotfnx.based certs if we are on gattodev servers
key = `key${localhost?"Local":""}.pem`
cert = `cert${localhost?"Local":""}.pem`
blynas = require("./blynublynai.js")
stats = {
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NO_CONTENT: 204,
	// SWITCHING_PROTOCOLS: 101,
	// fuck the 101 man
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	TIMEOUT: 408,
	TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504
}
// code MOSTLY stolen from hillers.js on my termux:
hillers = [["B",1],["μH",19],["H",4],["mH",8],["kH",10],["hH",4],["wH",20],["tH",20],["qH",5]]
hillers.forEach(function([n,sz],idx,h){
	if(idx<1)return
	h[idx]=[n,h.slice(1,idx+1).reduce(function(a,b){return(b[1])*a},1)]
})
names = {B:"byte",μH:"microhiller",H:"hiller",mH:"macrohiller",kH:"kilohiller",hH:"harhiller",wH:"wowhiller",tH:"terahiller",qH:"qwenhiller"}

function bytesToHillerSys(b) {
	var biggest = hillers[hillers.slice(1).reduce(function(c,d,idx){return((b<(d[1]*4))&&(b>hillers[idx][1]))?(idx+1):c},0)]
	return [b/biggest[1], biggest[0], names[biggest[0]]]
}
// original code continues beyond this comment!

net.createServer({/*noDelay:true*/}, async function(tcp) {
	var hndshk = ""+(await new Promise(function(a){tcp.once("data",a)}))
	if (!((hndshk.startsWith("HANDSHAKE / GURT/1.0.0\r\n"))&&(hndshk.endsWith("\r\n\r\n"))))return(tcp.destroy())
	await new Promise(function(a){tcp.write(Buffer.from(`
GURT/1.0.0 101 SWITCHING_PROTOCOLS
content-length: 0
encryption: TLS/1.3
server: hotfnx/0
alpn: GURT/1.0
date: ${new Date().toUTCString()}
gurt-version: 1.0.0


`.slice(1,-1).replaceAll("\n","\r\n"),"utf8"),null,a)})
	var tls = new (require("tls").TLSSocket)(tcp, {isServer: true, minVersion: "TLSv1.3", maxVersion: "TLSv1.3", key: read(key), cert: read(cert), requestCert: false, rejectUnauthorized: false})
	var rawReq = ""+(await new Promise(function(a){tls.once("data",a)}))
	var [, mtd, p, q] = rawReq.match(new RegExp("(^[A-Z]+) (\\/[\\/A-Za-z0-9\\-._~!\\$&'()*+,;=:@\\%]*)(\\?[^ ]*)?"))
	q=new URLSearchParams((q?q:"")+"")
	var hdrs = {
		"content-type": "text/text"
	}
	var hdlr = blynas(p)
	var lines = rawReq.split("\r\n").slice(1)
	var lastHdr = 0
	for (var l of lines) {
		if (!(l.includes(":"))) break
		lastHdr++
	}
	var reqHdrs = Object.fromEntries(lines.slice(0,lastHdr).map(function(a){return[a.slice(0,a.indexOf(":")),a.slice(a.indexOf(":")+1).trimStart()]}))
	var hReq = {
		url: p,
		method: mtd,
		hdrs: reqHdrs,
		q
	}
	var hRes = {
		h(hdr, val) {
			hdrs[(hdr+"").toLowerCase()] = val+""
		},
		status: "OK"
	}
	var resp = Buffer.from(await hdlr(hReq, hRes))
	console.log(hRes.status)
	if (typeof(stats[hRes.status])!="number") hRes.status = "OK" // fallback in case some stupid future me decided to troll present me
	var biggest = bytesToHillerSys(resp.length)
	hRes.h("content-length",resp.length)
	await new Promise(function(a){tls.write(Buffer.concat([Buffer.from(`
GURT/1.0.0 ${stats[hRes.status]} ${hRes.status}
${Object.entries(hdrs).map(function(a){return(a).join(":\x20")}).join("\n")}
date: ${new Date().toUTCString()}


`.slice(1,-1).replaceAll("\n","\r\n"),"utf8"),resp]),null,a)})
	tls.end()
	tcp.end()
	// `\x1b[1m${sz.toFixed(8)}\x1b[0m`,unit[0],`(${names[unit[0]]}${(sz==1)?"":"s"})`
	console.log(`${mtd} ${p} GURT/1.0.0: \x1b[1m${stats[hRes.status]}\x1b[0m (${hdrs["content-type"]}, ${biggest[0].toFixed(8)} ${biggest[2]+((biggest[0]===1)?"":"s")} (${resp.length}B))`)
}).listen(port=parseInt(process.argv[2]||4878), function() {
	console.log(`get\n  yOur\n:${port}\n  Ready`)
})