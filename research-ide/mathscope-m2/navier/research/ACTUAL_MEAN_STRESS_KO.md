# 실제 Imean의 열 보상 후 목표 응력

## 1. 계산한 양과 범위

신규 `actual-mean-stress.mjs`는 승인된 **동일 N3 원천**
`same-profile-2026-10-10.3`의 실제 최종 leading stress를 사용한다.
관측점은 `X=X0Imean exp(y)`, `eta=0`, `q/Q=1`,
`1/4<=y<=19/4`이다. 계산 결과는

\[
 R_\theta=\frac{T_{0,\theta}}{F X\lambda},\qquad
 R_z=\frac{T_{0,z}}{F X\lambda}
\]

의 구간이다. `F=E/sqrt(2X)>0`와 `X,lambda>0`는 원천의 실제 값이다.
그 거대한/미소 물리 배율은 표현식으로 보존한다. 반환 값은
물리적 `q^(-A-1/2) T0` 자체의 binary64 값이 아니다.

공개 함수는 다음과 같다.

```js
evaluateActualMeanStress({sourceProfile, y: 2.5, bits: 512})
compileActualMeanStressProgram({sourceProfile, y: 2.5, bits: 512})
actualMeanStressBounds(512)
verifyActualMeanStress(receipt)
```

`sourceProfile`은 고정된 승인 ID만 허용한다. `eta`, `h`, `lambda`,
외부 heat debt, 임의 source certificate 등은 호출 입력으로 받지 않는다.
`bits`는 16부터 4096까지이며 같은 물리점에서 반환할 **증명된 오차
반경**을 고른다. 내부 실제 열 적분을 해당 비트 수로 수치구적했다고
주장하지 않는다.

## 2. 원천과 복원 근거

원전은 [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf),
SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.
사용한 식은 (4.11), (4.15), (4.16), Lemma 4.4, A.2와 A.7이다.
원래 N3 조립 receipt SHA는
`184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`,
parameter expression SHA는
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`이다.

실제 사용한 로컬 유도 문서는 다음과 같다. 전용 테스트가 경로·바이트 수·
SHA를 대조한다. 신규 소스·테스트·이 문서의 최종 SHA는 생성된
`evidence/actual-mean-stress.json`의 `files`에 기록한다.

| 입력 | 사용한 내용 | SHA-256 |
|---|---|---|
| `HEAT_COMPENSATION_PROOF_EN.md` | H5–H9, H13–H14, H20: 실제 열 적분·전체 꼬리·정확한 I2 보상 | `81446a5f1a6a18a4e1aa9a44fdc5695da1846a1c23fe412c9ac282af155688e3` |
| `GLOBAL_STRESS_ASSEMBLY_EN.md` | §§1,3,6: 최종 프로파일과 I1 이후 모멘트의 정확한 일치 | `3c89af370fb2728bc407f5192493eb7474666051289626c57b73f19da7e59516` |
| `GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md` | §4: B.8 뒤 다섯 모멘트 전체의 실제 A.2 복원 | `f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b` |
| `actual-global-source-outer.mjs` | 실제 terminal wait와 A.2 단계 표현식 | `5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9` |
| `actual-pulse-meanpatch.mjs` | 동일 Imean의 E, F, M 및 shear 정규화 | `4e2930c8c89596c11f0db8ce72c417b52d01393f8d760920a197f6139bcb0e32` |

이 계산은 코어의 eta 반사 대칭을 가정하지 않는다. 실제 natural core에는
비대칭 이동 `j0`가 있다. 필요한 논리는 다음의 **함수 항등식**이다.

1. B.8은 선택된 A.2 데이터의 다섯 누적 모멘트를 모두 정확히 복원한다.
2. C.12 뒤 I1 보정도 같은 다섯 모멘트 함수를 보존하며 I2 이전에 끝난다.
3. I2는 E-only 보정이고 전체 A.7 열 변화의 반대 벡터를 정확히 더한다.
4. Imean은 I2 오른쪽이며 heat switch 왼쪽이다. 따라서 여기에서
   `M,J`는 literal prefix와 같지만 `I,S,Cp`는 각각 **전체 heat debt를
   뺀 값**이다.

eta=0 한 점의 모멘트 값만 일치시킨 것이 아니다. eta의 함수로 같으므로
필요한 eta 미분도 일치한다. 최종 복원 근거가 없는 임의 프로파일에는
이 계산을 적용할 수 없다.

## 3. 실제 A.2 prefix와 정규화

`S(s)=integral_0^s sigma(v)dv`,
`k(s)=4[1-sigma(log(1+s)/Md)]`로 둔다. 실제 k는
`s>=exp(Md)-1`에서 정확히 0이므로 다음 유한 적분을 쓴다.

\[
 K_1=\int_0^{e^{M_d}-1}e^s k(s)\,ds,\qquad
 J_{\rm init}=\int_0^1e^{8s/5-3S(s)/5}\,ds.
\]

이 구간까지의 실제 축·혼합 모멘트는

\[
 m_* = X_R e(4+K_1),\qquad
 J_* =\sqrt2 X_R^{3/2}P_*\left(\frac52+4J_{\rm init}
                       +e^{13/10}K_1\right).
\]

Imean에서 `M=eta*m_*`, `J=eta/(1+eta^2)*J_*`이다. 특히
`M_eta(0)=m_*`, `J_eta(0)=J_*`이다. 이 M을 0으로 놓으면 실제 radial
velocity와 응력 모두 달라진다.

각운동량 prefix의 정확한 세 단계는

\[
 r_{\rm initial}=e^{-13/10}\left(\frac58+J_{\rm init}\right),
\quad r_{\rm decay}=1+(r_{\rm initial}-1)e^{-T},
\]

\[
 r_{\rm entry}=e^{-1+\lambda/2}
       \left(r_{\rm decay}+\int_0^1e^{s-\lambda S(s)}\,ds\right).
\]

`L=60000T-8+y`이면

\[
 \frac{I_{\rm ref}}{XH}=\frac1{1-\lambda}
       +\left(r_{\rm entry}-\frac1{1-\lambda}\right)e^{-(1-\lambda)L},
\quad H=\sqrt{2X}E.
\]

여기서 denominator의 물리 배율은

\[
 XH=\sqrt2 X_R^{3/2}P_*
        e^{T+23/10-\lambda/2+(1-\lambda)L}.
\]

`X_R` 또는 `sqrt(2X)`를 누락한 축약을 쓰지 않는다.
평균 패치의 shear는 `a=2+2lambda`, `b_s=0`이다. (4.11)의 radial
viscosity를 그대로 남기면 eta=0에서

\[
 XQ_s=-X+m_*+\frac{(1-h)I_{\rm actual}-J_*}{H},\qquad
 T_{0,\theta}=F\{XQ_s-(2+2\lambda)\}.
\]

## 4. 열 적분 정의와 삭제하지 않은 보상

`Xt=Xtail`, `Et=E_cl(Xtail)`, `rho_o=c_o h`, `A=1/2+h`라 쓰자.
이 두 tail scale은 기존 actual outer compiler의 실제 terminal 단계
`start`와 `logAStart`에서 **부분 표현식을 복사**한다. 근삿값이나
미구현 tail oracle을 삽입하지 않는다.

\[
 f_o(s)=1-\rho_o\{1-\sigma((s-1)/2)\},\qquad
 E_{\rm cl}(X_te^s)=E_t e^{-As}\frac{f_o(s)}{1-\rho_o}.
\]

열 인자는 다음 두 명시적 Laplace 적분의 비이다.

\[
 \Gamma_h=\int_0^\infty e^{-v}v^h\,dv,\qquad
 \ell(Z)=\frac1{\Gamma_h}\int_0^\infty
 e^{-v}v^h\{1-(1+Zv)^{-h}\}\,dv.
\]

`ell=1-H_heat`이다. source parameter 중 이름이 `Gamma`인 축 비교
상수와 Euler의 `Gamma(1+h)`는 서로 다르다. 이 모듈은 전자를 사용하지
않고 후자를 위 적분으로 생성한다.

`chi= sigma((s-1/5)/(3/10))`, `Z=2(1-eta^2)/(Xt exp(s))`,
`g=-chi*ell(Z)`이면, `X=Xt exp(s)`의 Jacobian까지 포함한 전체 debt는

\[
 D_I=\int_{1/5}^\infty \sqrt2 X^{3/2}E_{\rm cl}g\,ds,
\]

\[
 D_S=-\frac12\int_{1/5}^\infty X E_{\rm cl}^2(2g+g^2)\,ds,
\quad D_{C_p}=\frac12\int_{1/5}^\infty E_{\rm cl}^2(2g+g^2)\,ds.
\]

프로그램은 모든 적분을 `s=lower+t/(1-t)`로 바꾸고 그 Jacobian
`(1-t)^-2`를 넣은 명시적 `definite_integral` 노드로 기록한다. 0과 1은
**부정적분의 한쪽 극한**으로 해석한다. 무한대 끝점을 유한 샘플로
대신하지 않는다. H7의 지배 함수와 H8이 이 적분의 수렴 및 eta 미분을
정당화한다. 미분 구현은 eta와 무관한 적분 경계를 확인한 뒤 적분 안에서
미분한다. `0 * undefined endpoint`를 만들지 않는다.

eta=0에서는 `D_I<0`, `D_S>0`, `D_Cp<0`이다. M/J heat debt는
수정 구간에서 U=0이므로 **항등적으로 0**이다. I2가 전체 debt의 반대를
더하므로

\[
 I_{\rm actual}=I_{\rm ref}-D_I.
\]

`D_I=0` 또는 `I_actual=I_ref`라고 쓰는 것은 실제 응력을 바꾸는 오류다.

### 실제 열 변화의 엄밀한 양의 하한

`0<h<=1/100`, `0<Z<=2`에서 `v^h<=1+v`이므로 `Gamma_h<=2`이다.
`v`가 [1,2]에 있으면

\[
 1-e^{-h\log(1+Zv)}\ge\frac h2\log(1+Z)
      \ge\frac{hZ}6.
\]

`e^2<9`와 `v^h>=1`을 사용하면 `ell(Z)>hZ/128`을 얻는다.
이제 tail 로그 좌표 `s`를 [1/2,1]에만 제한한다. 여기에서 chi=1,
`f_o=1-rho_o`이고 `exp(-hs)>1/3`이다. 이 양의 직사각형을 적분하면

\[
 -D_I>\frac{E_t\sqrt{X_t}\,h}{512}>0.
\]

따라서 다음의 정규화 열 보정은 실제로 0이 아니다.

\[
 0<\frac{(1-h)E_t\sqrt{X_t}\,h}{512 XH\lambda}
  <-\frac{(1-h)D_I}{XH\lambda}
  \le\frac{1024}{\lambda X_{0,I2}}.
\]

마지막 상한은 H8, H4, 그리고 I2 이후 XH 단조성으로 얻는다.
H9의 전체 eta C2 debt bound `2^15/X0I2`도 그대로 기록한다.
`integral_1^infinity x^(-1-h)dx=1/h`가 명시적 h를 상쇄하므로, 작은 h를
기계 0으로 바꾸거나 유한 tail을 잘라 이 상계를 얻지 않는다.

## 5. 실제 목표 응력의 실행 가능한 구간

앞의 식을 모두 합하면

\[
\begin{aligned}
 R_\theta={}&\frac{1-h/\lambda}{1-\lambda}
 +\frac{(1-h)(r_{\rm entry}-(1-\lambda)^{-1})e^{-(1-\lambda)L}}\lambda\\
 &+\frac{m_*}{X\lambda}-\frac{J_*}{XH\lambda}
 -\frac{2+2\lambda}{X\lambda}
 -\frac{(1-h)D_I}{XH\lambda}.
\end{aligned}
\]

실제 `T=exp(1048576)+10`에 대해 `T>=128`이면 충분하다. 아래 표는
`0<=y<=5`에서 성립하는 **전체 함수 상계**이다. 각 행의 상계와
`exp(-s)<2^-s`를 결합한 뒤, 작은 정수 연산으로 마지막 열을 계산한다.

| `Rtheta-1`의 절댓값 항 | 연속 상계 | 엄밀한 dyadic 상한 `2^-b`의 b |
|---|---|---:|
| `lambda/(1-lambda)` | `2 exp(-1000T)` | 127999 |
| `h/(lambda(1-lambda))` | `2 exp(-7002T)` | 896255 |
| initial/entry transient | `16 exp(-58400T+8)` | 7475188 |
| radial moment | `4 exp(-59000T+7)` | 7551991 |
| mixed moment | `128 exp(-58400T+8)` | 7475185 |
| radial viscosity | `4 exp(-59001T+6)` | 7552120 |
| full heat compensation | `1024 exp(-59001T+18)` | 7552100 |

상계 도출에서 `0<=sigma<=1`, `e<3`이면 `rInitial<10`,
`rDecay<10`, `rEntry<13`, `(1-lambda)^-1<2`가 된다. 따라서 transient
계수는 16 미만이다. `K1<4 exp(T)`와 `Jinit<9`이면
`Jshape<(149/2)exp(T)<128 exp(T)`이다.

각 항이 `2^(-bits-3)`보다 작고 항이 7개이므로, 지원하는 모든
`16<=bits<=4096`에서

\[
 1-2^{-\mathrm{bits}}<R_\theta<1+2^{-\mathrm{bits}},\qquad R_\theta>0.
\]

큰 수를 실제로 전개하지 않아도 이 구간은 유한 정수 연산으로 생성된다.
기본 bits=512의 정확한 양 끝은 분자·분모 문자열로 저장한다. binary64
표시는 이를 포함하는 `[nextDown(1),nextUp(1)]`이다. `[1,1]`로 축약하지
않는다. 정확한 열 보정의 양의 하한·상한도 별도 표현식으로 보존한다.

### 축 응력이 정확히 0인 이유

literal Imean prefix에서는 S, Cp와 A.21의 Pi0가 even이다. 실제 heat
debt 역시 `Z=2(1-eta^2)/X`에 의존하므로 even이다. 원천 복원으로
`M=eta*m_*`, `U=0`이고 `S_eta(0)=Pi_eta(0)=0`이다. (4.16)의 모든 Ns
항이 eta=0에서 사라지므로 `Ns=0`; `b_s=0`과 (4.11)이 `T0,z=0`을 준다.

프로그램은 세 실제 열 적분을 eta로 직접 미분하고 eta=0을 대입한
결과 노드가 정확한 rational 0인지 검사한다. 이 증명은 원래 비대칭
natural core를 even으로 바꾸지 않는다.

## 6. 독립 검증과 사용 한계

전용 Node 검사는 입력 바이트, 원래 응력식의 복원, 세 실제 heat
미분의 정확한 0, 7개 상계의 정수 산술, precision/point 계약 및 금지
입력을 확인한다. 12개 독립 유한 대입에서는 열 보상 부호 반전, J_eta
삭제와 점성 항 삭제가 각각 다른 응력을 만드는지도 검사한다.

별도 Python 표준 라이브러리 검사는 생성된 표현식을 `Fraction`으로
독립 해석한다. 48개 유한 대입에서 (4.11), (4.16), 정규화 및 세 종류의
실패 대조군을 **정확한 유리수 등식**으로 확인한다. 실제 단계들의 지수는
별도의 affine 연산으로 다시 모으고, 모든 eta 의존 노드가 eta²를
통하는지도 독립 검사한다. 90자리 Decimal 계산은 양의 열 적분 하한에
쓰인 초등 부등식의 독립 수치 대조군이다. 연속 인증 자체는 이 샘플들에
의존하지 않는다.

실행 명령:

```bash
node --test research-ide/mathscope-m2/navier/tests/actual-mean-stress.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-mean-stress-independent.py --write research-ide/mathscope-m2/navier/evidence/actual-mean-stress.json
```

이 모듈은 실제 대표점의 leading target stress를 제공하므로 같은 원천의
두 covariance 열과 결합할 수 있다. `Imean` 밖의 실제 stress evaluator,
전체 annulus의 covariance, global (7.30), 모든 slow derivative,
전 차수 background 및 완전 N5 패키지 인증은 이 모듈의 결과가 아니다.
특히 (5.44)의 velocity restriction을 양의 차수 pressure/stress가 모두
0이라는 주장으로 확장하지 않는다. 전체 heat 적분의 arbitrary-precision
구적을 실행했다고도 기록하지 않는다.
