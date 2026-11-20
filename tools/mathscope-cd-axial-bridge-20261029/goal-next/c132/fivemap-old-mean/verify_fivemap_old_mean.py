"""Replay the original initialized mean inputs of the first FiveMap time derivative."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path

p=ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","frontier","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()
base=a.goal/"c129/temporal-old-mean/verify_temporal_old_mean.py"
raw=base.read_bytes()
assert sha256(raw).hexdigest()=="d5fc84f53a9c2030c5cd5a92aae8b7ca120aa80853fc1b6d58eb0de043328593"
body=raw.decode()
for old,new in (
    ("d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332",
     "f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7"),
    ('frontier["combinedOldMean"]','frontier["sourceRequestCensus"]["initializedMean"]'),
    ('frontier["combinedOldNotInPinnedReceipts"]','frontier["sourceRequestCensus"]["initializedMeanOutsideC129"]'),
    ('==172','==266'),('==24','==104'),
    ('"requiredCount":172','"requiredCount":266'),('"additionalAgainstPriorFrontierPins":24','"additionalAgainstPriorFrontierPins":104'),
    ('MathScope.C129.LateTemporalVelocityInitializedMeanInputs','MathScope.C132.FiveMapVelocityTimeInitializedMeanInputs'),
    ('The complete late velocity, the FiveMap correction and final jet tests require separate evidence.',
     'The fresh P, Jz and Jtheta time moments, FiveMap correction and final jet tests require separate evidence.'),
    ('PASS all 172 original mean requests, 24 beyond earlier pins','PASS all 266 original FiveMap time mean requests, 104 beyond earlier pins'),
):
    assert old in body, old
    body=body.replace(old,new)
exec(compile(body,str(base),"exec"),{"__name__":"_fivemap_old_mean"})
