"""Independent adversarial checks, mutating only an in-memory temporary copy."""
from pathlib import Path
import argparse,hashlib,subprocess,sys,tempfile,json

if not __debug__:
    raise RuntimeError('Optimized Python disables required integrity assertions')

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True,help='Authenticated original graph directory')
parser.add_argument('--out',type=Path)
args=parser.parse_args()

here=Path(__file__).resolve().parent
script=(here/'check_source_row.py').read_text(encoding='utf8')
marker=" eta,xi,H,F0,U0,v0,Ux,Ueta,Omega,Visc=s.symbols("
assert script.count(marker)==1
cases={'picard_coefficient_25811':(25811,'assert rows0==[0]*6'),
       'raw_viscosity_117030':(117030,'assert raw_residuals==[0]*8')}
source=args.source.resolve()
result={}
for name,(node,expected_assertion) in cases.items():
    modified=script.replace(marker,f" d[{node}]={{'op':'rational','args':['0','1']}} # INJECTED TEST MUTATION\n"+marker)
    with tempfile.TemporaryDirectory(prefix='row5-mutation-',dir=here) as tmp:
        p=Path(tmp)/'checker.py';p.write_text(modified,encoding='utf8')
        proc=subprocess.run([sys.executable,str(p),'--source',str(source),'--out',str(Path(tmp)/'result.json')],capture_output=True,text=True)
    assert proc.returncode!=0,(name,proc.stdout,proc.stderr)
    assert 'AssertionError' in proc.stderr and expected_assertion in proc.stderr,(name,proc.stderr)
    result[name]={'changed_node':node,'exit_code':proc.returncode,'assertion_rejected':True,
      'expected_assertion':expected_assertion,'stderr_last_lines':proc.stderr.splitlines()[-5:]}
record={'status':'PASS_NEGATIVE_CONTROLS','checker_sha256':hashlib.sha256((here/'check_source_row.py').read_bytes()).hexdigest(),
 'scope':'Inject test mutations into an in-memory copy AFTER graph authentication; original files unchanged','cases':result}
print(json.dumps(record,indent=2))
out=args.out or here/'audit-mutations.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(record,indent=2)+'\n',encoding='utf8')
