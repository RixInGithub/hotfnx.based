#!/bin/bash

# Start Xpra server
export XDG_RUNTIME_DIR=$HOME/.xpra-runtime
mkdir -p $XDG_RUNTIME_DIR
export XKB_CONFIG_ROOT=/usr/share/X11/xkb
pkill -9 -f Xvfb
if ! xpra list | grep -q ":100"; then
	xpra start :100 --bind-tcp=0.0.0.0:14500 --keyboard-layout=en --keyboard-variant=us --daemon=yes
fi
xpra control :100 start "flumiInstall/Flumi.x86_64 --resolution 1366x611 --position 0,0 --maximized"