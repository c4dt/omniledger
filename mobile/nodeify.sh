#!/bin/bash
FILE="$1"
if [ "$2" ]; then
    FILE="$2"
    perl -pi -e 's/from "crypto-browserify"/from "crypto"/' "$FILE"
#    sed '1d' "$FILE" > "$FILE.tmp"
else
    perl -pi -e 's/from "crypto"/from "crypto-browserify"/' "$FILE"
#    echo 'require("nativescript-nodeify");' | cat - "$FILE" > "$FILE.tmp"
fi
#mv "$FILE.tmp" "$FILE"
