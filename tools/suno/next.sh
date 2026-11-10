#!/bin/bash
# fill + real Create for one element, retrying when Firefox says another BiDi session is open
cd "$(dirname "$0")"
for i in 1 2 3 4 5 6; do out=$(python3 fill.py "$1" 2>&1); echo "$out" | grep -q "Maximum" || break; sleep 4; done; echo "$out"
sleep 2
for i in 1 2 3 4 5 6; do out=$(python3 click_create.py 2>&1); echo "$out" | grep -q "Maximum" || break; sleep 4; done; echo "$out"
