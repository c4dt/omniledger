The tsconfig.common.json in this directory is included both by
`webapp/tsconfig.json` and `dynacred/tsconfig.json` to allow easy
working with changing cothority- and kyber-sources.

The paths given are resolved with the first found path. So `webapp`
will always use the dynacred-source, except if packed for distribution
(which currently is never done). For the cothority- and kyber-sources,
in normal running it takes the distributed version in
`node_modules/@{dedis,c4dt}/{cothority,kyber}`.

For developing cothority-sources, too, it is enough to make a symlink
from the `cothority/external/js/{cothority,kyber}/src` to the 
`src/lib/{cothority,kyber}` directories in `webapp` and `dynacred`.
