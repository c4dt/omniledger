#!/bin/bash
cls
rm -f *.cfg
./bcadmin -c . create public.toml --interval 500ms
./phapp spawner bc-* key-*
./bcadmin latest --bc bc-*
./bcadmin key -print key-*
