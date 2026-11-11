"""Exact source-bound local interval transfer for all original annular slow atoms."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
import json
import subprocess
import sys

from sympy import Poly, Rational, factor, together

HERE=Path(__file__).resolve().parent
NEXT=HERE.parent
sys.path[:0]=[str(NEXT/'whole-k-core-jet-bounds'),str(NEXT/'whole-k-center-n3')]
from check_strict_core_jet_bounds import (
    Y,eta,h,ATOMS,CHART,ENDPOINT,HIGH,WEIGHTS,FIELDS,ZERO,interval,need,
    operator,pinned,source_leading,validated_bounds,verify_chart_operators)
from check_endpoint_third import IMPORT,git_blob

COMMIT='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
M2='research-ide/mathscope-m2/navier/'
LEADING_SOURCE=M2+'actual-leading-enlarged-c2.mjs'
LEADING_BLOB='fd6cde8281b2a9d76d6912db6171a04048b1c0ce'
LEADING='48b451ef4a8d95af26a5658dfd9245fb6aa955e79fc43198092644ee39466c74'
ENVELOPE='68c70a831a219b9fbf5e6202c55c8f6f27c7bca252aab3669c6125054e392117'
STRESS3='26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7'


def runtime_pins(root,repo):
    todo,found=[LEADING_SOURCE],{}
    while todo:
        name=todo.pop()
        if name in found:
            continue
        path=root/name
        raw=path.read_bytes()
        found[name]=git_blob(raw)
        for imp in IMPORT.findall(raw):
            todo.append((path.parent/imp.decode()).resolve().relative_to(root).as_posix())
    command=['git','-C',str(repo),'ls-tree','-z',COMMIT,'--',*sorted(found)]
    readback={}
    for row in subprocess.check_output(command).rstrip(b'\0').split(b'\0'):
        meta,name=row.split(b'\t',1)
        mode,kind,oid=meta.decode().split()
        need(mode=='100644' and kind=='blob','actual source runtime blob')
        readback[name.decode()]=oid
    need(readback==found and found[LEADING_SOURCE]==LEADING_BLOB,
         'executed full leading annulus runtime matches original Git source')
    return found


def leading_and_envelope(leading,envelope,stress):
    need(leading['domain']=={'X':['Xa/2','2*Xb'],'eta':['-1','1']} and
         all(leading['sourceChecks'].values()),'actual leading F0 on enlarged annulus')
    middle=leading['middle']
    need(middle['interval']==['Xa','Xb'] and middle['logNorm']=='R^70' and
         middle['originalFastNSecondDerivativeRetained'],'same original closed annulus total jet')
    nodes=leading['middleNodes']
    roots=leading['allRoots']

    def args(i,op):
        node=nodes[str(i)]
        need(node['op']==op,f'actual leading bound op at #{i}')
        return node['args']

    R,Xa=roots['actualSourceR'],roots['actualSourceXa']
    log=roots['F0ClosedAnnulusLogC2']
    physical=roots['physicalXConversionFactor']
    need(args(R,'source_parameter')==['C12EnvelopeR'] and args(Xa,'source_parameter')==['Xa'] and
         args(log,'integer_power')==[R,70] and set(args(middle['root'],'multiply'))=={log,physical},
         'actual Rstar^70 log derivative and physical conversion')
    eight,square=args(physical,'multiply')
    acc,power=args(square,'integer_power')
    one,inv=args(acc,'add')
    need(args(eight,'rational')==['8','1'] and power==2 and args(one,'rational')==['1','1'] and
         args(inv,'inverse')==[Xa],'actual 8*(1+Xa^-1)^2 factor, including lower orders')
    radial=envelope['radialEnvelopeComparison']
    need(radial['M']=='max(1,Rout,Rin^(-1))' and radial['originalEnvelope']=='C12EnvelopeR' and
         radial['MAtMostOriginalEnvelope'] and envelope['actualOriginalQbig']['C12EnvelopeR']==216823,
         'same original Rin^(-1),Rout radial envelope')
    mass=stress['certificate']['leading']['mass']
    need(mass['pass'] and mass['sourceU']==9236 and mass['sourceM']==9239 and
         'actual global M0_X=U0' in mass['theorem'],'same exact global leading Stokes primitive')
    return {'F0AnnularOrdinaryBound':'32*Rstar^74',
            'middleNativeRoot':middle['root'],'physicalConversionRoot':physical,
            'Rstar':'C12EnvelopeR','annularBounds':['Xa^-1<=Rstar^2','4*Xb<=Rstar^2'],
            'sourceLeadingStream':mass,
            'normalizedPressureBounds':{
                'value':'5*K + Rstar^2*L_F^2 + 2^10*Rstar^150',
                'X':'2^10*Rstar^148',
                'eta':'160*K + 2*Rstar^2*L_F^2 + 2^11*Rstar^150'}}


def laurent_abs(expr):
    """Return coefficients of an exact polynomial majorant in the positive Rstar."""
    numerator,denominator=together(expr).as_numer_denom()
    denominators=Poly(denominator,Y).terms()
    need(len(denominators)==1,'exact denominator has one X Laurent factor')
    ((d,),base)=denominators[0]
    terms=Counter()
    for (n,),coefficient in Poly(numerator,Y).terms():
        reduced=factor(coefficient/base)
        need(not reduced.has(Y),'separate exact X Laurent factor')
        lo,hi=interval(reduced.subs({eta:3*eta},simultaneous=True))
        terms[2*abs(n-d)]+=max(abs(lo),abs(hi))
    return terms


def profile_masses(field,orders,positive):
    # The imported operator's formal radial variable Y is X here.
    weighted=positive and field in ('a','b')
    terms={ZERO:Rational(1,2) if not positive and field=='a' else Rational(1)}
    w=WEIGHTS[field]
    for axis,count in enumerate(orders):
        for _ in range(count):
            terms,w=operator(terms,w,axis,weighted)
    wmin,wmax=interval(w)
    need(wmin>=0,'nonnegative physical q loss on the original h interval')
    qfactor=2**(-(-wmax.numerator//wmax.denominator))
    result=Counter()
    for jet,c in terms.items():
        if positive or jet[0]==0:
            for k,mass in laurent_abs(c).items():
                if mass:
                    result[jet,k+int(weighted)]+=qfactor*mass
    return result,w


def scalar(field,orders,higher):
    ld,w=profile_masses(field,orders,False)
    pd,w2=profile_masses(field,orders,True)
    need(w==w2,'same physical loss for the leading and cutoff terms')
    leading,positive=Counter(),Counter()
    for ((_,r,t),k),value in ld.items():
        if field=='a':
            leading['L_U',k]+=value/F(r+1)
        elif field=='b':
            leading['1',k+74]+=32*value
        else:
            need(r+t<=1,'actual leading pressure input order')
            if r==t==0:
                leading['K',k]+=5*value
                leading['L_F^2',k+2]+=value
                leading['1',k+150]+=2**10*value
            elif r:
                leading['1',k+148]+=2**10*value
            else:
                leading['K',k]+=160*value
                leading['L_F^2',k+2]+=2*value
                leading['1',k+150]+=2**11*value
    for (jet,k),value in pd.items():
        m=sum(jet)
        for n in (1,2,3):
            if m<=n:
                positive[f'tau0^({n}*h)',k]+=value*F(2,2**n)
            else:
                B=higher[n,m,FIELDS[field]]
                positive[f'H_{B}*tau0^({2*n}*h)',k]+=2*value
    return leading,positive,w


def terms(rows):
    return [{'factor':factor,'RstarPower':k,'coefficient':str(v)}
            for (factor,k),v in sorted(rows.items()) if v]


def pack(row):
    lead,pos,w=row
    return {'tau0ReciprocalPower':str(w),'leadingTerms':terms(lead),'positiveTerms':terms(pos)}


def transfer(atoms,higher):
    scalar_rows={}
    for field,orders in atoms['remainingScalarDerivativeInputs'].items():
        for order in orders:
            scalar_rows[field,tuple(order)]=scalar(field,tuple(order),higher)
    need(len(scalar_rows)==22,'all original 22 scalar derivative requests')
    scalar_intervals={f'{field}@{i},{j},{k}':pack(row)
                      for (field,(i,j,k)),row in scalar_rows.items()}
    field_intervals={}
    for atom,body in atoms['formulas'].items():
        name,indices=atom.split('@')
        if name=='A2':
            need(not body,'same original slow A2=0')
            field_intervals[atom]={'exactInterval':['0','0']}
            continue
        field={'A0':'a','A1':'a','b':'b','p':'p_loc'}[name]
        idx=tuple(map(int,indices.split(',')))
        lead,pos=Counter(),Counter()
        w=None
        for t in body:
            i,j,k=t['derivative']
            d=sum(t['xyPower'])
            need(t['scalar']==field,'same actual background scalar family')
            if name=='b':
                need(idx==(i,j,k) and d==0,'same physical s,z,tau b atom')
            else:
                need((j,k)==idx[2:] and d==2*i-idx[0]-idx[1]+int(field=='a'),
                     'exact Cartesian monomial degree and common physical scale')
            l,p,w0=scalar_rows[field,(i,j,k)]
            power=w0-Rational(d,2)
            if w is None:
                w=power
            need(w==power,'same tau0 exponent after physical xy bound')
            c=abs(t['integer'])
            for (factor,rpower),v in l.items():
                lead[factor,rpower+d]+=c*v
            for (factor,rpower),v in p.items():
                pos[factor,rpower+d]+=c*v
        need(w is not None,'actual Cartesian atom has terms')
        field_intervals[atom]=pack((lead,pos,w))
    need(len(field_intervals)==67 and sum('exactInterval'in x for x in field_intervals.values())==19,
         'all actual slow-background atoms and 19 exact A2 zeros')
    return scalar_intervals,field_intervals


def main():
    p=ArgumentParser()
    p.add_argument('--repo',type=Path,required=True)
    p.add_argument('--runtime',type=Path,required=True)
    p.add_argument('--atoms',type=Path)
    p.add_argument('--joined',type=Path,required=True)
    p.add_argument('--endpoint',type=Path,default=NEXT/'whole-k-center-n3/endpoint-third-bound.json')
    p.add_argument('--whole-k',type=Path,required=True)
    p.add_argument('--high',type=Path,default=NEXT/'whole-k-core-jet-bounds/core-high-norms.json')
    p.add_argument('--leading',type=Path,default=HERE/'annular-leading.json')
    p.add_argument('--envelope',type=Path,default=NEXT/'first-pressure-norm/first-pressure-norm.json')
    p.add_argument('--stress3',type=Path,default=NEXT/'axial-alln/order-three.json')
    p.add_argument('--out',type=Path,default=HERE/'annular-slow-jet-bounds.json')
    a=p.parse_args()
    atoms=pinned(a.atoms or a.repo/'tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-core/inner-gauge-atoms.json',ATOMS)
    native=pinned(a.leading,LEADING)
    geometry=pinned(a.whole_k,CHART)
    need(geometry['background']['selector_lower_bounds_b_n_times_qBig']==['1','16','32','64'] and
         geometry['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16'],
         'same whole-K slab and exact positive active prefix')
    high=pinned(a.high,HIGH)
    canonical,higher=validated_bounds(high,pinned(a.endpoint,ENDPOINT))
    scalars,fields=transfer(atoms,higher)
    leading=source_leading(a.repo,a.joined)
    leading.pop('M0StrictCoreBranch')
    leading.pop('M0StrictCoreFormula')
    leading.update(leading_and_envelope(native,pinned(a.envelope,ENVELOPE),pinned(a.stress3,STRESS3)))
    lead=high['leading']
    chart=verify_chart_operators()
    need(interval((1-2*h*(3*eta)**2).expand())[0]==F(503,512),
         'exact positive physical Jacobian on the closed annular eta interval')
    chart['profile']=['log(q)','X','eta']
    chart['radialCoordinateSpecialization']='set Lambda=1 in the checked chart identity s=2*q*Y/Lambda'
    chart['jacobianLowerBound']='503/512'
    out={'schema':'MathScope.N7.ActualAnnularSlowFieldAtomBounds/1',
         'pins':{'atoms':ATOMS,'leading':LEADING,'envelope':ENVELOPE,'stress3':STRESS3,
                 'high':HIGH,'endpoint':ENDPOINT,'wholeK':CHART},
         'sourceRuntimeGitBlobs':runtime_pins(a.runtime.resolve(),a.repo),
         'domain':'original whole K, Xa<=X<=Xb, |eta|<=3/4, 1/2<=rho<=1, all theta',
         'operatorTransfer':chart,
         'radialTransfer':'formal Laurent bound |X^k|<=Rstar^(2*abs(k)), (2*X)^-1/2<=Rstar, r<=Rstar*sqrt(tau0)',
         'sourceFields':'actual axisymmetric slow/background gauge and pressure; wave/mean corrections excluded',
         'leadingSource':leading,
         'sourceNormFactors':{'L_U':lead['U0BoundRoot'],'L_F':lead['bounds']['F0inner']['root'],
            'L_FGraphSHA256':lead['normProgramSHA256'],'K':'original Pstar^2',
            'canonical':{f'{n},{m}':root for (n,m),root in canonical.items()},
            'unabsorbed':{f'{n},{m},{field}':root for (n,m,field),root in higher.items()}},
         'scalarIntervals':scalars,'slowFieldAtomIntervals':fields,
         'intervalConvention':'nonzero rows are [-R,R] with R=tau0^-tau0ReciprocalPower times sum(coefficient*Rstar^RstarPower*factor)',
         'scope':{'localSlowAtoms':67,'exactSlowZeros':19,'fullAnnularAtoms':0,
                  'waveAndMeanCorrectionsEnclosed':False,'globalJets':'0/67',
                  'N7-06':'OPEN','N8-05':'OPEN','release':'HOLD'}}
    a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print('PASS 22 actual annular slow scalar inputs and 67 local background atom bounds.')
    print('Wave/mean correction atoms and full annular field remain OPEN.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
