"""Compare original Picard matrix row with an independent symbolic transcription.

The exact graph and function registry are authenticated. Analytic nodes are left
as symbolic atoms; this proves coefficient algebra only, not source ODE semantics.
"""
import argparse,gzip,hashlib,json
from functools import lru_cache
from pathlib import Path
import sympy as s

if not __debug__:
 raise RuntimeError('Optimized Python disables required integrity assertions')

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 rb=(a.source/'original-source-functions.json').read_bytes();assert hashlib.sha256(rb).hexdigest()==REG
 s0=json.loads(json.loads(rb)['base']['base']['picard'])[0]
 assert s0['name']=='ActualSameN3OrderOneInner'
 A0=s0['A0'][5];A1=s0['A1'][5];forcing=s0['forcing'][5]
 assert A0==[25811,25921,25923,25560,0,25808]
 assert A1==[0,25934,25936,25576,0,0] and forcing==26744
 assert s0['sourceLeading']=={'F0':25601,'U0':25638,'v0':25637,'omega0OverX':26393}
 h=hashlib.sha256();d=[];count=0
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  hdr=f.readline();h.update(hdr);meta=json.loads(hdr)
  for line in f:
   h.update(line)
   if count<=117047:d.append(json.loads(line))
   count+=1
 assert count==4420257==meta['node_count'] and h.hexdigest()==GRAPH
 eta,xi,H,F0,U0,v0,Ux,Ueta,Omega,Visc=s.symbols('eta xi h F0 U0 v0 Ux Ueta Omega Visc',real=True)
 x=xi**2; A=s.Rational(1,2)+H; D=s.Rational(1,2)-H; lam=2*H
 L=1-2*H*eta**2; delta=1-eta**2;gamma=-A+lam;p_exp=-2*A+lam
 aliases={2:eta,9:H,25516:xi,25601:F0,25638:U0,25637:v0,25901:Ux,25911:Ueta,26393:Omega,26738:Visc}
 shapes={
  25601:('smooth_piecewise',[25586,3617,24805,25589,25600,25600]),
  25638:('smooth_piecewise',[25586,3617,24805,25605,25621,25621]),
  25637:('smooth_piecewise',[25586,3617,24805,25619,25636,25636]),
  25901:('smooth_piecewise',[25586,3617,24805,25815,25900,25900]),
  25911:('smooth_piecewise',[25586,3617,24805,25908,25910,25910]),
  26394:('multiply',[50,26393]),26738:('multiply',[1953,26737]),
  25586:('integer_power',[25516,2])}
 for i,(op,args) in shapes.items():assert d[i]=={'op':op,'args':args},i
 @lru_cache(None)
 def val(i):
  if i in aliases:return aliases[i]
  node=d[i];op=node['op'];v=node['args']
  if op=='rational':return s.Rational(int(v[0]),int(v[1]))
  if op=='add':return sum(map(val,v),s.S.Zero)
  if op=='multiply':return s.prod(map(val,v))
  if op=='inverse':return 1/val(v[0])
  if op=='integer_power':return val(v[0])**v[1]
  raise ValueError((i,op,v))
 Hu=x*Ux;Z0=(2*eta*(-A*U0-Hu)+delta*Ueta)/L; pKnown=-Omega/2
 expected0=[-8*eta*x*F0/L,
   2*gamma*(2*eta*U0-1)/L+4*eta*(A-lam)*Hu/L+2*Z0,
   -4*eta*(D+lam)*Hu/L,4*p_exp*eta/L,0,xi/L+xi*v0-2*eta*xi*U0/L]
 expected1=[0,2*(D*eta+delta*U0-delta*Hu)/L,-2*delta*Hu/L,2*delta/L,0,0]
 expected_force=-2*Visc-4*eta*x*pKnown/L
 def rem(x):return s.factor(s.together(x))
 rows0=[rem(val(i)-v) for i,v in zip(A0,expected0)]
 rows1=[rem(val(i)-v) for i,v in zip(A1,expected1)]
 force=rem(val(forcing)-expected_force)
 assert rows0==[0]*6,(A0,rows0)
 assert rows1==[0]*6,(A1,rows1)
 assert force==0,force
 # A wrong pressure coefficient is not accepted by this independent comparison.
 wrong=rem(val(A0[3])-5*p_exp*eta/L)
 assert wrong!=0
 # Project the *actual* order-one stress residual as eight separately
 # authenticated source terms. Treat derivatives and fields as independent
 # atoms; semantic derivative identities are deliberately not assumed here.
 X,U,U1x,U1xx,U1eta,P,Px,Peta,V1,U0x,U0eta,RawVisc=s.symbols(
  'X U U1x U1xx U1eta P Px Peta V1 U0x U0eta RawVisc',real=True)
 raw_aliases={2:eta,9:H,4756:X,9236:U0,18778:v0,33214:U0x,19029:U0eta,
  29289:U,72309:U1x,72376:U1xx,87475:U1eta,50558:P,96317:Px,
  117024:Peta,29440:V1,79047:RawVisc}
 @lru_cache(None)
 def raw(i):
  if i in raw_aliases:return raw_aliases[i]
  node=d[i];op=node['op'];v=node['args']
  if op=='rational':return s.Rational(int(v[0]),int(v[1]))
  if op=='add':return sum(map(raw,v),s.S.Zero)
  if op=='multiply':return s.prod(map(raw,v))
  if op=='inverse':return 1/raw(v[0])
  if op=='integer_power':return raw(v[0])**v[1]
  raise ValueError(('raw residual unsupported',i,op,v))
 actual_terms=[87480,87481,87488,87489,87490,117027,117030,117031]
 def Z(b,u,ux,ueta):return (2*eta*(b*u-X*ux)+delta*ueta)/L
 expected_raw=[(-gamma*U+D*eta*U1eta+X*U1x)/L,X*v0*U1x,
  U0*Z(gamma,U,U1x,U1eta),X*V1*U0x,U*Z(-A,U0,U0x,U0eta),
  Z(p_exp,P,Px,Peta),-2*(X*U1xx+U1x),-RawVisc]
 raw_residuals=[rem(raw(i)-v) for i,v in zip(actual_terms,expected_raw)]
 assert raw_residuals==[0]*8,(actual_terms,raw_residuals)
 def flatten(i):
  n=d[i]
  return sum((flatten(j) for j in n['args']),[]) if n['op']=='add' else [i]
 assert sorted(flatten(117045))==sorted(actual_terms)
 assert rem(raw(117045)-sum(expected_raw))==0
 raw_wrong=rem(-raw(117029)-expected_raw[6]);assert raw_wrong!=0
 # Relate BOTH authenticated AST projections under explicit calculus and
 # profile identifications; this is not a proof those hypotheses hold.
 F,K,W,Uxx,Ut,Kt,Pt=s.symbols('F K W Uxx Ut Kt Pt',real=True)
 v1=(2*eta*U-2*eta*(D+lam)*(U+K)-delta*(Ut+Kt))/L
 substitutions={X:xi**2,U1x:W/(2*xi),U1xx:(Uxx-W/xi)/(4*xi**2),
  U1eta:Ut,Peta:Pt,Px:2*F0*F+pKnown,V1:v1,U0x:Ux,U0eta:Ueta,RawVisc:Visc}
 projected_raw=raw(117045).subs(substitutions,simultaneous=True)
 fields=[F,U,K,P,s.S.Zero,W];etas=[s.S.Zero,Ut,Kt,Pt,s.S.Zero,s.S.Zero]
 projected_row=sum(val(i)*v for i,v in zip(A0,fields))+sum(val(i)*v for i,v in zip(A1,etas))+val(forcing)
 bridge=rem(2*projected_raw-(-Uxx-W/xi+projected_row))
 assert bridge==0,bridge
 # Check the source v1 formula and Picard pressure row independently of the
 # aliases used above. Integral/derivative and ODE semantics still need proof.
 assert s0['A0'][3]==[25602,0,0,0,0,0] and s0['A1'][3]==[0]*6
 assert s0['forcing'][3]==26395
 assert rem(val(25602)-4*xi*F0)==0 and rem(val(26395)-2*xi*pKnown)==0
 assert d[96317]=={'op':'smooth_piecewise','args':[4756,28819,28824,87492,96316,0]}
 assert d[87492]=={'op':'actual_background_even_profile','args':[0,3,4756,2,1,0]}
 assert d[29332]=={'op':'definite_integral','args':[29331,29329,0,1]}
 assert d[29343]=={'op':'definite_integral','args':[29342,29329,0,1]}
 M,Meta=s.symbols('M Meta',real=True)
 raw_aliases.pop(29440);raw_aliases.update({29336:M,29436:Meta});raw.cache_clear()
 v1_remainder=rem(raw(29440)-(2*eta*U-2*eta*(D+lam)*M-delta*Meta)/L)
 assert v1_remainder==0,v1_remainder
 raw_aliases.pop(29336);raw_aliases.pop(29436);raw_aliases[29440]=V1;raw.cache_clear()
 result={'status':'PASS','graph_sha256':GRAPH,'registry_sha256':REG,'nodes':count,
  'A0_row5':A0,'A1_row5':A1,'forcing':forcing,'remainder_A0':list(map(str,rows0)),
  'remainder_A1':list(map(str,rows1)),'forcing_remainder':str(force),
  'negative_control_wrong_pressure_coefficient_remainder':str(wrong),
  'raw_source_id':117045,'raw_term_ids':actual_terms,
  'raw_remainder_terms':list(map(str,raw_residuals)),
  'raw_negative_control_wrong_viscosity_remainder':str(raw_wrong),
  'raw_analytic_atoms':{str(i):('v1_factor' if i==29440 else str(v)) for i,v in raw_aliases.items()},
  'notation':'source node #29440 is v1_factor; manuscript radial coefficient V1 is X*v1_factor',
  'conditional_ast_bridge_remainder':str(bridge),
  'source_v1_average_formula_remainder':str(v1_remainder),
  'picard_pressure_row':'A0[3,0]=4xi*F0; forcing[3]=2xi*(-Omega/2); all other coefficients 0',
  'bridge_substitutions':['X=xi^2 and xi != 0','U_X=W/(2xi), U_XX=(Uxx-W/xi)/(4xi^2)',
   'actual and Picard leading U0/v0 and their derivatives agree','actual raw lower viscosity equals Picard lower viscosity',
   'Pi_X=2 F0 F1 - Omega/2','v1_factor=(2 eta U1-2 eta (D+lambda)(U1+K1)-d(U1_eta+K1_eta))/L',
   'L != 0 and all used terms are defined'],
  'analytic_atoms':{str(i):str(v) for i,v in aliases.items()},
  'scope':'source Picard system0 coefficient/forcing AND source stress raw #117045 AST, related by explicit substitutions at lambda1=2h; analytic atoms retained, not Picard ODE solvability',
  'limits':['source atoms Ux/Ueta must be derivatives of U0','Visc atom must match actual stress lower viscosity','actual stress leading profiles, pressure reconstruction and all native domains remain separate','no Picard convergence or moment cancellation proved']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2),encoding='utf8')
 print('PASS: authenticated source Picard row5 and all eight raw stress AST terms match independent exact transcriptions; negative controls detected')
if __name__=='__main__':main()
