#!/bin/bash
npm i --silent --no-audit --no-fund --prefer-offline
./flumi.sh & P1D=$!
./hotfnx.sh & P2D=$!
while kill -0 "$P1D" 2>/dev/null && kill -0 "$P2D" 2>/dev/null; do sleep 0.0167 done
kill -9 $P1D $P2D 2>/dev/null || true