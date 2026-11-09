"""Independent adversarial checks, mutating only an in-memory temporary copy."""
from pathlib import Path
import subprocess,sys,tempfile,json

here=Path(__file__).resolve().parent
script=(here/'check_source_row.py').read_text(encoding='utf8')
marker=" eta,xi,H,F0,U0,v0,Ux,Ueta,Omega,Visc=s.symbols("
assert script.count(marker)==1
cases={'picard_coefficient_25811':25811,'raw_viscosity_117030':117030}
source=here.parent/'delivery'/'inputs'/'graph'
result={}
for name,node in cases.items():
    modified=script.replace(marker,f" d[{node}]={{'op':'rational','args':['0','1']}} # INJECTED TEST MUTATION\n"+marker)
    with tempfile.TemporaryDirectory(prefix='row5-mutation-',dir=here) as tmp:
        p=Path(tmp)/'checker.py';p.write_text(modified,encoding='utf8')
        proc=subprocess.run([sys.executable,str(p),'--source',str(source),'--out',str(Path(tmp)/'result.json')],capture_output=True,text=True)
    assert proc.returncode!=0,(name,proc.stdout,proc.stderr)
    assert 'AssertionError' in proc.stderr,(name,proc.stderr)
    result[name]={'changed_node':node,'exit_code':proc.returncode,'assertion_rejected':True,'stderr_last_lines':proc.stderr.splitlines()[-5:]}
print(json.dumps(result,indent=2))
(here/'audit-mutations.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
