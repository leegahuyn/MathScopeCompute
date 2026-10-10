# 같은 원본의 실제 구성과 남은 의무

## 현재 판정

원문 N4/N5 16개 기준은 **15 PASS / 1 PARTIAL / 0 OPEN**이다. 원래 ID·제목·합격 문구·페이지를 그대로 유지한다. 개별 유한 합격과 blueprint의 M2 패키지 완료는 별도다. 모든 차수의 실제 배경·stress·flat error 및 전체 annulus의 pulse가 연결됐다는 판정은 아직 false다.

새 [원문 기준 재심사](research/FINITE_CRITERIA_REAUDIT_KO.md)는 필요한 조건을 실제 원문에서 확인한다. 전체 annulus·모든 차수·거대한 K항의 수치 합산 조건을 모든 개별 유한 항목에 일괄 적용하지 않는다. 동시에 실제 적분·source object가 빠졌는데 작은 오차나 기호 이름만으로 완료했다고 표시하지 않는다.

## 원래 유한 조건으로 완료한 다섯 항목

| 기준 | 실제 원본과 연결해 실행한 내용 | 별도의 패키지 범위 |
| --- | --- | --- |
| N4-03 | 고정 n=1의 정확한 6성분 계, source-derived C1·analytic strip·Cauchy loss, 원래 공통 collar, 유한 K의 정확식과 Picard tail, 실제 축·양의 반경 관측. 15개 certificate rule, Node 8개, 독립 Laurent/Fraction 782개 검사. | 거대한 K항 수치 합산, 모든 고차 계수, 모멘트 복구와 전체 N4. |
| N4-04 | 같은 실제 n=1,2의 수렴 함수와 전체 연속 5모멘트 복구, 실제 PDE 12개·preheat/heat invariant·4 support·prior-correction gate. Node 49개 및 독립 보존식 12개·누락 대조 12개. | 전역 signed 수치 적분, 모든 차수, 전체 배경·NS 정리. 보정 전 수치 debt 크기를 생성하지 않는다. |
| N4-05 | 같은 원래 source의 보존된 고정 core에서 N=0/1 직접 Fslow, 계산된 CNm/Km·공간·시간 미분, 같은 q의 양의 norm 하한/상한 비교, 독립 mesh·bits 정련. Node 12개·독립 Fraction 1,544개 및 교차 검토. | 전체 repaired profile, 모든 N의 잔차와 전체 N4. 고정-q supremum은 원래 similarity map의 시공간 집합이다. |
| N5-04 | (5.18),(5.44),(5.45)에 따른 완성 배경의 정확한 Imean velocity restriction. Φ,n,K,AΦ,B,B′와 left inverse, nonzero kp와 frequency bound, 실제 대표점의 원래 slow 이웃 및 전체 v에서 frame·denominator 하계. | 전체 annulus의 phase bound, 모든 slow derivatives. 생성식의 Imean domain을 더 넓은 인증 영역으로 표시하지 않는다. |
| N5-05 | 원문 homogeneous m=1 growing left datum으로 실제 projected ODE 적분. moving-normal·B′·damping을 유지한 Liouville 환원과 양의 Volterra 비교, 실제 energy·직교·reference midpoint·연속 Gaussian. | 일반 nonzero forcing의 zero-datum inverse, 모든 slow derivative Gaussian, 실제 covariance와 전체 N5. |

N5의 새 검증은 Node 13개 및 독립 Fraction/80자리 Decimal 618개를 포함한다. 실제 중점 x/P는 약 0.353553이며 reference P=1 또는 가운데 unit datum을 실제 해로 사용하지 않는다. 실제 h, lambda, u*와 carrier는 양의 정확식으로 유지한다. Float64 interval의 하단 0은 대입값이 아니다.

## 실제 모멘트 복구의 완료 범위

N4-04는 원래 식의 실제 1·2차에 대해 완료했다. 새 `ns.actual-moment-restoration`은 B.22/B.26/B.34/B.8, C.12/I1, 전체 outer와 I2/heat를 수렴 함수 연산으로 조립하고 실제 연속 inverse를 적용한다. 열 개 실제 모멘트 항등식과 내부 PDE 12개, 네 응력의 안쪽·바깥쪽 support 및 보존 total을 확인했다.

원래 preheat (5.19)의 상수항도 실제 Qp density, angular reset, 양의 Qb/Qp 및 terminal wait와 연결했다. 원식을 누락한 경우 실패하는 대조를 포함한다. **모멘트가 실제로 복구되기 전에는 다음 source를 허용하지 않는다.** 유한 iterate·reference 중점·caller 숫자나 복사한 판정은 완료 객체가 아니다.

기본 전체 원본 program의 SHA-256은 `8b79ba8db0b08acb8af742f91be9fa12d666832c38a6fdaeb58ed90a4f0f7776`이다. 43개 소스·증거 파일 결속과 매번 새로 생성한 전체 program 해시를 비교한다. 수치 signed moment의 계산을 이 정확식 구성에 포함시키지 않는다. 자세한 구성·독립 리뷰는 [실제 모멘트 복구](research/ACTUAL_MOMENT_RESTORATION_KO.md)에 있다.

## 남은 원문 기준

### N5-06: 실제 공분산·positive inverse·global 조립

실제 homogeneous pulse의 (7.27) 적분을 Gaussian 좌표로 계산하며 angular 1/2, 원래 Haar Jacobian, χ²·ψ², 원래 t_r t_tan과 양의 전체 tail을 유지한다. 같은 N3의 B.8·I1 moment restoration과 I2 열 보상으로 leading target T0,*를 만들고, pulse와 target의 F가 같은 정확식임을 확인한다. η=0 axial stress의 정확 0은 복구된 함수·heat parity의 결과이며 raw core parity 또는 positive-order pressure의 영성을 가정하지 않는다.

`ns.actual-covariance-matching`은 이 actual H inverse와 양의 y± 및 determinant 하계를 계산한다. 원문에서 허용한 구체적인 smooth 제곱분할을 같은 source 대표점에 고정해 한 활성 band·한 slow box 및 내부의 두 signs를 실행한다. 생략된 모든 정수 index가 support 밖이라는 정확 증명이 있으므로 전체 활성 합이다. 그 대표점의 C(W0)=epsilon T0,*와 물리 (7.30) 잔차 `[0,0]`을 원래 양의 h와 q/Q 배율로 확인한다. 자세한 증명·검사는 [실제 응력–공분산 연결](research/ACTUAL_PULSE_COVARIANCE_MATCHING.md)에 있다.

남은 것은 모든 enlarged slow neighborhoods에서의 실제 completed-background C²·edge-direction modulus, 원본에서 도출한 공통 q*, 그리고 이에 따른 actual integrated H column·positive inverse의 전영역 인증이다. 대표점에서 선택한 qBig=3Q/2는 공통 analytic q*가 아니다. 이러한 범위가 닫히기 전에는 N5-06과 whole-annulus flags를 PARTIAL/false로 유지한다.

## 이미 완료한 연산자 조건의 경계

N4-06의 모든 q에 대한 cutoff schedule은 선언된 derivative constants에 대한 조건부 scalar 연산자다. N4-08은 원래 doubling 조건에서 완전한 active prefix를 확인하고 실제 supplied potential의 locally finite 합을 계산한다. 실제 모든 repaired coefficient sequence가 이미 있다는 뜻은 아니다.

N5-01의 두 chart 관측은 원래 accepted core interval과 정확한 q/Y 역변환에 연결된다. N5-02의 normalized Haar와 모든 fast/slow chain-rule 항, N5-03의 countable source mesh support allocation도 별도 exact operator다. 전역 Haar factor는 covering lift를 모두 포함해 1이고 국소 rectangle Jacobian은 4−2√2다.

N5-07은 원래 C_m와 전체 r_m의 mixed jet, cylindrical basis 미분, Cartesian curl/divergence 및 conjugate pair를 검증한다. N5-08은 supplied forcing·amplitude·cutoff jet의 모든 (1−ψ)f+ψ′t 항과 조건부 고정차수 log tail을 계산한다. 이러한 연산자의 입력이 실제 모든 harmonic의 source tuple로 연결됐다는 추가 주장은 하지 않는다.

## 재현과 출처

같은 N3 identity, parameter expression graph, accepted assembly와 원본 소스 바이트를 변경하지 않는다. 각각의 새 manifest와 독립 검사 receipt는 사용한 바이트를 검증한다. `node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs`가 모든 등록 예제, original criterion text, 소스 manifest와 독립 근거를 묶는다. 현재 릴리스의 실행 대상 aggregate는 Node 267개, 독립 검사 10,409개이며 최종 결과는 `evidence/acceptance.json`에 기록한다. N4-05의 고정 compact 유한 인증은 [잔차 유도](research/ACTUAL_RESIDUAL_ORDER_KO.md)와 [manifest](actual-residual-order-manifest.json)에 결속돼 있다. 추가된 균일 공분산 부분 명제의 11개 Node·1,814개 독립 검사는 실제 whole-annulus source 의무를 완료로 바꾸지 않는다.

새 Lean kernel proof나 전역 Navier–Stokes 정리의 완료를 주장하지 않는다. 원래 자료에 보존된 분석적 증명, 실행한 exact/interval 검사, 유한 criterion의 PASS, 전체 package의 미완료를 각각 기록한다.
