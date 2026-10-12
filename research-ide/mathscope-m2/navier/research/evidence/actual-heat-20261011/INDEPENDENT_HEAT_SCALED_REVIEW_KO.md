# 실제 heat 인자·slow jet 구간의 독립 검토

`actual-heat-scaled-enclosure.mjs`와 실제 source 실행 기록을 읽기 전용으로 검토했다. 유한 moment 전개, 부호가 있는 remainder, 원래 heat/Gamma/차트 결속, 정확한 양의 인자와 9개 slow jet에서 구체적인 수학 오류를 발견하지 못했다. 대형 source를 다시 실행하거나 제품 source를 수정하지 않았다.

검토한 실행은 `actual-heat-scaled-enclosure-source-attempt1.json` 및 같은 이름의 `.log`다. source 검사 12/12 PASS, 기록된 process exitCode 0, 53개 import 파일의 현재 SHA와 실행 당시 SHA가 모두 일치함을 직접 확인했다.

| 대상 | SHA256 |
|---|---|
| 실제 heat 모듈 | `965f2e8eeb7b0735ab9cb1ec50a1c9fb41874e0fc805daf15e3ca2da84f7b7d2` |
| 실제 source JSON | `c1edd08d193d6b302e1b53cf84bb78b571514c2a331ff0364814f74702b5467e` |
| 실제 graph | `6569333c2f43189b4cf9474048194f7c690df6233d27fa7667937f7c7645b353` |
| 53개 import closure | `2b8737fc72f3173af1753ab69f05b655b28d691f2f6d003fc4a452f16b0be4d2` |

## 1. 실제 적분과 유한 전개의 관계

원래 heat는

\[
H(z;h)=\frac1{\Gamma(1+h)}\int_0^\infty
 e^{-v}v^h(1+zv)^{-h}\,dv,
\qquad h>0,\quad z\ge0
\]

이다. 실제 모듈은 원래 `heatLoss`, Gamma의 완전한 improper integral, `1-loss`와 직접 적분의 integrand partition을 결속한다. 양의 `h`와 실제 양의 `z`는 소거하지 않는다.

정규화한 계수

\[
D_0=(1-H)/(hz),\quad D_1=-H'/h,\quad
D_2=H''/[h(1+h)]
\]

의 유한 전개는 코드의 recurrence와 일치한다. 양의 항의 다음항 비율은 각각

\[
\frac{a_{n+1}^{(0)}}{a_n^{(0)}}
=\frac{(h+1+n)(h+2+n)z}{n+2},
\]

\[
\frac{a_{n+1}^{(1)}}{a_n^{(1)}}
=\frac{(h+1+n)(h+2+n)z}{n+1},\qquad
\frac{a_{n+1}^{(2)}}{a_n^{(2)}}
=\frac{(h+2+n)(h+3+n)z}{n+1}.
\]

`(1+t)^(-a)`의 Taylor remainder는 `t>=0`에서 부호가 `(-1)^N`이고 절댓값이 `(a)_N t^N/N!` 이하이다. 이를 전체 양의 Gamma density에 적분하면 코드가 사용한 다음항 상한이 나온다. `D0`는 원래 power 전개를 한 항 더 쓴 뒤 `hz`로 나누므로 분모가 `(n+1)!`인 식과 부호가 맞는다.

따라서 이것은 **유한 항의 엄밀한 enclosure**이며, 대개 발산하는 무한 moment series가 수렴한다는 가정이 필요하지 않다. 코드는 parameter-box 및 directed arithmetic 폭과 해석적 remainder 폭을 따로 계산하여 각각 tolerance의 절반 이하인지 확인한다. actual 실행에서 한 항만으로 충분했다는 것은 실제 작은 source 인자 덕분이며, remainder를 0으로 두었기 때문이 아니다.

## 2. 미분과 improper integral

모든 고정 유한 `j`에 대해

\[
\left|\partial_z^j(1+zv)^{-h}\right|
\le (h)_jv^j\qquad (z\ge0)
\]

이므로 지배함수 `e^-v v^(h+j)`는 전체 적분구간에서 적분 가능하다. 이에 따라

\[
|H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!
\quad(0<h<1)
\]

은 정당하다. 이 모든 유한 차수에 대한 해석적 경계와, 실행으로 구성한 `j<=2`의 실제 source roots/수치 구간을 구분한 현재 문구도 적절하다.

`z=0`에서는 `z>=0` 쪽의 연속 jet/right derivative를 사용한다. 이 논리로 원래 실수 적분을 음의 `z`까지 연장했다고 말할 수는 없다. 실제 실행점은 `s=1,eta=0`, 즉 slow `T=1`이므로 필요한 모든 방향의 열린 local chart가 존재한다.

## 3. slow 차트와 9개 jet

원래 implicit chart는

\[
s-Z^2s^{2h}=T,\quad X=R^2/(2s),\quad
\eta=Z/s^{1/2-h}
\]

이므로 실제 heat argument는

\[
z=2(1-\eta^2)/X=4T/R^2.
\]

이 항등식은 근삿값을 넣은 inverse root가 아닌, 원래 chart 식에서 얻는다. 따라서 `Z,RZ,ZZ,ZT` jet가 정확히 0인 것이 맞다. 나머지 계수는

\[
\frac{H_R}{hz/R}=2D_1,\qquad
\frac{H_T}{hz/T}=-D_1,
\]

\[
\frac{H_{RR}}{hz/R^2}=-6D_1+4(1+h)zD_2,
\]

\[
\frac{H_{RT}}{hz/(RT)}=2D_1-2(1+h)zD_2,
\qquad
\frac{H_{TT}}{hz^2/T^2}=(1+h)D_2.
\]

코드가 원래 heat integrand를 직접 미분한 결과와 위 식을 정확한 대수로 비교한다. `RR`에서 `H' z_RR` 항을 빼는 음성 대조가 실패하는 것도 적절하다. 외부에서 미분값이나 completion flag를 공급하여 실제 source 인증을 받는 API가 아니다.

## 4. 실제 인자의 거듭제곱 경계

원래 terminal witness에서 `X>X_R`, `Pstar>2^256`, `CSelected>1`이므로 `X_R=110(CSelected Pstar)^10>2^2560`이다. 따라서

\[
0<h<2^{-4096},\quad 0<z=2/X<2^{-2559},\quad
R>2^{1280},\quad R^2>2^{2561},\quad T=1.
\]

이에 따라 코드의 양의 인자 지수는 다음과 같이 맞는다.

| 인자 | 엄밀한 지수 합 |
|---|---|
| `h*z` | `4096+2559=6655` |
| `h*z/R` | `4096+2559+1280=7935` |
| `h*z/R^2` | `4096+2559+2561=9216` |
| `h*z^2/T^2` | `4096+2*2559=9214` |

source root의 양의 인자는 그대로 보존하고 이들의 크기를 유리수 상한으로 감싼다. 절대 enclosure 끝점에 0이 포함되는 것은 유효한 외향 경계이며 실제 heat jet가 0이라는 뜻이 아니다. 실행 결과의 `D0,D1,D2` 구간과 각 완성 계수의 폭 검사 역시 이 범위를 유지한다.

## 5. 완료로 확대하지 않는 범위

검토한 graph는 233,243 nodes, 9,297,420 compiler bytes다. 실행 기록은 21.5441초, peak RSS 1,336,086,528 bytes이며 이는 직접 Node source 경로다.

이번 결과는 실제 heat 인자와 9개 1·2차 slow jet의 계수/절대 구간 인증이다. 전체 leading `F`의 곱 인자, actual pulse Volterra 해, covariance 행렬 전체, determinant와 weight의 수치 구간, 전체 G-NUM, 새로운 해석학 Lean 증명, M3 시작으로 확대하지 않은 scope가 정확하다.
