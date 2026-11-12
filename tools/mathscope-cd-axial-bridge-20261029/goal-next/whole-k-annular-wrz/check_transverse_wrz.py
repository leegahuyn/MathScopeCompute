"""Audit the original directional W_rz source and compile a transverse inverse bound."""
from argparse import ArgumentParser
from functools import lru_cache
from fractions import Fraction as F
from hashlib import sha256
from itertools import product
from math import comb, factorial
from pathlib import Path
import gzip
import json

HOSTED='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
REGISTRY='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
SHARP='6a3bda9be88fd2c3b525a5393b470afff753b94b72d39d35e68c683f62758792'
XI,CHI,V,R,Z,T=623035,623043,622805,622802,622803,622804
DINV,DGEOM,VR1,VT0=624017,622751,623066,623067
POTENTIAL={694:625322,695:625323,696:625324,703:628773,704:628774,705:628775}
LOCAL={1:(-3,627174,627167),-1:(-9,630592,630585)}
SLOW={(0,j) for j in range(8)}|{(1,j) for j in range(7)}


def require(ok,reason):
    if not ok:
        raise ValueError(reason)


def read(path,expected=None):
    raw=path.read_bytes()
    if expected:
        require(sha256(raw).hexdigest()==expected,f'actual pinned {path.name}')
    return json.loads(raw)


def graph_load(graph):
    manifest=read(graph/'original-source-export-manifest.json')
    require(manifest['node_stream_sha256']==HOSTED,'same GitHub source artifact')
    registry=read(graph/'original-source-functions.json',REGISTRY)['base']
    nodes={}
    h=sha256()
    with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as f:
        h.update(next(f))
        for i,line in enumerate(f):
            h.update(line)
            if i<=644000:
                nodes[i]=json.loads(line)
    require(h.hexdigest()==HOSTED and i+1==4456994,'full exact hosted graph stream')
    return nodes,registry


class Source:
    def __init__(self,nodes,registry):
        self.nodes=nodes
        self.local=json.loads(registry['expressionDefinitions'])
        self.fields=json.loads(registry['fieldDefinitions'])
        self.native=json.loads(registry['base']['expression'])
        self.pulses=json.loads(registry['base']['m3GlobalPulses'])

    def args(self,i,op):
        node=self.nodes[i]
        require(node['op']==op,f'expected {op} at actual #{i}')
        return node['args']

    def check(self,i,op,a):
        require(self.args(i,op)==a,f'exact {op} at #{i}')

    def rational(self,i):
        return F(*map(int,self.args(i,'rational')))

    def pair(self,i,op,known):
        a=self.args(i,op)
        require(len(a)==2 and known in a,f'retained {op} with actual #{known} at #{i}')
        return a[1] if a[0]==known else a[0]

    def children(self,i):
        n=self.nodes[i]
        op,a=n['op'],n['args']
        if op in ('rational','source_parameter','coordinate'):
            return []
        if op=='definite_integral':
            return [a[0],a[2],a[3]]
        if op in ('integer_power','source_step_derivative'):
            return a[:1]
        if op in ('actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial'):
            return a[1]
        if op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            return [a[2],*a[3]]
        if op in ('actual_quadratic_root','actual_monotone_root'):
            return a[1] if isinstance(a[1],list) else a[1:]
        if op in ('actual_background_picard','actual_background_even_profile'):
            return a[2:4]
        if op=='actual_natural_series':
            return a[1:3]
        if op in ('add','multiply','inverse','sqrt_positive','log_positive','exp','ceiling','maximum','smooth_piecewise'):
            return a
        raise ValueError(f'unsupported original source operation {op} at #{i}')

    def xi_free(self,i,cache):
        todo=[(i,False)]
        while todo:
            k,done=todo.pop()
            if k in cache:
                continue
            kids=self.children(k)
            if not done:
                require(all(j<k for j in kids),'native source is topologically ordered')
                todo.append((k,True))
                todo.extend((j,False) for j in kids if j not in cache)
                continue
            vals=[cache[j] for j in kids]
            n=self.nodes[k]
            if n['op']=='definite_integral' and n['args'][1]==XI:
                vals[0]=False
            cache[k]=any(vals)
        return cache[i]

    def polynomial(self,i,allow_native,cache):
        if not self.xi_free(i,cache):
            return {(0,0)}
        if i==CHI:
            return {(1,0)}
        n=self.nodes[i]
        op,a=n['op'],n['args']
        if op=='actual_expression_partial' and allow_native:
            system,values,orders=a
            require(system in POTENTIAL and values[3]==XI and len(values)==len(orders)==12,
                    'exact actual potential formal-to-actual Xi binding')
            require(all(j==3 or not self.xi_free(v,cache) for j,v in enumerate(values)),
                    'potential has one Xi slot and all other actual arguments Xi independent')
            require(orders[3] in (0,1),'actual first curl transverse derivative')
            return {(1-orders[3],orders[3])}
        if op=='add':
            return set.union(*(self.polynomial(k,allow_native,cache) for k in a))
        if op=='multiply':
            result={(0,0)}
            for k in a:
                result={(r+p,s+q) for r,s in result for p,q in self.polynomial(k,allow_native,cache)}
            return result
        raise ValueError(f'another Xi-dependent factor at actual #{i}: {op}')

    def matrix_value(self,i):
        d=None
        values=[]
        for k in range(5):
            guard,l,r,out,inside,also=self.args(i,'smooth_piecewise')
            require(d is None or guard==d,'same exact palette selector')
            d=guard
            require(self.rational(l)==F(2*k-1,2) and self.rational(r)==F(2*k+1,2),
                    'actual integer delta branch guard')
            values.append(int(self.rational(inside)))
            require(out==also,'same out-of-branch label continuation')
            i=out
        require(i==0,'exact finite matrix branch outside original range')
        return d,values

    def affine_rows(self):
        f=self.fields[2]
        require(f['name']=='GlobalCompleteCommonTorus_rz' and len(f['rows'])==162,
                'actual full W_rz 81-box two-sign cover')
        self.check(DINV,'inverse',[DGEOM])
        mat=[((1,0),(0,1))]
        for _ in range(4):
            a,b=mat[-1]
            mat.append(((3*a[0]+b[0],3*a[1]+b[1]),(a[0]+5*b[0],a[1]+5*b[1])))
        mapping=[]
        for row in f['rows']:
            key=row['label']['sign']
            sys,body,_=LOCAL[key]
            require((row['localSystem'],row['localBody'])==(sys,body)
                    and self.local[-1-sys]['body']==body and row['localParameters'][7:]==[XI,V]
                    and len(row['guards'])==5 and len(row['values'])==9,
                    'actual signed guarded W_rz row and native argument order')
            y0,y1=row['derivativeMaps'][3:5]
            require([a['parameter'] for a in y0]==[7,8]==[a['parameter'] for a in y1],
                    'both original local Xi and v columns')
            x0,x1=(self.pair(y[0]['coefficient'],'multiply',DINV) for y in (y0,y1))
            def plus_with(i,factor):
                terms=self.args(i,'add')
                special=[k for k in terms if self.nodes[k]['op']=='multiply' and factor in self.nodes[k]['args']]
                require(len(special)==1,'exact original basis vector entry')
                return self.pair(i,'add',special[0]),self.pair(special[0],'multiply',factor)
            m00,m10=plus_with(x0,VR1)
            m01,m11=plus_with(x1,VR1)
            require(m01==m10,'same exact symmetric integer cover matrix')
            delta0,v00=self.matrix_value(m00)
            delta1,v01=self.matrix_value(m01)
            delta2,v11=self.matrix_value(m11)
            require(delta0==delta1==delta2 and v00==[m[0][0] for m in mat]
                    and v01==[m[0][1] for m in mat] and v11==[m[1][1] for m in mat],
                    'all five literal J_g^delta integer matrices')
            n0,d0=self.args(y0[1]['coefficient'],'multiply')
            n1,d1=self.args(y1[1]['coefficient'],'multiply')
            if self.nodes[n0]['op']=='inverse':
                n0,d0=d0,n0
            if self.nodes[n1]['op']=='inverse':
                n1,d1=d1,n1
            require(d0==d1 and plus_with(n0,VT0)==(m10,m00) and plus_with(n1,VT0)==(m11,m01),
                    'actual same v coordinate, second row of affine cover')
            denom=self.args(d0,'inverse')[0]
            ci=self.pair(denom,'multiply',DGEOM)
            mapping.append({'label':row['label']['key'],'sign':key,'delta':delta0,'ci':ci})
        require(len({(r['label'],r['sign']) for r in mapping})==162,
                'all original signed labels are retained exactly once')
        return {'rowsChecked':len(mapping),'integerMatrices':mat,
                'distinctPaletteSelectors':sorted(set(r['delta'] for r in mapping)),
                'originalTransversePullback':'L xi=Lambda^delta and L v=0',
                'nativeDirectionRegisters':f['directions']}

    def slow_background_leaves(self,roots):
        result=set()
        seen=set()
        todo=list(roots)
        while todo:
            i=todo.pop()
            if i in seen or i<622790:
                continue
            seen.add(i)
            n=self.nodes[i]
            if n['op']=='actual_expression_partial':
                fn,actual,orders=n['args']
                if fn in (688,689):
                    require(actual[:3]==[R,Z,T] and sum(orders)<=1,
                            'every live slow background matrix operand is at most first order')
                    result.add((fn,tuple(orders)))
            todo.extend(self.children(i))
        return [{'family':self.native[i]['name'],'orders':list(o)} for i,o in sorted(result)]

    def verify(self):
        self.check(CHI,'smooth_piecewise',[623038,847,120836,1,623042,0])
        self.check(623042,'source_step_derivative',[623041,0])
        require(self.rational(847)==F(1,4) and self.rational(120836)==F(3,4)
                and self.rational(137451)==2**34,
                'literal transverse plateau, endpoint, and r0=2^-34')
        self.check(623036,'multiply',[137451,XI])
        self.check(623037,'integer_power',[623036,2])
        self.check(623038,'sqrt_positive',[623037])
        self.check(623041,'add',[656,623040])
        self.check(623040,'multiply',[20,623039])
        self.check(623039,'multiply',[24,623038])
        cache={XI:True}
        for i,body in POTENTIAL.items():
            d=self.native[i]
            require(d['body']==body and d['parameters'][3]==XI
                    and self.polynomial(body,False,cache)=={(1,0)},
                    'actual native potential is exactly homogeneous degree one in chi(Xi)')
        for _,body,raw in LOCAL.values():
            b=body
            for _ in range(7):
                _,_,_,zero,inside,other=self.args(b,'smooth_piecewise')
                require(zero==other==0,'all seven actual local lazy guards give zero outside')
                b=inside
            require(b==raw and self.polynomial(raw,True,cache)=={(2,0),(1,1)},
                    'actual W_rz interior has only chi^2 and chi*chi_prime')
        # H solves against two original live normalized targets.
        t0,t1,h00,h01,h10,h11,det=623781,623788,623405,623737,623408,623740,623792
        self.check(det,'add',[623789,623791])
        for node in (h00,h01,h10,h11):
            integral=self.pair(node,'multiply',623058)
            _,v,lo,hi=self.args(integral,'definite_integral')
            require((v,lo,hi)==(V,0,623027),'literal H column integrates on the complete original pulse')
        self.check(623824,'sqrt_positive',[623799])
        self.check(623825,'sqrt_positive',[623803])
        self.check(623799,'multiply',[623797,623798])
        self.check(623803,'multiply',[623798,623802])
        self.check(623798,'inverse',[det])
        pulse_matrix=[]
        for row in self.pulses:
            require(row['parameters'][:3]==[R,Z,T] and row['variable']==V
                    and row['initial']==[1,0] and row['length']==623027,
                    'actual same native Volterra initial condition and all slow formals')
            pulse_matrix.extend(i for rr in row['matrix'] for i in rr)
        leaves=self.slow_background_leaves(pulse_matrix)
        require({tuple(r['orders']) for r in leaves}=={(0,0,0,0),(1,0,0,0),(0,1,0,0)},
                'actual Volterra matrix keeps ordinary background, radial and axial first derivatives')
        return {'nativePotentialBodies':POTENTIAL,'rawSignedWrz':{sign:v[2] for sign,v in LOCAL.items()},
                'transverseCutoffRoot':CHI,'localMonomials':['chi^2','chi*chi_prime'],
                'pulseMatrices':pulse_matrix,'matrixLiveBackgroundLeaves':leaves,
                'targetComponents':[t0,t1],'H':[[h00,h01],[h10,h11]],'determinant':det,
                'positiveSquareRootWeights':[623824,623825],
                'commonCover':self.affine_rows()}


def fourier_constants():
    # See the proof for the quadratic-norm spacing and the transverse strips.
    near=F(1024)*F(3,2)**4
    far=4*4*6
    total=near*F(4,3)+far*2
    require((near,far,total)==(5184,96,7104) and total<85**2,
            'exact summable near/far dyadic constants')
    return {'nearShellUpper':'5184/N^2','farShellUpper':'96/N',
            'weightedInverseSquareSumUpper':str(total),
            'pointwiseL2Constant':str(F(85,6)),'pointwiseL2TransverseSecondConstant':str(F(85,216)),
            'transverseL2InverseWithOneDerivative':['1','1/6'],
            'dyadicTailSquaredUpper':'6912/N^2 + 192/N'}


def cutoff_constants():
    # d/dt [exp(-1/t^2)*t^-p] = exp(-1/t^2)*(-p*t^(-p-1)+2*t^(-p-3)).
    terms={0:1}
    a=[]
    for _ in range(4):
        a.append(sum(abs(c)*factorial((p+1)//2) for p,c in terms.items()))
        new={}
        for p,c in terms.items():
            for power,factor in [(p+1,-p),(p+3,2)]:
                new[power]=new.get(power,0)+factor*c
        terms=new
    require(a==[1,4,36,1968],'fixed sigma2 derivative seed')
    require(F(11,4)**4<64 and sum(F(1,factorial(i)) for i in range(5))+F(1,100)<F(11,4),
            'e^4<64 via the elementary series')
    sigma=[1]
    for n in range(1,4):
        sigma.append(64*(a[n]+sum(comb(n,k)*2*a[k]*sigma[n-k] for k in range(1,n+1))))
    chi=[sigma[n]*2**(35*n) for n in range(4)]
    return {'seedSup':a,'sigmaSup':sigma,'chiSup':chi,
            'localChiSquareSup':1,'localChiChiPrimeSup':chi[1],
            'localChiSquareSecondSup':2*chi[1]**2+2*chi[2],
            'localChiChiPrimeSecondSup':3*chi[1]*chi[2]+chi[3]}


def jet_program():
    entries=[]
    for r,z in sorted(SLOW,key=lambda x:(sum(x),x)):
        splits=[]
        for a,b in product(range(r+1),range(z+1)):
            if a==b==0:
                continue
            splits.append({'coefficient':comb(r,a)*comb(z,b),'source':[a,b],'previous':[r-a,z-b]})
        entries.append({'slowJet':[r,z],'positiveNonzeroLeibnizSplits':splits})
    background=SLOW|{(r+1,z) for r,z in SLOW}|{(r,z+1) for r,z in SLOW}
    require(max(map(sum,SLOW))==7 and max(map(sum,background))==8 and len(SLOW)==15,
            'only original anisotropic order-seven target and order-eight background')
    require(162*4**4==41472,'finite exact global derivative majorant')
    return {'axes':['R','Z'],'downwardClosedJets':entries,
            'sameSourceDirectionalWeightedTargetJets':sorted(SLOW),
            'sameSourceDirectionalBackgroundFGJets':sorted(background),
            'stableVolterraRecurrence':'U_w[0]=W; U_w[alpha]=L_s*W*sum_{0<beta<=alpha} binom(alpha,beta)*M[beta]*U_w[alpha-beta]',
            'matrixInverseRecurrence':'U_Hinv[alpha]=U_Hinv[0]*sum_{0<beta<=alpha} binom(alpha,beta)*U_H[beta]*U_Hinv[alpha-beta]',
            'originalDenominatorBounds':['|n_tan|>=B^-2','|n|>=B^-2','|c0|>=B^-1','|det H|>=d_star/S','y>=c_y*zeta'],
            'globalBound':'W0<=41472*local_W0; L^2W0<=41472*Lambda^8*local_W2',
            'localBound':'local_Wj <=32*U^2*((2+Rstar)*B_chi2[j]+a_fast_sup*B_chiChiprime[j]), j=0,2',
            'U':'common bound for all selected slow jets of A_r,A_z,U_theta after Gaussian absorption',
            'noSlowDerivativeFromTheTwoExtraTransverseDirections':True}


def main():
    p=ArgumentParser()
    for s in ('graph','sharp','out'):
        p.add_argument('--'+s,type=Path,required=True)
    a=p.parse_args()
    sharp=read(a.sharp,SHARP)
    require(sharp['lineage']['earlyPressureWrzZZ']==643048
            and sharp['lineage']['lateTemporalViscousAxialNativePsiZZZ']==3613979,
            'same previous late-to-early surviving actual pressure term')
    graph,registry=graph_load(a.graph)
    src=Source(graph,registry)
    result={'schema':'MathScope.N7.TransverseDirectionalWrzBoundProgram/1','graphSHA256':HOSTED,
            'nativeRegistrySHA256':REGISTRY,'directionalParentSHA256':SHARP,
            'source':src.verify(),'fourier':fourier_constants(),'fixedCutoff':cutoff_constants(),
            'directionalBoundProgram':jet_program(),
            'scope':{'actualCovarianceNormValueMaterialized':False,'lastLeafNeedsOldGenericTargetC9':False,
                     'highestDirectionalWeightedTargetOrder':7,'highestDirectionalBackgroundOrder':8,
                     'remainingWholeKJetCoverage':'0/67','release':'HOLD'}}
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print('PASS actual W_rz two transverse monomials, all 162 cover rows, inverse bound and anisotropic C7/C8 program.')
    print('Remaining directional source norms are symbolic, final jets 0/67.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
