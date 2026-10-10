# N5-07: 원문 harmonic potential–curl 연산자

## 완료한 범위

이 모듈은 청사진 PDF **60쪽 N5-07 원문**의 연산자 기준을 구현한다. 기준 텍스트와 판정 범위는 `evidence/original-m2-criteria.json`을 따른다. 사용한 수학식은 보존된 원문 논문 `source-sections5-7.txt`의 (6.6), (7.37)–(7.39), 특히 인쇄본 **85–86쪽**이다. 원본 논문 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.

`source-pulse-curl.mjs`가 공급받은 harmonic coefficient의 jet에 수행하는 계산은 다음과 같다.

\[
 C_m=\frac{i\,n_\Phi\times t_m}{km|n_\Phi|^2},\qquad
 r_m=\bigl(-D_z(C_m)_\theta,\,
 D_z(C_m)_r-D_r(C_m)_z,\,
 (D_r+R^{-1})(C_m)_\theta\bigr).
\]

실제 반환 속도 진폭은 `t_m+r_m`이다. cutoff를 먼저 진폭에 적용하고 그 뒤 potential과 curl을 계산하므로 cutoff 미분과 coefficient/frame 미분이 모두 남는다. 물리 potential은 `Q^(1/2-A) C_m exp(i k m Phi)`이며 물리 속도는 `Q^(-A) (t_m+r_m) exp(i k m Phi)`이다.

이것은 임의의 **조건을 만족하는 smooth coefficient에 적용되는 원문 연산자**다. 내장 numerical probe는 그 연산자의 독립 검증용 smooth coefficient이다. 원래 N3/N4 background, Lemma 7.4의 실제 growing-mode solution, 그 pulse class의 모든 derivative bound를 새로 구한 것으로 표시하지 않는다. 해당 상태는 반환 자료에서 계속 `globalN3PulseEvaluated:false`, `pulseClassBoundsCertified:false`, `formalComplete:false`이다.

## 실제 정규화 미분

독립 좌표를 `R,Z,Y1,Y2`로 두고

\[
 D_r=\partial_R+M_i d_r R^{d_r-1}(v_r\cdot\nabla_Y),
 \qquad D_z=\epsilon\partial_Z
\]

를 그대로 적용한다. 시간 및 band label은 이 spatial curl 동안 고정된다. `theta`는 진폭의 독립 좌표가 아니며, phase의 `p theta` 항으로 정확히 처리한다. 따라서 이 curl에 필요한 모든 미분을 위 네 변수로 계산할 수 있다. 원래 (7.3)의 phase를 직접 구성한다.

\[
 \Phi=p\theta+p_z Z/\epsilon+x_0R-v(pF+p_zG).
\]

`F,G`의 auxiliary independence와 `D_r v=D_z v=0`을 검사한다. phase를 미분해서 `nPhi=(D_r Phi,p/R,D_z Phi)`를 얻으므로 axial `F_Z,G_Z` 항도 유지된다. carrier와 harmonic은 `k>=1`, `m!=0` 정수이고 `k*p`는 0이 아닌 정수여야 한다. 계산 도중 이 label을 다시 선택하지 않는다.

진폭과 potential의 출력은 complex pair `[real,imaginary]`이다. 혼합 미분을 포함한 3차 normalized Taylor jet를 입력 표현으로 사용한다. phase의 3차 jet에서 normal의 2차 jet, potential의 2차 jet, remainder의 1차 jet, divergence의 0차 값을 계산한다. 각 연산은 알려진 미분 차수를 감소시키므로 제공되지 않은 상위 미분을 0으로 취급하지 않는다. `fromDerivatives`의 미분 자료는 normalized coefficient가 아닌 실제 derivative 값이며, 입력 시 multi-index factorial로 나눈다.

`amplitude`로 주어진 계수가 비접선이면 실패하며 값을 projection해서 바꾸지 않는다. `seed`를 별도로 제공하면 `t_m=nPhi cross seed`가 진폭의 **정의**이므로 접선 조건이 대수적으로 성립한다. 두 방법을 동시에 사용할 수 없다. 일반 수치 `amplitude`의 jet 검사는 exact transversality 증명을 대신하지 않으며, 반환 `transversalityPremise`에 그 차이를 기록한다.

## exact identity와 numerical diagnostic의 구분

`exactSourcePulseCurlIdentities()`는 `BigInt` 계수를 갖는 differential polynomial을 실제 전개한다. `w=i*k*m`를 formal scalar로 두고 다음 관계를 사용한다.

\[
 D_rD_zC=D_zD_rC,\quad D_rn_z=D_zn_r,\quad
 D_rn_\theta=-n_\theta/R,\quad D_zn_\theta=0,\quad
 D_r(R^{-1})=-R^{-2}.
\]

첫 관계는 위 source `D_r,D_z`가 commute하기 때문이다. 나머지는 `nPhi`가 `p theta+PhiBase`의 원통좌표 gradient라는 사실에서 나온다. 계산된 다항식

\[
 (D_r+R^{-1})a_r+D_za_z+ikm(n_\Phi\cdot a),\qquad a=t_m+r_m
\]

은 항이 하나도 없는 zero polynomial이다. `n cross (n cross t)=n(n dot t)-|n|^2t`도 별도로 전개한다. 그러므로 `ikm n cross C_m=t_m`는 접선 조건 아래 성립한다. 진폭 재구성은 단순히 검사 결과를 `true`로 지정하지 않고 이 다항식과 실제 jet 값을 모두 대조한다.

`(D_r+R^-1)C_theta`에서 radial frame 항을 제거한 negative control은 **비영 다항식**을 돌려준다. physical exponent도 `[상수,h계수]`의 두 정수/유리수 성분으로 합산하여

\[
 (1/2-A)-1/2=-A
\]

를 검사한다. 이러한 exact identity와 binary64 jet 값의 rounding residual은 다른 종류의 증거로 보존한다. 새 Lean kernel 검증을 수행했다고 표시하지 않는다.

## 독립 Cartesian 대조

테스트 파일 `tests/source-pulse-curl.test.mjs`의 `referencePotential`은 jet 엔진, remainder 식, 원통 미분을 호출하지 않는 별도의 **값 전용 potential 구현**이다. 실제 physical Cartesian 좌표에서

\[
 R=\sqrt{x^2+y^2}/\sqrt Q,\quad Z=z/Q^D,
 \quad Y=Y_{\rm base}+M_iR^{d_r}v_r
\]

를 다시 구성하고, complex potential을 원통 basis에서 Cartesian basis로 바꾼다. 이 potential에 Cartesian 중앙차분 curl을 적용하면 full jet velocity로 2차 수렴한다. 검증에는 세 dyadic scale을 사용한다. `Y(R)`의 fast radial map 또는 `Q^(1/2-A)` 중 `Q^(1/2)`를 빠뜨리면 이 대조가 실패한다.

별도로 full physical velocity에 Cartesian 중앙차분 divergence를 적용한다. 기본 probe에서 정규화 divergence의 절댓값은 step을 절반씩 줄일 때 다음과 같이 줄었다.

| 정규화 step | full divergence 절댓값 | remainder를 버린 divergence 절댓값 |
|---:|---:|---:|
| 0.024 | 0.000189226455 | 0.0669098828 |
| 0.012 | 0.000047282694 | 0.0670431148 |
| 0.006 | 0.000011819176 | 0.0670764356 |

이 표는 numerical refinement의 증거다. 전역 PDE residual certificate나 rigorous numerical error bound는 아니다. full divergence의 exact zero는 앞의 polynomial identity에서, 수치값의 수렴은 이 독립 coordinate 대조에서 각각 확인한다.

## conjugate pair와 covariance

고정된 같은 `Phi`에 대해 `t_-m=conjugate(t_m)`이면 denominator의 `m` 부호 때문에 `C_-m=conjugate(C_m)`, `r_-m=conjugate(r_m)`가 된다. 실수파 convention은

\[
 \operatorname{Re}(a e^{ikm\Phi})
 =\tfrac12 a e^{ikm\Phi}+\tfrac12\bar a e^{-ikm\Phi}
\]

이다. angular frequency가 0이 아닌 정수이므로 평균 covariance는

\[
 \frac12\operatorname{Re}(a_r\overline{a_{\rm tan}})
\]

이다. 양/음 harmonic의 potential, remainder, velocity를 모두 비교하고, 256개 angular node의 별도 합으로 factor `1/2`를 검사한다. 기본 complex probe에서 `r_m`을 제거하면 covariance 차이가 약 `(-0.0043707991,-0.0003168565)`이므로 제거를 무해한 것으로 취급하지 않는다.

probe cutoff는 `exp(1-1/(1-s^2))`를 `|s|<1`에 사용하고 그 밖에서 0으로 정의한다. 모든 경계 derivative가 0인 compact smooth cutoff다. radial support는 `0.65<R<1.95`이므로 축 근방의 physical field는 0이다. 축에서는 cylindrical `0/0`을 평가하지 않고 이 smooth zero extension을 반환한다. 이 probe를 원문 N3 field의 값으로 이름 붙이지 않는다.

## API 및 통합

### 사용자 실행용 audit

```js
const audit = sourcePulseCurlAudit({ell: 8}, {checkCancelled});
```

선택 입력은 `ell` 하나이며 정수 `4..20`이다. 이 숫자는 **finite verification window**이다. 원문 N3의 `q_star` domain을 인증한 값이 아니다. 다른 필드는 실패시켜 `h` 등의 무단 대체를 막는다.

주요 출력은 다음과 같다.

- `checks: [{id,pass}]`, `pass`: exact/operator/numerical/negative 검증 결과.
- `samples: [{R,tNorm,remainderNorm,fullNorm,fullCovariance,withoutRemainderCovariance}]`: 계수 norm 및 covariance 비교 표시용 자료. `R`는 normalized radial coordinate이며 나머지는 해당 명시적 probe의 값이다.
- `convergence`: Cartesian physical/normalized step와 divergence.
- `probe.values`, `probe.diagnostics`, `probe.physical`: actual operator output과 numerical diagnostic.
- `contract`, `scope`: 원문 식, scale, 정확한 조건 및 아직 인스턴스화하지 않은 원문 field 범위.

### 외부 coefficient provider용 연산자

```js
evaluateSourcePulseCurl({
  coordinates: {R, Z, Y1, Y2, theta},
  operators: {epsilon, Mi, dr, vr},
  phase: {k, m, p, pz, x0},
  physicalScale: {Q, h},
  slowFields: (variables, J) => ({F, G}),
  pulseCoordinate: (variables, J) => v,
  amplitude: (data, J) => [t_r, t_theta, t_z],
  // 또는 amplitude 대신 seed: (data,J) => [s_r,s_theta,s_z]
  cutoff: (data, J) => chi // 선택. 이 단계 뒤에 C_m와 curl을 계산한다.
});
```

`data`는 `R,Z,Y1,Y2,F,G,v,nPhi,Dr,Dz,complex`를 제공한다. jet 생성/연산은 `J.constant`, `J.add/sub/mul/div`, `J.scale`, `J.inv/pow/exp/sin/cos`, `J.derivative`, `J.fromDerivatives`, `J.bump`이다. real component는 jet 하나, complex component는 `[realJet,imaginaryJet]`로 전달한다. 수치 physical chart는 `epsilon=Q^h`와 양의 radial normal denominator를 검사한다. exact N3 h는 별도 source provenance에 남으며 내장 `h=1/128` 검증값으로 대체되지 않는다.

### 실행

```sh
node --test research-ide/mathscope-m2/navier/tests/source-pulse-curl.test.mjs
```

N5-07을 이 범위의 PASS로 사용해도 N5-04의 uniform source phase bounds, N5-05의 실제 growing/forced pulse, N5-06의 실제 두 family stress 일치가 완료되었다는 뜻은 아니다. 이 연산자는 그 계수가 준비되면 같은 API로 적용할 수 있다.
