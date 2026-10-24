# MathScope 실제 56개 Y 입력쌍: 43개 대수 정규형과 차트 적용범위 검사 (2026-10-24 KST)

## 증거 고정
- 원본 first-FiveMap 그래프: **4,420,257 nodes**, SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
- Native 등록부 SHA-256: `bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`.
- 원본 11 물리장 루트: `actual_natural_series` **523 호출 / 56 (Y,eta)쌍**. 이전 인증된 Y≤5 호출은 **33/523** 그대로이며, 미인증 **490/523**.
- 신규 `audit_source56_Y_algebraic_normal_forms.py`는 전체 원본 JSONL.gz 스트림을 SHA 검증하고 로그 정의역 조건을 보존하면서 정확히 **43개의 대수적 정규형**으로 묶는다. 원본 검증 CI [#40100049686](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40100049686) **SUCCESS**, artifact **#12562398010**, 단위검사 7개도 성공.

## 중복 제거한 구체적 대상

| 대수적 정규형 | Y쌍 | 호출수 | 새로 요구되는 핵심 증명 |
|---|---:|---:|---|
| \(\Lambda X\) | 8 | **114** | 실제 호출 지지집합에서 \(0\le X\le5/\Lambda\) |
| \(\Lambda(\text{actual_inner_xi})^2\) | 3 | **33** | \(|\xi|\le\sqrt{5/\Lambda}\) |
| \(\Lambda\Omega_0\) | 2 | 26 | \(0\le\Omega_0\le5/\Lambda\) |
| \(\Lambda\Omega_1\) | 2 | 26 | \(0\le\Omega_1\le5/\Lambda\) |
| \(\Lambda\Omega_2\) | 2 | 18 | \(0\le\Omega_2\le5/\Lambda\) |

이들 총 **17개 입력쌍 / 217개 호출**이 적은 수의 공통 좌표·근 추정으로 귀착된다. 위 표는 Y 상한 자체를 새로 해결한 성과가 아니라 **원본 부등식의 정확한 환원**이다.

원본 8개 \(\Lambda X\)쌍 중 7개 쌍·87개 호출은 \(\exp(\log_{+}(z))=z\) 소거 시 \(z>0\) 가드를 보존한다. 원본 slow-chart 선언을 가정하면 \(X\ge X_a/2>0\)으로 그 로그 조건은 충족되지만, 그 자체가 \(Y\le5\)의 증명은 아니다.

## 원본 slow-chart 전체 구간의 Y≤5 자동 인증은 불가능

원본 `source-global-band.mjs`에는 slowPointDomain `X in[Xa/2,2Xb]`, positiveWeightDomain `Xa<X<Xb`가 명시되고, N3에서는 \(X_a=4/\Lambda>0\)이다.

범위 \([X_a/2,2X_b]\)는 \(X_b>X_a\)이므로 대수적 점 \(X=2X_a\)를 포함한다. 그 점에서는
\[ Y=\Lambda X=\Lambda(2X_a)=8>5. \]

따라서 **선언된 포괄 차트 범위만으로 모든 호출의 \(Y\le5\)를 증명할 수 없다**. \(X\le5/\Lambda\)인 subchart / support / cutoff 국소화의 근거가 추가로 필요하다. 이는 시험점에 실제 PDE 해가 존재한다는 주장이나 원본 구성의 반증은 아니다.

원본 소스 바이트를 대조하는 감사기 `audit_original_chart_natural_domain_overlap.py`와 fail-closed 테스트 4개 검증 [#40100398902](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40100398902), [#40100398907](https://github.com/leegahuyn/MathScopeCompute/actions/runs/40100398907) **SUCCESS**.

## 아직 열려 있는 수학적 의무
1. 전체 미인증 490 호출을 실제 원본 chart/support 영역에서 \(0\le Y\le5\)로 제한. source chart 선언만으로 근거를 대체하지 말 것.
2. 전체 523 호출의 coefficient \(\Vert(\Phi,u)\Vert_{B_\rho}\le Q\)와 공통 복소 \(\eta\) 정의역·branch/guard 증명.
3. 실제 자연급수 B.14/B.15의 유한항 원본 계수 및 반올림·절단 오차의 정확 구간 평가.
4. 원본 A–D 모든 반복장과 종단 전역 PDE·외력의 매끄러움·cutoff 무한합 증명. 첫 FiveMap DAG는 최종 \(A,b,p\)가 아니다.

**M3 62/64 · M4 0/16 · 실제 최종 67 jets 0/67 · RELEASE HOLD.** 원본 PR #30 HEAD `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60` 및 라이브 웹페이지 수정 없음.
