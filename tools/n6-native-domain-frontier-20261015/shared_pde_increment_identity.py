"""Exact reusable PDE factorization, with every square and cutoff term.

This proves an ordinary smooth-function identity. It never treats this
kernel proof as a certificate that the current source fields are smooth.
"""
import argparse,json
from pathlib import Path
import sympy as S

def derive():
    x=S.symbols('x0:3',real=True);t=S.Symbol('t',real=True);nu=S.Symbol('nu',real=True)
    u=[S.Function('u'+str(j))(*x,t) for j in range(3)]
    w=[S.Function('w'+str(j))(*x,t) for j in range(3)]
    p=S.Function('p')(*x,t);pi=S.Function('pi')(*x,t)
    lap=lambda f:sum(S.diff(f,a,2) for a in x)
    div=lambda v:sum(S.diff(v[j],x[j]) for j in range(3))
    adv=lambda a,b,j:sum(a[k]*S.diff(b[j],x[k]) for k in range(3))
    residual=lambda v,P,j:S.diff(v[j],t)+adv(v,v,j)+S.diff(P,x[j])-nu*lap(v[j])
    linear=lambda j:S.diff(w[j],t)+adv(u,w,j)+adv(w,u,j)+S.diff(pi,x[j])-nu*lap(w[j])
    quadratic=lambda j:sum(S.diff(w[j]*w[k],x[k]) for k in range(3))
    defect=[S.expand(residual([a+b for a,b in zip(u,w)],p+pi,j)-residual(u,p,j)-linear(j)-quadratic(j)) for j in range(3)]
    factored=[S.simplify(defect[j]+w[j]*div(w)) for j in range(3)]
    assert factored==[0,0,0]
    # The physical residual/force is not set to zero by this equality.
    forcing=[S.Function('f'+str(j))(*x,t) for j in range(3)]
    force_checks=[S.simplify((residual([a+b for a,b in zip(u,w)],p+pi,j)-forcing[j])
                    -(residual(u,p,j)-forcing[j])-linear(j)-quadratic(j)+w[j]*div(w)) for j in range(3)]
    assert force_checks==[0,0,0]
    def curl(A):
        return [S.diff(A[2],x[1])-S.diff(A[1],x[2]),
                S.diff(A[0],x[2])-S.diff(A[2],x[0]),
                S.diff(A[1],x[0])-S.diff(A[0],x[1])]
    chi=S.Function('chi')(*x);A=[S.Function('A'+str(j))(*x,t) for j in range(3)]
    full=curl([chi*a for a in A]);assert S.simplify(div(full))==0
    grad=[S.diff(chi,a) for a in x]
    cross=[grad[1]*A[2]-grad[2]*A[1],grad[2]*A[0]-grad[0]*A[2],grad[0]*A[1]-grad[1]*A[0]]
    assert all(S.simplify(full[j]-chi*curl(A)[j]-cross[j])==0 for j in range(3))
    # Explicit polynomial adverse controls detect a lost quadratic term,
    # the opposite cross-advection term, and the discarded cutoff curl.
    sample_w=[x[0],-x[1],S.Integer(0)]
    assert div(sample_w)==0
    omitted_square=[adv(sample_w,sample_w,j) for j in range(3)]
    assert omitted_square==[x[0],x[1],0]
    sample_u=[S.Integer(1),S.Integer(0),S.Integer(0)]
    assert adv(sample_u,sample_w,0)==1
    sample_A=[S.Integer(0),x[0]*x[2],S.Integer(0)]
    dropped=div([x[0]*a for a in curl(sample_A)])
    assert S.simplify(dropped)==-x[0]
    assert S.simplify(div(curl([x[0]*a for a in sample_A])))==0
    return {
      'schema':'MathScope.N6.SharedPDEIncrementIdentity/1',
      'functionPremise':'The SAME ordinary physical u,w,p,pi and cutoff/potential are jointly smooth to the orders used; viscosity is the same constant.',
      'exactUnconditionalDefect':'R(u+w,p+pi)-R(u,p)-L_u(w,pi)-div(w tensor w)=-w*div(w)',
      'independentComponentResiduals':list(map(str,factored)),
      'linearTermsRetained':['partial_t w','(u dot grad)w','(w dot grad)u','grad pi','-nu Laplacian w'],
      'actualNonlinearSquareRetained':True,'forcePreserved':list(map(str,force_checks)),
      'fullCutoffCurlIdentity':'curl(chi*A)=chi*curl(A)+grad(chi) cross A; div(curl(chi*A))=0',
      'strictNegativeControls':{'droppedQuadraticTermRejected':True,'droppedCrossAdvectionRejected':True,'droppedCutoffCurlRejected':True},
      'sourceApplicationComposed':False,'currentNativeSmoothnessAssumedProved':False,
      'physicalForceDeclaredZero':False,'actualSourceCorrectionInserted':False,
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    result=derive();a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'allThreeExactIncrementIdentities':True,'nonlinearSquareAndForceAndCutoffCurlRetained':True,'sourceApplicationComposed':False,'newDischarged':0}))
