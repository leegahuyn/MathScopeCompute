# 원본 j=0의 고정 profile 보조정리와 남은 클래스 조건

2026-10-14. 원본 producer와 그 판정은 수정하지 않았다. 첫 클라우드 실행
`38500114302`의 독립 exact arithmetic **5/5**를 재사용했고, 이번 검사에서
기존 다섯 식의 산술 계산을 다시 수행하지 않았다. 기존 whole mean **8/8**도
새로운 클래스 증명으로 간주하지 않는다.

## 원본 요구사항

보존된 원본 PDF SHA-256은
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다.
PDF 69–71쪽의 (6.24), (6.25), (6.29)는 **각 고정 미분 차수마다**
상수가 존재하고 band, label, rectangle copy, point에 대해 균일할 것을
요구한다. 특정 차수의 유한 계산은 이 전체 양화 조건을 충족하지 않는다.

- `M^alpha`: 모든 `I∈N_0^5`에 대해
  `|∂^I f| ≤ C_I ε^alpha S_*^b_I ζ δ^(-d_I)`.
- `W^alpha`: 같은 label–harmonic을 먼저 합친 amplitude마다
  `|∂^I A| ≤ C_I ε^alpha S_*^b_I sqrt(ζ) δ^(-d_I) P_v`.
  common-torus descent, support, smooth zero extension도 요구한다.
- `S^alpha`: 모든 `I∈N_0^2`에 대해
  `|∂^I_(Z,T) F| ≤ C_I ε^alpha S_*^b_I`.
  radial moment는 (6.26)의 measure와 weight를 포함한 정규화를 사용한다.

PDF 106–107쪽 Definition 9.4 / Proposition 9.5의 j=0은
`B0=7/10`, `C0*=6/5`, (9.9)의 total correction classes, (9.10)의
두 **전체 tuple** moment를 모두 요구한다. 원본 순서도 그대로다:
primary pressure → temporal (8.20) → 새 pressure → 새 P/J의 five-map
(8.25) → 새 pressure. 보존된 mean certificate SHA-256은
`22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b`다.

## 이번에 확인한 실제 fixed bump

`initial_source_lemmas.py`는 원본 3,892,594-node checkpoint를 한 번
순차 검증하고 약 1,400개의 필요한 node만 보존한다. 이는 원본 source의
byte/shape 확인이며 원본 mean/PDE 계산의 재실행이 아니다. 각 compressed
part, 전체 decompressed stream, 원본 155 dependency의 SHA를 확인한다.

실제 원본식은 `source-global-moment.mjs:sourceBumps`에 있다.

| 의미 | 실제 node |
|---|---:|
| 원본 positive lambda | 8 |
| `x0=sqrt(2 X0Imean) exp(1/2)` | 633686 |
| `eta0(x)=x0^-1 b(10(x/x0-1))` | 634278 |
| `b(t)=exp(-1/[t(1-t)])`, `0<t<1`, 바깥 0 | 634277 |
| `mu_p=∫_[x0,(11/10)x0] x^p eta0(x) dx` | 634285, 634289, 634293, 634296, 634300 |
| angular geometric nodes `z0,z1,z2` | 634333, 634335, 634337 |
| axial ratio / gap | 634339 / 634416 |
| actual copies `j=0,1,2` | 634278, 634467, 634497 |
| `a=K*(2 X0Imean)^(1/2+lambda)/(1+eta^2)` | 634320 |
| angular/axial homogeneous rows | 3614735 / 3614752 |

`source-profile-data.mjs`의 정의를 immutable original assembly receipt
SHA `184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`에
대조한다. 큰 정수의 JS-safe decimal-string encoding과 원본 integer를
명시적으로 대조하며 원본 parameter canonical SHA
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`를 확인한다.
Windows working-file의 줄바꿈이 다른 경우 정확한 Git blob을 읽으며,
그 mode를 결과에 기록한다. 파일의 줄바꿈을 묵시적으로 정규화하지 않는다.

`T=exp(1048576)+10`은 positive finite real이고
`lambda=exp(-1000*T)>0`다. 매우 작은 lambda를 0으로 치환하지 않는다.
`CSelected`와 `Pstar`는 지수함수의 값이며,
`XR=110*(CSelected*Pstar)^10>0`, `X0Imean=XR*exp(real)>0`이므로 `x0>0`다.

각 고정 차수의 `b^(m)`은 지수함수 `b`와 `t,1/t,1/(1-t)`의
유한 rational polynomial의 곱이다. 지수 감쇠가 모든 endpoint pole을
흡수하므로 모든 미분이 양 끝에서 0으로 수렴한다. 따라서 실제 zero
extension은 C∞이다. 각 `mu_p`는 0에서 떨어진 compact interval에서
positive continuous integrand를 적분하므로 finite이며 **strictly positive**다.

`d=1/5`와 실제 lambda로부터 정확히

`z1=exp(-(2+2lambda)/5) < z2=exp(-2lambda/5) < z0=exp(2/5)`

이고 `1-exp(-2lambda/5)>0`다. 양의 `mu_p`, `a`, `exp(1/5)`,
`1+eta^2`와 함께, 기존 independent rows와 actual coefficient certificate의
합집합 **15개** nonzero divisors가 실제 real source chart에서 0이 아님을
확인했다. 정수·유리수 및 affine-lambda exponent 비교만 사용하며
두 binary64 exponential을 빼서 gap을 만들지 않는다.

## 고정 profile의 적분 의미와 두 increment moment

실제 copy는 `eta_j(x)=c_j^-1 eta0(x/c_j)`, `c_j=exp(j/5)`다.
integrand, scale, prefactor, support를 모두 실제 node에 대조했다.
`x=c_j*u`에서 Jacobian이 prefactor를 취소하므로 모든 실제 다섯 power에 대해

`∫_0^∞ x^p eta_j(x) dx = exp(j*p/5)*mu_p`.

이 적분들은 compact support에서 절대 수렴한다. `R=sqrt(s)*x`를 사용하면

`∫ R^2 Δv dR = s^(3/2-A)*mu_2*Σ_j exp(2*j/5)*angularCoefficient_j = 0`,

`∫ R Δgamma dR = s^(1-A)*mu_1*Σ_j exp(j/5)*axialCoefficient_j = 0`.

마지막 등식은 기존 독립 5/5의 실제 homogeneous row를 사용한다. 따라서
이번 증명은 단순 분모 제거 identity보다 더 강한 **고정 five-bump increment의
적분 identity**를 제공한다. 모든 실제 target coefficient가 정의되는
source point에서 성립한다. 전체 temporal increment 및 전체 tuple의
(9.10) 증명에는 여전히 그 Fourier zero mode, T1/A1 reconstruction,
support와 Fubini가 필요하다.

copy들과 그 support의 convex hull의 normalized original mean patch 위치도
`1 ≤ log(X/X0Imean) ≤ 1+4/5+2log(11/10) < 2 < 5`로 분리된다.
`log(1+u)<u`를 사용한 exact inequality다. 이것은 reserved `Imean` 내부의
증명이다. 실제 finite radial primitive의 적분 경계가 이 전체 support를
포함한다는 조건은 별도다. 그 조건을 확인한 뒤에야 full zero moment를
그 primitive의 zero exterior value로 전달할 수 있다. 전체 PDE primitive의
외부 envelope와 source gluing을 이 한 inequality로 대체하지 않는다.

## 남은 N6-01 조건

| 원본 조건 | 실제 source roots | 이번 판정 |
|---|---|---|
| (9.8) grouped wave residual `W^0.7` | 3825348, 3825349, 3825350 | 모든 label/mode의 source seminorm 및 derivative losses 미완료 |
| (9.8) `Etheta,Ez ∈ M^1.2` | 3614976, 3615392 | (9.11) actual covariance cancellation와 source all-order input estimates 미완료 |
| (9.8) `P,Jtheta,Jz ∈ S^1.2` | 3615055, 3615101, 3615147 | 실제 nonlinear remainder 적분 class 미완료 |
| (9.9) wave `W^1/2`, curl remainder `W^0.68` | 3825006–3825008 | 실제 primary complete-curl all-order estimates 미완료 |
| (9.9) `v,gamma,p_m ∈ M^0.9` | 3614791, 3614792, 3615361 | actual target/input norm과 full pressure operator estimates 미완료 |
| (9.9) `beta ∈ M^1.9` | 3614790 | actual radial gain 및 endpoint/cutoff estimates 미완료 |
| (9.10) 전체 두 moment | 3614791, 3614792 | five-bump increment만 적분 의미까지 해결; temporal/full tuple 조건 미완료 |
| Definition 9.4 domain/support/divergence | 3825024 및 전체 velocity | actual slow chart는 별도 파일에서 해결; 나머지 전체 source/label closure는 미완료 |

`kappa_s=1/100000`으로 계산한 모든 exponent slack은 positive다.
그러나 inequality의 전제인 실제 클래스 입력이 미입증이면 exponent 비교만으로
class membership을 얻을 수 없다. 결과 JSON의 10개 원본 요구사항은 모두
`UNRESOLVED`이며 `originalN601Complete=false`다.

초기 local 실행에서 선택 node 4708/137266 누락과 Windows CRLF receipt를
발견했고 검사 범위·exact blob 읽기를 수정했다. 원본 producer는 수정하지
않았다. 수정 후 전체 authenticated stream 검사는 **통과**했으며
15 divisor / 5 positive moment bodies / 3 actual copy bodies를 기록했다.

실행:

```text
python research-ide/mathscope-m3/n6-continuation-20261014/initial_source_lemmas.py --artifacts ORIGINAL_SIX_ARTIFACT_DIRECTORIES --output RESULT_DIRECTORY
```
