"""Prepare the historical downstream runner for the two exact repair overlays."""
from argparse import ArgumentParser
import hashlib
from pathlib import Path


def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def replace_one(source, old, new):
    assert source.count(old) == 1, old
    return source.replace(old, new)


parser = ArgumentParser(description=__doc__)
parser.add_argument("navier", type=Path)
parser.add_argument("runner", type=Path)
parser.add_argument("--repeat-recorder", type=Path)
args = parser.parse_args()
navier, runner = args.navier, args.runner
pins = navier / "source-signed-162-pr30-pins.mjs"
source = pins.read_text(encoding="utf-8")
changes = {
    "source-initialized-angular.mjs": (
        "69d9311f93e10e176a53f67958f7bd56e0a5691d", "5270ae0792718cbc475c9e7249f7cb4e8f0309c6"),
    "source-global-forced-current.mjs": (
        "03c3e125d93a5bd9e66d00c5f237b100c7b48b50", "1a8d1968b1825de477960cd59b3a0420c72ba4e3"),
}
for name, (original, repaired) in changes.items():
    assert blob_sha((navier / name).read_bytes()) == repaired
    source = replace_one(source, f"navier/{name}':'{original}'", f"navier/{name}':'{repaired}'")
source = replace_one(source, "schema:'MathScope.N6.PR30ExactSourceBytes/1'",
    "schema:'MathScope.N6.PR30WithCorrectedFirstForceExactSourceBytes/1'")
source = replace_one(source, "originalSourceBytesChecked:true,",
    "originalSourceBytesChecked:false,verifiedUnchangedPR30Files:27,verifiedPinnedRepairFiles:2,")
pins.write_text(source, encoding="utf-8", newline="\n")

data = runner.read_bytes()
assert blob_sha(data) == "690e1f7a842bafcfcfb768093b8a777656f8ce0d"
source = data.decode()
source = replace_one(source, "schema:'MathScope.M3.SourceBoundOriginalPipeline/1',",
    "schema:'MathScope.M3.SourceBoundCorrectedFirstCyclePipeline/1',")
source = replace_one(source, "ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p",
    "CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT")
source = replace_one(source, " receipt.real_original_signed162_seal_issued=true;",
    """ if(signed.source.sourceBytePins.verifiedPinnedRepairFiles!==2 ||
    signed.source.sourceBytePins.verifiedUnchangedPR30Files!==27)
   throw Error('Signed used the wrong exact source byte inventory');
 receipt.corrected_first_cycle_source_byte_pins=signed.source.sourceBytePins;
 receipt.real_original_signed162_seal_issued=true;""")
if args.repeat_recorder is not None:
    assert args.repeat_recorder.name == "record_repeat_forced.mjs"
    runner.with_name(args.repeat_recorder.name).write_bytes(args.repeat_recorder.read_bytes())
    end = " receipt.stage='FOUR_STAGE_ITERATION_ALL_ORDER_ESTIMATES_AND_FINAL67_NUMERIC_OPEN';"
    source = replace_one(source, end, """
 const {recordPostFiveRepeatForced}=await import('./record_repeat_forced.mjs');
 receipt.repeat_forced_candidate=await stage('post_five_repeat_forced_candidate',()=>{
   global.gc?.();
   return recordPostFiveRepeatForced({rawGraph:G,full:actualFull3D,context,
     dir:process.env.M3_REPEAT_GRAPH_EXPORT_DIR,commit:process.env.GITHUB_SHA,
     pr30Commit:receipt.expected_base_commit});
 });
 save();
""" + end)
runner.with_name("run_repaired_full_cycle.mjs").write_text(source, encoding="utf-8", newline="\n")
