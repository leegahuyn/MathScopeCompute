"""Actual outer angular/pulse root domains and terminal-heat shear.

The full 3311-node original outer program is already inside the small fixed
payload. No full N6 graph or new numerical outer evaluator is needed.
"""
import argparse,hashlib,json,sys
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path
BASE=Path(__file__).resolve().parent

def inequalities():
    lam=F(1,2**200);D=1024*lam**30
    assert 120000*F(2,10**6)<1
    assert 7*3**4<1024
    assert 2**17*D<F(1,4)
    assert 2**13*D<1
    assert 4*2**18*9*D<F(1,2)
    assert 2+9*18<2**8
    assert 2**8*lam<1
    assert 2**32*lam**28<1
    assert 16*lam<F(1,64) and 4096*lam<F(1,64)
    assert (2+3*2)/F(2)==4 and (2+2)/F(2)==2
    assert F(1,64)+F(1,64)-F(1,8)==-F(3,32)
    # Heat: original sigma'<=256, rho=h/256, Z<1/100.
    h=F(1,1000);z=F(1,100)
    assert 1-h*(1+h)*z>F(1,2)
    assert 2-1/(1-h/256)-8*z>F(1,2)
    return {'actualAngularDebtBelow1024Lambda30':True,
      'actualAngularDiscriminantAboveHalf':True,'actualAngularCoefficientsInsideOriginal1024Lambda29':True,
      'actualAngularShearAbove2PlusLambda':True,'actualPulseAmp0BelowMinus3Over32':True,
      'actualPulseAmp2PositiveFromKb':True,'actualHeatShearAbove2PlusHOver2':True}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--payload',type=Path,required=True);ap.add_argument('--kernel-binding',type=Path,required=True)
    ap.add_argument('--heat',type=Path,required=True);ap.add_argument('--kernels',type=Path,default=BASE/'regularity-source')
    ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
    try:import sympy as s
    except ImportError:
        sys.path.insert(0,str(BASE/'audit-deps'));import sympy as s
    payload=json.loads(a.payload.read_text(encoding='utf8'));fixed=payload['fullNativePayloads']['fixed'];outer=fixed['outer'];nodes=outer['nodes']
    paper_sha='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
    assert fixed['source']['sourcePaperSHA256']==paper_sha
    binding=json.loads(a.kernel_binding.read_text(encoding='utf8'))
    assert binding['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1'
    assert binding['fixedDefinitionSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
    assert binding['fullActualOuterProgramEqual'] and binding['sourceKernelBytesUnchanged']
    heat=json.loads(a.heat.read_text(encoding='utf8'))
    assert heat['schema']=='MathScope.N6.ActualCompleteHeatRegularity/1'
    assert heat['actualIntegralBindings']['fullOriginalHeatLoss'] and heat['actualIntegralBindings']['fullOriginalGammaDenominator']
    assert heat['actualIntegralBindings']['profileArgument']=='2*(1-eta^2)/X'
    assert all(heat['negativeControls'].values())
    export=json.loads((a.kernels/'SOURCE_EXPORT.json').read_text(encoding='utf8'))
    source_paths=['research-ide/mathscope-m2/navier/actual-global-source-outer.mjs',
      'research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs',
      'research-ide/mathscope-m3/navier/source-global-representative.mjs',
      'research-ide/mathscope-m2/navier/actual-common-admissible-band.mjs']
    source_rows=[]
    for path in source_paths:
        row=next(v for v in export['files'] if v['path']==path)
        sha=hashlib.sha256((a.kernels/path).read_bytes()).hexdigest();assert sha==row['sha256']
        source_rows.append({'path':path,'sha256':sha,'sourceBytesUnchanged':True})
    def parse(root,overrides):
        @lru_cache(None)
        def at(i):
            if i in overrides:return overrides[i]
            n=nodes[i];op,x=n['op'],n['args']
            if op=='rational':return s.Rational(*map(int,x))
            if op in ('source_parameter','coordinate'):return s.Symbol(str(x[0]))
            if op=='add':return sum(at(j) for j in x)
            if op=='multiply':return s.prod(at(j) for j in x)
            if op=='integer_power':return at(x[0])**x[1]
            if op=='inverse':return 1/at(x[0])
            if op=='exp':return s.exp(at(x[0]))
            if op=='sqrt_positive':return s.sqrt(at(x[0]))
            if op=='log_positive':return s.log(at(x[0]))
            raise AssertionError('Unreviewed actual outer algebra '+str(i)+' '+op)
        return at(root)
    ang=outer['equations']['angular'];A00,A01,A10,A11,Q0,Q1,debt=s.symbols('A00 A01 A10 A11 Q0 Q1 debt')
    overrides={ang['linear'][0][0]:A00,ang['linear'][0][1]:A01,ang['linear'][1][0]:A10,ang['linear'][1][1]:A11,ang['quadratic'][0]:Q0,ang['quadratic'][1]:Q1,ang['target'][0]:debt}
    ratio=A01/A00;target=debt/A00;aq=Q0*ratio**2+Q1;bq=A11-A10*ratio-2*Q0*target*ratio;cq=A10*target+Q0*target**2
    expected2=-2*cq/(bq-s.sqrt(bq*bq-4*aq*cq));expected1=target-ratio*expected2
    c1,c2=[parse(root,overrides) for root in ang['coefficients']]
    assert s.simplify(c1-expected1)==s.simplify(c2-expected2)==0
    assert s.simplify(A00*c1+A01*c2-debt)==0
    assert s.simplify(aq*c2*c2+bq*c2+cq)==0
    assert s.simplify(c2+expected2)!=0 # changed actual small-branch sign
    pulse=outer['equations']['pulse'];p0,p1,p2=s.symbols('amp0 amp1 amp2')
    m00,m01,m10,m11,d0,d1=s.symbols('m00 m01 m10 m11 incoming0 incoming1')
    mov={pulse['linear'][0][0]:m00,pulse['linear'][0][1]:m01,
         pulse['linear'][1][0]:m10,pulse['linear'][1][1]:m11,
         pulse['incoming'][0]:d0,pulse['incoming'][1]:d1}
    det=m00*m11-m01*m10
    assert s.cancel(parse(pulse['affineConstant'][0],mov)-(d0*m11-m01*d1)/det)==0
    assert s.cancel(parse(pulse['affineConstant'][1],mov)-(m00*d1-d0*m10)/det)==0
    lam_symbol=s.Symbol('lambda');b0,b1=s.symbols('bump0 bump1')
    for i,base in enumerate((b0,b1)):
        got=parse(pulse['linear'][i][1],{pulse['linear'][i][0]:base,8:lam_symbol})
        assert s.simplify(got-base*s.exp(1-2*(i+1)*lam_symbol))==0
    proots=pulse['amplitudePolynomial'];actual_amp=parse(pulse['amplitude'],dict(zip(proots,[p0,p1,p2])))
    assert s.simplify(actual_amp-(s.sqrt(p1*p1-4*p2*p0)-p1)/(2*p2))==0
    nu,ne,w0,w1,C0,C1,Kb,B0,B1=s.symbols('nu ne w0 w1 C0 C1 Kb B0 B1')
    ov={889:nu,893:ne,907:w0,921:w1,outer['roots']['Kb']:Kb,
        pulse['affineConstant'][0]:C0,pulse['affineConstant'][1]:C1,
        pulse['affineAmplitude'][0]:B0,pulse['affineAmplitude'][1]:B1}
    assert s.expand(parse(proots[0],ov)-(nu-ne/2+w0*C0*C0+w1*C1*C1))==0
    assert s.expand(parse(proots[2],ov)-(Kb+w0*B0*B0+w1*B1*B1))==0
    # Bind the actual normalization of the crucial negative energy term.
    yp,ap,lf,lp,us,en,lam,eta=s.symbols('yp ap logf logP U2shape Energy lambda eta')
    ps=next(v for v in outer['stages'] if v['id']=='pulse')
    atom={ps['start']:yp,ps['logAStart']:ap,18:lf,11:lp,593:us,561:en,8:lam,2:eta}
    assert s.simplify(parse(889,atom)-lam*eta**2*us*s.exp(-(yp+2*lp+2*ap+2*lf)))==0
    assert s.simplify(parse(893,atom)-lam*en*s.exp(-(yp+2*ap+2*lf)))==0
    x=s.Symbol('x',real=True);v=x-s.Rational(1,100)
    kp=s.exp(-2*x)*(v*v/2+v/2+s.Rational(1,4))
    assert s.simplify(-s.diff(kp,x)-s.exp(-2*x)*v*v)==0
    params=fixed['source']['parametersExactExpressions']
    assert params['Tf']=={'integer':128} and params['BOuter']=={'product':[{'integer':1000},{'ref':'T'}]}
    assert params['co']=={'rational':'1/256'}
    checks=inequalities()
    result={'schema':'MathScope.N6.ActualOuterRootAndHeatDomains/1','fixedDefinitionSHA256':binding['fixedDefinitionSHA256'],
      'sameUserProvidedPaperSHA256':paper_sha,
      'originalPaperApplication':{'angular':'Proposition A.4 and A.3, (A.10)-(A.11), pp130-132',
        'pulse':'(A.15),(A.19)-(A.20), pp131-133','pressure':'Lemma A.5, (A.21)-(A.23), pp133-134',
        'heat':'Lemma A.6 (A.32)-(A.38), p138; Proposition A.7 (A.39), pp139-140',
        'finiteN':'Lemma C.1 (C.9)-(C.10), pp158-160; Proposition C.2 (C.11)-(C.13), p161'},
      'sourceRows':source_rows,'originalOuterNodeCount':len(nodes),
      'inputSHA256':{name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in [('payload',a.payload),('kernel-binding',a.kernel_binding),('heat',a.heat)]},
      'independentActualAlgebra':{'angularLiteralSmallBranchAndBothEquations':True,'pulseLiteralAmplitudeRoot':True,
        'actualPulseLinearExponentialRowsAndExactSolve':True,
        'pulseActualNegativeEnergyTermAndNormalization':True,'actualKbPositiveIntegralPrimitive':True,'changedAngularBranchRejected':True},
      'independentUniformInequalities':checks,
      'provedActualConclusions':{'etaDomain':'[-1,1] (strict representative eta is interior)',
        'angularCoefficients':'abs(cj)<1024lambda^29, real C-infinity original small branch',
        'angularE':'positive, a>2+lambda','pulseAmplitude':'positive real C-infinity, actual amp0<-3/32,amp2>0',
        'terminalHeatE':'positive, a>2+h/2','representativeGeometry':'Every active box selector gives Xa<Xrep<Xb, abs(etarep)<1, 1/2<srep<2'},
      'proof':'ACTUAL_OUTER_DOMAINS_AND_REPRESENTATIVES_KO.md',
      'remainingComposition':['Exact source binding/application of I1/I2 true root boxes and their local shear preservation.','Combine postC12 gap and outer cases to completed-leading frozen-frame application.','Actual full covariance/weight cone and final g21 pressure-J application.'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualOuterAngularPulseRootDomains':True,'actualTerminalHeatPositiveGap':True,'newOriginalDischarged':0}))

if __name__=='__main__':main()
