"""Bind the saved Temporal potential to its shifted radial FTC curl."""
from pathlib import Path
from hashlib import sha256
import gzip
import json
import sys
import sympy as sp

assert len(sys.argv) == 5, 'Pass GOAL_NEXT, ORIGINAL_M3_NAVIER, ORIGINAL_GRAPH_DIRECTORY and NEW_OUTPUT.'
goal, runtime, graph, output = map(Path, sys.argv[1:])
assert not output.exists()
def load(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return json.loads(data)

old = load(goal/'whole-k-annular-pressure-lower/mean-path-longitudinal.json',
           'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59')
registry = load(graph/'original-source-functions.json',
                '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333')
source_pins = old['nativeMean']['originalRuntimeSHA256']
texts = {}
for name in ('source-temporal-potential.mjs','source-full-mean-equations.mjs',
             'source-pressure.mjs','source-global-initial-mean.mjs'):
    data = (runtime/name).read_bytes()
    pin = source_pins['research-ide/mathscope-m3/navier/'+name]
    assert sha256(data).hexdigest() == pin
    texts[name] = data.decode()
for name, literals in {
    'source-full-mean-equations.mjs': [
        'Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))',
        'De=(x,e)=>G.add(Dr(x),G.div(G.mul(G.q(e),x),R))'],
    'source-pressure.mjs': [
        'shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)',
        'integrand=G.simultaneousSubstitute(body,[R,...Y],[r,...shiftedY])'],
    'source-temporal-potential.mjs': [
        'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
        'radialNumerator=G.add(partialRnumerator,G.mul(a,Lnumerator))',
        'G.neg(G.mul(a,angularIntegrals.left))',
        'G.mul(chi,a,angularIntegrals.whole)',
        'G.sub(gammaDesired,cutoffRemainder)'],
    'source-global-initial-mean.mjs': [
        'previous=temporal.potential.velocity',
        'updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])]))',
        'realizedGamma=De(psi,1)',
        "id:'post-temporal-five-bump-has-no-auxiliary-variable'"],
}.items():
    for literal in literals:
        assert literal in texts[name], (name, literal)

needed = {20,622791,622798,622802,622803,622804,623066,623135,633710,633712,633733,633761,
          635044,635045,635059,635060,643116}
needed.update(range(1706622,1706638))
needed.update(range(1706661,1706667))
needed.update(range(1706766,1706786))
needed.update((1706796,3614767,3614771,3614776,3614778,3614789,3614790,3614791,3614792))
h = sha256()
nodes = {}
number = -1
with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as source:
    for line in source:
        h.update(line)
        if number in needed:
            nodes[number] = json.loads(line)
        number += 1
assert number == 4456994
assert h.hexdigest() == old['sourceSHA256'] == 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
def check(i, op, args):
    assert nodes[i] == {'op':op,'args':args}, i
params = [622791,622802,622803,622804,635044,635045]
check(623135,'inverse',[622802])
check(1706770,'m3_aux_expression_partial',[-13,params,[0,0,0,0,0,0]])
check(1706774,'m3_aux_expression_partial',[-13,params,[0,1,0,0,0,0]])
check(1706775,'m3_aux_expression_partial',[-13,params,[0,0,0,0,1,0]])
check(1706776,'m3_aux_expression_partial',[-13,params,[0,0,0,0,0,1]])
check(1706777,'multiply',[623066,1706776])
check(1706778,'add',[1706775,1706777])
check(1706779,'multiply',[635060,1706778])
check(1706780,'add',[1706774,1706779])
check(1706781,'multiply',[623135,1706770])
check(1706782,'add',[1706780,1706781])
check(1706771,'m3_aux_expression_partial',[-13,params,[0,0,1,0,0,0]])
check(1706772,'multiply',[622798,1706771])
check(1706773,'multiply',[20,1706772])
check(1706661,'m3_aux_inverse_partial',[1,[1706628,622803,622804,622791,1706635,1706637],[0,0,0,0,0]])
check(1706664,'multiply',[1706628,1706663])
check(1706665,'definite_integral',[1706664,1706628,633710,622802])
check(1706666,'definite_integral',[1706664,1706628,633710,633712])
check(1706634,'add',[643116,1706633])
check(643116,'multiply',[20,635059])
check(1706635,'add',[635044,1706634])
check(1706636,'multiply',[623066,1706634])
check(1706637,'add',[635045,1706636])
check(1706768,'add',[1706665,1706767])
check(1706769,'multiply',[623135,1706768])
check(1706796,'multiply',[623135,1706785])
check(3614790,'add',[1706773,3614789])
check(3614791,'add',[1706624,3614767])
check(3614792,'add',[1706782,3614771])
def decode(value):
    return json.loads(value) if isinstance(value,str) else value
common = decode(registry['base'])
definitions = decode(common['expressionDefinitions'])
definition = definitions[12]
assert definition['body'] == 1706769 and definition['parameters'] == params
assert definition['name'] == 'global_actual_temporal_actual_meridional_potential'

R,a,chi,chiR,gamma,J,JL,JW = sp.symbols('R a chi chi_R gamma_d J J_L J_W',real=True)
partialN = R*gamma - a*JL - chiR*J + chi*a*JW
LN = JL-chi*JW
covariantN = sp.expand(partialN+a*LN)
assert sp.expand(covariantN-(R*gamma-chiR*J)) == 0
assert sp.simplify(covariantN/R-(gamma-chiR*J/R)) == 0
# An omitted external a*L term leaves a nonzero symbolic residual.
negative_residual = sp.expand(partialN-(R*gamma-chiR*J))
assert sp.expand(negative_residual+a*LN) == 0 and negative_residual != 0
# On the radial plateau, C=C(z,t), Amean=psi e_theta.
C,Cz,Czz,psi,psiR,psiZ = sp.symbols('C C_z C_zz psi psi_R psi_Z',real=True)
commutator = -Cz*psi
assert sp.diff(commutator,psi)*psiR == -Cz*psiR
out = {
    'status':'VERIFIED_SAVED_TEMPORAL_COVARIANT_CURL_SOURCE_IDENTITY',
    'sourceSHA256':h.hexdigest(),'sourceNodes':number,
    'registrySHA256':'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333',
    'runtimePins':{name:source_pins['research-ide/mathscope-m3/navier/'+name] for name in texts},
    'sourceNodesRetained':nodes,
    'actualPsi':1706770,'actualBeta':1706773,'actualGamma':1706782,
    'actualCompleteVelocity':[3614790,3614791,3614792],
    'definition':definition,
    'actualShiftedInverseArguments':nodes[1706661]['args'],
    'actualShiftedIntegrals':{'left':1706665,'whole':1706666,'radialVariable':1706628,
                             'inner':633710,'outer':633712},
    'actualRadialDirection':{'a':635060,'L':'partial_Y0 + #623066 partial_Y1'},
    'identity':'(partial_R+a L+1/R) psi = gamma_d - (partial_R chi)*J/R',
    'betaIdentity':'beta=-epsilon partial_Z psi',
    'phaseCancellation':{'partialN':str(partialN),'LN':str(LN),'D_R_N':str(covariantN)},
    'negativeWithoutExternalAL':str(negative_residual),
    'outerAxialCutoff':{
        'sourceGauge':'Amean=Q^(-h) psi e_theta',
        'curlProduct':'curl(C Amean)=C curl(Amean)-C_z Q^(-h) psi e_r',
        'radialDerivativeOfPsi':'D_R psi=gamma-psi/R',
        'axialDerivativeOfPsi':'epsilon partial_Z psi=-beta',
        'remaining':'A source-bound bound on psi and the actual outer cutoff/flat-join chart must be supplied for the commutator estimate.'},
    'assumptions':['original smooth zero-extended source and fixed radial endpoints',
        'FTC and differentiation under the translated integral',
        'the original radial primitive has derivative a and is independent of Z,T,Y',
        'fixed reference band and actual physical Y(R) with derivative a*vr',
        'for the outer product formula, the original radial cutoff is on its plateau'],
    'correction':'The previously listed independent a*L(psi) gap in the Temporal curl is resolved by the actual shifted T1 definition. Native gamma already contains that covariant derivative.',
    'scope':'Saved initialized source Temporal curl and source FiveMap assembly only. This source identity does not evaluate the remaining outer-cutoff commutator, later corrections, actual energy acceptance or final jets.',
    'release':'HOLD',
}
output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
print('PASS actual Temporal radial shift cancels external a*L; cutoff A1 retained')
