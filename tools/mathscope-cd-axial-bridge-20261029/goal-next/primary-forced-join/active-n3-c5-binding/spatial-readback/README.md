# Independent active-N3 spatial source readback

This Python reader targets the frozen GitHub job 44553053960 and commit
`6adb862667b0ce0e627843b253d6d94673a35164`. The run must finish before
a terminal artifact is interpreted. Supply independently downloaded
`gh run view --json databaseId,headSha,status,conclusion` output as
`--run-json`, together with the extracted run artifact. The commands
below write fresh output paths and read the source evidence.

~~~text
python -B verify_spatial_artifact.py --artifact NEW_JOB_ARTIFACT --run-json NEW_JOB_METADATA \
  --reference PINNED_44528954587_FIRST_CYCLE_JSON \
  --prior-compact PRIOR_44541601028_ARTIFACT --scratch WRITABLE_SCRATCH --out NEW_READBACK_JSON
~~~

All six original construction stages and the four direct/split root
IDs must match the pinned original receipt after omitting process RSS
only. The independent rational direct/split result remains separate from
the gauge comparison. The five-point guards, own/reference scaling,
registry definitions and same-owner component associations are checked
against the complete exported source tree rather than the new receipt
alone.

Use `--retry` with the authenticated artifact and run JSON for
[44568520276](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44568520276),
commit `b26c8d8bd30a94540669791991795bea01535dbf`. The complete
retry also checks both original Corollary 8.5 stress applications directly
in the official node stream and coupled registry. Their registration
identifiers differ. The defining body, formal parameter list, actual
argument list and derivative orders must agree.

The full source case verifies the original manifest, gzip stream
header, uncompressed SHA-256, exact bytes, count, operations histogram,
and extended registry SHA-256, shapes and sizes. A disk spool with
64-bit offsets permits targeted exact root readback without allocating
an object for every node. The spool is a temporary uncompressed stream
and needs free disk space of at least the manifest's
`node_stream_uncompressed_bytes`. The user-provided scratch location or
output directory hosts it. The prefix record hash excludes the new
header's total node count.

- The three value roots and nine first derivative roots for each field
  group are checked in the exported root inventory. All 33 original
  spatial jet labels and their \(Q\)-powers are checked.
- The uncut roots use the original post-Five velocity minus the earlier
  initialized velocity with its original angular field. The complete
  original first Forced and Signed 162 row maps and both physical signs
  are checked against the three new gauge fields and 12 appended
  own/reference expression definitions.
- Positive Forced and Signed source potential coefficients, true
  \(Q^{1/2-A}\) potential factor, native radial and axial pullbacks,
  angle connection, source Temporal inverse, exact shifted T1
  integral pair, and original FiveMap raw and separate compact operands
  are checked.
- Each gauge difference retains the same source uncut velocity and the
  candidate curl plus direct swirl. The candidate curl's three terms
  agree with the stored covariant-gradient assembly. The gauge
  difference itself remains OPEN, as do uniform source enclosures,
  N7-06, N8-05 and all 67 final jets.

The optional `--prior-compact` uses the exact older hosted closure
with SHA-256 `51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a`.
All saved pre-append record IDs must match. With
`--preappend-export`, the entire independently archived old source
node prefix and nested original native registry must match. Omitting a
complete predecessor emits an explicit scope field. The main output
also records whether the same run's pre-append arithmetic snapshot
matches the exported prefix.

Partial modes distinguish a missing or stopped first cycle, an original
cycle with no spatial receipt, and a spatial ingress receipt with
missing official source files. Hash or structural mismatches are
errors. Complete source verification never marks a numerical endpoint,
gauge equivalence, or a release gate.

## Controls and limits

The exact earlier N1 artifact is the full 4,456,994-node export from
GitHub job 43010593847. An archived control first validates the same
official exporter format and its pinned extended registry. Then the
actual older Temporal/FiveMap and mixed-reference roots exercise the
same structural reader. Synthetic intake controls alter one recorded
multiplicative factor or source input at a time and test incomplete
artifacts. These controls do not substitute for a positive active-N3
replay.

~~~text
python -B verify_spatial_artifact.py --archive-control --artifact OLD_REAL_N1_GRAPH --out ARCHIVE_CONTROL_JSON
python -B check_readback_controls.py --goal GOAL_NEXT --archive OLD_REAL_N1_GRAPH \
  --reference PINNED_44528954587_FIRST_CYCLE_JSON --out CONTROLS_JSON
~~~
