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
db = require("./supabase")
bjs = require("bcryptjs")
genUid=function(){return(require("uid-safe")).sync(24)}
sessions = new Map()

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

var apiRules = (function() {
	var api = {
		add(mtd,p,n){return[n=n?n:p.name,!function(){if(!(n))throw(Reflect.construct(Error,["what\x20the\x20fuck"]))}(),n=(n==p.name)?`/${n}/`:n,api.rules[mtd.toLowerCase()][n]=p]},
		rules: {get:{},post:{}}
	}
	api.add("POST", async function account(req,res) {
		res.h("content-type","application/json")
		var reqBdy = JSON.parse(req.body)
		var exists = async function(){return(await(db(`SELECT * FROM logins WHERE username = $1`,reqBdy.user))).length!=0}
		switch (reqBdy.req) {
			case "r":
				if (reqBdy.pass!=reqBdy.cnfm) return res.err("plz make sure ur \"confirm password\" is the same as the \"password\" ;(")
				console.log(await(db(`SELECT * FROM logins WHERE username = $1`,reqBdy.user)))
				if (await exists()) return res.err("username taken!")
				if (reqBdy.user.match(new RegExp("[^a-zA-Z0-9_\\-!]"))) return res.err("username must only have alphanumerical characters, _, -, H, and !")
				// todo: password taken by <username> /j
				var pHash = bjs.hashSync(reqBdy.pass, 12)
				smth = await db("INSERT INTO logins (username, pass) VALUES ($1, $2) RETURNING *", reqBdy.user, pHash)
				console.log(await(db(`SELECT * FROM logins WHERE username = $1`,reqBdy.user)))
				console.log(smth)
				if (!(await exists())) return res.err("database error 1")
				break
			case "l": break // login functionality happens either way :3
			default: return res.err(`.req must be either 'r' or 'l' but i got '${reqBdy.req}'`)
		}
		// await db("SELECT * FROM logins WHERE username = 'userbro' AND pass = 'hashbrown'")
		if (!(await exists())) return res.err("username not found")
		user = await db("SELECT * FROM logins WHERE username = $1 LIMIT 1", reqBdy.user)
		console.log(user)
		user = user[0]
		if (!(user)) return res.err("database error 2")
		pHash = atob(user.pass)
		if (!(bjs.compareSync(reqBdy.pass, pHash))) return res.err("incorrect password")
		var sessId = genUid()
		sessions.set(sessId, {user: reqBdy.user})
		return JSON.stringify({sessId})
	})
	api.add("GET", async function account(req, res) {
		var validSess = req.hdrs["x-hotfnx-ss"]
	})
	return function(path) {
		var foundMtds = []
		Object.entries(api.rules).forEach(function([mtd,paths]) {
			Object.entries(paths).forEach(function([p]) {if (p==path.slice(4)) foundMtds.push(mtd.toLowerCase())})
		})
		if(foundMtds.length==0)return[false]
		return [true, function(req, res) {
			if(foundMtds.indexOf(req.method.toLowerCase())==-1)return[res.status="METHOD_NOT_ALLOWED",""][1]
			return(api).rules[req.method.toLowerCase()][path.slice(4)](req, {...res, err(error){return(JSON).stringify([res.status="BAD_REQUEST",{error}][1])}}, ...([].slice.call(arguments,2)))
		}]
	}
})()

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
	var apiResp = apiRules(h)
	if (apiResp[0]) return apiResp[1]
	var shyt = ([basicRules.get(h)]).find(function(a){return(a)}) // find the first unundefined shyt
	return(shyt?shyt:iThinkItsA_404)//(req, res)
}