# 실제 fixed-label potential의 slow cutoff와 물리 좌표 결합

이 추가 경로는 `actual-full-curl.mjs`가 만든 같은 실제 원본에 원래 slow cutoff, palette rectangle, physical map, 실수 conjugate 및 pressure coefficient를 연결한다. source constructor는 한 번만 실행하며, 하나의 `ell=1` pulse를 다른 band의 pulse로 사용하지 않는다. 원문은 [Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의 (6.3), (6.6), (6.9), (6.11), (7.3), (7.13), (7.37)–(7.40), 인쇄 62–66쪽 및 73–87쪽이다. 읽은 PDF SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.

## 1. 실제로 추가한 식

기존 source의 실수 potential coefficient를 `C`라 하고, 원래 한 slow label `beta=(ell,a)`의 cutoff를 `eta_beta`라 한다. 원래 두 sign은 같은 box 내부의 서로 다른 rectangle이며, harmonic `m=+1,-1`과 구분한다.

\[
\eta_\beta=\chi_\ell\!\left(-\frac{\log q}{\log2}\right)
\prod_{j=1}^3\chi_{a_j}\!\left(\ell^6(C_\ell)_j\right),\qquad
\chi_j(x)=\frac{b(x-j)}{\sqrt{\sum_{k\in\mathbb Z}b(x-k)^2}}.
\]

`b`는 기존 source의 동일한 bump이다. 고정 label `j`에 대해 `|x-j|<=3/4` 안에서는 분모를 `j-1,j,j+1` 세 항으로 정확하게 계산한다. 다른 정수까지의 거리는 `5/4` 이상이므로 나머지 항은 지지집합 밖에서 정확히 0이다. 가장 가까운 정수가 이 세 정수 중 하나이며 그 bump가 `1/2` 이상이므로 분모는 `1/4` 이상이다. 이 지지집합 밖은 flat zero guard로 정의한다. 따라서 전체 원래 `chi_j`와 같은 함수이며, 분모가 0이 될 수 있는 먼 영역을 평가하지 않는다.

이 표현에서는 미분 중 가장 가까운 정수를 다시 선택하지 않는다. source graph의 `ceiling` 연산은 움직이는 정수 선택의 미분을 지원하지 않으므로, 이를 shared body에 숨기는 것으로는 충분하지 않다. 새 경로는 cutoff의 R/Z/T 첫 미분 본문을 실제로 materialize하여 같은 source body의 직접 미분과 일치하는지 검사하고 RZ/ZR 혼합 본문도 생성한다. `sqrt(b*b)`를 평탄한 경계에서 새로 미분하지도 않는다.

새 구현은 `eta_beta*C`의 본문을 먼저 만든 뒤 실제 미분 연산자를 적용한다. 정규화된 원통 연산자는

\[
D_r=\partial_R+M_i d_rR^{d_r-1}\partial_\xi,\qquad D_z=\epsilon\partial_Z.
\]

기존 `curl(i C exp(i k Phi))=(L+i r)exp(i k Phi)`에 대해 직접 생성한 식은

\[
\begin{aligned}
L_\beta&=\eta_\beta L,\\
r_\beta&=\eta_\beta r+
\left(-D_z\eta_\beta C_\theta,
D_z\eta_\beta C_r-D_r\eta_\beta C_z,
D_r\eta_\beta C_\theta\right).
\end{aligned}
\]

각 항은 실제 cutoff 본문을 미분해서 얻는다. `eta_beta`를 이미 계산한 velocity에 곱하기만 하면 위 세 추가항이 빠진다. 비상수 coefficient와 cutoff에 대한 정확한 다항식 대조는 이 누락을 검출한다. 가중 potential의 혼합 미분과 원통 연결항을 포함한 divergence 전제도 다시 검사한다.

## 2. conjugate, pressure 및 physical map

실수 속도와 potential은 각 sign에 대해

\[
\begin{aligned}
u_\beta&=Q^{-A}\left(L_\beta\cos(k\Phi)-r_\beta\sin(k\Phi)\right),\\
\mathcal A_\beta&=-Q^{1/2-A}\eta_\beta C\sin(k\Phi).
\end{aligned}
\]

두 complex harmonic의 coefficient는 각각 `(L_beta+i*r_beta)/2`와 그 켤레이다. potential의 coefficient 역시 `i*eta_beta*C/2`와 그 켤레를 사용한다. `1/2`를 빼거나 두 harmonic을 실제 sign family로 혼동하면 다른 파동이 된다.

Pressure에는 원래 moving-frame의 `pressureImaginaryRow`를 사용한다. 이 행은

\[
\frac{n^T K-(n')^T}{k|n|^2}
\]

이고, 원래 `i`를 실수 sine 표현으로 보존한다. 따라서 물리 pressure는

\[
p_\beta=-Q^{-2A}\eta_\beta\sqrt\epsilon\sqrt y\,\chi\psi
\left(\operatorname{pressureImaginaryRow}\cdot t\right)\sin(k\Phi).
\]

이 coefficient의 원래 전체 본문을 `G.share`로 유지한다. 실제 source 검사는 공유 함수의 body가 바로 이 pressure 행과 원래 `t`의 곱인지 확인한다. 이렇게 하면 단순한 켤레의 `+1/2,-1/2` 부호를 검사할 때 내부의 큰 유리식을 불필요하게 다시 전개하지 않는다. 공유는 pressure의 정의나 도함수를 외부값으로 대체하지 않는다.

물리 평가에는 기존 `attachSourcePalette`의 rectangle, 정수 lift, 다음 map을 재사용한다.

\[
Y_i=J_g^i\left(v_r r^{d_r}+v_t t\right),\quad
r=\sqrt Q\,R,\ z=Q^D Z,\ t=1-QT.
\]

먼저 독립 local `xi,v`를 실제 rectangle 좌표에 합성하고 그 뒤 `Y_i`를 물리 map에 대입한다. 반환된 물리 식에 독립적인 `xi,v,Y_i`가 남지 않는지 검사한다. 결과 성분의 basis는 원통좌표의 `(e_r,e_theta,e_z)`이다. 실제 정수 mesh label과 고정된 대표점은 계속 명시된 파라미터로 남는다.

Rectangle 밖의 zero guard는 Volterra의 유효 시간 구간 밖을 평가하기 전에 적용한다. stress shell 밖에서도 zero guard를 적용한다. `y=0` 경계의 제곱근 나눗셈을 평가하지 않는다. 이 guard의 존재와 원래 square-root flat extension의 해석적 증명은 별개의 자료다.

## 3. 물리 스케일의 정확한 감사

`actualPhysicalWaveExponentAudit`는 `h`에 대한 유리수 계수의 일차 다항식으로 지수를 계산한다. `A=1/2+h`, `D=1/2-h`를 대입하여 potential의 curl scale, axial/time normalization, pressure gradient, nonlinear transport, viscosity 계수를 검사한다. 결과 residual의 물리 scale은 `Q^(-A-1-h)`이고, 정규화된 NS 연산자에서 viscosity 앞에는 실제 `epsilon`이 남는다.

\[
\mathcal R_\star(u,p)=t_\star u+(u\cdot\nabla_\star)u
-\epsilon\Delta_\star u+\nabla_\star p.
\]

이 연산자의 모든 항을 계산한 residual을 이미 제공했다는 뜻은 아니다. 이 추가 모듈이 실행하는 것은 scale 항등식과 물리 potential/curl/pressure의 식 구성이다. 기존 원문의 비영 eikonal defect

\[
\epsilon v(H_T-GH_Z)+b n_r
\]

도 그대로 연결하며 0으로 바꾸지 않는다.

## 4. 전체 label 합과 남은 G-CURL 범위

기존 source의 2,250색 palette와 실제 band별 81개 후보 partition을 같은 graph에 연결한다. 하나의 box는 전체 squared partition에 한 번만 들어가며 두 sign column은 그 box 안에 있다.

원래 공통 palette의 서로 다른 label 분리 정리는 `ell>=ell0>=8`과 overlap 전제를 사용한다. `ell=1`에서도 palette의 정의식을 만들 수 있지만, 이 실행을 그 분리 정리의 정의역 포함 증거로 사용하지 않는다. certificate의 `paletteSeparationExercisedBandCertified`는 `false`다.

현재 실행의 실제 pulse 인스턴스는 **한 band의 한 고정 box family**이다. 나머지 후보마다 실제 background prefix, 대표점, carrier, Volterra solution, `H`와 weight를 생성했다는 결론을 반환하지 않는다. 전체 field는 각 label에 그 자신의 constructor를 적용하고 모든 active source potential을 합친 뒤 curl과 local finite sum의 호환성을 결속해야 한다.

가까운 정수 chart가 바뀔 때 분모는 같은 정수 family의 재색인이다. 반면 pulse의 실제 band·대표점·carrier를 미분 중 다시 선택하면 다른 함수가 된다. 그래서 정수 선택은 label 안에서 고정하고, 전체 family의 support 및 재색인 증명으로 결합해야 한다.

이 버전은 `actualFixedLabelPhysicalCurlConstructed=true`, `actualSlowCutoffBeforeCurl=true`, `originalPaletteAndPhysicalMapReused=true`를 제공한다. 다음 항목은 그대로 별도 의무이다.

- 실제 사용 member의 positive-weight 정의역 포함 증거.
- 모든 실제 label의 source 결속과 필요한 smooth zero extension.
- 공통 Gaussian coefficient bounds와 물리 flat-tail 합산.
- background stress를 포함한 직접 물리 NS residual과 분해식의 일치.
- 실제 source 해석학에 대한 Lean kernel 연결.

`globalDivergenceCertified`, `actualAllLabelPulseFamilyConstructed`, `fullPhysicalResidualAndFlatErrorPackageComplete`는 이 모듈에서 `false`다. 조건부 divergence의 `[0,0]`은 원래 smooth positive-weight 정의역 및 명시된 전제 아래의 값이다.

## 5. 다음 물리 residual에 필요한 정확한 미분 차수

| 목표 | 실제로 필요한 도함수 |
| --- | --- |
| `R(u,p)`의 점별 식 | velocity 공간 2차·시간 1차, pressure 공간 1차 |
| `u=curl A`에서 같은 잔차 | potential 공간 3차 및 공간 1차/시간 1차 혼합 |
| `C=n×amplitude/(k|n|²)`의 공간 3차 | amplitude·weight 공간 3차, `n` 공간 3차 |
| `n=grad Phi`, 실제 `Phi` | `Phi`와 배경 `F,G`의 공간 4차 |
| 모든 고정 차수의 flat residual | 위 차수를 각 목표 차수만큼 높이는 공통 source norm 생성 규칙 |

현재 raw pulse의 R/Z/T 2차 jet를 위의 3차·4차 의무로 확대할 수 없다. 3차 변분계는 `|alpha|<=3`의 multi-index 20개에 원래 2차원 system을 붙인 40성분 삼각계로 생성할 수 있다.

\[
(w_\alpha)'=\sum_{\beta\le\alpha}\binom\alpha\beta M_\beta w_{\alpha-\beta}.
\]

Gaussian을 유지할 때는 `exp(||M||*Ls)`라는 일반 norm만으로 충분하지 않다. 원래 normalized system의

\[
M=\operatorname{diag}(0,-2\lambda)+E-(d-d_{\rm ref})I
\]

를 이용하면 infinity logarithmic norm이 `||E||+|d-dref|`로 제어된다. 실제 공통 bound `C/Sstar`와 `Ls~Sstar`가 결속되면 기본 propagator는 `exp(C')`로 제어되고, 고차 변분의 실제 forcing을 유한 재귀로 적분하여 polynomial `Sstar`와 원래 `P(v)`를 보존할 수 있다. 이 추가 고차·공통 상계는 현재 구현의 실행 결과가 아니다.

## 6. API와 검증

```js
const p = prepareActualPhysicalFullCurlProgram({ellExact:'1',terms:0});
const certificate = await actualPhysicalFullCurlCertificateFromProgram(p);
```

이미 준비한 authentic local full curl이 있으면 `attachActualPhysicalFullCurl(local)`를 사용한다. 외부 coefficient·gradient·완료 flag를 주입하는 경로가 없다.

가벼운 kernel 검사는 다음 명령으로 실행한다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-physical-full-curl-kernel.test.mjs
```

실제 source 검사는 별도 프로세스에서 한 번만 큰 graph를 생성한다. 동시에 다른 큰 source/Worker를 실행하지 않는다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-physical-full-curl-source.test.mjs
```

Exact product·divergence, physical exponent, 비상수 cutoff 누락, 독립 Cartesian finite difference 및 위조 source 객체 거절을 구분한다. Generic Cartesian 검사는 actual source의 numerical quadrature를 대신하지 않는다. 실행된 source의 compiler SHA, source/file hash, domain, source check와 resource 값은 별도 evidence에 기록해야 한다. 기존 64개 원문 기준의 개수를 바꾸지 않는다.

### 실행된 검증: 2026-10-11 UTC

- 새 kernel **7/7 PASS**. 원래 integer partition과 고정 label 함수의 값 일치, 정수 chart 전환점 부근의 직접 미분, flat zero guard, product curl, 누락 negative, 독립 Cartesian 차분 및 source 위조 거절을 포함한다. 기존 partition 검사 8개와 함께 최종 **15/15 PASS**이다.
- 실제 원본 source **5/5 PASS**, `exit 0`. source constructor를 한 번 생성하여 두 sign의 6개 물리 성분과 2개 조건부 divergence 행을 검사했다. 실제 R/Z/T cutoff body의 materialization, 원래 pressure body, 켤레 계수 및 public compiler metadata 변조 거절도 통과했다.
- 최종 원본 실행은 **22.54초**, source worker 최대 RSS는 **1,501,433,856 bytes**였다. program은 **388,699 nodes**, 직렬화 **15,366,258 bytes**다. 이 시간은 실제 수학 원본 검사 프로세스의 관측값이며 browser 성능 검사값은 아니다.
- graph SHA256은 `8071cab1057fdb7be9933bc2e7b2b2d138c28ecd2c50ed7226cb6a2119380a50`, compiler file SHA256은 `539753a76375338653ff7420752270b600dc8c78893212ce541c47484b2f6454`이다.

기록은 `research/evidence/physical-bridge-20261011/physical-curl-source.tap`, `physical-curl-source-process.json`, `physical-curl-source-result.json`, `physical-curl-kernel.tap` 및 `physical-curl-kernel.json`에 있다.

두 선행 시도도 삭제하지 않았다. 첫 시도는 완료 TAP가 나오지 않아 원래 실행 세션에서 정상 취소했다. 두 번째 계측 실행은 source 구성이 **17.17초**에 끝나고 이후 비교 검사에서 지연됐음을 밝혔으며, runner가 설정된 **70초** 제한에서 종료했다. 따라서 첫 시도의 지연을 constructor 문제로 추정했던 설명은 철회했다. 공유된 원래 pressure 본문으로 중복 유리식 전개를 제거한 뒤 위 최종 5/5 실행을 얻었다. 취소/timeout 기록은 성공 횟수에 포함하지 않는다.

이 검증은 **한 fixed label의 조건부 실제 물리 curl** 범위를 닫는다. 실제 모든 label의 양의 weight 정의역, 공통 flat-tail 경계 및 전체 물리 NS 잔차의 완료를 뜻하지 않는다.
