from pathlib import Path
import json
from fractions import Fraction as F
root=Path(__file__).resolve().parent
text=(root.parent/'group-data.mjs').read_text();data=json.loads(text[text.index('['):text.rfind(';')]);data={g['id']:g for g in data}
def dense(s,scale=1):
 a=[[[0,0] for j in range(s['n'])] for i in range(s['n'])]
 for i,j,r,im in s['entries']:
  a[i][j]=[F(r)*scale,F(im)*scale]
 return a
def leanmat(a):
 def ci(v):
  assert all(F(x).denominator==1 for x in v)
  return '⟨'+','.join(str(int(x)) for x in v)+'⟩'
 return '['+','.join('['+','.join(ci(v) for v in row)+']' for row in a)+']'
lines=['import MathScope.M1.Gauge.Defs','namespace MathScope.M1.Gauge','']
for name in ['SU3','G2']:
 g=data[name];prefix=name.lower()
 mats=[dense(x) for x in g['basis']['matrices']]
 for i,a in enumerate(mats):lines.append(f'def {prefix}B{i} : Mat := {leanmat(a)}')
 lines.append(f'def {prefix}Basis : List Mat := ['+','.join(f'{prefix}B{i}' for i in range(len(mats)))+']')
 rows={}
 for a,b,c,value in g['structureConstants']:
  rows.setdefault((a,b),[0]*g['dimension'])[c]=int(F(value));assert F(value).denominator==1
 entries=[]
 for a in range(g['dimension']):
  for b in range(a+1,g['dimension']):entries.append(f'({a},{b},['+','.join(map(str,rows.get((a,b),[0]*g['dimension'])))+'])')
 lines.append(f'def {prefix}BracketRows : List BracketRow := ['+','.join(entries)+']')
 for i,a in enumerate(g['embedding']['matrixGenerators']):lines.append(f'def {prefix}L{i} : Mat := '+leanmat(dense(a,2)))
 lines.append(f'def {prefix}EmbeddingScaled : List Mat := [{prefix}L0,{prefix}L1,{prefix}L2]')
 # An exact compact group element with a quarter-turn on every active rotation plane.
 for i in range(3):
  a=dense(g['embedding']['matrixGenerators'][i],2)
  for j in (range(2,3) if name=='SU3' else range(3)):a[j][j]=[1,0]
  lines.append(f'def {prefix}U{i} : Mat := '+leanmat(a))
 if name=='G2':
  lines.append('def g2Omega0 : Mat := matAdd (matAdd (matId 7) g2B0) (matMul g2B0 g2B0)')
  lines.append('def g2Omega1 : Mat := matAdd (matAdd (matId 7) g2B1) (matMul g2B1 g2B1)')
lines+=['','end MathScope.M1.Gauge','']
(root/'MathScope/M1/Gauge/Fixtures.lean').write_text('\n'.join(lines))

def write_tests(name,tests):
 lines=['import MathScope.M1.Gauge.Fixtures','set_option maxRecDepth 200000','set_option maxHeartbeats 16000000','namespace MathScope.M1.Gauge','']
 for ident,statement,comment in tests:lines.extend([f'/-- {comment} -/',f'theorem {ident} : {statement} := by decide',''])
 lines+=['set_option pp.fullNames true']
 for ident,statement,comment in tests:lines.extend([f'#check {ident}',f'#print axioms {ident}'])
 lines+=['end MathScope.M1.Gauge',''];(root/f'MathScope/M1/Gauge/{name}.lean').write_text('\n'.join(lines))
write_tests('SU3',[
 ('su3_shapes','su3Basis.all (squareShape 3) = true','All eight concrete defining matrices have square shape.'),
 ('su3_compact_form','su3Basis.all antiHermitian = true','The literal full basis lies in the anti-Hermitian real form.'),
 ('su3_complete_bracket_table','checkBracketRows 3 su3Basis su3BracketRows = true','All 28 unordered basis brackets agree with the exact integral table.'),
 ('su3_embedding_brackets','matBracket su3L0 su3L1 = matScale 2 su3L2 ∧ matBracket su3L1 su3L2 = matScale 2 su3L0 ∧ matBracket su3L2 su3L0 = matScale 2 su3L1','Cleared denominators: L_a=2T_a, hence [L_a,L_b]=2 epsilon L_c.'),
 ('su3_embedding_metric','gramTrace su3EmbeddingScaled = [[2,0,0],[0,2,0],[0,0,2]]','With B=-Tr and T=L/2 this gives B(T_a,T_b)=delta_ab/2, index one.'),
 ('su3_jacobi_fixture','bracketJacobi su3B0 su3B1 su3B2 = matZero 3','A nonzero nested-bracket Jacobi fixture; full table Jacobi is independently exact-rational checked.'),
 ('su3_link_unitary','matMul (matDagger su3U0) su3U0 = matId 3','A nontrivial exact embedded SU2 link is unitary.')])
write_tests('G2',[
 ('g2_shapes','g2Basis.all (squareShape 7) = true','All fourteen actual compact G2 basis matrices have square shape.'),
 ('g2_compact_form','g2Basis.all antiHermitian = true','The complete real antisymmetric matrix basis is anti-Hermitian.'),
 ('g2_complete_bracket_table','checkBracketRows 7 g2Basis g2BracketRows = true','All 91 unordered brackets agree with the exact table of the octonion stabilizer.'),
 ('g2_embedding_brackets','matBracket g2L0 g2L1 = matScale 2 g2L2 ∧ matBracket g2L1 g2L2 = matScale 2 g2L0 ∧ matBracket g2L2 g2L0 = matScale 2 g2L1','Actual 7x7 embedded quaternion matrices; cleared denominator SU2 brackets.'),
 ('g2_embedding_metric','gramTrace g2EmbeddingScaled = [[4,0,0],[0,4,0],[0,0,4]]','B=-Tr_7/2 and T=L/2 give B(T_a,T_b)=delta_ab/2, index one.'),
 ('g2_jacobi_fixture','bracketJacobi g2B0 g2B1 g2B2 = matZero 7','An exact exceptional-algebra Jacobi fixture, distinct from an abstract group label.'),
 ('g2_link_unitary','matMul (matDagger g2U0) g2U0 = matId 7','The exact nontrivial quaternion block link is orthogonal and unitary.'),
 ('g2_nonconstant_site_frames','matMul (matDagger g2Omega0) g2Omega0 = matId 7 ∧ matMul (matDagger g2Omega1) g2Omega1 = matId 7','Distinct exact compact site frames used in a finite gauge covariance fixture.'),
 ('g2_holonomy_covariance','holonomy3 (gaugeLink g2Omega0 g2U0 g2Omega1) (gaugeLink g2Omega1 g2U1 (matId 7)) (gaugeLink (matId 7) g2U2 g2Omega0) = gaugeLink g2Omega0 (holonomy3 g2U0 g2U1 g2U2) g2Omega0','Exact endpoint cancellation for an actual exceptional-group loop with unequal site frames.'),
 ('g2_wilson_trace','matTrace (holonomy3 (gaugeLink g2Omega0 g2U0 g2Omega1) (gaugeLink g2Omega1 g2U1 (matId 7)) (gaugeLink (matId 7) g2U2 g2Omega0)) = matTrace (holonomy3 g2U0 g2U1 g2U2)','Closed unnormalized Wilson trace equality of literal matrices, without floating point.')])
(root/'NegativeBracket.lean').write_text('import MathScope.M1.Gauge.Fixtures\nopen MathScope.M1.Gauge\nexample : matBracket su3L0 su3L1 = matScale 3 su3L2 := by decide\n')
(root/'NegativeWilson.lean').write_text('import MathScope.M1.Gauge.Fixtures\nopen MathScope.M1.Gauge\nexample : matTrace (holonomy3 g2U0 g2U1 g2U2) = CI.mk 7 0 := by decide\n')
print('Generated fixed literal SU3/G2 finite Lean certificates')
