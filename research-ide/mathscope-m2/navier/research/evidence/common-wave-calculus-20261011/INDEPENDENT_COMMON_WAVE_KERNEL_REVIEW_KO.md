# 공통 wave 미분·잔차 kernel 독립 검토

검토자: 별도 `positive_stress` 작업자. 검토일: 2026-10-11. 아래 세 구현과 그 직접 사용 recurrence를 읽고, 기록된 실행 결과를 대조했다. 원본 구현과 실행 snapshot을 수정하지 않았다.

## 판정

검토한 generic 수학 연결에서 수정이 필요한 오류를 발견하지 않았다. 증명은 명시된 실제 source 전제를 소비하는 형태이다. 이 파일 자체는 공통 family의 모든 전제가 이미 결속되었다거나 전체 Navier–Stokes 잔차가 flat하다는 인증을 추가하지 않는다.

| 검토 구현 | 실행 시 SHA-256 |
|---|---|
| `actual-all-order-gaussian-jet-kernel.mjs` | `5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6` |
| `actual-physical-residual-algebra.mjs` | `df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116` |
| `actual-global-wave-bound-kernel.mjs` | `aed60d154195d07b38e2b7fa3005a1b792cc6e8c8867a91008fecec2d33ca6b9` |

실행 증거 `common-wave-kernels-attempt1.json`은 17/17, 관측 종료 코드 0, 실행 전후 source 불변을 기록한다. 검토자는 이 무거운 source 전제가 없는 generic 검사를 반복 실행하지 않았다. 앞선 새 test의 metadata 경로 오류 기록과 이번 성공 기록은 구분되어 있다.

## 1. 혼합 Duhamel 귀납

`stableMixedVolterraPowerRecurrence`는 전체 미분 길이로 귀납한다. 순수 slow word는 같은 원래 전파자와 영 initial slow derivative를 사용한다. 길이 k의 비어 있지 않은 부분 word를 선택하는 개수는 `binomial(m,k)`이므로 다중지표의 모든 부분집합을 덮는다. 전파자 인자는 `W*W^(m-k+1) <= W^(m+1)`이고, 적분 구간 길이 `L<=B*S`를 정확히 한 번 부과한다.

fast 미분이 있는 word는 `w_v=Mw`를 미분하므로 오른쪽의 w 미분은 항상 더 낮은 전체 차수이다. 이때 `binomial(m-1,j)`와 M의 0차 항도 빠지지 않는다. 따라서 순수 slow와 fast가 섞인 word를 같은 m차 상수로 통제한다. 계산에는 S에 따라 증가하는 새 `exp(L)` 상수가 없다.

기존 matrix 연산 DAG를 올리는 부분은 원래 F, F_R, G_R의 slow 미분을 영으로 취급하지 않는다. n은 v에서만 affine이며 slow 변수에서는 임의 유한 미분을 가진다는 점을 `j+16` 지수로 유지한다. n′와 B′의 추가 한 미분도 남는다. reciprocal와 square root recurrence는 같은 양의 하한을 사용하고 중간 Leibniz 항을 전부 보존한다.

P는 고정 label과 고정 대표점에서 slow 독립인 원래 Gaussian envelope이다. 따라서 P의 ordinary v 미분 bound를 전체 word의 상계로 쓰는 것이 정당하다. 실제 adapter에서는 대표점과 carrier를 slow 미분 중 고정한다는 전제를 유지해야 한다.

## 2. covariance inverse, 제곱근, 양끝 pole

H의 적분 미분은 원래 Haar 계수를 남기고 `ci*Ls=2*r0`로 구간 길이를 상쇄한다. H의 0차 inverse는 `|det H|>=d_star/S`와 entry bound를 사용한다. 이후 `D^m(H^-1)`는 `H*H^-1=I`를 미분한 식의 모든 양의 H 미분과 낮은 차수 inverse 미분을 포함한다. 행렬 크기 2에 대한 여분 계수도 들어 있다.

y=H^-1 T의 미분은 zeta를 공통 인자로 유지한다. `sigma=sqrt(y)`의 m차 미분에서는 `sigma²=y`의 모든 중간 곱을 남긴다. 분자에는 zeta가 있고 `sqrt(y)>=sqrt(c_y)*sqrt(zeta)`이므로 결과에도 `sqrt(zeta)`가 남는다. 부호가 있는 derivative를 양의 y로 오인하거나 경계에서 0/0을 수치 계산하지 않는다. 시작 pole의 올림과 이후 pole의 최대·합은 `0<delta<=1`에서 안전한 방향이다.

`doubleBoundaryGaussianPoleBound`의 `nu=ab/(a+b)`는 양의 두 원래 exponent보다 작다. 완전제곱은

`pole²/(2nu)+(nu/2)x²-pole*x = (nu*x-pole)²/(2nu)`

이며 `x=1/delta`로 모든 유한 pole을 흡수한다. 반쪽 지수만 쓰면 원래 양끝에서 임의 차수 소멸도 남는다. a와 b의 실제 양성은 호출하는 source adapter의 의무로 명확히 구분되어 있다.

## 3. 실제 물리 잔차 대수와 Q 손실

`exactPhysicalMomentumSplit`는 `gradient[component][direction]` 규약으로 시간·확산·압력 및 `(u·∇)w`, `(w·∇)u`, `(w·∇)w`를 모두 남긴다. covariance 전개도 이전 correction과 새 increment의 상호작용, full curl remainder, 새 increment의 제곱을 보존한다. signed inverse의 `1/(2a_j)`는 실제 교차항의 2를 상쇄하며 새 제곱항은 별도로 남는다. 이를 제거한 negative controls가 있는 점도 확인했다.

물리 손실은 h를 0으로 바꾸지 않고 `h<1/16`에서 정확한 유리수 양의 margin을 계산한다. axial phase의 epsilon 상쇄, radial fast 계수의 `epsilon^(-kappa_s)`, 시간 연산자의 `-epsilon*d_T+d_v`와 harmonic k 비용이 구분되어 있다. 기본 물리 momentum 손실을 2, 추가 미분마다 2로 약하게 잡는 것은 표시된 엄밀 상계보다 크다.

마지막 band 합은 `S=ell²`의 polynomial을 ell 지수로 바꾸고 전체 3차원 mesh의 `ell^18`을 더한다. source-only amplitude 상수는 generic Gaussian scalar recipe 바깥의 곱으로 유지되어야 한다. 구현은 그 사실을 명시하며 temporal-cutoff Gaussian force의 flatness만 결론으로 삼는다. 전체 미수정 NS 잔차를 flat 또는 0으로 선언하는 flag는 켜지지 않는다.

## 실제 adapter에서 계속 필요한 결속

같은 공통 b_n에서 나온 C_(m+2), 실제 원래 matrix와 stable decomposition, 중심에 정규화된 같은 a>0 Gaussian, 원래 H의 Haar 적분 및 determinant 하한, 실제 y_j의 zeta 하한, 전체 target의 유한 pole bound, original physical map/phase와 full curl을 결속해야 한다. 이들은 위 generic kernel의 성공만으로 대체되지 않는다.
