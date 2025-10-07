module.exports = async function(sql, ...args) {
	require("dotenv/config") // til you can use require on dotenv and it wont fucking crash. what sorcery is this...
	args=args.map(String)
	sql=sql.replaceAll(new RegExp("\\$(\\d+)","g"),function(a,b){return`'${Buffer.from((args[b-1]?function(){return(args)[b-1]}:function(){throw new Error(`no arg for '${a}' found`)})()).toString("base64")}'`}) // this is a last ditch effort type way of adding in args. do not do this in your own projects. just use pg. like a normal person.
	var r = await (require("node-fetch").default(`https://${process.env.SPBS_URL}/rest/v1/rpc/execute`, {
		method: "POST",
		headers: {"Content-Type":"application/json",apikey:process.env.SPBS_SRK},
		body: JSON.stringify({sql})
	}))
	return await r.json()
}