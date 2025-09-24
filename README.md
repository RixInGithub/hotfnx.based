# hotfnx.based
## how to run...
### ...flumi?
decompress either `flumiInstall/flumi100.7z` or `flumiInstall/flumi102.7z` into the `flumiInstall` folder

then run `chmod +x flumiInstall/Flumi.x86_64` and then run `./flumi.sh`. you will see some xpra logs. if so, your xpra instance should be running on localhost:14500 or some forwarded port url if youre also in codespaces.

prerequisites: xpra and p7zip
### ...the server?
install all the npm deps: `npm i`

then just run `node servre.js` (yes, it's misspelled)

if needed, edit lines 4-6 to change up the certificates or whether to use which version of the certs.

also you might need to `mkcert -install` or [remake them certs](https://docs.gurted.com/docs/gurt-server#development-certificates).

prerequisites: node (+npm), mkcert