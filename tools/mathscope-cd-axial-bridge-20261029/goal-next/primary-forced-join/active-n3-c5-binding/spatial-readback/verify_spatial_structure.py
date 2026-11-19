"""Exact source-operand checks on the completed spatial graph export."""
from collections import Counter, defaultdict
from fractions import Fraction
import re

from source_stream import need, node_id


ROW_KEYS = ('values','guards','derivativeMaps','coefficient','label')
REF_NAME = re.compile(r'^SpatialStage1Gauge_reference_([01])_([012])$')
APPEND_FIELD = 'SpatialStage1Gauge_'


def expr(graph,index):
    row=graph.record(index)
    return row['op'],row['args']


def arithmetic_terms(graph,root,opaque=(),limit=120):
    """Expand small sums/products over exact rational coefficients and opaque IDs."""
    stops=set(opaque)
    visits=0
    def visit(i):
        nonlocal visits
        visits+=1
        need(visits<=limit,f'bounded arithmetic operand comparison at {root}')
        if i in stops:
            return {(i,):Fraction(1)}
        op,args=expr(graph,i)
        if op=='rational':
            n,d=args
            val=Fraction(int(n),int(d))
            return {():val} if val else {}
        if op=='add':
            out=defaultdict(Fraction)
            for x in args:
                for ids,coeff in visit(x).items():
                    out[ids]+=coeff
            return {k:v for k,v in out.items() if v}
        if op=='multiply':
            out={():Fraction(1)}
            for x in args:
                nex=defaultdict(Fraction)
                for old,a in out.items():
                    for new,b in visit(x).items():
                        nex[tuple(sorted(old+new))]+=a*b
                out=nex
            return {k:v for k,v in out.items() if v}
        return {(i,):Fraction(1)}
    return visit(root)


def small_linear_atoms(graph,root,expected,opaque=()):
    stops=set(opaque)|set(i for term in expected for i in term)
    need(arithmetic_terms(graph,root,stops)==expected,f'exact boxed arithmetic at node {root}')


def parts(graph,root,operation):
    return graph.args(root,operation)


def product_partner(graph,root,factor):
    values=list(parts(graph,root,'multiply'))
    need(len(values)==2 and factor in values,f'missing product operand {factor} at {root}')
    values.remove(factor)
    return values[0]


def inverse_partner(graph,root,denominator=None):
    values=list(parts(graph,root,'multiply'))
    need(len(values)==2,f'quotient product at {root}')
    choices=[]
    for i,x in enumerate(values):
        op,args=expr(graph,x)
        if op=='inverse' and (denominator is None or args==[denominator]):
            choices.append((values[1-i],args[0]))
    need(len(choices)==1,f'independent quotient denominator at {root}')
    return choices[0]


def registered_row_map(field):
    return [{k:row[k] for k in ROW_KEYS} for row in field['rows']]


def get_registered(fields,name):
    values=[field for field in fields if field['name']==name]
    need(len(values)==1,f'unique registry definition {name}')
    return values[0]


def list_guard_chain(graph,root):
    guards=[]
    for _ in range(5):
        coord,low,high,lower,root,upper=parts(graph,root,'smooth_piecewise')
        need(lower==upper==0,'outer source guard loses lazy zero branch')
        guards.append((coord,low,high))
    return guards


def source_geometry(graph, record, definition):
    wave=record['wave']
    R,Z,T,Y0,Y1,theta=definition['directions']
    own_arguments=wave['referenceArguments']
    local_formals=definition['rows'][0]['localParameters']
    need(len(local_formals)==16 and local_formals[:3]==[R,Z,T] and own_arguments[3:]==local_formals[3:],
         'fixed native argument ordering')
    own,reference=local_formals[3],local_formals[7]
    rad=product_partner(graph,own_arguments[0],R)
    rho,=parts(graph,rad,'sqrt_positive')
    need(product_partner(graph,own_arguments[2],T)==rho,'time dilation must use the same rho')
    axial=product_partner(graph,own_arguments[1],Z)
    axial_ell,=parts(graph,axial,'exp')
    potential_ell,=parts(graph,wave['potentialScale'],'exp')
    rho_ell,=parts(graph,rho,'exp')
    q_ell,=parts(graph,wave['Q'],'exp')
    factors=parts(graph,rho_ell,'multiply')
    log_factors=[factor for factor in factors if graph.record(factor)['op']=='log_positive']
    need(len(log_factors)==1,'positive source logarithm of 2')
    log_two=log_factors[0]
    two,=parts(graph,log_two,'log_positive')
    need(graph.rational(two)==2,'base-two source label')
    small_linear_atoms(graph,rho_ell,{tuple(sorted((log_two,own))):1,tuple(sorted((log_two,reference))):-1})
    small_linear_atoms(graph,q_ell,{tuple(sorted((log_two,own))):-1})
    a=wave['A']
    h_candidates=[atom for atom in parts(graph,a,'add') if expr(graph,atom)==('source_parameter',['h'])]
    need(len(h_candidates)==1,'original h source parameter')
    h=h_candidates[0]
    small_linear_atoms(graph,a,{():Fraction(1,2),(h,):1})
    candidates=[factor for factor in parts(graph,axial_ell,'multiply') if expr(graph,factor)==('log_positive',[rho])]
    need(len(candidates)==1,'source log rho')
    log_rho=candidates[0]
    small_linear_atoms(graph,axial_ell,{(log_rho,):Fraction(1,2),tuple(sorted((log_rho,h))):-1})
    gauge_log=[factor for factor in parts(graph,potential_ell,'multiply')
               if expr(graph,factor)==('log_positive',[rho])]
    need(len(gauge_log)==1,'same typed log rho operand in the potential')
    small_linear_atoms(graph,potential_ell,{tuple(sorted((gauge_log[0],h))):1})
    return {'R':R,'Z':Z,'T':T,'Y':[Y0,Y1],'theta':theta,'rho':rho,'h':h}


def verify_registered_wave(graph,native,record):
    wave=record['wave']
    representative=None
    rows_expected=None
    lookup={item['id']:item for item in native.expressions}
    sign_owners={}
    reference_defs=[]
    original_exprs=[]
    original_fields=[]
    fields=[get_registered(native.fields,name) for name in
            ('ActualForcedCurrent_velocity_0','ActualForcedCurrent_velocity_1','ActualForcedCurrent_velocity_2',
             'GenericSigned162_velocity_0','GenericSigned162_velocity_1','GenericSigned162_velocity_2')]
    for f in fields:
        if rows_expected is None:
            rows_expected=registered_row_map(f)
        need(len(f['rows'])==162 and registered_row_map(f)==rows_expected,'Forced and Signed 162 maps differ')
        original_fields.append(f['id'])
    for i,item in enumerate(wave['indexed']):
        own_field,actual,orders=native.application(graph,item['root'],APPEND_FIELD+str(i))
        need(own_field['id']==item['field'] and actual==own_field['parameters'] and not any(orders),
             'new gauge field native direct application')
        need(registered_row_map(own_field)==rows_expected,'candidate changes original frozen branch maps')
        need(Counter(row['label']['sign'] for row in own_field['rows'])=={1:81,-1:81},'both original signs')
        need(len({(row['label']['key'],row['label']['sign']) for row in own_field['rows']})==162,'unique original label pairs')
        if representative is None:
            representative=own_field
        seen=set()
        for row,forced_row,signed_row in zip(own_field['rows'],fields[i]['rows'],fields[i+3]['rows'],strict=True):
            sign=row['label']['sign']
            own_ref=lookup[row['localSystem']]
            native_forced=lookup[forced_row['localSystem']]
            native_signed=lookup[signed_row['localSystem']]
            match=REF_NAME.fullmatch(own_ref['name'])
            need(match is not None and int(match[2])==i, 'candidate reference-gauge native role')
            sign_index=int(match[1])
            need(native_forced['name'].endswith('_reference_'+str(sign_index))
                 and native_signed['name'].endswith('_reference_'+str(sign_index)),'original native sign-index route')
            need(sign_owners.setdefault(sign,sign_index)==sign_index,'candidate switches original sign-index route')
            if own_ref['id'] in seen:
                continue
            seen.add(own_ref['id'])
            call=product_partner(graph,own_ref['body'],wave['potentialScale'])
            defined,actual,orders=native.application(graph,call,f'SpatialStage1Gauge_own_{sign_index}_{i}')
            need(actual==wave['referenceArguments'] and defined['parameters']==own_ref['parameters']
                 and own_ref['parameters']==row['localParameters'],'native own/ref gauge shape and exact arguments')
            need(row['localBody']==own_ref['body'] and graph.prefix<=defined['body']<graph.count
                 and graph.prefix<=own_ref['body']<graph.count,'new gauge body append')
            for original in (native_forced,native_signed):
                # Each original reference body uses exp(power*log(rho)) times its own native application.
                factors=parts(graph,original['body'],'multiply')
                calls=[i0 for i0 in factors if graph.record(i0)['op']=='m3_coupled_expression_partial']
                need(len(calls)==1,'original reference body has one registered local application')
                own_source,old_args,_=native.application(graph,calls[0])
                need(old_args==wave['referenceArguments'],'same original own/ref source parameter substitution')
                need(list_guard_chain(graph,own_source['body'])==list_guard_chain(graph,defined['body']),
                     'candidate removes or changes a lazy original guard')
                original_exprs.append(own_source['id'])
            reference_defs.extend([defined['id'],own_ref['id']])
        need(len(seen)==2,'exact two native sign definitions per component')
    need(set(sign_owners.values())=={0,1} and len(set(reference_defs))==12,'distinct candidate append native registrations')
    for group,expected,original in [(native.expressions,reference_defs,original_exprs),
                                    (native.fields,[item['field'] for item in wave['indexed']],original_fields)]:
        last_ids=[row['id'] for row in group[-len(expected):]]
        need(set(last_ids)==set(expected) and not set(last_ids)&set(original), 'append-only last native definitions')
    return source_geometry(graph,record,representative),sign_owners


def verify_coefficient_apps(graph,native,record,sign_owners):
    for row in record['wave']['perTemplate']:
        # The original mapped complex potential is i*(shared real+i*shared imag).
        for term in row['potential'][:2]:
            for i,(imag,real) in enumerate(zip(term['imaginary'],term['real'],strict=True)):
                name=f'ActualMappedOriginalForced_{row["key"]}_m{term["m"]}'
                native.application(graph,imag,f'{name}_real_{i}')
                factors=parts(graph,real,'multiply')
                negative=[a for a in factors if graph.record(a)['op']=='rational' and graph.rational(a)==-1]
                need(len(negative)==1,'mapped complex real coefficient has its exact negative sign')
                base=product_partner(graph,real,negative[0])
                native.application(graph,base,f'{name}_imaginary_{i}')
                need(imag<graph.prefix and base<graph.prefix,'Forced complex source from original prefix')
        for i,root in enumerate(row['potential'][-1]['imaginary']):
            factors=parts(graph,root,'multiply')
            halves=[a for a in factors if graph.record(a)['op']=='rational' and graph.rational(a)==Fraction(1,2)]
            need(len(halves)==1,'Signed fundamental half coefficient')
            call=product_partner(graph,root,halves[0])
            native.application(graph,call,f'GenericSignedAfterForced_{sign_owners[row["sign"]]}_{i}')


def verify_means(graph,native,record,reference,R):
    operands=record['input']
    streams=operands['meanPotentials']
    temporal_azimuthal, five_azimuthal=operands['azimuthalSwirls']
    psi_definition,_,_=native.application(graph,streams[0],'afterActualSigned162_actual_meridional_potential')
    native.application(graph,five_azimuthal,'PostSignedFiveBump_v')
    checked=[]
    for root,which,raw in zip(reference['stages'][3]['inverses'],('theta','z'),
                              operands['temporalRawCenteredSources'],strict=True):
        definition,_,_=native.application(graph,root,f'ActualAfterSigned_{which}_OriginalFastTime')
        need(definition['body']==raw,'actual current Temporal native body')
        checked.append(root)
    topo=[]
    for result,wanted in ((temporal_azimuthal,checked[0]),(operands['temporalDesiredAxial'],checked[1])):
        factors=parts(graph,result,'multiply')
        minus=[a for a in factors if graph.record(a)['op']=='rational' and graph.rational(a)==-1]
        # The original denom is ci, and the source wraps the quotient in a negative sign.
        need(len(minus)==1,'post-Signed Temporal inverse sign')
        quotient=product_partner(graph,result,minus[0])
        numerator,ci=inverse_partner(graph,quotient)
        need(numerator==wanted,'post-Signed Temporal inverse application')
        topo.append(ci)
    need(topo[0]==topo[1],'common Temporal ci factor')
    temporal_compact,_=inverse_partner(graph,psi_definition['body'],R)
    temporal_terms=arithmetic_terms(graph,temporal_compact,limit=180)
    term_by_sign={a:ids for ids,a in temporal_terms.items()}
    need(len(temporal_terms)==2 and set(term_by_sign)=={1,-1}
         and len(term_by_sign[1])==1 and len(term_by_sign[-1])==2,
         'original Temporal T1 compact numerator')
    temporal_left=term_by_sign[1][0]
    temporal_wholes=[i for i in term_by_sign[-1] if graph.record(i)['op']=='definite_integral']
    need(len(temporal_wholes)==1,'retained original shifted whole T1')
    temporal_whole=temporal_wholes[0]
    left_args=parts(graph,temporal_left,'definite_integral')
    whole_args=parts(graph,temporal_whole,'definite_integral')
    need(left_args[:3]==whole_args[:3] and left_args[3]==R and whole_args[3]!=R,
         'original T1 translated integrand/binder and endpoints')
    graph.args(left_args[1],'coordinate')
    # Original FiveMap uses the raw primitive, retaining the compact candidate separately.
    primitive,_=inverse_partner(graph,streams[1],R)
    whole=operands['fiveWhole']
    pi=parts(graph,primitive,'definite_integral')
    wi=parts(graph,whole,'definite_integral')
    need(wi[:3]==pi[:3] and pi[3]==R and wi[3]!=R,'same original FiveMap integrand, binder and lower end')
    graph.args(pi[1],'coordinate')
    compact,_=inverse_partner(graph,operands['fiveCompactCandidate'],R)
    terms=arithmetic_terms(graph,compact,(primitive,whole),limit=180)
    rest={ids:value for ids,value in terms.items() if ids!=(primitive,)}
    need(terms.get((primitive,),0)==1 and len(rest)==1,'FiveMap compact candidate retains raw primitive')
    term,coefficient=next(iter(rest.items()))
    need(coefficient==-1 and len(term)==2 and whole in term,'FiveMap explicitly retained cutoff whole')
    return {'temporalInverseRoots':checked,'sameTemporalCi':topo[0],
            'temporalLeftAndWhole':[temporal_left,temporal_whole],'fiveOriginalPrimitive':primitive,
            'fiveWholeIntegral':whole,'fiveCompactCandidate':operands['fiveCompactCandidate'],
            'wholeIntegralAnalyticCancellation':'OPEN'}


def direct_derivative(graph,native,record,geometry):
    groups=record['normalizedRoots']
    R=geometry['R']
    field=record['wave']['indexed']
    checks=0
    # Independent connection and axial scale checks on simple indexed A_r, A_z.
    # The radial A_theta also binds the separate mean contributions below.
    approximate_epsilon=[]
    for i in (0,2):
        expected=native.application(graph,field[i]['root'])[0]
        radial,angular,axial=groups['G_A'][i]
        if i==0:
            terms=arithmetic_terms(graph,angular,(groups['A'][1],),limit=120)
            rem={key:c for key,c in terms.items() if groups['A'][1] not in key}
            connection={key:c for key,c in terms.items() if groups['A'][1] in key}
            need(len(connection)==1 and len(rem)==1,'physical cylindrical negative polar connection')
            neg_term,coef=next(iter(connection.items()))
            need(coef==-1 and len(neg_term)==2,'radial angular connection sign')
            inv_r=next(a for a in neg_term if a!=groups['A'][1])
            need(parts(graph,inv_r,'inverse')==[R],'radial angle connection denominator')
            term,coef=next(iter(rem.items()))
            need(coef==1 and len(term)==2 and inv_r in term,'angle derivative uses same radius')
            derivative=next(a for a in term if a!=inv_r)
        else:
            derivative,_=inverse_partner(graph,angular,R)
        definition,actual,orders=native.application(graph,derivative,zero_order=False)
        need(definition==expected and actual==expected['parameters'] and orders==[0,0,0,0,0,1],
             'physical angular native derivative slot')
        factors=parts(graph,axial,'multiply')
        if len(factors)==2:
            possibilities=[a for a in factors if graph.record(a)['op']=='m3_coupled_indexed_partial']
            need(len(possibilities)==1,'one direct indexed A axial derivative')
            axial_native=possibilities[0]
            eps=product_partner(graph,axial,axial_native)
            definition,actual,orders=native.application(graph,axial_native,zero_order=False)
            need(definition==expected and actual==expected['parameters'] and orders==[0,1,0,0,0,0],
                 'physical axial native derivative slot')
            approximate_epsilon.append(eps)
        else:
            raise ValueError('two actual indexed axial derivative factors')
        checks+=2
    need(len(set(approximate_epsilon))==1,'same positive native epsilon in both exact axial derivatives')
    epsilon=approximate_epsilon[0]
    exponent,=parts(graph,epsilon,'exp')
    h=geometry['h']
    log_q=product_partner(graph,exponent,h)
    need(parts(graph,log_q,'log_positive')==[record['wave']['Q']], 'actual epsilon=Q^h')
    checks+=1
    return {'checkedIndexedSpatialSlotsAndScale':checks,'epsilon':epsilon}


def linear_combination(graph, terms, opaque):
    out=defaultdict(Fraction)
    for scalar,node in terms:
        for ids,value in arithmetic_terms(graph,node,opaque,limit=200).items():
            out[ids]+=scalar*value
    return {ids:value for ids,value in out.items() if value}


def verify_roots(graph,native,record,reference,geometry):
    R=geometry['R']
    prefix=graph.prefix
    inputs=record['input']
    groups=record['normalizedRoots']
    waves=[row['root'] for row in record['wave']['indexed']]
    curl_candidates=[]
    for i,(latest,initial,delta,defect) in enumerate(zip(inputs['latest'],inputs['initialized'],
            groups['U'],record['gaugeDifferenceRootsForIndependentCheck'],strict=True)):
        need(initial<21_620_247,'initial angular current from verified pre-Forced stage')
        atoms=parts(graph,initial,'add')
        prefix_wave=[]
        for root in atoms:
            candidate=graph.record(root)
            if candidate['op'] in ('m3_aux_indexed_partial','m3_coupled_indexed_partial','m3_global_indexed_partial'):
                definition,_,_=native.application(graph,root)
                if definition['name']==f'OriginalAll81InitialAngular_velocity_{i}':
                    prefix_wave.append(root)
        need(len(prefix_wave)==1,'initial same-source initialized angular velocity component')
        need(reference['stages'][1]['roots']['velocity'][i] in parts(graph,latest,'add'),
             'latest physical component includes original signed current')
        small_linear_atoms(graph,delta,{(latest,):1,(initial,):-1})
        delta_op=parts(graph,defect,'add')
        need(delta in delta_op and len(delta_op)==2,'open gauge difference subtracts candidate from same-stage uncut current')
        other=next(atom for atom in delta_op if atom!=delta)
        factors=parts(graph,other,'multiply')
        have=[x for x in factors if graph.record(x)['op']=='rational' and graph.rational(x)==-1]
        need(len(have)==1,'gauge difference retains negative candidate curl')
        curl_candidates.append(product_partner(graph,other,have[0]))
    small_linear_atoms(graph,groups['A'][1],{(i,):1 for i in [waves[1],*inputs['meanPotentials']]})
    small_linear_atoms(graph,inputs['directSwirl'],{(i,):1 for i in inputs['azimuthalSwirls']})
    jets={item['label']:item['root'] for item in record['spatialJetAtoms']}
    need(jets['A2@0,0,0,0']==groups['A'][2],'axial Cartesian value equals source cylindrical value')
    potential=groups['A']
    grad=groups['G_A']
    curl_terms=[[(1,grad[2][1]),(-1,grad[1][2])],
                [(1,grad[0][2]),(-1,grad[2][0]),(1,inputs['directSwirl'])],
                [(1,grad[1][0]),(-1,grad[0][1])]]
    # The native Cartesian sum is independent of the curl builder.
    # The angular radial connection expands only in the third equation.
    opaque={*potential,inputs['directSwirl'],grad[2][1],grad[1][2],
            grad[0][2],grad[2][0],grad[1][0]}
    for candidate,terms in zip(curl_candidates,curl_terms,strict=True):
        need(arithmetic_terms(graph,candidate,opaque,200)==linear_combination(graph,terms,opaque),
             'candidate gauge curl-vs-covariant-gradient consistency')
    cos_sin={}
    for i,expected_signs in [(0,(1,-1)),(1,(1,1))]:
        values=arithmetic_terms(graph,jets[f'A{i}@0,0,0,0'],potential)
        need(len(values)==2,'two native cylindrical-to-Cartesian rotation terms')
        for j,sign in enumerate(expected_signs):
            [term]=[k for k in values if potential[j] in k]
            need(len(term)==2 and values[term]==sign,'exact Cartesian rotation sign')
            identity=next(a for a in term if a!=potential[j])
            function='cosine' if i==j else 'sine'
            need(parts(graph,identity,function)==[geometry['theta']],'fixed physical angle in Cartesian rotation')
            need(cos_sin.setdefault(function,identity)==identity,'common original trigonometric factors')
    b,_=inverse_partner(graph,jets['b@0,0,0'],R)
    need(b==inputs['directSwirl'],'original direct swirl divided by physical radius')
    _,radial_den=inverse_partner(graph,jets['b@1,0,0'])
    small_linear_atoms(graph,radial_den,{(R,):2})
    return {'originalInitialVelocity':inputs['initialized'],'originalPostFiveVelocity':inputs['latest'],
            'checkedActualUncutDifferences':3,'checkedOpenGaugeDifferenceClips':3,
            'checkedCandidateCurlAssemblyTerms':3,'checkedCartesianRotationTerms':4,
            'newGraphNodeRange':[prefix,graph.count-1]}


def check_spatial_structure(graph,native,record,reference):
    geometry,sign_owners=verify_registered_wave(graph,native,record)
    verify_coefficient_apps(graph,native,record,sign_owners)
    mean=verify_means(graph,native,record,reference,geometry['R'])
    stage=verify_roots(graph,native,record,reference,geometry)
    calc=direct_derivative(graph,native,record,geometry)
    return {'exactOriginalRowsReused':162,'newNativeGaugeDefinitions':12,'newNativeGaugeIndexedFields':3,
            'forcedPositiveNativeCoefficients':20,'signedPositiveNativeCoefficients':10,
            'resolvedGeometryRoots':geometry,'coefficientAndScopeReadback':mean,'rootLineage':stage,
            'physicalDerivativeControls':calc,'gaugesStillUnreduced':record['gaugeDifferenceRootsForIndependentCheck']}
