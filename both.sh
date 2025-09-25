#!/bin/bash
npm i --silent --no-audit --no-fund --prefer-offline
setsid ./flumi.sh & P1D=$!
setsid ./hotfnx.sh & P2D=$!
wait $P1D $P2D || touch "i failed to exit flumi and hotfnx :(.txt"