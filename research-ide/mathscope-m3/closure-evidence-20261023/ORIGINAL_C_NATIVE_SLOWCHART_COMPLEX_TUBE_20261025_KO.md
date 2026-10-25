# OpenAI (C) 원본 native system 2: 공통 복소 역함수 튜브와 전 차수 미분 경계

2026-10-25 KST · M3/N6–N8 첫 FiveMap 원본 감사 브랜치에 한정한다.

## 원본 및 적용 범위

- 첫 post-Signed FiveMap AST **4,420,257 nodes**, SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
- Native registry SHA-256 `bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`.
- 실제 11개 물리 루트의 native-body 의미론에서 도달하는 역함수 2개는 `#622820`, `#623935`. 이는 최종 반복장 A–D 루트가 아니며, 호출의 **런타임 인자**를 아직 인증하지 않는다.
- 원본 `0<h<2^-4096`, `D=1/2-h`. Source image는 `1/2<=s0<=2`, `|eta0|<=1`, `Z0=s0^D eta0`, `T0=s0(1-eta0²)`.
- Native 근 방정식: `F(s;Z,T)=s-Z²s^(2h)-T=0`. 양의 실수축을 포함하는 반평면에서 principal complex power를 사용한다.

## 원본 영상의 **복소 정칙성** 정리

모든 허용 실제 실수 `(s0,eta0,h)`에 대해 복소 원판 `|Z-Z0|<1/100`, `|T-T0|<1/100`에 역근 `s(Z,T)`가 유일하게 존재하며, `|s-s0|<1/8`이고 복소 해석적이다.

실제 부등식은 다음과 같다.

1. 닫힌 근원판 `|s-s0|<=1/8` 전체에서 `Re s>=3/8`, `|s|<=17/8`; 따라서 `log s`의 principal branch가 유효하다.
2. `2h<1/2`이므로 `|s^(2h)|<sqrt(17/8)<3/2`, `|s^(2h-1)|<4`.
3. `|Z0|<=sqrt(2)<3/2`; 복소 Z 튜브 전체 `|Z|<151/100<8/5`.
4. 고정점 함수 `G(s)=Z² s^(2h)+T`는 `|G'(s)|< (512/25)h <1/8`.
5. 중심 이동은
   `|G(s0)-s0| < (301/10000)(3/2)+1/100 = 1103/20000 <7/64`.
6. `1103/20000+(1/8)(1/8)<1/8`. 따라서 닫힌 근원판이 내부로 이동하고, 수축사상 정리가 적용된다.

복소 매개변수에 대해 Picard 반복이 국소 균일 수렴하므로 유일근은 정칙 함수다. Cauchy 부등식에서 각 음이 아닌 정수 `a,b`에 대해

`|d_Z^a d_T^b s(Z0,T0)| <= (17/8) a! b! 100^(a+b)`.

이는 **native 역함수 한 개의 전 차수 해석적 상계**이지, 원본 `Phi/u`의 `B_rho` 전체 Banach 노름이나 원본 최종장을 인증하는 정리는 아니다.

## 실제 source-image eta 복소 변수를 통한 합성 정리

`s0`를 고정하고 `Z(eta)=s0^D eta`, `T(eta)=s0(1-eta²)`로 두면, 모든 `|eta-eta0|<1/1000`에 대해
`|Z(eta)-Z0|<3/2000<1/100`,
`|T(eta)-T0|<2001/500000<1/100`.

그런데 `2D+2h=1`이므로 **복소 η 전체에서**

`F(s0;Z(eta),T(eta)) = s0 - s0^(2D+2h)eta²-s0(1-eta²)=0`.

따라서 위 역함수의 유일성에 의해 `s(Z(eta),T(eta))=s0`이고, 고정 `s0`에 대해 복소 η의 모든 **양의 차수** 미분은 정확히 0이다.

이 정리는 실제 native 호출이 이 **영상 매개변수화**를 따를 때만 사용할 수 있다. 자유좌표 호출 `#622820`, 원본 메시 부호 선택과 접합 `#623935`, 그 두 호출의 실제 물리 지지집합 및 스위칭 표면에서의 `C^infty` 정칙성은 여전히 OPEN이다.

## 같은 실제 native 역함수의 유한 Taylor tail

위 해석적 튜브로부터 각 다변수 Taylor 계수는
`|c_(a,b)| <= (17/8)*100^(a+b)`다.
`|delta Z|,|delta T| <= 1/400`이면 합차수 k의 (k+1) 항 전체는
`(17/8)*(k+1)/4^k`로 제어된다.

따라서 차수 N까지의 이변수 Taylor 근사에 대한 절대 오차는
`(17/8) * r^(N+1) * ((N+2)-(N+1)r) / (1-r)^2`,
여기서 `r=100*max(|delta Z|,|delta T|)<=1/4`이다.
원본의 실제 (N=12) 계수차수에 대한 공통 튜브 `r=1/4` 상한:

`731/1207959552 = 6.0515...e-7`.

이것은 **native system 2 역함수의 로컬 Taylor remainder**다.
`Phi/u`의 Appendix B 급수나 cutoff-Borel 무한합 tail과는
대상 함수가 다르므로, 자연급수 원본의 490 OPEN은 감소시키지 않는다.

## 테스트·증거

- `prove_original_monotone2_uniform_complex_tube.py`
- `test_prove_original_monotone2_uniform_complex_tube.py`
- `.github/workflows/mathscope-original-root623935-general-srep-20261025.yml`
- 2026-10-25 SHA-pin 원본 AST CI 검증: https://github.com/leegahuyn/MathScopeCompute/actions/runs/40158271484

상태는 증명 경계를 넘겨 상향하지 않는다: actual native caller domain OPEN; natural Y 33/523 proved, 490 OPEN; final 67 jets 0/67; M3 62/64, M4 0/16; **RELEASE HOLD**.

## 다음 반드시 필요한 수학적 연결

1. 두 역근을 호출하는 실제 원본 source native body의 자유좌표 `Z,T`를 실제 `s0,eta0` 영상 또는 위 복소 튜브에 **모든 지지집합에서** 결속한다.
2. 실제 메시 교차·부호 스위칭의 `C^k` 평탄 접합과 도함수 손실을 소스 cutoff 및 Fourier tail에 연결한다.
3. 자연급수 `490`개의 실제 `Y` 범위 및 `Phi/u`의 전 차수 `B_rho` 계수·복소 domain 및 유한항 구간을 증명한다.
4. 실제 (C)의 최종 4단계 A–D 물리장과 압력을 완성하고 동일 source 데이터의 67 + 13개 jet, full 3D NS residual, force, 전역 K 에너지와 N8 독립 refinement를 계산·인증한다.
5. 그 후 (D)의 **물리적** 토러스 주기화·실제 웹 3D 동일-run evidence · M4 16 기준을 연결한다. N8 generic Fourier comparator를 최종 (C)/(D) 사례로 바꾸지 않는다.
