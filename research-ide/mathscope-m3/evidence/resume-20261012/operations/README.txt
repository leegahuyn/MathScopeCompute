These are the operational scripts used for this release. They do not form part of the numerical source binding.

refresh_release_manifest.py accepts --repo with the MathScopeCompute checkout path, --working-tree, and --write. New files must be staged first. Changed existing artifacts need an exact --allow-change research-ide-relative path. It preserves all inherited mathematical sources and evidence, and does not replace the full CI verifier.

verify_public_p7.py records a live HTTP run and fresh replay against the existing production service. Its production output directory is write-once; the saved successful evidence is already present. For a later attempt, explicitly select a new output directory after reviewing the target and source baseline.
