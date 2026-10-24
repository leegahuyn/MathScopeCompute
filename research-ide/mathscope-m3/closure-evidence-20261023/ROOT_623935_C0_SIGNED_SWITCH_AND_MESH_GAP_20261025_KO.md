# 원본 #623935 부호 메시 선택의 C⁰ 불연속 장애 (2026-10-25 KST)

## 원본 정의 및 확인 범위
- 첫 FiveMap source AST 4,420,257 nodes, SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
- 실제 11개 루트의 정의 본문을 통한 `actual_monotone_root` 2개 중 변환된 호출 `#623935`, Z 선택 `#623921`, T 중점 `#623934`.
- 원본은 정수 `r,z,t`, `E=ell^6`, `delta=3/(4E)`를 물리 중심 `(r,z,t)/E`로 변환한다.
- 이 감사는 **소스 함수의 매개변수 전체 정의역**에 관한 장애다. 실제 A–D 물리장 경로에서 반례 셀을 사용한다는 증명은 아니다.

## 새 엄밀한 불연속 정리

`ell=3, E=729, (r,z,t)=(1458,0,729), delta=1/972`를 정한다.
`m=1-delta`, `M=1+delta`,
`Xa=(2+delta)^2/4`, `Xb=(2-delta)^2/(2a)`로 둔다.
`a\in[M+delta²,M+2delta²]`에 대하여 유리수의 정확한 부등식으로
`0<Xa<Xb`, 원본 메시 하한 `a`, 상한 `b=2`,
`zlo=-delta`, `zhi=+delta`가 모두 성립한다.

모든 `0<h<2^-4096`에 대해
`H(a)=a-M-a^(2h)*delta²`를 정의하면,
- `H(M+delta²)<0`, 왜냐하면 `a>1\Rightarrow a^(2h)>1`.
- `H(M+2delta²)>0`, 왜냐하면 `a<2\land 2h<1\Rightarrow a^(2h)<2`.
- `H'(a)=1-2h*a^(2h-1)*delta²>0`.

따라서 유일한 `a_*\in(M+delta²,M+2delta²)`에 `L(a_*)=delta`.
원본 `U²=(b-m)/b^(2h)=(1+delta)/2^(2h)>(1+delta)/2>delta²`이므로 `U>delta`.

`a\nearrow a_*`로 가면 `0<L(a)<delta`이고,
음의 구간 교차 `[-delta,-L]` 폭은 `delta-L>0`.
소스의 분기 `w_minus>0`는
`Z_- =(-delta-L)/2\to-delta`를 선택한다.

경계 `a=a_*`에서 `w_minus=0`이므로 소스는 양의 선택지로 넘어가고,
이때 양의 교차 구간은 단일점 `[delta,delta]`,
따라서 `Z_+=delta`. 즉 선택된 **Z 함수값**의 일방향 점프는
`2delta=1/486>0`이다.

이 반례는 원본 정의의 무제약 매개변수 전역 `C^0` 정리를 반증한다.
그러나 원본 실제 런타임에서 호출하는 지지집합/고정 메시
대표점이 이 스위칭 면을 통과한다고 주장하지 않는다.
선택된 T 및 역함수 s가 반드시 불연속이라는 주장도 아니다.

## 왜 이 결과가 중요하고, 무엇을 아직 증명하지 못했는가

원본의 원천 메시 모든 정수/모든 양의 파라미터에 대해
`#623935`의 `C^∞` 증명을 시도하면 이 정확한 점프로 실패한다.
원본 응용의 정칙성은 **실제 11개 루트 지원에 제한된 메시/대표점 관계**,
혹은 이 위험 스위칭을 배제하는 cutoff/zero-flat 접합의 독립 증명을
요구한다. 일반 `sRep` 조건부 함수값·자동 메시 존재 증명은
그 실제 고정 인덱스/전역 정칙성 의무를 대신하지 않는다.

## 검사 증거
- `audit_original_root623935_switch_discontinuity.py`와 대응 unit test
- 기존의 `prove_original_root623935_general_srep_image.py`,
  `prove_original_root623935_autoselected_mesh.py`,
  `audit_original_root623935_integer_mesh_no_image_witness.py`
- 원본 AST 고정 CI (latest): https://github.com/leegahuyn/MathScopeCompute/actions/runs/40132376013

## 공식 미완료 유지
`114/114` 첫 선택 분기 조건부, 실제 native 전역 OPEN,
원본 Y `33/523` 인증·`490 OPEN`, 실제 최종 제트 `0/67`,
`M3 62/64`, `M4 0/16`, **RELEASE HOLD**.
원본 PR #30 및 운영 웹페이지 변경 금지.
