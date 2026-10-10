"""Independent Python/complex-number plaquette oracle; no JS matrix code is reused."""
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent

def matrix(raw):
    n=raw['n']
    return [[complex(raw['re'][i*n+j],raw['im'][i*n+j]) for j in range(n)] for i in range(n)]

def multiply(a,b):
    return [[sum(x*y for x,y in zip(row,col)) for col in zip(*b)] for row in a]

def adjoint(a):
    return [[x.conjugate() for x in col] for col in zip(*a)]

def trace(a):
    return sum(a[i][i] for i in range(len(a)))

def independent(fixture,wrong_orientation=False):
    l=fixture['lattice'];ns=l['Ns'];nt=l['Nt'];n=fixture['model']['action']['dimension'];beta=fixture['model']['action']['beta']
    sizes=[ns,ns,ns,nt];bcs=[l['spatialBoundary']]*3+[l['temporalBoundary']]
    links=[matrix(x) if x else None for x in fixture['links']]
    def to_index(p):
        return ((p[3]*ns+p[2])*ns+p[1])*ns+p[0]
    def neighbour(p,axis):
        q=p.copy();q[axis]+=1
        if q[axis]==sizes[axis]:
            if bcs[axis]=='OPEN':
                return None
            q[axis]=0
        return q
    total=0;traces=[]
    for t in range(nt):
        for z in range(ns):
            for y in range(ns):
                for x in range(ns):
                    p=[x,y,z,t];s=to_index(p)
                    for mu in range(4):
                        for nu in range(mu+1,4):
                            pm=neighbour(p,mu);pn=neighbour(p,nu)
                            if pm is None or pn is None:
                                continue
                            a=links[4*s+mu];b=links[4*to_index(pm)+nu];c=links[4*to_index(pn)+mu];d=links[4*s+nu]
                            u=multiply(multiply(multiply(a,b),c if wrong_orientation else adjoint(c)),adjoint(d))
                            tr=trace(u).real/n;traces.append(tr)
                            coefficient=beta*((l['as']/l['at']) if nu==3 else (l['at']/l['as']))
                            total+=coefficient*(1-tr)
    return {'action':total,'meanPlaquette':sum(traces)/len(traces),'plaquetteCount':len(traces)}

def main():
    fixtures=json.loads((ROOT/'evidence/independent-lattice-fixtures.json').read_text())
    checks=[]
    for f in fixtures:
        result=independent(f)
        action_error=abs(result['action']-f['action'])
        trace_error=abs(result['meanPlaquette']-f['meanPlaquette'])
        assert action_error<1e-10,(f['id'],action_error)
        assert trace_error<1e-12,(f['id'],trace_error)
        checks.append({'id':f['id'],'group':f['model']['group'],'plaquettes':result['plaquetteCount'],'independentAction':result['action'],'actionAbsoluteError':action_error,'meanTraceAbsoluteError':trace_error})
    nontrivial=next(f for f in fixtures if f['id']=='m2-g2-wilson-lattice')
    wrong=independent(nontrivial,wrong_orientation=True)
    negative_difference=abs(wrong['action']-nontrivial['action'])
    assert negative_difference>1e-3,'Missing inverse must not pass the independent nonabelian fixture.'
    output={'schema':'MathScope.M2.GaugeIndependentValidation/1','runtime':'Python standard library complex arithmetic','checks':checks,'negativeControl':{'mutation':'third plaquette factor inverse omitted','actionDifference':negative_difference,'rejected':True},'passed':True}
    (ROOT/'evidence/independent-validation.json').write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({'passed':True,'fixtures':len(checks),'maximumActionError':max(x['actionAbsoluteError'] for x in checks),'negativeControlDifference':negative_difference}))

if __name__=='__main__':
    main()
