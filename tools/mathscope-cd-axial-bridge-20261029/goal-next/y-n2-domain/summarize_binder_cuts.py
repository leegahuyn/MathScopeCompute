from os import environ
import hashlib,json,collections
from pathlib import Path
p=Path(environ["MATHSCOPE_N2_REACHED"]); r=Path(environ["MATHSCOPE_N2_REGISTRY"]); g=p.read_bytes(); b=r.read_bytes(); assert hashlib.sha256(g).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32' and hashlib.sha256(b).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'
n=dict(json.loads(g)['nodes']); cuts=json.loads(Path(Path(__file__).resolve().with_name('binder-cuts.json')).read_text());assert len(cuts)==182 and sum(c['count'] for c in cuts)==610 and all(c['targetsReachedAfterCut']==0 for c in cuts)
groups=collections.defaultdict(lambda:{'binders':0,'calls':0})
for c in cuts:
 name=n[c['binder']]['args'][0]; key='physical_norm_face' if name.startswith('physical_norm_face') else ('n2_n3_stress' if name.startswith(('n2_stress','n3_stress')) else 'local_integral')
 groups[key]['binders']+=1;groups[key]['calls']+=c['count']
out={'N2_reached_sha256':hashlib.sha256(g).hexdigest(),'registry_sha256':hashlib.sha256(b).hexdigest(),'binder_count':len(cuts),'calls':sum(c['count'] for c in cuts),'all_calls_unreachable_when_all_matching_binder_bodies_cut':True,'groups':groups,'scope':'Structural conservative reachability only. Exact sign and frame transport, including simultaneous substitution, endpoints and derivatives, must still be shown; this is not an all-domain proof.'}
Path(Path(__file__).resolve().with_name('binder-summary.json')).write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out,indent=2))
