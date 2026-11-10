#!/bin/bash
# the five chosen clips (TAKEOVER: the longer take; Fire the first generation), each a whole take through BlackHole
cd "$(dirname "$0")"; mkdir -p takes
while read -r name id secs; do
  python3 record.py "$name" "$id" "$secs" "takes/$name-${id:0:8}.wav"
  sox "takes/$name-${id:0:8}.wav" -n stat 2>&1 | grep -E "Length|Maximum amp" | tr '\n' ' '; echo
done <<LIST
earth 0da2a192-8b18-4a23-8102-f6b83093d9da 334.76
water 616872ba-dc53-422e-b8a4-28c3d64822eb 339.48
fire 0fea918a-ed6e-45fa-ad56-35b65075eea8 363.6
air 03e0bad4-360f-4023-8c41-2c6e58f06a52 338.8
ether d08c2c3b-6850-403e-a5b4-93cad1dd6574 390
LIST
SwitchAudioSource -c -t output
