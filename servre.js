net = require("net")
void({readFileSync:read}=require("fs"))

localhost = true
key = `key${localhost?"Local":""}.pem`
cert = `cert${localhost?"Local":""}.pem`
handlers = require("./blynublynai.js")
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

function bytesToHillerSys(b) { // code stolen from hiller.js on my termux
	hillers = [["B",1],["μH",19],["H",4],["mH",8],["kH",10],["hH",4],["wH",20],["tH",20],["qH",5]]
	hillers.forEach(function([n,sz],idx,h){
		if(idx<1)return
		h[idx]=[n,h.slice(1,idx+1).reduce(function(a,b){return(b[1])*a},1)]
	})
	names = {B: "byte", μH: "microhiller", H: "hiller", mH: "macrohiller", kH: "kilohiller", hH: "harhiller", wH: "wowhiller", tH: "terahiller", qH: "qwenhiller"}
	var biggest = hillers[hillers.slice(1).reduce(function(c,d,idx){return((b<(d[1]*4))&&(b>hillers[idx][1]))?(idx+1):c},0)]
	return [b/biggest[1], biggest[0], names[biggest[0]]]
}

net.createServer({/*noDelay:true*/}, async function(tcp) {
	// tcp.on("data",function(a){console.log("eyy i got smth over here (b4 middle man init)", a+"")})
	var hndshk = ""+(await new Promise(function(a){tcp.once("data",a)}))
	if (!((hndshk.startsWith("HANDSHAKE / GURT/1.0.0\r\n"))&&(hndshk.endsWith("\r\n\r\n")))) {console.log("well fuck");tcp.destroy();return}
	await new Promise(function(a){tcp.write(Buffer.from(`
GURT/1.0.0 101 SWITCHING_PROTOCOLS
content-length: 0
encryption: TLS/1.3
server: GURT/1.0.0
alpn: GURT/1.0
date: ${new Date().toUTCString()}
gurt-version: 1.0.0


`.slice(1,-1).replaceAll("\n","\r\n"),"utf8"),null,a)})
	/*
		function duplexProxy(toRead,toWrite,...rest) {
			Duplex.constructor.apply(this,rest)
			this._read = toRead
			this._write = toWrite
		}
		duplexProxy.prototype = new Duplex()
		duplexProxy.prototype.constructor = duplexProxy
		var middleMan = new duplexProxy(function() {
			console.log("eyyy im reading over here")
		}, function(a,b,c) {
			console.log("eyyy im writing over here", a+"")
			tcp.write(a,b,c)
		})
	*/
	var tls = new (require("tls").TLSSocket)(tcp, {isServer: true, minVersion: "TLSv1.3", maxVersion: "TLSv1.3", key: read(key), cert: read(cert), requestCert: false, rejectUnauthorized: false})
	var rawReq = ""+(await new Promise(function(a){tls.once("data",a)}))
	var [, mtd, p] = rawReq.match(new RegExp("(^[A-Z]+) (\\/[\\/A-Za-z0-9\\-._~!\\$&'()*+,;=:@\\%]*)"))
	var hdrs = {
		"content-type": "text/text"
	}
	var hdlr = ((handlers[p])||(handlers.default))
	var hReq = {
		url: p,
		method: mtd
	}
	var hRes = {
		h(hdr, val) {
			hdrs[(hdr+"").toLowerCase()] = val+""
		},
		status: "OK"
	}
	var resp = Buffer.from(await hdlr(hReq, hRes))
	if (typeof(stats[hRes.status])!="string") hRes.status = "OK" // fallback in case some stupid future me decided to troll present me
	var biggest = bytesToHillerSys(resp.length)
	// `\x1b[1m${sz.toFixed(8)}\x1b[0m`,unit[0],`(${names[unit[0]]}${(sz==1)?"":"s"})`
	console.log(`${mtd} ${p} GURT/1.0.0: ${stats[hRes.status]} (${hdrs["content-type"]}, ${biggest[0].toFixed(8)} ${biggest[2]+((biggest[0]===1)?"":"s")} (${resp.length}B))`)
	await new Promise(function(a){tls.write(Buffer.concat([Buffer.from(`
GURT/1.0.0 ${stats[hRes.status]} ${hRes.status}
${Object.entries(hdrs).map(function(a){return(a).join(":\x20")}).join("\n")}
date: ${new Date().toUTCString()}
content-length: ${resp.length}


`.slice(1,-1).replaceAll("\n","\r\n"),"utf8"),resp]),null,a)})
	await new Promise(function(a){setTimeout(a,2e3)})
	tls.destroy()
	tcp.destroy()
}).listen(4878, function() {
	console.log("get\n  yOur\n:4878\n  Ready")
})