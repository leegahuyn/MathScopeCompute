"""Exact exterior equality of the two complete authenticated first-cycle pressures."""
from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

ADJACENT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ADJACENT / d) for d in ('first-gauge','temporal-exterior','f1-mean')]
from bind_first_cycle_gauge import (
    FIVE, Graph, Exact, Native, TEMP_INVERSE, TEMP_PSI, difference,
    git_blob, need, product_other, q, read_artifact, split_sub, unique,
)
from bind_mean_angle_scope import Scope
from check_temporal_exterior import (
    CHI, ELL, INNER, OUTER, P, R, T, X, XA, XB, Y, Z, args_on_exterior,
    definitions, pin_sources, rejected, replay as replay_temporal,
)
from prove_five_whole import actual_axial_source, factors, verify_whole_binding

THETA = 622806
RHO = 633726
BACKGROUNDP = 622935
PRESSURE = [3859821,4456439]
ANGULAR = [3674937,4196627,4228738]
MEAN = [3615361,4455781]
INITIAL_TAG = 'GlobalInitializationAfterFiveMoments'
FINAL_TAG = 'PostSignedAfterFiveMomentsFreshPAndJ'


def same_rows(field):
    rows = field['rows']
    labels = {(r['label']['key'],r['label']['sign']) for r in rows}
    need(len(rows) == len(labels) == 162 and len({k for k,s in labels}) == 81 and
         {s for k,s in labels} == {-1,1} and
         all(r['guards'].count([X,XA,XB]) == 1 for r in rows),
         f'{field["name"]} must guard all original 81 boxes and both signs on the same shell')


def angular_pressure(graph,native,run):
    initial = native.expressions['ActualInitializedMeanFullPressure']
    mean_bkg = initial['body']
    need(Counter(graph.args(mean_bkg,'add')) == Counter([BACKGROUNDP,MEAN[0]]) and
         Counter(graph.args(PRESSURE[0],'add')) == Counter([mean_bkg,ANGULAR[0]]),
         'actual J0 normalized pressure contains this background, mean T0 and primary angular pressure')
    need(run['post_five_full_three_dimensional_pressure_root'] == PRESSURE[1] and
         run['post_five_direct_vs_split_same_original_pressure_root'] == PRESSURE[1],
         'actual final physical pressure is the pinned full source operand')
    need(not difference(graph,PRESSURE[1],(BACKGROUNDP,1),(MEAN[1],1),
                        (ANGULAR[1],1),(ANGULAR[2],1)), 'complete final pressure exact additive lineage')
    items = [
        ('m3_aux_indexed_partial',native.aux_fields['OriginalAll81InitialAngular_pressure']),
        ('m3_coupled_indexed_partial',native.fields['ActualForcedCurrent_angular_pressure']),
        ('m3_coupled_indexed_partial',native.fields['GenericSigned162_angular_pressure']),
    ]
    result = []
    for root,(op,field) in zip(ANGULAR,items,strict=True):
        need(field['parameters'] == [*P,THETA] and len(field['directions']) == 6 and
             graph.args(root,op) == [field['id'],[*P,THETA],[0]*6],
             'original actual angular pressure call, including physical angle')
        same_rows(field)
        result.append({'root':root,'nativeId':field['id'],'name':field['name'],'rows':162,
                       'commonRadialGuard':[X,XA,XB]})
    return result


def signature(graph,root,aliases):
    """Exact structure comparison up to named radial substitution."""
    @cache
    def visit(i):
        if i in aliases:
            return aliases[i]
        op,args = graph.node(i)
        if op in ('rational','coordinate','source_parameter'):
            return op,tuple(args)
        if op in ('add','multiply'):
            return op,tuple(sorted((visit(k) for k in args),key=repr))
        if op in ('sqrt_positive','exp','log_positive','inverse','integer_power',
                  'source_step_derivative','smooth_piecewise','definite_integral'):
            children = len(args) if op in ('smooth_piecewise','definite_integral') else 1
            return op,tuple(visit(k) for k in args[:children]),tuple(args[children:])
        # Remaining nodes may only occur in the unchanged slow factors.
        need(not set(aliases).intersection(graph.reach([i])),f'unhandled substituted operation {op}')
        return 'unchangedNative',i
    return visit(root)


def bind_shift(graph,actual,binder):
    base_phi = 635059
    sh0,sh1 = [product_other_add(graph,node,y) for node,y in zip(actual[-2:],Y,strict=True)]
    positive,negative = split_sub(graph,sh0)
    need(negative == base_phi and
         signature(graph,base_phi,{R:('radius',)}) == signature(graph,positive,{binder:('radius',)}),
         'exact original radial primitive under R -> integration binder')
    need(Counter(graph.args(sh1,'multiply')) == Counter([623066,sh0]),
         'same actual second torus translation, with original radial basis factor')
    return {'shift':sh0,'phiAtR':base_phi,'phiAtBinder':positive,'actualY':actual[-2:]}


def product_other_add(graph,root,term):
    args = graph.args(root,'add')
    need(len(args)==2 and term in args,'literal additive operand')
    return next(i for i in args if i!=term)


def bind_rho(graph,rho,binder,coordinates):
    need(signature(graph,RHO,{R:('radius',)}) == signature(graph,rho,{binder:('radius',)}),
         'same original rho under R -> integration binder')
    pieces = factors(graph,RHO)
    inverse_mass = unique((i for i in pieces if graph.node(i)[0]=='inverse' and
                          graph.node(graph.args(i,'inverse')[0])[0]=='definite_integral'),
                          'original rho normalization mass')
    bump = unique((i for i in pieces if graph.node(i)[0]=='smooth_piecewise'),
                  'original rho source smooth compact bump')
    arg, lo, hi, before, inside, after = graph.args(bump,'smooth_piecewise')
    need([lo,hi,before,after] == [0,1,0,0] and arg == coordinates['cutoffArgument'],
         'rho uses original identical mean-patch transition interval')
    mass = graph.args(inverse_mass,'inverse')[0]
    body,r,a,b = graph.args(mass,'definite_integral')
    unnormalized = product_other(graph,RHO,inverse_mass)
    need([a,b]==[INNER,OUTER] and
         signature(graph,unnormalized,{R:('radius',)})==signature(graph,body,{r:('radius',)}),
         'rho mass integrates the identical unnormalized original bump across full annulus')
    return {'actualRho':rho,'originalRho':RHO,'compactBump':bump,
            'normalizationMass':mass,'massIntegrand':body,'massBinder':r}


def bind_defect(graph,p_def,haar,gr,op):
    body,r,lo,hi = graph.args(p_def['body'],'definite_integral')
    need([lo,hi]==[INNER,OUTER] and
         haar['parameters']==[ELL,R,Z,T] and
         graph.args(body,op)==[haar['id'],[ELL,r,Z,T],[0]*4],
         'actual defect is the full radial integral of the identical stage Haar source')
    outer,y1,a,b = graph.args(haar['body'],'definite_integral')
    call,y0,c,d = graph.args(outer,'definite_integral')
    need([y0,y1,a,b,c,d]==[*Y,0,1,0,1] and
         graph.args(call,op)==[gr['id'],gr['parameters'],[0]*6],
         'actual defect Haar integrand is the literal original full radial source')
    return {'nativePBody':p_def['body'],'nativeHaarBody':haar['body'],'sourceAtFormalArguments':call}


def bind_t0(graph,mean,expr,p_def,haar,op,shell):
    left,negative = split_sub(graph,mean)
    whole = product_other(graph,negative,CHI)
    integrand,r,lo,hi = graph.args(whole,'definite_integral')
    need([lo,hi]==[INNER,OUTER] and graph.args(left,'definite_integral')==[integrand,r,INNER,R],
         'actual T0 uses identical shifted integrand and literal shared envelope')
    gr,norm = split_sub(graph,integrand)
    ident,actual,orders = graph.args(gr,op)
    need(ident==expr['id'] and orders==[0]*6,'actual T0 uses zero-order native full radial source')
    args_on_exterior(expr['parameters'],actual,r)
    shift = bind_shift(graph,actual,r)
    terms = graph.args(norm,'multiply')
    p = unique((i for i in terms if graph.node(i)[0]==op and graph.node(i)[1][0]==p_def['id']),
               'exact stage P operand of rho*P')
    need(p_def['parameters']==[ELL,Z,T] and graph.args(p,op)==[p_def['id'],[ELL,Z,T],[0]*3],
         'pressure defect has no radial/torus argument')
    normalization = bind_defect(graph,p_def,haar,expr,op)
    rho = bind_rho(graph,product_other(graph,norm,p),r,shell)
    return {'pressure':mean,'left':left,'whole':whole,'integrand':integrand,'binder':r,
            'bounds':[INNER,OUTER],'chi':CHI,'nativeGrApplication':gr,'nativeGrActual':actual,
            'formalGrBody':expr['body'],'defectP':p,'shift':shift,'rho':rho,'normalization':normalization}


def five_support(graph,native):
    c = {'R':R,'Z':Z,'T':T,'ell':ELL}
    axial = actual_axial_source(graph,native,c)
    five = {'whole':4455163,'integrand':4455161,'binder':4455158,'inner':INNER,'outer':OUTER,
            'partial':4455162,'usedPsi':4455164,'compactCandidatePsi':4455168,'chi':CHI}
    verify_whole_binding(graph,native,five,R)
    swirl_definition = native.expressions[FIVE[1]]
    swirl = swirl_definition['body']
    swirl_application = 4455153
    need(graph.args(swirl_application,'m3_coupled_expression_partial') ==
         [swirl_definition['id'],[ELL,R,Z,T],[0]*4] and
         swirl_definition['parameters']==[ELL,R,Z,T], 'actual registered FiveMap direct swirl application')
    alg = Exact(graph)

    def summands(i):
        op,a=graph.node(i)
        return [x for k in a for x in summands(k)] if op=='add' else [i]

    actual_swirl_terms = summands(swirl)
    need(len(actual_swirl_terms)==3, 'all three actual FiveMap swirl terms')
    scope = Scope(graph,native.raw)
    raw_profiles = {634453,634481,634511}
    profiles = []
    bumps = []
    for term in actual_swirl_terms:
        profile = unique((i for i in graph.args(term,'multiply') if i in raw_profiles),
                         'actual original profile operand in the three-term swirl sum')
        coefficient = product_other(graph,term,profile)
        need(scope.free(coefficient) <= {Z,T,ELL}, 'actual FiveMap swirl coefficient is independent of radius and angles')
        pieces = factors(graph,profile)
        bump = unique((i for i in pieces if graph.node(i)[0]=='smooth_piecewise'),
                      'exact scalar compact bump in each actual FiveMap swirl term')
        profiles.append({'term':term,'profile':profile,'compactBump':bump,'coefficient':coefficient})
        bumps.append(bump)
    need({p['profile'] for p in profiles} == raw_profiles, 'all three distinct original FiveMap swirl profiles')
    first_two = {row['bump'] for row in axial['profiles']}
    need(first_two <= set(bumps), 'actual FiveMap swirl retains first two original radial bumps')
    third = unique(set(bumps)-first_two,'third actual FiveMap radial bump')
    arg,lo,hi,before,inside,after = graph.args(third,'smooth_piecewise')
    need([lo,hi,before,after]==[0,1,0,0],'third actual FiveMap bump zero branches')
    a=alg.of
    need(5*q(graph,graph.args(634333,'exp')[0])==2, 'actual third bump exact dilation')
    rad = alg.mul(a(R),alg.inv(alg.mul(a(633686),a(633687),a(634333))))
    need(a(arg)==alg.mul(alg.scalar(10),alg.sub(rad,alg.one)),
         'third actual FiveMap bump uses the original e^(2/5) radial dilation')
    # (11/10)^2 < 2 < e implies 1+4/5+2log(11/10)<5 exactly.
    need(121 < 200 and q(graph, graph.args(71672,'exp')[0]) * 4 + 2 < 5,
         'third dilate support stays strictly inside the authenticated mean patch')
    beta = native.expressions[FIVE[0]]['body']
    beta_integral = unique((i for i in graph.reach([beta]) if graph.node(i)[0]=='definite_integral'),
                           'actual FiveMap differentiated left integral')
    body,binder,lo,hi = graph.args(beta_integral,'definite_integral')
    need([binder,lo,hi]==[five['binder'],INNER,R], 'actual FiveMap beta uses raw primitive, fixed endpoints')
    app = product_other(graph,body,binder)
    gam = native.expressions[FIVE[2]]
    need(graph.args(app,'m3_coupled_expression_partial') ==
        [gam['id'],[binder if a==R else a for a in gam['parameters']],
         [int(a==Z) for a in gam['parameters']]], 'FiveMap beta uses exact differentiated native gamma')
    a=alg.of
    need(a(beta)==alg.neg(alg.mul(a(622798),a(623135),a(beta_integral))),
         'actual FiveMap beta is negative epsilon d_Z of supported raw psi')
    return {'rawPsi':five,'axial':axial,'directSwirl':swirl_application,'swirlBody':swirl,
            'swirlProfiles':profiles,'thirdSwirlBump':third,'betaBody':beta,'betaDifferentiatedIntegral':beta_integral}


class ExteriorAlgebra(Exact):
    def __init__(self,graph,native,temporal,omit=()):
        super().__init__(graph)
        self.used = {}
        self.zero_apps = {}
        for name in temporal['covarianceFields']:
            if name in native.aux_fields:
                self.add_zero('m3_aux_indexed_partial',native.aux_fields[name],omit)
            else:
                self.add_zero('m3_coupled_indexed_partial',native.fields[name],omit)
        for name in [TEMP_PSI,*FIVE]:
            self.add_zero('m3_coupled_expression_partial',native.expressions[name],omit)
        for name in TEMP_INVERSE:
            self.add_zero('m3_coupled_inverse_partial',native.inverses[name],omit)

    def add_zero(self,op,d,omit):
        if d['name'] not in omit:
            self.zero_apps[op,d['id']] = d

    @cache
    def of(self,i):
        op,args = self.graph.node(i)
        key=(op,args[0]) if len(args)==3 and op.endswith('_partial') else None
        if key in self.zero_apps:
            d = self.zero_apps[key]
            args_on_exterior(d['parameters'],args[1],R)
            need(len(args[2])==len(d.get('directions',d['parameters'])) and
                 all(type(n) is int and n>=0 for n in args[2]),'actual finite native partial order')
            self.used[i]=d['name']
            return self.zero
        return super().of(i)


def compare_sources(graph,native,temporal,initial,final):
    alg = ExteriorAlgebra(graph,native,temporal)
    lhs,rhs = alg.of(initial['formalGrBody']),alg.of(final['formalGrBody'])
    need(lhs==rhs and bool(lhs), 'exact initial and final full radial sources must coincide on exterior')
    use = set(alg.used.values())
    need(alg.used.get(4455153)==FIVE[1] and
         all(name in use for name in [TEMP_PSI,*FIVE,TEMP_INVERSE[0]]) and
         all(any(n.startswith(prefix) for n in use) for prefix in (
             'GlobalCompleteCommonTorus_','ActualForcedCurrent_W_','GenericSigned162_covariance_delta_')),
         'all actual source lineage families exercised in radial specialization')
    missing = {}
    for name in (TEMP_PSI,FIVE[1],FIVE[0]):
        bad = ExteriorAlgebra(graph,native,temporal,omit=[name])
        missing[name] = bad.of(initial['formalGrBody']) != bad.of(final['formalGrBody'])
        need(missing[name],f'omitting {name} exterior theorem must expose exact source difference')
    pol = [[[list(f) for f in monomial],str(value)] for monomial,value in sorted(lhs.items())]
    return {'initialFullRadialSource':initial['formalGrBody'],'finalFullRadialSource':final['formalGrBody'],
            'sameExteriorPolynomialTerms':len(lhs),
            'sameExteriorPolynomialSHA256':sha256(json.dumps(pol,separators=(',',':')).encode()).hexdigest(),
            'exteriorZeroApplications':alg.used,'omittedExteriorReductionRejected':missing}


def check(graph,native,repo,run):
    temporal = replay_temporal(graph,native,repo,run)
    five = five_support(graph,native)
    angular = angular_pressure(graph,native,run)
    aux = definitions(native,'expressionDefinitions')
    init = bind_t0(graph,MEAN[0],aux[INITIAL_TAG+'_complete_gr'],aux[INITIAL_TAG+'_P'],
                   aux[INITIAL_TAG+'_haar_gr'],'m3_aux_expression_partial',temporal['shell'])
    final = bind_t0(graph,MEAN[1],native.expressions[FINAL_TAG+'_complete_gr'],
                    native.expressions[FINAL_TAG+'_P'],native.expressions[FINAL_TAG+'_haar_gr'],
                    'm3_coupled_expression_partial',temporal['shell'])
    compare = compare_sources(graph,native,temporal,init,final)
    negative = rejected(lambda: bind_t0(graph,MEAN[1],native.expressions[FINAL_TAG+'_complete_gr'],
                        aux[INITIAL_TAG+'_P'],native.expressions[FINAL_TAG+'_haar_gr'],
                        'm3_coupled_expression_partial',temporal['shell']))
    return {'initialFullPressure':PRESSURE[0],'finalFullPressure':PRESSURE[1],
            'sameBackgroundPressureCancels':BACKGROUNDP,'angularPressure':angular,
            'initialT0':init,'finalT0':final,'actualRadialSourceComparison':compare,
            'actualFiveMapSupport':five,'temporalExteriorSource':temporal['postSignedTemporal'],
            'wrongStageNormalizationRejected':negative,
            'normalizedReferenceShell':temporal['shell'],
            'strictExteriorVerified':True,'bothEnvelopeSeamValuesZero':True,
            'zeroExtensionToAxisAvailable':True,'cylindricalExpressionAtAxisEvaluated':False,
            'twoSidedPositiveOrderSeamJetsCertified':False,'uniformDerivativeConstantsCertified':False,
            'sourceRecursionScope':'First corrected cycle only','release':'HOLD'}


def endpoint_source_pin(repo,run):
    path = 'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs'
    body = git_blob(repo,run['executing_commit'],path)
    need(all(token in body for token in (
        b'if(x===a||x===this.zero&&this.sourcePositiveGeometry(a))return this.substitute(args[3]',
        b'if(x===b)return this.substitute(args[5]',
        b'xn*ad<=an*xd?args[3]:xn*bd>=bn*xd?args[5]:args[4]')),
        'actual source lazy smooth-piecewise exterior branches include equality')
    return path,sha256(body).hexdigest()


def main():
    parser=ArgumentParser(description=__doc__)
    for key in ('repo','artifact','out'):
        parser.add_argument('--'+key,required=True,type=Path)
    a=parser.parse_args()
    d,run,manifest,run_sha=read_artifact(a.artifact,True)
    native=Native(d/'original-source-functions.json',manifest)
    pins=pin_sources(a.repo,run)
    path,digest=endpoint_source_pin(a.repo,run)
    pins[path]=digest
    with TemporaryFile() as backing:
        graph=Graph(d/'original-source-nodes.jsonl.gz',backing,manifest)
        result=check(graph,native,a.repo,run)
    data={'schema':'MathScope.N7.CorrectedFirstPressureExterior/1',
          'graphSHA256':manifest['node_stream_sha256'],'registrySHA256':manifest['definitions_sha256'],
          'hostedRunSHA256':run_sha,'sourceCommit':manifest['executing_commit'],
          'nodeCount':manifest['node_count'],'sourceSHA256':pins,**result}
    a.out.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print(f'PASS corrected pressure exterior: #{PRESSURE[1]} - #{PRESSURE[0]}, '
          f'{result["actualRadialSourceComparison"]["sameExteriorPolynomialTerms"]} common exact terms, '
          '486 angular row guards, actual FiveMap direct swirl #4455153, both seam values, 4 controls rejected')


if __name__=='__main__':
    main()

