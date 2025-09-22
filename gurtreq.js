function camelToKebab(c) {
	var split = c.split(new RegExp("(?=[A-Z])"))
	return [split[0]].concat(split.slice(1).map(function(a){return(a).toLowerCase()})).join("-")
}

function kebabToCamel(k) {
	return(k.includes("-")?function(){return(k).slice(0,k.indexOf("-"))+k.slice(k.indexOf("-")+1).split("-").map(function([a,...b]){return(a?function(){return(a).toUpperCase()+b.join("").toLowerCase()}:function(){return""})()}).join("")}:function(){return(k)})()
}

function sendRawReq(skt, mtd, path, headers, body) {
	body = ["post","put","patch"].includes(mtd.toLowerCase())?(body+""):""
	var constructed = `${mtd.toUpperCase()} ${path} GURT/1.0.0\r\n${Object.entries({...headers,contentLength:body.length}).map(function([k,v]){return[camelToKebab(k),v+""].join(":\x20")}).join("\r\n")}\r\n\r\n${body}`
	if (skt) skt.write(constructed)
	console.log(constructed)
	return constructed
}

module.exports = async function req(host, askDns, mtd, path, hdrs, body) {
	if (askDns) void({records:[{value:host}]} = JSON.parse(await req("135.125.163.131", false, "POST", "/resolve-full", JSON.stringify({domain: host, type: "A"}), {})))
	var tcp = require("net").connect(4878, host)
	await new Promise(function(a,b) {
		tcp.on("connect",a)
		tcp.on("error",function(...c){console.log(...c);b(...c)})
	})
	sendRawReq(tcp, "HANDSHAKE", "/", {userAgent: "hotfnx/0.0.0"}, "") // i am walking as blindly as gurtler.lua does
	await new Promise(function(a) {
		tcp.on("data", function(b) {
			require("fs").writeFileSync("tcp.bin", b)
			a()
		})
	})
	var tls = new (require("tls").TLSSocket)(tcp, {isServer: false, minVersion: "TLSv1.3", maxVersion: "TLSv1.3", requestCert: false, rejectUnauthorized: false})
	sendRawReq(tls, mtd.toUpperCase(), new URL(path, "gurt://hotfnx.based").pathname, hdrs, body)
	await new Promise(function(a) {
		tls.on("data", function(b) {
			// require("fs").writeFileSync("out.bin", b)
		})
	})
}