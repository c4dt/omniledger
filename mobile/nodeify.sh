#!/bin/bash
FILE="$1"
if [[ "$2" ]]; then
    FILE="$2"
    echo "Unnodifying $FILE"
    if grep -q "nativescript-nodeify" "$FILE"; then
        sed -i '' '1,3d' "$FILE"
    fi
else
    echo "Nodifying $FILE"
    if grep -rilq '^import.*"crypto' $FILE; then
        echo -e '// tslint:disable-next-line\nrequire("nativescript-nodeify");'\n | cat - "$FILE" > "$FILE.tmp"
    fi
fi
