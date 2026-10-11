# 공통 선택 수열·자체 band·weighted target 독립 검토

검토자: root. 검토일: 2026-10-11. 기준 저장소 HEAD:
`675a413968e964454bef1295fd35b0488f0e45df`.

## 판정과 범위

새 공통 family의 **실제 source 구성과 문서의 유한 차수 귀납은 이 검토 범위에서 통과**한다.
원래 전체 leading, 같은 양의 차수 계수, 하나의 재귀 b_n, 각 band 자체의 두 Volterra/H,
전체 target의 weighted 미분 상수를 연결한다. 원래 source의 h>0, n=1 stress의 경계 pole,
물리 radial cutoff commutator, 축 pressure와 두 shear를 모두 유지한다.

이 판정은 실제 수치 H/도함수 구간, 전체 물리 curl 합, 물리 잔차 및 시간 cutoff의 flat
경계가 각각 이 private family에 결속되었다는 판정까지 포함하지 않는다.
그 연결은 별도 통합 실행의 대상이다. 전체 M2 완료 또는 M3 시작을 발급하지 않는다.

## 실제 읽은 파일과 실행 시점의 동일성

| 파일 | 검토한 SHA-256 |
|---|---|
| `actual-compact-all-band-background-norms.mjs` | `62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464` |
| `actual-common-admissible-family.mjs` | `7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75` |
| `actual-common-admissible-band.mjs` | `41a1fb93ec6384a3999761913ede62d374bce077810c366cbb6c2a065c71d28a` |
| `actual-common-target-weighted-norms.mjs` | `6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a` |
| 설명 문서, 이 검토 링크를 추가하기 전 | `41488f5e0c93fa771e6e7cafe3a778c641ec35783dba541190c476c847d7bd63` |

[설명 문서](ACTUAL_COMMON_ADMISSIBLE_FAMILY_KO.md), 실제 source 테스트, 외부 실행 runner,
최종 JSON, process와 로그를 읽었다. 실행 import closure **92개 파일의 현재 SHA를 직접
다시 계산하여 92/92 일치**를 확인했다. 검토를 위해 동일한 큰 source 실행을 반복하지 않았다.

최종 [source attempt3 JSON](evidence/common-admissible-family-20261011/actual-common-admissible-family-source-attempt3.json)의
SHA는 `ab068695261541789783ab5feb8d38ae6d6798ebb42151a259ca05ed3f9b37ca`이다.
외부 process는 **8/8, exit0, timeout=false, 271.440953161초,
peak RSS 3,938,156,544 bytes**를 기록한다. 내부 결속은 family 9개, band 16개, target 9개다.

| 발급 graph | nodes | SHA-256 |
|---|---:|---|
| family | 622,781 | `bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219` |
| 자체 band | 627,497 | `5912d073e58d1f587395d4478b5ad704f63530f8bd5219cca54da1d95c39f3ff` |
| weighted target N0..N2 | 630,060 | `df0cd7314d4c5b8bf70e90ce3f6d18812861ee41a455817d9a3c0aba1c2a7add` |

## 1. 전체 C_m과 표현 공유

새 compact 모듈은 기존 저장된 C_m 모듈을 수정하지 않는다. 전체 F0/U0의 실제 본문은
기존 root와 materialization을 비교한다. Heat의 실제 I2 해와 양의 h를 유지한다.
공유한 slow 계수도 0차 본문이 원래 coefficient root와 정확히 같은지 검사한다.
3변수 FTC의 8개 face는 이 본문의 실제 mixed partial이다. 임의의 미분 oracle이나
사용자가 지정한 norm을 받지 않는다. 일반 대조에서 모든 face를 materialize한 검사도 보존했다.

각 유한 m에서 full leading jet, exact slow coefficient 전개, 양의 차수 finite block과
canonical tail을 결합한다. 차수 증가 시 multiplier와 역 chart 계수의 미분을 포함한다.
q=Qs, 1/2<=s<=2에서 양의 차수 오차의 q^(2h)를 4 epsilon^2로 상계하는 것은 원래
0<h<1에서 유효하다. b_n>=c_n에 대한 Euler cutoff 상계가 scale에 독립이므로 같은
오차 상수와 전체 C_m을 공통 수열로 옮길 수 있다.

Heat 적분의 j차 domination과 I2 implicit Jacobian 역의 4/3 상계는 각 고정 유한 차수에
적용한다. eta=+-1은 원래 T>=0에서의 한쪽 jet이며, 음의 시간 적분을 사용하지 않는다.

## 2. 공통 수열의 모든 조건과 선행 차수

같은 G, prepared와 primitive 객체가 velocity/pressure/stress norm을 생성했는지 private
객체 동일성으로 검사한다. prepared3의 primitive/moment/stress를 먼저 모두 인증한 뒤
n1/n2의 m<=n norm을 선택한다. 이 순서가 attempt1의 결손을 해결한다.

각 실제 B_(n,m)에 대해 log b_n에는 (n log2+log B_(n,m))/(nh)가 들어간다.
따라서 원래 cutoff가 남는 q<=1/b_n에서 B_(n,m)q^(2nh)<=2^-n q^(nh)이다.
모든 velocity/potential, pressure/stress, normalized pressure, n1 직접 weighted stress,
n>=2 quotient 및 직접 weighted stress의 조건을 별개로 유지한다.

재귀 growth는 새 log b_(n-1)에 n=2에서 log16, 나머지에서 log2를 더한다.
독립 수열의 점별 maximum으로 이 간격을 대신하지 않는다. b_n>=c_n>=2^n의 local
finiteness와 각 고정 n,m의 source 상수 정의가 전체 유한 차수 귀납을 정당화한다.
유한 prefix의 성공만으로 실행하지 않은 계수값을 발급하는 구조는 아니다.

## 3. 충분조건 영역과 자체 band

ell_min은 모든 source concentration 조건과 원래 양의 h의 frequency 조건을 포함한다.
ell>=ell0=ell_min+6인 band는 q<q_*를 만족한다. 역방향에는 별도 buffer가 필요하다.
문서가 요구하는 q_global=2^(-(ell0+4))를 쓰면 원래 cutoff 지지
|ell+log2(q)|<3/4에서 ell>ell0+13/4가 나온다. 후속 전체 합은 이 더 작은 같은
family 영역을 사용해야 한다.

실제 기본 band ellA=ceil(log2(4b1))는 b1 q가 [1/16,1/2] 안에 있고 b2>=16b1이므로
n1 plateau와 n>=2 flat zero가 성립한다. 이 축약은 기본 band에 한정된다.
다른 band에는 원래 cutoff와 모든 필요한 계수 prefix를 요구하며, 모자란 계수를 0으로
두지 않는다. 계수의 실제 radial Euler commutator와 Pi0=P0+Cp도 보존한다.

각 부호는 자기 실제 F/G로 H_R,H_Z,H_T를 만들고
n=(x0-vH_R,p/R,pz-epsilon*vH_Z)를 사용한다. 원래 pressure와 Bprime이 든 행렬,
w(0)=(1,0), P, transverse/time cutoff, Haar 적분이 모두 새 band 위에 생성된다.
기존 terminal 예제나 ell=1 covariance를 복사하지 않는다. 같은 box 대표점과 carrier를
고정한 뒤 미분하는 조건을 문서와 객체에 유지한다.

## 4. determinant와 양의 가중치

정규화 covariance의 determinant 절댓값 15/8..17/8, 질량 하한 J c_* sqrt(Ls),
상한 J W_*^2 Ls, ci Ls=2r0 및 원래 transverse 질량 하한을 결합한다.
실제 저장한 d_*/S는 이 조합의 보수적 하한이다. 예를 들어 질량 하한을 제곱하고
Ls<=2r0 Tg S를 쓰면 S^-1이 나오며, 코드의 u 인자는 u>=1에서 가능한 더 작은 하한이다.
각 H 원소 상한과 이 determinant 하한에서 H^-1의 S 다항식 상계가 따른다.

원래 full leading target의 방향·크기, chart multiplier 및 Ac 상한과 실제 mass 상한을
같이 쓰므로 y>=c_y zeta는 임의 양의 행렬을 가정한 결론이 아니다. determinant의 음수
부호와 양의 역가중치를 혼동하지 않는다. 닫힌 radial 끝점은 strict positivity의 영역이
아니며, 후속 Gaussian sqrt 연장으로 처리한다.

## 5. target weighted 미분과 모든 고정 sqrt 차수

Inner에서는 원래 exp(-t1^2/y^2)g_a 및 nonlinear moment 차이의 실제 regular factor를,
outer에서는 exp(-4/delta^2)delta^-3와 axial delta^6 인자를 보존한다.
중간 rectangle은 실제 full T0 미분을 양의 zeta로 나눈다. 두 collar와 중간 rectangle의
범위는 겹치므로 annulus에 빈 구간이 없다.

Reverse-distance FTC의 anchor는 양의 거리 t1/4 또는1/2이다. 0 끝점은 dominated
regularity로 정당화한 적분 끝의 한쪽 극한이며, 거기서 singular formula를 직접 평가하지
않는다. Gaussian/Laurent 및 첫 Stirling 수 귀납은 ordinary X 미분의 모든 항을 보존한다.
각 radial 미분당 최대3의 pole과 실제 slow chart multiplier를 포함하여 N_m을 만든다.

실제 H^-1 미분, y=H^-1 Tbar의 Leibniz, sigma^2=y의 완전한 재귀를 순서대로 사용한다.
분자 각 항에 zeta가 남고 분모는 sqrt(c_y zeta)로 제어되어 모든 고정 sqrt jet에
sqrt(zeta)와 유한 pole이 남는다. 두 원래 Gaussian이 pole을 흡수하므로 각 끝점의
zero extension이 성립한다. 고정 차수가 증가할 때 임의의 새로운 수열을 선택하지 않는다.

## 보존한 실패와 완료 경계

Attempt1의 누락된 n3 stress 결속, attempt2의 metadata 함수 직렬화 오류는 실제 실패로
보존되어 있다. 마지막 수정은 source root·copy trace·kernel provenance를 유지한 명시적
metadata projection이다. 함수를 증거 JSON에 넣지 않는 수정으로 수학 본문을 바꾸지 않았다.

이 검토는 실제 source8/8, 내부 결속 및 모든 유한 차수의 위 논증을 함께 읽은 결과다.
원문 64개 항목의 PASS, 새로운 Lean kernel 증명, 실제 수치 미분, 전역 물리 잔차의
후속 통합 결과와 서로 대신하지 않는다.
