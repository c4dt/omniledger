#!/bin/bash
FILE="$1"
if [[ "$2" ]]; then
    FILE="$2"
    echo "Unnodifying $FILE"
    perl -pi -e 's/from "crypto-browserify"/from "crypto"/' "$FILE"
    if grep -q "nativescript-nodeify" "$FILE"; then
        sed -i '' '1,3d' "$FILE"
    fi
else
    echo "Nodifying $FILE"
    perl -pi -e 's/from "crypto"/from "crypto-browserify"/' "$FILE"
    if grep -rilq '^import.*"crypto' $FILE; then
        echo -e '// tslint:disable-next-line\nrequire("nativescript-nodeify");'\n | cat - "$FILE" > "$FILE.tmp"
    fi
fi
