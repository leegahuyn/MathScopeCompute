# MathScope M3 — 217개 자연급수 Y 범위 원본 감사, 첫 inner 분기 정리 (2026-10-24)

## 원본 그래프

첫 FiveMap 원본 4,420,257 노드 / 실제 11 물리장 루트의 자연급수 523 호출 / 고유 Y,eta 입력쌍 56 / 대수적 정규형 43. 노드 SHA-256 a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269, 함수정의 SHA-256 bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e. 실제 상한 Y<=5 기인증 호출 33개, 미인증 호출 490개.

## 217 원본 호출의 정확한 국소화 의무

| 원본 정규형 | 쌍 | 호출 | 추가 로그 양성가드가 있는 호출 | 요구되는 상한 |
|---|---:|---:|---:|---|
| Lambda*X | 8 | 114 | 87 | 0<=X<=5/Lambda |
| Lambda*actual_inner_xi^2 | 3 | 33 | 14 | abs(xi)<=sqrt(5/Lambda) |
| Lambda*Omega0 | 2 | 26 | 10 | 0<=Omega0<=5/Lambda |
| Lambda*Omega1 | 2 | 26 | 10 | 0<=Omega1<=5/Lambda |
| Lambda*Omega2 | 2 | 18 | 7 | 0<=Omega2<=5/Lambda |
| **합계** | **17** | **217** | **128** | OPEN |

원본 정규형·함수 ID가 들어 있는 검사기: audit_original_217_Y_domain_obligations.py. 실제 4.4M-node SHA-pinned archive 재생 및 unit tests 모두 성공: [GitHub Actions #40101841204](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40101841204), artifact #12563256873. 이 실행의 receipt는 원본 217개의 새 Y 범위가 증명되지 않았다고 명시하고 490개 미인증을 보존한다.

## 수학적으로 증명된 국소 inner branch 상한

원본 actual-continuation-exact-order-one.mjs:
- Xkeep = Xa exp(t1/64), Xcut = Xa exp(t1/32)
- Ft = choose(X,Xkeep,Xcut,Fraw,kappa*Fraw,0); Ut도 같은 source-select 분기.
- 원본 N3에서 Xa=4/Lambda, Lambda>0, 0<t1<1/8.

따라서 선택된 inner 분기에서 0<=X<=Xcut인 경우

    0 <= Lambda*X <= 4*exp(t1/32) < 1024/255 < 5.

동일하게 X<=Xkeep인 경우 Lambda*X < 2048/511 < 5. 원본 M2 소스 확인/가짜 cutoff 거부/정확 유리수 계산 테스트 5개 [GitHub Actions #40102376635](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40102376635) **PASS**.

**매우 중요한 논리적 제한**: 이것은 원본 Fraw/Uraw의 해당 국소 분기에 대한 조건부 정의역 증명이지, 실제 11 루트에서 도달하는 114개의 Lambda*X 호출 전체가 모두 이 분기 안에서 평가됨을 입증하지 않았다. 아직 경로민감한 native 함수·piecewise·적분인자 분석이 필요하다.

원본 fast cutoff chi는 common_band_transverse_xi, psi는 pulse v, time cutoff는 coefficient sigma에 작용한다. 이를 증명 없이 actual_inner_xi와 동일시하거나 모든 실제 X를 subchart에 넣으면 안 된다.

## 아직 미해결
1. 114 X 호출 각각의 piecewise-branch path certificate 및 inner axisAverage 적분의 tX 구간.
2. Xi^2 33 호출의 실제 좌표 identity/support 경계.
3. Omega_j 총 70 호출의 원본 sign/branch/상한.
4. 원본 coefficient Banach norm ||(Phi,u)||_{B_rho}<=Q 및 공통 복소 eta 영역.
5. B.14/B.15 원본 유한항 원래 계수 12차 방향성 구간 평가 및 전체 A–D 종단 장 구성.

M3 62/64, M4 0/16, source Y 인증 33/523, final 67 jets 0/67, RELEASE HOLD. PR30 a9b3a5b317525f6d0a71e2e356b054c9d25d2e60 원본 변경 없음, 운영 웹사이트 변경 없음.
