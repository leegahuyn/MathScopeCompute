"""Keep the source-pinned historical runner through its private Forced seal."""
import hashlib
from pathlib import Path
import sys

runner, helper = map(Path, sys.argv[1:])
data = runner.read_bytes()
blob = b"blob " + str(len(data)).encode() + b"\0" + data
assert hashlib.sha1(blob).hexdigest() == "690e1f7a842bafcfcfb768093b8a777656f8ce0d"
source = data.decode()
seal = " receipt.real_original_forced_seal_issued=true;save();"
failure = "}catch(e){receipt.error="
assert source.count(seal) == source.count(failure) == 1
prefix, remainder = source.split(seal)
suffix = failure + remainder.split(failure)[1]
stage = """
 receipt.stage='FIRST_FORCED_EXACT_INPUT_AND_DAG';save();bound();
 receipt.corrected_first_force=await recordCorrectedFirstForce({
   rawGraph:G,initial,forced,dir:process.env.M3_SOURCE_GRAPH_EXPORT_DIR,
   commit:process.env.GITHUB_SHA,pr30Commit:receipt.expected_base_commit
 });
 receipt.stage='CORRECTED_FIRST_FORCED_SOURCE_CAPTURED';
 receipt.status='CORRECTED_FIRST_FORCE_VERIFIED';save();
"""
import_line = "import {recordCorrectedFirstForce} from './record_corrected_first_force.mjs';"
source = prefix.replace("import fs from 'node:fs';", "import fs from 'node:fs';\n" + import_line)
runner.with_name("run_repaired_first_force.mjs").write_text(source + seal + stage + suffix)
runner.with_name(helper.name).write_bytes(helper.read_bytes())
