"""Compile exact theta integrands of the recovered actual initialized field.

This is a source-bound spectral frontend, not a whole-K numerical evaluator.
No toy parameters, source overrides, private-seal reconstruction, or dropped
equal-frequency/cross-label terms are used. Scalar source references remain
bound to the pinned original graph, and missing numerical kernels fail closed.
"""
from __future__ import annotations
import argparse, hashlib, json, sys
from collections import Counter
from fractions import Fraction as Q
from functools import lru_cache
from pathlib import Path

BASE = 'analysis/base/PR30-primary67-continuation/'
PACKET = BASE+'pressure-proof/angular-pde/ANGULAR_PDE_SOURCE_V3.json'
HEADER = BASE+'pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
ANGULAR = BASE+'MathScopeCompute/research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json'
HELPER = 'analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015'
SUPPLEMENTS = [BASE+'pressure-proof/'+p for p in [
    'inputs/AUXILIARY_INVERSE0_SOURCE.json','inputs/PRIMARY_INDEXED_SOURCE.json',
    'inverse1/AUXILIARY_INVERSE1_SOURCE.json',
    'initialized-mean-independent/INDEPENDENT_SELECTED_SOURCE_BINDINGS.json']]+[
    BASE+'MathScopeCompute/research-ide/mathscope-m3/evidence/n6-continuation-20261015/run-38694948443/COMPACT_JET_PDE_SOURCE.json']

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,x): p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def require(x,message):
    if not x: raise ValueError(message)

class Compile:
    def __init__(self, nodes, definitions, children, native, native_definition):
        self.n=nodes; self.reg=definitions; self.children=children
        self.native=native; self.native_definition=native_definition
        self.theta=622806; self.arena=[]; self.keys={}
    def node(self,op,*args):
        k=json.dumps([op,args],sort_keys=True,separators=(',',':'))
        if k not in self.keys:
            self.keys[k]=len(self.arena);self.arena.append({'op':op,'args':list(args)})
        return self.keys[k]
    def ref(self,i):
        require(str(i) in self.n,'Absent input scalar root '+str(i))
        return self.node('actual_source_ref',i)
    def num(self,n):return self.node('integer',n)
    def add(self,*a):return self.node('add',*a)
    def mul(self,*a):return self.node('multiply',*a)
    def neg(self,a):return self.mul(self.num(-1),a)
    def square(self,a):return self.mul(a,a)
    def sub(self,a,b):return self.add(a,self.neg(b))
    @lru_cache(None)
    def depends(self,i):
        return i==self.theta or any(self.depends(j) for j in self.children(self.n[str(i)]))
    @lru_cache(None)
    def factor(self,i):
        """Exact Laurent monomial expansion of rational/product/inverse only."""
        n=self.n[str(i)];op=n['op'];a=n['args']
        if op=='rational':return Q(int(a[0]),int(a[1])),()
        if op=='multiply':
            c=Q(1);f=Counter()
            for j in a:
                cj,fj=self.factor(j);c*=cj;f.update(dict(fj))
            return c,tuple(sorted((k,v) for k,v in f.items() if v))
        if op=='inverse':
            c,f=self.factor(a[0]);return 1/c,tuple((k,-v) for k,v in f)
        return Q(1),((i,1),)
    def slope(self,i):
        if i==self.theta:return Q(1),()
        if not self.depends(i):return None
        n=self.n[str(i)];a=n['args']
        if n['op']=='add':
            rows=[self.slope(j) for j in a if self.depends(j)]
            require(len(rows)==1,'Multiple theta terms require polynomial merge')
            return rows[0]
        require(n['op']=='multiply','Non-affine actual theta dependence')
        dep=[j for j in a if self.depends(j)]
        require(len(dep)==1,'Nonlinear theta product')
        c,f=self.slope(dep[0]);f=Counter(dict(f))
        for j in a:
            if j==dep[0]:continue
            cj,fj=self.factor(j);c*=cj;f.update(dict(fj))
        return c,tuple(sorted((k,v) for k,v in f.items() if v))
    def angular_frequency(self,t):
        c,f=self.slope(t['phase']);ck,fk=self.factor(t['k'])
        f=Counter(dict(f));f.update(dict(fk));f={i:p for i,p in f.items() if p}
        require(c*ck==1 and len(f)==1,'Actual k*phase derivative did not cancel exactly')
        root,p=next(iter(f.items()));require(p==1,'Frequency is not one literal source root')
        n=self.n[str(root)];require(n['op']=='smooth_piecewise','Unexpected exact integer selector')
        x,left,right,before,middle,after=n['args']
        require(self.factor(left)==(Q(-1,2),()) and self.factor(right)==(Q(1,2),()),'Changed integer zero guard')
        require(before==after==x,'Changed integer selector exterior')
        cx,fx=self.factor(x);require(cx==-1 and len(fx)==1 and fx[0][1]==1,'Expected negative ceiling')
        require(self.n[str(fx[0][0])]['op']=='ceiling','Unproved integer frequency')
        md=self.n[str(middle)];require(md['op']=='smooth_piecewise','Expected nonzero interior choice')
        require(all(self.factor(j) in [(Q(-1),()),(Q(1),())] for j in md['args'][3:]),'Zero inside frequency guard')
        return root
    def conjugates(self,rows):
        pos=next(r for r in rows if r['m']==1);neg=next(r for r in rows if r['m']==-1)
        require(len(rows)==2,'Unexpected original angular modes')
        for x,y in zip(pos['velocity'],neg['velocity']):
            require(x['real']==y['real'],'Conjugate real component changed')
            cr,fr=self.factor(x['imaginary']);cn,fn=self.factor(y['imaginary'])
            require(fr==fn and cr==-cn,'Conjugate imaginary component changed')
            require(not self.depends(x['real']) and not self.depends(x['imaginary']),'Theta-dependent coefficient')
        return pos
    def compile_template(self,t):
        f=self.angular_frequency(t);p=self.conjugates(t['waveRows'])
        require(len(t['previous'])==1 and t['previous'][0]['m']==0,'Changed actual mean')
        mean=[self.ref(v['real']) for v in t['previous'][0]['velocity']]
        require(all(v['imaginary']==0 for v in t['previous'][0]['velocity']),'Nonreal mean')
        coeff=[(self.ref(v['real']),self.ref(v['imaginary'])) for v in p['velocity']]
        wave_norm=self.add(*(self.add(self.square(r),self.square(i)) for r,i in coeff))
        kinetic=self.add(*(self.square(v) for v in mean),self.mul(self.num(2),wave_norm))
        nr=self.ref(f)
        # Cylindrical connections retained: D_theta u=(du_r-u_theta,du_theta+u_r,du_z).
        (rr,ri),(tr,ti),(zr,zi)=coeff
        angular=[(self.sub(self.neg(self.mul(nr,ri)),tr),self.sub(self.mul(nr,rr),ti)),
                 (self.sub(rr,self.mul(nr,ti)),self.add(ri,self.mul(nr,tr))),
                 (self.neg(self.mul(nr,zi)),self.mul(nr,zr))]
        theta_numerator=self.add(self.square(mean[0]),self.square(mean[1]),self.mul(self.num(2),
            self.add(*(self.add(self.square(r),self.square(i)) for r,i in angular))))
        radius_root=t['lift']['geometry']['R'];radius=self.ref(radius_root)
        theta_gradient=self.mul(theta_numerator,self.node('inverse',self.square(radius)))
        return {'template':t['key'],'frequency_source_root':f,'source_k_root':t['k'],
            'source_phase_root':t['phase'],'source_coefficients':p['velocity'],
            'kinetic_mean_theta_root':kinetic,'cylindrical_angular_derivative_numerator_mean_theta_root':theta_numerator,
            'cylindrical_angular_gradient_mean_theta_root':theta_gradient,'source_radius_root':radius_root,
            'angular_gradient_metric':'The derivative numerator is divided by the actual normalized radius R^2. Formula on R>0; a continuous axis limit is not evaluated here.',
            'identity':'(2*pi)^-1 integral_0^(2*pi)|u|^2 dtheta = |actual mean|^2+2*sum_component |actual positive coefficient|^2',
            'scope':'One actual fixed-label chart with its complete current mean; normalized source coordinates. The physical energy measure and scale still must be applied.',
            'phase_materialized':False,'carrier_integer_materialized':False}

    def closure(self,roots):
        """Expand actual expression bodies, exposing exact unavailable boundaries."""
        stack=[(r,None) for r in roots];seen=set();missing={};native_calls={};ops=Counter();unimplemented={}
        while stack:
            i,parent=stack.pop()
            if i in seen:continue
            seen.add(i)
            if str(i) not in self.n:
                missing[i]=parent;continue
            node=self.n[str(i)];ops[node['op']]+=1
            stack.extend((j,{'node':i,'edge':'argument'}) for j in self.children(node))
            if node['op'] in self.native:
                key,d=self.native_definition(node,self.reg)
                native_calls[i]={'registry':key,'definition_sha256':hashlib.sha256(json.dumps(d,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}
                if 'body' in d and type(d['body']) is int:
                    stack.append((d['body'],{'node':i,'registry':key,'edge':'actual_native_body'}))
                else:
                    unimplemented[i]={'operation':node['op'],'registry':key,'definition_keys':sorted(d)}
        return {'visited_nodes':len(seen),'present_nodes':len(seen)-len(missing),'operations':dict(sorted(ops.items())),
            'missing_scalar_bodies':[{'root':i,'requested_by':v} for i,v in sorted(missing.items())],
            'native_calls':len(native_calls),'non_expression_native_kernels':[
                {'root':i,**v} for i,v in sorted(unimplemented.items())],
            'scalar_numeric_evaluation_complete':False,
            'reason':'Actual native body expansion was attempted against every recovered scalar record; missing original scalar records and non-expression native numerical kernels are explicit. No missing value is replaced by zero.'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path('.'));ap.add_argument('--output-dir',type=Path,required=True);args=ap.parse_args()
    root=args.root.resolve();out=args.output_dir.resolve();out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((root/'work/actual_evaluator/evidence/INPUT_MANIFEST.json').read_text())
    for row in manifest['files']:require(sha(root/row['path'])==row['sha256'],'Changed pinned input '+row['path'])
    sys.path.insert(0,str(root/HELPER));from native_domain_extract import argument_children,NATIVE,native_definition
    p=json.loads((root/PACKET).read_text());h=json.loads((root/HEADER).read_text());a=json.loads((root/ANGULAR).read_text());reg={}
    def registries(d):
        for k,v in d.items():
            if k=='base':registries(v)
            elif isinstance(v,str):
                try:reg[k]=json.loads(v)
                except ValueError:pass
    registries(h['definitions'])
    require(p['sourceHeaderSHA256']==sha(root/HEADER) and p['constructionSHA256']==sha(root/ANGULAR),'Source packet join failed')
    require(a['global']['velocity']==[3825006,3825007,3825008] and a['global']['pressure']==3825009,'Not accepted initial tuple')
    supplement_log=[]
    def merge(x,seen):
        if isinstance(x,dict):
            for k,v in x.items():
                if k.isdigit() and isinstance(v,dict) and set(v)=={'op','args'}:
                    require(k not in p['records'] or p['records'][k]==v,'Conflicting same-source scalar record '+k)
                    seen.add(k);p['records'][k]=v
                else:merge(v,seen)
        elif isinstance(x,list):
            for v in x:merge(v,seen)
    supplements=json.loads((root/'work/actual_evaluator/evidence/SAME_HEADER_SCALAR_SUPPLEMENTS.json').read_text())
    require(supplements['sourceHeaderSHA256']==sha(root/HEADER),'Supplement index header mismatch')
    for row in supplements['supplements']:
        path=row['path'];require(sha(root/path)==row['sha256'],'Changed supplementary scalar records')
        data=json.loads((root/path).read_text());seen=set();before=len(p['records'])
        require(data['sourceHeaderSHA256']==sha(root/HEADER),'Supplement from another graph')
        merge(data,seen)
        supplement_log.append({'path':path,'sha256':sha(root/path),'same_original_header':True,
            'scalar_records_checked':len(seen),'new_scalar_records':len(p['records'])-before})
    c=Compile(p['records'],reg,argument_children,NATIVE,native_definition)
    rows=[c.compile_template(t) for t in a['templates']]
    roots=sorted({v[part] for t in a['templates'] for r in t['waveRows'] for v in r['velocity'] for part in ('real','imaginary')}|set(a['reference']['normalizedMeanVelocity']))
    closure=c.closure(roots)
    controls={}
    altered=json.loads(json.dumps(a['templates'][0]));altered['waveRows'][1]['velocity'][0]['imaginary']=altered['waveRows'][0]['velocity'][0]['imaginary']
    try:c.compile_template(altered);controls['wrong_conjugate_rejected']=False
    except ValueError:controls['wrong_conjugate_rejected']=True
    altered=json.loads(json.dumps(a['templates'][0]));altered['k']=1
    try:c.compile_template(altered);controls['wrong_carrier_rejected']=False
    except ValueError:controls['wrong_carrier_rejected']=True
    require(all(controls.values()),'Negative source controls failed')
    result={'schema':'MathScope.ActualInitializedAngularEnergyFrontend/1','source_header_sha256':sha(root/HEADER),
        'source_construction_sha256':sha(root/ANGULAR),'source_packet_sha256':sha(root/PACKET),
        'same_graph_supplements':supplement_log,'combined_scalar_records':len(p['records']),
        'actual_initial_tuple':{'velocity':a['global']['velocity'],'pressure':a['global']['pressure']},
        'templates':rows,'expression_arena':c.arena,'literal_theta_integration':True,
        'scope':'Actual initial finite-label kinetic/angular-gradient integrands only. No final localization/correction stages are substituted by this initial field.',
        'cross_label_rule':'These ten templates must NOT be summed as independent global modes. The accepted 162 actual signed cover rows and their exact support joins must be applied. Equal-frequency surviving labels must be combined before squaring; cross terms cannot be discarded merely because template keys differ.',
        'source_cover_all_cross_label_products_vanish':a['application']['sourceCover']['allCrossLabelProductsVanish'],
        'numeric_coefficient_closure_attempt':closure,'negative_controls':controls,
        'whole_K_energy_integrated':False,'independent_space_time_tables':None,
        'four_axis_refinement_table':None,'actual_last_resolved_tau':None,
        'final_field_evaluator_complete':False,'N706_closed':False,'N805_closed':False}
    dump(out/'ACTUAL_ANGULAR_ENERGY_FRONTEND.json',result)
    print(json.dumps({'templates':len(rows),'expression_nodes':len(c.arena),'closure_present_nodes':closure['present_nodes'],
        'missing_native_body_records':len(closure['missing_scalar_bodies']),'native_kernel_frontiers':len(closure['non_expression_native_kernels']),
        'negative_controls':controls,'N706_closed':False,'N805_closed':False}))

if __name__=='__main__':main()
