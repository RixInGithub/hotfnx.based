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
	return require("ejs").render(require("fs").readFileSync("ejs/redirector.ejs","utf8"), {a,b})
}

function staticHost(root, ...f) {
	var out = {}
	f.forEach(function(a) {
		var target = a
		if (a.endsWith("/")) target += "index.html"
		var poss = (a.endsWith("/"))?[a+"index.html",a+"index.htm",a.slice(-1)]:[]
		poss.forEach(function(b){
			out[b] = function(rq,rs){return[rs.h("content-type",mimes.htm),redirector(b,a)][1]}
		})
		var mime = mimes[a.split(".").toReversed()[0]]||dfltMime
		if (a.split(".")==a) mime = mimes.htm
		out[a] = function(rq,rs){return[rs.h("content-type",mime),require("fs").readFileSync(require("path").join(root,target),null)][1]} // i made it a buffer cuz font files dont work when i read them as strings apparently 😒
	})
	return out
}

async function iThinkItsA_404({url:a}, res) {
	res.status = "NOT_FOUND"
	// return `<html><body><p>why dawg, ofc you know ${req.url} doesnt exist homie</p></body></html>`
	// return require("ejs").render(require("fs").readFileSync("ejs/notFound.ejs","utf8"), {a})
	return"" // flumi displays its own 404 page sadly.
}

var basicRules = new Map(Object.entries({
	...staticHost(require("path").join(__dirname,"static"), "/", "/style.css", "/hotfnx.css", "/Hilaricons.woff2"),
	...staticHost(require("path").join(__dirname,"pix"), ...require("fs").readdirSync(require("path").join(__dirname,"pix")).map(function(a){return"/"+a})),
	...staticHost(require("path").join(__dirname,"trebuchetms"), ...require("fs").readdirSync(require("path").join(__dirname,"trebuchetms")).map(function(a){return"/"+a})),
	["/testmajij/"](req, res) {
		res.h("content-type", "text/html")
		return redirector("/testmajij/", "/") // yes, this is VERY intentional
	},
	["/dash/"](req, res) {
		res.h("content-type", "text/html")
		return require("ejs").render(require("fs").readFileSync("ejs/partial2full.ejs","utf8"))
	},
	["/login/"](req, res) {
		res.h("content-type", "text/html")
		return require("ejs").render(require("fs").readFileSync("ejs/login.ejs","utf8"), {q:req.q})
	}
}))

var sigmaRules = new Map([
	[new RegExp("^/[A-Z]_[a-h0-9]{4}/(.*)"), async function(req, res) { 
		
	}]
])

module.exports = function handlor(h) {
	var shyt = ([basicRules.get(h)]).find(function(a){return(a)}) // find the first unundefined shyt
	return(shyt?shyt:iThinkItsA_404)//(req, res)
}