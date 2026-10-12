# Pinned PARI/GP runtime for P7

From the repository root, the native Linux service installs this local pip
requirement:

```
./research-ide/mathscope-m3/p7/pari_runtime
```

An explicit reproduction is:

```
python -m pip install ./research-ide/mathscope-m3/p7/pari_runtime
python -c 'import mathscope_p7_pari; print(mathscope_p7_pari.binary_path())'
```

The build downloads the official PARI/GP 2.19.0 source over certificate-verified
HTTPS. It checks the exact 5,508,075-byte archive and SHA-256
`f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d`
before safe extraction. The official checksum is published at
<https://pari.math.u-bordeaux.fr/download.html>.

The recipe uses GCC and `make -j2`, a fixed release timestamp, no GMP, no readline,
and no database. Configure and compilation share a 600-second process budget;
the download stops after a 180-second deadline plus at most one 30-second socket
read and has an exact size limit. Build subprocess groups are terminated on
timeout, including compiler descendants. The wheel
is platform-specific. GP contains PARI statically and still uses Linux system
libraries. A fixed source recipe does not assert that different compilers or
platforms produce the same binary hash: the observed compiler, executable hash,
version output and raw build-log hashes are recorded in the installed sidecar
`mathscope-pari-build.json`.

For an already downloaded build cache, a build administrator may set
`MATHSCOPE_PARI_SOURCE_ARCHIVE=/absolute/path/pari-2.19.0.tar.gz`. The same size and
SHA checks apply; its sidecar truthfully records that TLS was not used during
that cached build. This variable is never accepted through computation requests.

Runtime discovery returns `mathscope_p7_pari.binary_path()`. P7 also accepts the
server-controlled environment variable `MATHSCOPE_PARI_GP` for an explicit
executable path, with the matching sidecar beside it. Missing executables,
altered bytes, missing source provenance or a different version are explicit
backend failures. No installation, network lookup or database-based rank
inference occurs while handling an arithmetic request.

The original GPL license files accompany the installed executable. Source
archives, wheels and executable files are build products, not repository files.
