"""Create a diagnostic runtime with one enlarged primitive-identity visit budget."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import shutil


REL = Path("research-ide/mathscope-m2/navier/actual-global-primitive-kernels.mjs")
ORIGINAL = "efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59"
DIAGNOSTIC = "dd43ece92cc3f2ca4aa9555770552238dc385fe00f680204ffb5c7cb83a10ab3"
BEFORE, AFTER = b"maxVisits=300000", b"maxVisits=1200000"


def main():
    cli = ArgumentParser(description=__doc__)
    for name in ("runtime", "diagnostic", "out"):
        cli.add_argument("--"+name,type=Path,required=True)
    a = cli.parse_args()
    source = a.runtime/REL
    current = source.read_bytes()
    assert sha256(current).hexdigest() == ORIGINAL and current.count(BEFORE) == 1
    output = current.replace(BEFORE, AFTER)
    assert output.replace(AFTER, BEFORE) == current
    assert sha256(output).hexdigest() == DIAGNOSTIC
    if not a.diagnostic.exists():
        shutil.copytree(a.runtime, a.diagnostic)
        target=a.diagnostic/REL
        target.write_bytes(output)
    else:
        target=a.diagnostic/REL
    assert target.read_bytes() == output
    src_files={f.relative_to(a.runtime):sha256(f.read_bytes()).hexdigest()
               for f in a.runtime.rglob("*") if f.is_file()}
    target_files={f.relative_to(a.diagnostic):sha256(f.read_bytes()).hexdigest()
                  for f in a.diagnostic.rglob("*") if f.is_file()}
    assert src_files[REL] == ORIGINAL
    src_files[REL]=DIAGNOSTIC
    assert src_files == target_files
    receipt={"schema":"MathScope.C101.FiniteAxialDiagnosticBudgetOnly/1","sourceRuntimeFiles":len(src_files),
             "singleChangedPath":REL.as_posix(),"originalSHA256":ORIGINAL,"diagnosticSHA256":DIAGNOSTIC,
             "originalMaxVisits":300000,"diagnosticMaxVisits":1200000,
             "context":"The source-issuer module, its historical prefix, arithmetic, and graph validation are byte-identical."}
    a.out.write_bytes((json.dumps(receipt,indent=2)+"\n").encode())
    print("PASS isolated replay runtime differs by one visit limit literal only")


if __name__=="__main__":
    assert __debug__
    main()
