#!/bin/bash
setsid mkcert -install >/dev/null 2>&1 </dev/null
echo "mkcert -install went as it should"
mkcert -cert-file certLocal.pem -key-file keyLocal.pem localhost 127.0.0.1 ::1