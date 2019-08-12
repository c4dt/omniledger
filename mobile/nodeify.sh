#!/bin/bash
FILE="$1"
if [ "$2" ]; then
    FILE="$2"
    echo "Unnodifying $FILE"
    perl -pi -e 's/from "crypto-browserify"/from "crypto"/' "$FILE"
#    sed '1d' "$FILE" > "$FILE.tmp"
else
    echo "Nodifying $FILE"
    perl -pi -e 's/from "crypto"/from "crypto-browserify"/' "$FILE"
#    echo 'require("nativescript-nodeify");' | cat - "$FILE" > "$FILE.tmp"
fi
#mv "$FILE.tmp" "$FILE"
