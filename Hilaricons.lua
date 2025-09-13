(function()
	gurt.select("head"):append(gurt.create("font", {}))
	local begin = 0x7676
	local hicns = {"f7676","brainfuck","hiccup","h","grad","rgb","back","fwd","hicn","python","javascript","cheese","apple","facedev","gary","bsod","h1","loss","npm","null","stack","noBlink","usbCerberus","printerJam","license","recursion","stackUltraflow","placeholder","tf","err","pump","mad","hello"}
	local count = 0
	local handlin = {}
	for idx,el in pairs(gurt.selectAll("i[hicn]")) do
		local newEl = el.clone(false)
		local found = false
		local unicode = nil
		if not handlin[el] then
			for idx2,nm in pairs(hicns) do
				found = (found) or (nm==el:getAttribute("hicn"))
				if found and not unicode then unicode = begin+idx2 end
			end
			if not found then
				trace.warn(string.format("Hilaricons.lua: unknown hilaricon %q", nm))
			end
			trace.log(found)
			if found then
				trace.log(string.format("%x",unicode))
				-- el.text = string.format("&#%d;",unicode)
			end
		end
	end
end)()