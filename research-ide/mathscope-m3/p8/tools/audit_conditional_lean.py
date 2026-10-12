#!/usr/bin/env python3
"""Separate CI experiment: a literal-goal axiom, then actual source removal.

Never emits the unconditional LeanAudit schema or claims an independent proof.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
import re
import sys

from audit_lean import command, sha, canonical, imports

AXIOM="MathScope.P8.Conditional.assumedTarget"
TARGET="MathScope.P8.Conditional.conditional_target"
AXIOM_LINE="axiom assumedTarget : (2 : Nat) + 2 = 4\n"

def remove_assumption(source):
    if source.count(AXIOM_LINE)!=1:raise ValueError("The exact declared axiom line must occur once")
    result=source.replace(AXIOM_LINE,"")
    if "theorem conditional_target : (2 : Nat) + 2 = 4 := assumedTarget" not in result:
        raise ValueError("The consuming proof must remain unchanged after removal")
    return result

def parse_conditional(log):
    matches=list(re.finditer(r"^P8_CONDITIONAL_BEGIN ([\w.]+)\r?\n(.*?)^P8_CONDITIONAL_END \1\r?$",log,re.M|re.S))
    if [m[1] for m in matches]!=[AXIOM,TARGET]:raise ValueError("Missing or duplicated conditional declarations")
    leftover=log
    for m in reversed(matches):leftover=leftover[:m.start()]+leftover[m.end():]
    if leftover.strip():raise ValueError("Unexpected conditional audit output")
    rows=[]
    for m in matches:
        match=re.fullmatch(r"(.+?)\n'"+re.escape(m[1])+r"' depends on axioms:\s*\[([^]]*)\]",m[2].strip(),re.S)
        if not match:raise ValueError("Conditional axiom report missing")
        statement=match[1].strip();axioms=[x.strip() for x in match[2].split(',')]
        if not statement.startswith(m[1]+" :") or axioms!=[AXIOM]:raise ValueError("Unexpected target type or custom axiom set")
        rows.append({"name":m[1],"type":statement,"typeSha256":sha(statement.encode()),"axioms":{"all":[AXIOM],"standard":[],"custom":[AXIOM]}})
    if rows[0]["type"].split(" :",1)[1]!=rows[1]["type"].split(" :",1)[1]:
        raise ValueError("The assumed proposition is not the literal target")
    return rows

def expected_removal_rejection(log,exit_code):
    # A failed process or missing import cannot masquerade as assumption removal.
    errors=[line for line in log.splitlines() if ": error:" in line]
    return exit_code>0 and len(errors)==1 and "RemovedAssumption.lean:" in errors[0] and bool(re.search(r"error: Unknown (?:identifier|constant) [`'](?:MathScope\.P8\.Conditional\.)?assumedTarget[`']",errors[0]))

def closure(lean,lean_root):
    source_roots=[lean/"conditional",lean_root/"src/lean"]
    artifact_roots=[lean/".lake/build/lib/lean",lean_root/"lib/lean"]
    pending=["ConditionalTarget"];seen={}
    while pending:
        name=pending.pop()
        if name in seen:continue
        rel=Path(*name.split('.'))
        source=next(((p/rel).with_suffix('.lean') for p in source_roots if (p/rel).with_suffix('.lean').is_file()),None)
        artifact=next(((p/rel).with_suffix('.olean') for p in artifact_roots if (p/rel).with_suffix('.olean').is_file()),None)
        if not source or not artifact:raise ValueError("Conditional import closure unresolved: "+name)
        try:imported=imports(source.read_text(encoding='utf-8'))
        except ValueError as exc:raise ValueError(f'Conditional import header parse failed for {name} ({source}): {exc}') from exc
        compiled=[]
        for ext in ['.olean','.olean.private','.ir']:
            file=artifact.with_suffix(ext)
            if file.is_file():compiled.append({'kind':ext,'sha256':sha(file.read_bytes())})
        seen[name]={'module':name,'sourceSha256':sha(source.read_bytes()),'imports':imported,'compiledArtifacts':compiled}
        pending.extend(x for x in imported if x!=name)
    return {'modules':[seen[k] for k in sorted(seen)],'unresolved':[],'rootModule':'ConditionalTarget','unconditionalFiniteModulesImported':False}

def source_manifest(base):
    paths=[base/'lean/conditional/ConditionalTarget.lean',base/'lean/conditional/Audit.lean',base/'tools/audit_conditional_lean.py',base/'tools/audit_lean.py',base/'lean/pins.json',base/'lean/lean-toolchain',base/'lean/lakefile.lean']
    return [{'path':str(p.relative_to(base)).replace('\\','/'),'sha256':sha(p.read_bytes())} for p in paths]

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);args=parser.parse_args()
    base=Path(__file__).resolve().parents[1];lean=base/'lean';output=(args.output or base/'evidence/conditional-lean-audit').resolve();output.mkdir(parents=True,exist_ok=True)
    result={'schema':'MathScope.M3.P8.ConditionalLeanAudit/1','status':'FAILED','proofGrade':'CONDITIONAL_ON_TARGET','independentTargetProved':False,'unconditionalFiniteAudit':False,'serializedAuthority':'UNTRUSTED_REQUIRES_REEXECUTION','formalLeanProofIssued':False,'wholeP8Complete':False,'wholeM3Complete':False,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat()}
    try:
        before=source_manifest(base);pins=json.loads((lean/'pins.json').read_text(encoding='utf-8'))
        original=(lean/'conditional/ConditionalTarget.lean').read_text(encoding='utf-8');removed=remove_assumption(original)
        _,version=command(['lake','env','lean','--version'],lean,output,'lean-version')
        if pins['leanCommit'][:12] not in version or not re.search(r'version\s+'+re.escape(pins['leanVersion'])+r'(?:\D|$)',version):raise ValueError('Unexpected Lean pin')
        _,prefix=command(['lake','env','lean','--print-prefix'],lean,output,'lean-prefix');lean_root=Path(prefix.strip())
        _,commit=command(['git','rev-parse','HEAD'],lean/'.lake/packages/mathlib',output,'mathlib-commit')
        if commit.strip()!=pins['mathlibCommit']:raise ValueError('Unexpected mathlib pin')
        compiled=lean/'.lake/build/lib/lean/ConditionalTarget.olean';compiled.parent.mkdir(parents=True,exist_ok=True)
        build,_=command(['lake','env','lean','--root=conditional','-o',str(compiled),'conditional/ConditionalTarget.lean'],lean,output,'conditional-positive')
        fresh,log=command(['lake','env','lean','--root=conditional','conditional/Audit.lean'],lean,output,'conditional-fresh-import')
        targets=parse_conditional(log)
        removed_path=output/'RemovedAssumption.lean';removed_path.write_text(removed,encoding='utf-8',newline='\n')
        rejection,rejection_log=command(['lake','env','lean',str(removed_path)],lean,output,'removed-assumption',check=False)
        if not expected_removal_rejection(rejection_log,rejection['exitCode']):raise ValueError('Axiom removal did not yield the single expected unknown-assumption diagnostic')
        import_closure=closure(lean,lean_root);closure_bytes=canonical(import_closure)+b'\n';(output/'import-closure.json').write_bytes(closure_bytes)
        if before!=source_manifest(base):raise ValueError('Conditional sources changed during execution')
        env={'leanVersion':version.strip(),'leanCommit':pins['leanCommit'],'mathlibCommit':commit.strip(),'leanBinarySha256':sha((lean_root/'bin/lean').read_bytes()),'runtimeLibrarySha256':sha((lean_root/'lib/lean/libleanshared.so').read_bytes()),'importClosureSha256':sha(closure_bytes),'importedModuleCount':len(import_closure['modules']),'kernelModified':False,'runtimeModified':False}
        result.update(status='CONDITIONAL_SOURCE_CHECKED_AND_REMOVAL_REJECTED',sourceFiles=before,sourceManifestSha256=sha(canonical(before)),environment=env,targets=targets,axiomLedger={'target':TARGET,'assumption':AXIOM,'sameLiteralProposition':True,'customAxioms':[AXIOM],'standardAxioms':[],'status':'CONDITIONAL_ON_TARGET'},build=build,consumerAudit=fresh,positiveOleanSha256=sha(compiled.read_bytes()),removal={'sourceRegenerated':True,'sourceFile':'RemovedAssumption.lean','sourceSha256':sha(removed_path.read_bytes()),'transformation':'Delete exactly the declared axiom line; preserve consuming theorem and its proof.','expectedRejected':True,'rejected':True,'expectedDiagnostic':'Unknown identifier assumedTarget','commandResult':rejection})
    except Exception as exc:result['error']={'type':type(exc).__name__,'message':str(exc)}
    (output/'audit.json').write_bytes(json.dumps(result,ensure_ascii=False,indent=2).encode()+b'\n');print(result['status'])
    if result['status']=='FAILED':print(result.get('error'),file=sys.stderr);raise SystemExit(1)

if __name__=='__main__':main()
