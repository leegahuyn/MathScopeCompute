"""Replay the corrected initialized parent and compute exact annular jet multipliers."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from hashlib import sha256
from math import ceil, factorial
from pathlib import Path
import gzip
import json

from sympy import Add, Rational, diff, expand, symbols

R,C,S=symbols('R C S',real=True)
ZERO=(0,0,0,0)
ATOMS='1f342570c0ac63a919441ed999860c835574299b73a2c36fb1b1c658b386876f'
CHART='af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'
EXPECTED_PREFIX='99dcc6ff6aaa92d4449d6ad5aae5a8ff2037f3e1644ac3ad0fdd2994ca020745'
GRAPH='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
FUNCTIONS='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
NATIVE={
    'actual_quadratic_root':'snapshot.base.base.quadratic',
    'actual_monotone_root':'snapshot.base.base.monotone',
    'actual_background_picard':'snapshot.base.base.picard',
    'actual_background_even_profile':'snapshot.base.base.picard',
    'actual_expression_partial':'snapshot.base.base.expression',
    'actual_covariance_volterra':'snapshot.base.base.m3GlobalPulses',
    'm3_global_pulse_jet':'snapshot.base.base.m3GlobalPulses',
    'm3_global_indexed_partial':'snapshot.base.base.m3GlobalFields',
    'm3_aux_expression_partial':'snapshot.base.expressionDefinitions',
    'm3_aux_indexed_partial':'snapshot.base.fieldDefinitions',
    'm3_aux_inverse_partial':'snapshot.base.inverseDefinitions',
}


def require(yes,detail):
    if not yes:
        raise ValueError(detail)


def read(path,digest=None):
    raw=path.read_bytes()
    if digest:
        require(sha256(raw).hexdigest()==digest,f'Changed immutable file {path.name}')
    return json.loads(raw)


def verify_graph(path,selectors):
    manifest=read(path/'original-source-export-manifest.json')
    require(manifest['node_stream_sha256']==GRAPH and manifest['definitions_sha256']==FUNCTIONS,
            'same corrected hosted graph and native definitions')
    definitions=read(path/'original-source-functions.json',FUNCTIONS)
    auxiliaries=definitions['base']
    source_functions=json.loads(auxiliaries['base']['expression'])
    wave_roots={694:625322,695:625323,696:625324,703:628773,704:628774,705:628775}
    for i,body in wave_roots.items():
        row=source_functions[i]
        require(row['name'].startswith('GlobalOriginalPotential_') and row['body']==body
                and len(row['parameters'])==12,'exact own-label native Primary potential body and parameters')
    p_field=json.loads(auxiliaries['fieldDefinitions'])[9]
    require(p_field['name']=='OriginalAll81InitialAngular_pressure' and len(p_field['rows'])==162,
            'actual stage-zero angular pressure over the full cover')
    signed={1:(-30,3625754),-1:(-37,3652129)}
    for row in p_field['rows']:
        require(signed[row['label']['sign']]==(row['localSystem'],row['localBody'])
                and len(row['guards'])==5 and len(row['derivativeMaps'])==6,
                'exact source signs and pressure guards with all physical derivative directions')
    targets=set(wave_roots.values())|{3625754,3652129,3674937,3675276,3859821}
    wave_bodies={}
    prefix=selectors['actualSource']['sourceNodeCount']
    require(prefix==3615866,'exact initialized mean parent boundary')
    stream,part=sha256(),sha256()
    selected=selectors['sourceBodyRecords']
    inventory={}
    seen=set()
    with gzip.open(path/'original-source-nodes.jsonl.gz','rb') as f:
        header=next(f)
        stream.update(header)
        require(json.loads(header)['node_count']==manifest['node_count'],'same header count')
        for i,line in enumerate(f):
            stream.update(line)
            if i in targets:
                wave_bodies[i]=json.loads(line)
            if i>=prefix:
                continue
            part.update(b'['+str(i).encode()+b','+line.rstrip(b'\r\n')+b']\n')
            if str(i) in selected:
                require(json.loads(line)==selected[str(i)],f'exact selected initial root #{i}')
                seen.add(str(i))
            if line.startswith((b'{"op":"actual_',b'{"op":"m3_')):
                node=json.loads(line)
                op=node['op']
                if op in ('actual_natural_series',):
                    continue
                require(op in NATIVE,f'unhandled native registry operation {op}')
                raw_id=node['args'][0]
                if op=='m3_aux_expression_partial':
                    require(raw_id<0,'original auxiliary expression uses the negative native namespace')
                    actual=-1-raw_id
                else:
                    require(raw_id>=0,'original indexed native namespace')
                    actual=raw_id
                inventory[op]=max(inventory.get(op,-1),actual)
    require(i+1==manifest['node_count'] and stream.hexdigest()==GRAPH and set(selected)==seen,
            'full authenticated corrected hosted stream and every selected native root')
    require(part.hexdigest()==selectors['actualSource']['sourceNodePrefixSHA256']==EXPECTED_PREFIX,
            'literal equality of the entire initialized node prefix')
    require(set(wave_bodies)==targets,'complete readback of initial native wave and pressure bodies')
    require(wave_bodies[3674937]=={'op':'m3_aux_indexed_partial',
            'args':[9,[622802,622803,622804,622791,635044,635045,622806],[0,0,0,0,0,0]]}
            and set(wave_bodies[3859821]['args'])=={3674937,3675276}
            and set(wave_bodies[3675276]['args'])=={622935,3615361},
            'actual full stage-zero pressure is exact background plus mean plus primary harmonic')
    require(next(row for row in selectors['registry'] if row['namespace']=='snapshot.base.base.fixed')['identicalObject'],
            'same immutable natural-series definitions')
    tables={row['namespace']:row for row in selectors['registry']}
    for op,last in inventory.items():
        table=tables[NATIVE[op]]
        require(last<table['identicalPrefix'],f'actual {op} registry range through index {last}')
    return {'fullHostedNodes':i+1,'fullHostedSHA256':GRAPH,'nativeRegistrySHA256':FUNCTIONS,
            'initializedParentNodes':prefix,'initializedParentSHA256':EXPECTED_PREFIX,
            'nativeRegistryLastUsedIndex':inventory,'allSelectedRootsEqual':True,
            'initialWavePotentialNativeFunctions':{i:source_functions[i] for i in wave_roots},
            'initialAngularPressure':{'fullStageZeroRoot':3859821,'waveRoot':3674937,'meanRoot':3615361,
              'backgroundRoot':622935,'actualIndexedRows':len(p_field['rows']),'localBodies':signed},
            'initialWaveAndPressureBodyRecords':wave_bodies}


def operator(terms,axis,radial_squared=False):
    rotation=lambda f:-S*diff(f,C)+C*diff(f,S)
    if radial_squared:
        dr,angle=1/(2*R),0
    else:
        dr,angle=((C,-S/R),(S,C/R),(0,0),(0,0))[axis]
    result=defaultdict(int)
    for jet,value in terms.items():
        result[jet]+=dr*diff(value,R)+angle*rotation(value)
        for i,factor in ((0,dr),(3,angle),(1,int(axis==2)),(2,int(axis==3))):
            if factor:
                target=tuple(q+int(j==i) for j,q in enumerate(jet))
                result[target]+=factor*value
    return {jet:expand(v) for jet,v in result.items() if expand(v)!=0}


def physical_poly(base,orders,mode):
    state={ZERO:base}
    if mode=='b':
        for axis,count in enumerate(orders):
            for _ in range(count):
                state=operator(state,(0,2,3)[axis],axis==0)
    else:
        for axis,count in enumerate(orders):
            for _ in range(count):
                state=operator(state,axis)
    values=Counter()
    for jet,c in state.items():
        if c==0:
            continue
        if mode in ('b','p_mean') and jet[3]>0:
            continue
        for term in Add.make_args(c):
            n=term.as_powers_dict().get(R,0)
            coef=(term/(R**n)).as_coeff_Mul()[0]
            require(term/(R**n)/coef in (1,C,S) or
                    set((term/(R**n)/coef).free_symbols)<={C,S},
                    'coefficient is a polynomial monomial in bounded sine and cosine')
            values[(sum(jet),abs(int(n)))]+=abs(coef)
    return values


def serialize(poly):
    return [{'mappedOrder':n,'radiusEnvelopePower':r,'coefficient':str(c)}
            for (n,r),c in sorted(poly.items()) if c]


def scale_and_atoms(atoms):
    rows={}
    for key in atoms['formulas']:
        name,index=key.split('@')
        I=tuple(map(int,index.split(',')))
        if name=='b':
            i,j,k=I
            require(i+j+k<=2,'b fixed demand')
            # w=A+1/2, with Q^(-1) per sbar differentiation.
            base_hi=Rational(65,64)+i+Rational(j,2)+k
            coeff=physical_poly(1/R,I,'b')
            rows[key]={'tau0ReciprocalExponent':f'A+1/2+{i}+D*{j}+{k}',
                       'QtoTauDyadic':4**int(ceil(base_hi)),'mean':serialize(coeff)}
            continue
        i,j,l,k=I
        extra=Rational(i+j+l,2)+k
        shift=f'({i}+{j})/2+D*{l}+{k}'
        if name=='p':
            require(sum(I)<=1,'pressure fixed demand')
            coeff=serialize(physical_poly(1,I,'p_mean'))
            rows[key]={'tau0ReciprocalExponent':f'2*A+{shift}',
                       'QtoTauDyadic':4**int(ceil(Rational(33,32)+extra)),'mean':coeff,
                       'wave':serialize(physical_poly(1,I,'p_wave'))}
            continue
        require(name in ('A0','A1','A2') and sum(I)<=3,'potential fixed demand')
        mean_base={'A0':-S,'A1':C,'A2':0}[name]
        primary_bases={'A0':[C,-S],'A1':[S,C],'A2':[1]}[name]
        wave=Counter()
        for c in primary_bases:
            wave.update(physical_poly(c,I,'A'))
        rows[key]={'tau0ReciprocalExponent':f'h+{shift}',
                   'QtoTauDyadic':4**int(ceil(Rational(1,64)+extra)),
                   'mean':serialize(physical_poly(mean_base,I,'A')),'wave':serialize(wave)}
    require(len(rows)==67 and sum(not r['mean'] for r in rows.values())==19,
            'all actual stencil requests and zero stage-zero mean Az')
    require(rows['A0@0,0,0,0']['wave']==[{'mappedOrder':0,'radiusEnvelopePower':0,'coefficient':'2'}] and
            rows['b@0,0,0']['mean']==[{'mappedOrder':0,'radiusEnvelopePower':1,'coefficient':'1'}],
            'wave cylindrical rotation and actual direct B/r readback')
    return rows


def absorption(pole,weight):
    n=(pole+1)//2
    if pole==0:
        return {'bound':'1','pole':0}
    return {'pole':pole,'n':n,'coefficient':str(factorial(n)),
            'lowerEdgeInverseExponent':'t1^-2' if weight=='zeta' else '2*t1^-2',
            'upperEdgeInverseExponent':'1/4' if weight=='zeta' else '1/2',
            'bound':'1+n!*(a^(-n)+b^(-n))'}


def main():
    p=ArgumentParser()
    p.add_argument('--selectors',type=Path,required=True)
    p.add_argument('--graph',type=Path,required=True)
    p.add_argument('--atoms',type=Path,required=True)
    p.add_argument('--chart',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    selectors=read(a.selectors)
    chart=read(a.chart,CHART)
    require(chart['variables']['bounds']==['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16'],
            'same original whole-K normalization')
    graph=verify_graph(a.graph,selectors)
    coeff=scale_and_atoms(read(a.atoms,ATOMS))
    norms=selectors['norms']
    require(all(row['weight']=='zeta' and row['epsilonExponent']=='1-kappa_s' for row in norms.values()),
            'all actual mean factors use the same source Gaussian and epsilon exponent')
    primary=selectors['primaryDegree']
    require(primary['demands']=={'output':3,'amplitudeAndTarget':4,'background':6},
            'actual original C3 primary degree and source demand')
    receipt={'schema':'MathScope.N7.AnnularStage0ConditionalPhysicalJetTransfer/1',
             'selectorReceiptSHA256':sha256(a.selectors.read_bytes()).hexdigest(),
             'chartSHA256':CHART,'atomContractSHA256':ATOMS,'graph':graph,
             'stageZeroRoots':selectors['actualRoots'],
             'radialEnvelope':'Rstar^-1 <= R <= Rstar for every active band',
             'physicalReferenceScale':'tau0/4 <= Q_label <= 4*tau0 on every active chart',
             'Supper':'(8+2*log(1/qBig))^2',
             'gaussianAbsorption':{k:absorption(row['pole'],row['weight']) for k,row in norms.items()},
             'primaryAbsorption':{'potentialC3':absorption(primary['potential'][3]['pole'],'sqrt(zeta)'),
                                  'pressureC1':absorption(primary['homogeneousPressure'][1]['pole'],'sqrt(zeta)')},
             'chartBell':[[1],[5],[5,25],[5,75,125]],
             'phaseBell':[[1],[1],[1,1],[1,3,1]],
             'coefficientCarrierTransport':{
                 'J':'48*Rstar^4*tau0^-h',
                 'B_j':'j=0:1; j>0: dot(chartBell[j], [J,J^2,J^3][:j])',
                 'carrier':'Ccar=1+(Rstar+1)*Rstar^42*(1+u*Rstar^31/(4*r0)+u/2)',
                 'phaseJet':'P=64*Ccar*Cbg3*(1+Lmax)*Supper*tau0^(-3h/2)',
                 'E_j':'j=0:1; j>0: dot(phaseBell[j], [P,P^2,P^3][:j])',
                 'waveAssembly':'162*sum_{j=0}^m binomial(m,j)*B_j*E_(m-j)'},
             'atoms':coeff,
             'scope':{'stageZeroOnly':True,'allMeanNormLeavesNumericallyMaterialized':False,
                      'wholeKPrimaryC3Materialized':False,'wholeKFinalJetCoverage':'0/67','release':'HOLD'}}
    a.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(f'PASS exact stage-zero initialized source parent and {len(coeff)} conditional physical jet multipliers.')
    print('Actual finite mean norm leaf materialization and whole-K primary C3 remain OPEN.')
    print('Receipt SHA256',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
