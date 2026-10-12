# 실제 terminal wave의 물리 curl과 속도 공간 2차·시간 1차 미분

이번 구성은 앞서 고정한 실제 harmonic third-jet source에 이어 붙인다. 원래 real potential을 Cartesian 성분으로 회전한 뒤 실제 물리 미분을 적용하여, 두 부호 각각 속도 3개·공간 1차 9개·대칭 공간 2차 18개·시간 1차 3개와 압력 기울기 3개를 만든다. 여기에 potential 3개와 압력 1개를 포함한 **40개의 물리 scalar expression을 부호마다** 합성한다. 같은 fixed label의 두 부호 합도 보존한다.

이 결과는 지정한 작은-$q$ terminal member와 그 열린 양성 영역의 exact expression 구성이다. 모든 label의 합, 전역 물리 residual/flat-error, 엄밀한 수치 속도 구간, 새로운 analytic Lean kernel 정리 또는 M3 gate 완료를 뜻하지 않는다.

## 1. 원래 source와 이번 입력

소스는 unchanged actual-terminal-harmonic-third-jets가 생성하는 $iC e^{ik\Phi}$이다. 실제 $C$에는 다음 원래 인자가 모두 남는다.

- 전체 covariance 적분 $H$, 원래 target, $H^{-1}T$와 양의 제곱근.
- 원래 $\sqrt{\epsilon}$, transverse $\chi(\xi)$, longitudinal $\psi(v)$, 고정된 slow cutoff $\eta_\beta$.
- 원래 두 성분 Volterra **전체 극한**, moving frame, normal, pressure/connection 항.
- 원래 historical canonical $c_n$ 배경과 terminal common-support 동치.

표시용 terms:1은 첫 ordered-integral correction과 별도 수렴 경계이다. 표시용 finite sum을 원래 해의 자리에 넣지 않는다. 별도로 강화한 cutoff 배경을 이 source와 동일시하지 않는다.

generic kernel은 potential/pressure 본문과 좌표·기하 인자만 받으며 caller derivative 배열을 받지 않는다. 실제 source adapter는 private 원본 객체를 소비한다. 복사한 certificate나 caller의 양성 플래그는 실제 source를 인증하지 못한다.

## 2. 물리 좌표의 정확한 정규화

$A=\frac12+h$, $D=\frac12-h$, $Q=2^{-\ell}$, $\epsilon=Q^h$는 원래 source 식 그대로이다. $h>0$를 0으로 치환하거나 $Q$를 binary64로 평가하지 않는다. 한 label에서 $Q$와 모든 대표점·정수 label은 고정된다.

\[
r=\sqrt Q\,R,\qquad z=Q^D Z,\qquad t=1-QT.
\]

원래 palette는

\[
Y_i=v_r\,\Lambda^i r^{d_r}+v_t\,T_g^i t
\]

를 사용한다. 실제 basis

\[
v_r=(1,1-\sqrt2),\quad v_t=(\sqrt2-1,1),\quad
|v_r|^2=|v_t|^2=4-2\sqrt2,\quad v_r\cdot v_t=0
\]

를 이전 source의 literal 원본과 비교한다. 이후 $Q,S,\epsilon,k,i,c_i,L_s$는 **현재 선택된 작은-$q$ member**의 식으로 다시 구성·검사한다. $\ell=1$ ancestor의 pulse 값을 새 member에 복사하지 않는다. palette mesh도 기존 potential의 동일한 frozen mesh label을 사용한다.

고정 nearest lift에서 $\xi=(v_r\cdot\mathrm{offset})/(4-2\sqrt2)$, $v=((v_t\cdot\mathrm{offset})/(4-2\sqrt2)+r_0)/c_i$이므로 원래 radial primitive의 실제 미분

\[
a(R)=\partial_R\!\left[\Lambda^i(\sqrt Q R)^{d_r}\right]
\]

를 사용하면 정규화된 연산자는

\[
D_r=\partial_R+a(R)\partial_\xi,\qquad
D_z=\epsilon\partial_Z,\qquad
D_t=-\epsilon\partial_T+\partial_v.
\]

마지막 식에서는 $c_i=T_g^iQ^{1+h}$와 $Q>0$에 의한

\[
(-\epsilon)\partial_Tv=\epsilon Q T_g^i/c_i=1
\]

을 사용한다. 코드가 원래 exp/log 식의 factor를 확인하고, exponent audit가 정확한 유리수 계수의 $h$ 다항식으로 이 스케일 관계를 확인한다. 독립된 근삿값이나 우연한 decimal 일치는 사용하지 않는다.

## 3. Cartesian 기저와 반복 미분

실제 real cylindrical potential은 $\mathcal A=-C\sin(k\Phi)$이다. 먼저

\[
\mathcal A_x=\cos\theta\,\mathcal A_r-\sin\theta\,\mathcal A_\theta,\quad
\mathcal A_y=\sin\theta\,\mathcal A_r+\cos\theta\,\mathcal A_\theta,\quad
\mathcal A_z=\mathcal A_z
\]

로 Cartesian 성분을 만든다. 그 다음

\[
D_x=\cos\theta\,D_r-\frac{\sin\theta}{R}\partial_\theta,\qquad
D_y=\sin\theta\,D_r+\frac{\cos\theta}{R}\partial_\theta
\]

를 사용하여 $U=(D_y\mathcal A_z-D_z\mathcal A_y,\ D_z\mathcal A_x-D_x\mathcal A_z,\ D_x\mathcal A_y-D_y\mathcal A_x)$를 계산한다.

각 적용에서 $\cos\theta,\sin\theta,1/R,a(R)$를 함께 미분한다. 따라서 radialFast의 $a_R,a_{RR}$, 기저 연결항, $\xi$의 2·3차 미분, $v$의 시간 미분을 생략하지 않는다. 속도 공간 Hessian은 여섯 축쌍 $xx,xy,xz,yy,yz,zz$를 갖는다. 각 성분의 mixed 순서 교환 9개, potential의 공간·시간 순서 교환 9개, divergence-curl 1개를 합친 **19개 정확한 식**을 부호마다 확인한다.

각 Cartesian potential을 실제 본문이 명시된 share로 유지하고 필요한 partial만 생성한다. 사용한 모든 partial은 원래 본문을 canonical 순서로 AD한 결과와 실제 materialization root가 같은지 별도로 검사한다. identity checker는 이 결속된 symbol의 대수만 담당한다. 이 분리가 unspecified function oracle을 도입한다는 뜻은 아니다. 사용하지 않은 고차 미분은 0으로 정하지 않는다.

## 4. 압력과 물리 스케일

압력은 원래 moving row

\[
\pi_{\rm row}=\frac{n^T K-n'^T}{k|n|^2}
\]

를 그대로 사용한다. 정규화된 real 압력은

\[
p_*=-\eta_\beta\sqrt{\epsilon}\sqrt y\,\chi\psi\,
(\pi_{\rm row}\cdot t)\sin(k\Phi)
\]

이며 이 **전체 본문**의 기울기를 미분한다. $H$, target, 제곱근, cutoff 또는 moving-pressure row의 미분을 별도의 상수 취급으로 빠뜨리지 않는다.

| 물리 식 | 독립 좌표에서 계산한 식에 곱하는 원래 인자 |
|---|---|
| potential | $Q^{1/2-A}$ |
| velocity | $Q^{-A}$ |
| velocity 공간 1차 | $Q^{-A-1/2}$ |
| velocity 공간 2차 | $Q^{-A-1}$ |
| velocity 시간 1차 | $Q^{-A-1-h}$ |
| pressure | $Q^{-2A}$ |
| pressure gradient | $Q^{-2A-1/2}$ |

원래 real wave는 $m=+1,-1$ conjugate의 각각 $1/2$ 인자를 합한 것이다. real harmonic을 다시 두 번 더하지 않고, 이 두 half가 원래 real body와 같음을 검사한다. 서로 다른 두 source sign의 rectangle은 별도로 합성한 뒤 같은 fixed label의 유한 합을 구성한다.

## 5. 실제 map 합성·도메인

각 derivative expression에 원래 $Q$ 인자를 붙인 다음 $\xi,v$를 원래 rectangle 식으로 대입하고 $Y_i$를 실제 물리 map으로 대입한다. 합성용 share는 원래 본문과 모든 자유 매개변수를 명시하며 대입 전에 원래 값의 materialization을 검사한다. 최종 root에는 독립 $\xi,v,Y_i$나 template grid 좌표가 남지 않는다.

fast cutoff의 support는 guard 경계보다 안쪽이다. 따라서 $|\xi|\ge r_0$ 또는 $v\notin(0,L_s)$에서 원래 zero guard가 Volterra 평가보다 먼저 적용되며, guard 경계 근처에서 해당 본문과 모든 필요한 fast jet는 이미 0이다. 원래 rectangle은 nearest lift의 경계보다 충분히 안쪽이므로 그 경계에서 floor를 미분하지 않는다.

slow 영역은 $X_+<X<X_b$, $X_+<X_{\rm rep}<X_b$, $1/2<s,s_{\rm rep}<2$, $|\eta|,|\eta_{\rm rep}|<1$와 같은 원래 fixed slow box이다. 양성은 private terminal covariance certificate의 영역을 소비한다. $X_+$에서 인위적인 zero extension을 추가하지 않는다. $y=0$에서 제곱근 quotient를 평가하거나 원래 heat를 음의 시간으로 연장하지 않는다.

slow Volterra 미분은 이전 source-bound FTC envelope와 국소 균등 수렴을 사용한다. $v$ 및 slow-$v$ mixed 미분은 원래 ODE $w_v=Mw$, $(w_R)_v=M_Rw+Mw_R$로 결속된다. 이 source 범위에서 원래 smooth 계수와 열린 양성 domain이 이번 유한 jet의 regularity를 준다.

## 6. 독립 작은 검사와 실제 실행 상태

generic 검사는 별도의 Cartesian 다항식에서 curl, 모든 gradient/Hessian, 시간 미분, 압력 기울기를 직접 계산한 결과와 정확한 유리수로 비교한다. 실제 nonlinear radial map $\xi=1+(x^2+y^2)^2$를 사용해 $a_R,a_{RR}$를 비영으로 만들고, radialFast 전체·그 도함수·기저 연결·fast time 항을 빠뜨리면 결과가 달라지는지 확인한다. 원래 형태의 smooth cutoff·양의 제곱근·움직이는 적분도 사용한 모든 partial을 실제 본문에서 생성한다.

첫 source attempt는 원래 harmonic graph와 selected physical map을 생성한 뒤 adapter가 대표점 메타데이터까지 kernel의 strict 6좌표 인자로 넘겨 거절됐다. elapsed 44449.973039 ms, peak RSS 2066563072 bytes, 관측 exit 1이다. certificate는 발급되지 않았다. 이 실패와 실행 당시 네 새 파일의 byte snapshot을 보존했다. 수정은 6개 미분 좌표를 명시적으로 선택하는 인터페이스이며, 대표점은 본문의 고정 매개변수로 계속 남는다. 그 구별을 검증하는 회귀를 포함해 최종 generic 6/6 PASS를 얻었다. 최초 실패를 계획한 음성 대조로 재분류하지 않는다.

수정 후 actual source attempt 2는 **runner 12/12, 내부 source 검사 11/11 PASS**이고 최종 프로세스의 **exit 0**을 별도로 관측했다. 실행 시간은 89726.211122 ms, peak RSS는 2829660160 bytes다. 두 부호 각각 실제 본문 partial 133개, 정확한 항등식 19개, 물리 scalar 합성 40개를 검증했다. 이 구성은 실제 원본 적분 및 전체 Volterra 극한의 표현을 미분한 것으로, 수치 적분값을 산출한 실행은 아니다.

| 실행 증거 | 값 |
|---|---|
| 실제 입력 | sourceProfile same-profile-2026-10-10.3, terms:1 |
| 실행 당시 HEAD | fdf2ea19d373e7bb280913db6403c4103af145c0 |
| 실제 import closure | 72개 파일, 실행 전후 및 관측 기록 시 SHA 불변 |
| 실제 graph | 390953 nodes, canonical 16081246 bytes |
| source graph SHA256 | 6518b019dec5277b480a28fcf752297589b0deb6b69dfd112f83fe59049777cc |
| import closure SHA256 | 76047debfb1e41e4338aba668da6b71a24ff558c84a519439f25d801fd637c79 |
| 실제 source receipt SHA256 | 5f2a73e9dcc4a7ba86a7529c1a296a1d4ac52add3d044931cddfdcb19338c2db |

새 파일은 실행 당시 HEAD에 아직 없었으므로 위 HEAD만으로 실행 코드를 식별하지 않는다. 실제로 읽은 72개 파일의 literal byte manifest가 새 모듈과 runner를 함께 식별한다. 이전 harmonic graph도 376092 nodes, SHA256 235374c4fe2bfe79912ed0a653c594864fc6a221c92f1142bef5ac0665bf0cd6으로 정확히 재현됐고, 뒤의 독립 graph append가 이미 발급된 두 source prefix를 바꾸지 않는지 확인했다.

최종 실제 실행은 [source receipt](actual-terminal-physical-velocity-jets-source-attempt2.json), [전체 실행 로그](actual-terminal-physical-velocity-jets-source-attempt2.log), [별도 프로세스 종료 관측](actual-terminal-physical-velocity-jets-source-attempt2-process-runtime.json)에 기록했다. generic 6/6 결과는 [TAP](physical-jet-kernel-before-source2.tap)와 [runtime receipt](physical-jet-kernel-before-source2-runtime.json)에 별도로 남는다. 최초 실패의 [receipt](actual-terminal-physical-velocity-jets-source-attempt1.json), [종료 관측 및 원래 네 파일 snapshot 결속](actual-terminal-physical-velocity-jets-source-attempt1-process-runtime.json)도 보존한다.

이번 성공은 Node에서 실제 source를 생성·검증한 결과다. 생성된 Worker나 공개 브라우저에서 이 새 physical 기능을 실행한 것으로 기록하지 않는다. 모든 label의 무한 합과 전역 물리 residual/flat-error, 수치 velocity/residual enclosure 및 전체 G-NUM/M3 gate는 여전히 별도이다.
