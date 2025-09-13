mimes = { // taken from official gurty
	html: "text/html",
	htm: "text/html",
	css: "text/css",
	js: "application/javascript",
	json: "application/json",
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	svg: "image/svg+xml",
	ico: "image/x-icon",
	txt: "text/plain",
	xml: "application/xml",
	pdf: "application/pdf"
}
dfltMime = "application/octet-stream"

function redirector(a, b) {
	
}

function staticHost(root, ...f) {
	var out = {}
	f.forEach(function(a) {
		var target = a
		if (a.endsWith("/")) target += "index.html"
		var poss = (a.endsWith("/"))?[a+"index.html",a+"index.htm",a.slice(-1)]:[]
		poss.forEach(function(b){
			out[b] = function(rq,rs){return[rs.h("content-type",mimes.htm),`<html><head><title>Please wait...</title><body><p>plz wait for your internet to load the redirection page...</p><script>gurt.location.goto(${JSON.stringify(a)})</script></body></html>`][1]}
		})
		var mime = mimes[a.split(".").toReversed()[0]]||dfltMime
		out[a] = function(rq,rs){return[rs.h("content-type",mime),require("fs").readFileSync(require("path").join(root,target),"utf8")][1]}
	})
	return out
}

module.exports = {
	...staticHost(require("path").join(__dirname,"static"), "/", "/style.css", "/Hilaricons.woff2"),
	async default(req, res) {
		res.status = "NOT_FOUND"
		return `<html><body><p>why dawg, ofc you know ${req.url} doesnt exist homie</p></body></html>`
	}
}