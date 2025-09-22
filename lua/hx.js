module.exports = function(f, L, ctx) { // L=lauxlib.luaL_newstate()
	var lua = f.lua
	var lauxlib = f.lauxlib
	var lualib = f.lualib
	var inbredLua = {...lua, ...lauxlib, ...lualib}
	
	var realOs = inbredLua.luaopen_os
	inbredLua.luaopen_os = function(L) {
		realOs(L)
		var patched = Object.fromEntries(["remove", "exit", "rename", "tmpname", "getenv"].map(function(a){return[a,function(){return inbredLua.luaL_error("os has limited functionality for sandboxing purposes")}]}))
		inbredLua.luaL_setfuncs(L, patched, 0)
		return 1
	}
	f.lualib.luaopen_os = lualib.luaopen_os = inbredLua.luaopen_os
	
	inbredLua.luaopen_io = function(L) {
		inbredLua.lua_newtable(L)
		var patched = Object.fromEntries(["close", "flush", "input", "output", "type", "write"].map(function(a){return[a,function(){return inbredLua.luaL_error("io has limited functionality for sandboxing purposes")}]}))
		inbredLua.luaL_setfuncs(L, patched, 0)
		var stdin = inbredLua.lua_newuserdata(L)
		stdin.f = new Readable({read(){this.push(null)}}) // no stdin for you, silly ass
		stdin.closef = function(L) {
			lua_pushnil(L)
			lua_pushliteral(L, "cannot close standard file")
			return 2
		}
		stdin.fakedUp = true
		inbredLua.lua_setfield(L, -2, f.to_luastring("stdin"))
		// eh, stdout + stderr later.
		// nothing will happen if a few std handles are missing
		return 1
	}
	f.lualib.luaopen_io = lualib.luaopen_io = inbredLua.luaopen_io
	
	// lua.lua_requiref(L, f.to_luastring("package"), inbredLua.luaopen_package, 1)
	inbredLua.luaopen_package(L) // hmm idk
	// inbredLua.lua_pop(L, 1)
	// inbredLua.lua_getglobal(L, f.to_luastring("package"))
	inbredLua.lua_getfield(L, -1, f.to_luastring("preload"))
	inbredLua.luaL_setfuncs(L, {
		hotfnx: function(L) { // require("hotfnx")
			inbredLua.lua_newtable(L)
			// stuff
			return 1
		}
	}, 0)
	inbredLua.lua_pop(L, 2) // clean up time!
	
	inbredLua.luaL_openlibs(L)
}