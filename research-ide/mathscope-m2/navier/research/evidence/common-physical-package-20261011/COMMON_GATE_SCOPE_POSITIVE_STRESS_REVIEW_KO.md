# 공통 물리 패키지의 원래 M2 관문 범위 검토

## 판정과 검토 경계

현재 읽은 실제 source와 수학적 연결은 원래 **G-POS, G-CURL, G-N4, G-N5를 닫는 데 필요한 해석적 구조를 제공한다.** 같은 source를 사용한 통합 실행이 `complete:true`, 관측 exit 0, 실제 8개 검증 성공과 unchanged import 증거를 함께 남기면, 이 네 관문을 여전히 미완료로 유지할 별도의 수학적 의존성을 이번 검토에서 찾지 못했다. 검사 개수가 정리의 증거를 대신한다는 뜻은 아니다. 아래 실제 항등식·정량 상계·정의역·합의 논증을 source 실행에 연결하는 것이 판정 조건이다.

이 문서는 source attempt 5가 진행 중인 상태에서 작성했다. attempt 5의 성공을 미리 기록하지 않으며, 이전 incomplete checkpoint나 오래된 로그의 마지막 단계도 완료 증거로 사용하지 않는다. 실행 결과의 최종 판정은 별도의 관측 receipt에 맡긴다. G-NUM은 이 네 해석적 관문과 다른 유한 수치 연결이 남아 있다.

검토자는 positive_stress agent이다. 공통 family·physical curl·global wave·covariance 코드는 다른 담당자의 코드를 읽은 독립 검토이며, G-N4의 finite/flatness/E_B 모듈은 본 검토자가 작성했으므로 이 문서만을 그 부분의 독립 수학 검토로 세지 않는다. G-N4에 관해서는 root의 독립 검토와 `INDEPENDENT_FINITE_AND_COMMON_RESIDUAL_REVIEW_KO.md`, leading 원본 미분의 별도 body 검토를 함께 사용한다. 새 heavy 실행, 수학 코드 변경, gate JSON 변경은 하지 않았다.

## 원래 기준과 실제 연결

| 관문 | 원래 요구 | 실제 source 연결 | 승인 가능한 범위 |
|---|---|---|---|
| G-POS | 사용한 member의 비영 H, 양의 두 y, 실제 sqrt 미분과 zero extension | 공통 Γ 및 원래 H/T 정량 부등식, 해당 family의 constructBand, 실제 weighted target norms, global wave의 양 끝 Gaussian/pole 논증 | 공통 Γ의 모든 실제 label, 열린 shell의 양성, 모든 고정 차수 smooth zero extension |
| G-CURL | 모든 slow/auxiliary label, cutoff·phase·물리 배율·켤레·divergence | 원래 전체 potential과 물리 jet, 원래 81후보 squared partition/palette, global wave의 모든 label 및 겹치는 두 band 논증 | 같은 전역 primary field의 정확한 divergence 0와 support, 모든 고정 미분 |
| G-N4 | R(u_B,p_B)=−div T_phys+E_B, 동일 점근계수와 모든 고정 차수 flatness | 원래 leading/positive conservative 순간 및 응력, finite residual, 같은 b_n의 tuple 비교, 실제 독립 NS 식과 응력 | 원래 cutoff 합으로 실현된 배경의 실제 잔차 분해와 all-fixed-m flat remainder |
| G-N5 | 실제 full u,p의 직접 PDE, non-eikonal·비선형·cutoff 항, all-label Gaussian tail, N6 입력 | 실제 Cartesian full curl의 공간 2차/시간 1차 및 압력 미분, 모든 quadratic 항, full temporal force, 정확한 primary 평균과 signed inverse | 원래 N5까지의 물리적 잔차와 N6 finite-state 입력; N6 반복은 수행하지 않음 |

### G-POS: 실제 member와 열린 정의역

공통 family는 원래 F/U/M/pressure, 두 shear 항을 포함한 leading target, 각 label 자신의 rounded carrier·Volterra 초기값·원래 Haar 적분을 사용한다. 검사한 H와 y는 대체 행렬이나 독립 symbolic parameter가 아니다. 원래 norm과 target의 정량 상수로 공통 ell0와 qStar를 만들며 각 실제 band는 그 Γ와 같은 selector의 identity를 유지한다.

하한은 `|det H| >= d_star/S`, `y_j >= c_y*zeta > 0`이다. 여기서 shell 안의 ζ는 실제 양의 flat factor이다. ζ가 경계로 갈 때 0이 되므로 열린 shell 전체에 경계와 무관한 하나의 양의 상수를 주장해서는 안 된다. 원래 G-POS도 boundary strict positivity를 요구하지 않는다. 사용한 내부점 또는 compact 내부 영역에서는 이 식으로 비영 수치 하한을 얻는다.

`sigma^2=y`, `Hy=T`의 미분은 원래 H/T의 도함수를 포함한 product/inverse 재귀이다. reciprocal weight의 pole은 실제 안쪽 Gaussian과 바깥쪽 Gaussian에 흡수된다. 경계에서 inverse/sqrt를 평가하는 대신 **가중된 원래 식을 먼저 0으로 연장**하여 모든 고정 미분을 잇는다. 실제 physical composition에도 시간·횡단·shell guard가 inverse/sqrt의 바깥에 놓여 있다. η=±1에서 사용한 heat regularity는 원래 물리 측 T>=0의 한쪽 regularity이며 N7의 종단 force 연장을 미리 주장하지 않는다.

과거 ell=1 예제의 양성을 새 결과로 소급하지 않는다. 새로운 평가 member가 source로 인증한 공통 Γ의 실제 member라는 것이 이번 G-POS의 결속이다.

### G-CURL: 실제 물리 미분과 모든 label

각 부호의 원래 potential은 slow partition, sqrt(epsilon), 양의 sqrt(y), 원래 χ·ψ·t와 `n cross amplitude/(k|n|^2)`를 모두 포함한다. phase와 carrier는 미분 전에 고정한다. 실제 derivative operator는 다음과 같다.

\[
D_r=\partial_R+a(R)\partial_\xi,\qquad
D_z=\varepsilon\partial_Z,\qquad
D_t=-\varepsilon\partial_T+\partial_v.
\]

`a(R)`와 원통 기저는 반복 미분 때도 미분되며, C_theta/R와 모든 slow partition·cutoff 도함수가 남는다. 실제 source 40성분 third-variation과 원래 표현함수의 mixed partial body를 사용하여 velocity의 공간 2차, 시간 1차 및 압력 미분을 만든다. G-N5에서 필요한 potential 공간 3차를 단순 2차 slow packet으로 대신하지 않는다.

전역 합은 임의 band·mesh label마다 그 label 자신의 실제 원본 constructor를 쓰는 정의다. 실행된 한 label의 숫자를 다른 label의 함수로 복사하는 정의가 아니다. 원래 palette가 서로 다른 label의 지지 분리를 제공하고, 같은 label의 harmonic 및 square/cross 항은 그대로 남긴다. 원래 squared partition의 81개 국소 후보와 정확히 0인 omitted complement가 유지된다. 한 점에서 최대 16개 beta label, 32개 sign, 두 개의 band가 겹칠 수 있다. 전역 per-band flatConstant에는 마지막 band 계수 2가 반영되어 있고, 무한 band tail은 이미 전체 합이므로 여기에 다시 2를 곱하지 않는다.

q>0의 compact 영역에서는 합이 locally finite이다. 원래 rectangle·shell의 flat joins와 lift의 국소 상수성으로 zero extension은 smooth하고, 각 항이 실제 Cartesian curl이므로 전역 divergence도 0이다. 모든 label에 독립인 원래 정량 상계와 임의 유한 label constructor로 전칭 결론을 증명하며, 무한히 많은 그래프를 실제 생성했다고 주장하지 않는다.

### G-N4: 같은 b_n과 실제 잔차

공통 selector는 원래 canonical c_n, velocity·pressure·stress와 필요한 정규화·가중 norm 조건을 같은 재귀 max에 넣는다. n=2에는 새 b_1에 대한 16배 gap, 이후에는 새 직전 b에 대한 두 배 gap을 사용한다. 조건은 각 필요한 n,m에서

\[
B_{n,m} b_n^{-nh}\le 2^{-n}
\]

이다. 예전 cutoff 수열과 새 b_n가 같다고 취급하지 않는다. pressure, stress, stream potential, velocity, background norm, 실제 band와 flatness가 모두 이 하나의 새 허용 수열을 사용한다.

Leading 부분은 전체 heat F0/U0/M0, 원래 I/J/S/Cp primitive와 mixed FTC, axis pressure datum, 두 shear 항을 보존한다. Positive 부분은 원래 다섯 conservative total moments와 독립 momentum coefficient를 사용한다. n=1은 isolated divergent boundary를 적분하는 대신 전체 수렴하는 heat-subtracted angular moment와 남은 axial viscosity tail을 사용한다. n>=2의 내부 지지와 exterior 응력의 0은 실제 total moments에서 나온다.

Finite residual은 모든 ordered quadratic pair를 보존하고 고차 잔차 지수의 손실은 차수 N에 의존하지 않는다. cutoff 합과 finite stage J의 비교에서는 첫 J개의 χ가 실제 plateau 1인 공통 창을 선택하고 나머지의 도함수 tail을 같은 selector 조건으로 합한다. 그 다음 원래 비선형 residual difference의 선형·양방향 교차항·자기제곱을 모두 쓴다. 평가창에서 몇 항이 비활성이라는 사실만으로 q→0 전 차수 flatness를 주장하지 않는다.

Actual E_B adapter는 실제 physical graph에 이미 존재하는 background NS vector와 원래 응력 divergence를 사용한다. tuple 식의 radial stream χ′ commutator와 axis-regular leading 연속성, 응력의 2/R 및 1/R 항이 남는다. 복사 전 derivative root와 새 optimized derivative가 달라지는 경우에는 원래 copied prefix의 동일 바이트를 먼저 확인하고 literal-zero/alpha-equivalent body 항등식이 통과한 쌍만 치환한다. 형제 graph에서 새로 생성한 integer ID를 가져오지 않는다. M_X=U와 M_etaX=U_eta의 원래 FTC authority도 별도로 유지한다.

모든 고정 m와 원하는 flat 지수 P에 대해 J와 실제 C_fin(J,m), C_u(J,m+2), C_flat 및 q threshold를 유한 source constructor로 만드는 정리이다. 매우 큰 J를 이번 한 실행에서 전부 생성하는 것은 완료 조건이 아니다. 해당 정량 재귀는 자원 예산만으로 제한되며 부재한 고차 norm을 낮은 차수 norm으로 대신하지 않는다.

### G-N5: 실제 잔여항과 N6 경계

물리 NS 식은 실제 Cartesian velocity·gradient·Laplacian·time·pressureGradient에서 독립 조립한다. background, background/wave 양방향 교차항, wave self-advection, 원래 nonzero eikonal 항이 살아 있다. 모든 cutoff가 들어간 full velocity와 pressure를 다시 미분하므로 pressure 또는 curl remainder를 primary 평균으로 대체하지 않는다.

Temporal force는 `Q^(-A-1-h)*psi_prime*curl_star(A_base)`의 전체 curl이다. primary t만 남기거나 ψ로 나누지 않는다. 원래 primary의 homogeneous pulse ODE와 일반 source가 있는 cutoff 식을 구별해야 한다. 이후 source가 있는 N6 inverse에서는 `(1-psi)f+psi_prime*t`를 원래 전체 식으로 보존해야 하며, 이번 primary의 homogeneous 초기 시스템을 다른 source로 바꾸는 허가가 아니다.

각 실제 temporal force 미분은 원래 Gaussian을 유지한다. 양 끝의 Gaussian/pole, 실제 source norm, mesh 개수, 겹치는 band 수, exact positive infinite tail을 함께 사용하여 모든 고정 m와 P에 대해 q^P flatness를 얻는다. 다른 nonlinear/eikonal 잔차 전체가 flat하다는 주장은 하지 않는다. retainedAfterTemporalForce에는 실제 남은 NS vector가 들어 있다.

Primary covariance의 epsilon*H*y=epsilon*T에는 angular cosine-square의 1/2와 원래 normalized Haar Jacobian이 그대로 남는다. 전역 평균의 physical scale은 원래 squared partition의 합으로 바뀐다. C/B는 실제 원통 radial/angle/axial 기저로 투영한 뒤 **theta 평균과 Y Haar 평균을 모두** 취하는 연산이다. 점별 NS product는 별도로 보존된다.

Signed inverse는 고정된 실제 양의 primary amplitude 주위의 선형 inverse이다. 입력 Sigma가 어떤 부호든 가능하지만 필요한 M_alpha 소속은 이후 N6의 별도 전제이다. U in W_(1/2)도 arbitrary rho에서 추정하지 않고 명시적으로 남긴다. 이 전제 아래 inverse/curl remainder/square/cross의 원래 지수와 지원집합을 N6에 넘기는 것까지가 M2이다. Def.9.4→Prop.9.5→Prop.9.6→Lem.9.7→Lem.9.8→Prop.9.9의 실제 반복, N7 compact force·에너지, N8 reconstruction은 여기서 수행되지 않는다.

## G-NUM: 원래 필요한 유한 수치 연결

원래 at-resume gate의 출력 문구는 다음과 같다.

> w,w_i,w_ij,t_i,t_ij,H_i 및 필요한 weight/curl 도함수의 directed enclosure
>
> 요청 tolerance 이하임을 보이는 합산 오차

원래 2차 jet의 i,j는 R/Z/T slow 방향이다. 원래 local full curl은 leading/imaginary remainder 값을 생성하며 C의 1차 공간 미분을 사용하고, divergence 검증은 C의 혼합 2차를 사용한다. Blueprint 81쪽은 각 series/heat/derivative tail 계약, 83쪽은 source·derivative·반올림 오차 및 residual의 derivative 의존성을 요구한다. 이 자료에는 모든 label·모든 점에서 고정 상대정밀도, 또는 별도의 물리 Hessian 전체 수치표를 추가 완료 조건으로 정한 문구가 없다.

실제 fast/slow 138 jet, 실제 positive scales, 새로운 실제 물리점의 3성분 VALUE만으로 나머지 curl 미분 구간을 자동 인증하지 않는다. 원래 138 jet의 점은 보조좌표 중심이고 새 physical-center 점은 실제 torus inverse로 정한 다른 점이다. 같은 원래 함수의 source-bound displacement와 미분 상계로 옮기거나 새 점에서 같은 finite numerical proof를 결속해야 한다. root가 맡은 이 전달과 full curl VALUE/1차 미분의 directed interval·오차 장부가 원래 수치 관문에 남은 유한 연결이다. 필요한 실제 positive factor도 숫자 구간 또는 동등한 엄밀한 log/scaled 구간으로 평가해야 하며 symbolic root의 양성만을 numeric factor라고 부르지 않는다.

권장 최소 bridge는 full-curl leading와 remainder의 실제 계수, 새 점의 full VALUE, 공간/slow/fast 1차 미분 및 필요한 inverse/sqrt 도함수를 같은 정확한 정규화로 내는 것이다. 원래 w,t의 slow 2차와 H_i는 138 predecessor와 원래 radial slow packet에서 별도로 결속한다. 전체 물리 Hessian 수치표를 새 의무로 만들 필요는 없다. G-N5의 시간 1차·공간 2차 잔차의 의미는 이미 실제 functional source와 모든 고정 차수 bounds가 제공한다.

원하면 같은 2차 coefficient 자료로 phase0의 물리 Hessian까지 계산할 수 있다. Cartesian coefficient를 L,J라 놓고 원래 완전한 field를 `U=L cos(k phi)-J sin(k phi)`로 보존하면 phase0에서

\[
D_aU=L_a-k\phi_aJ,
\]
\[
D_{ab}U=L_{ab}-k^2\phi_a\phi_bL-k\phi_{ab}J-k\phi_aJ_b-k\phi_bJ_a.
\]

J는 C의 curl이므로 위 식에는 C의 2차까지만 필요하다. 이 사실은 완전한 원래 field를 먼저 미분한 뒤 phase0을 대입하는 항등식이다. 지정점에서 U=L이라는 값만 미분하면 J 항을 잃는다. 물리 2차 수치 값을 추가할 경우 이 항등식, basis/metric/phase 미분, 실제 point transfer를 함께 결속해야 한다.

오차 예산은 exact graph/input/domain/order/normalization와 함께 명시한다. coefficient enclosure, whole-time Volterra/Picard remainder, heat integral tail·quadrature, 이동점 전달, inverse/sqrt denominator stability, 반올림을 한 장부에서 합한다. scaled interval이면 양의 factor와 normalized tolerance, unscaled tolerance의 의미를 분명히 한다. 더 넓은 미지원 범위를 실패로 선언하거나 원래 요구를 표제만 바꾸어 제거하는 방식은 필요하지 않다.

## 이번에 확인한 수정과 실제 증거의 경계

이전 검토에서 지적한 (i) 겹치는 두 band의 flatConstant 계수, (ii) C/B의 theta와 Haar 이중 평균, (iii) signed input의 cheap 좌표 검증 후 실제 private physical authentication은 현재 source에 모두 반영되어 있다. 함수 이름과 test count만으로 이를 판단하지 않고 실제 정의와 operand를 읽었다.

Source1/2의 representation/cache 실패, source3 timeout, source4의 stale-log/partial checkpoint와 interruption은 이전 사실대로 보존한다. source4의 마지막 visible log가 active CPU phase였다고 결론 내리지 않는다. source5의 종료·실제 pass·source hashes는 이 문서 작성 시 미확정이다. 이 문서는 새 gate manifest 자체가 아니며, 마지막 실행이 성공하면 root는 아래 source snapshot과 관측 receipt 및 독립 G-N4 검토를 묶어 네 해석적 관문을 판정할 수 있다.

## 읽은 파일의 바이트

- `research-ide/mathscope-m2/navier/research/evidence/m2-continuation-20261011/at-resume-M2_COMPLETION_GATE.json` — `e7ea496477c67342950ec66210efc933790925f8ad9cf48cdb65524f0b96c3f6`
- `research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs` — `7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75`
- `research-ide/mathscope-m2/navier/actual-common-admissible-band.mjs` — `41a1fb93ec6384a3999761913ede62d374bce077810c366cbb6c2a065c71d28a`
- `research-ide/mathscope-m2/navier/actual-common-band-physical-curl.mjs` — `60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70`
- `research-ide/mathscope-m2/navier/actual-common-physical-jet-kernel.mjs` — `4ffa1f1608b12b54efa36b2f7e185c48fe1522c943206f2223b2c60299b70a00`
- `research-ide/mathscope-m2/navier/actual-physical-jet-kernel.mjs` — `0f496101e5228d29f60d311abcd99bee727f0ab203af5a43ed4241cab109268e`
- `research-ide/mathscope-m2/navier/actual-physical-residual-algebra.mjs` — `df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116`
- `research-ide/mathscope-m2/navier/actual-common-global-wave-bounds.mjs` — `63262e2bc53e2032fab12cfc8e1eac61021cc4728b8e5f49a5623fc9aa9089ad`
- `research-ide/mathscope-m2/navier/actual-global-wave-bound-kernel.mjs` — `aed60d154195d07b38e2b7fa3005a1b792cc6e8c8867a91008fecec2d33ca6b9`
- `research-ide/mathscope-m2/navier/actual-common-global-covariance.mjs` — `2541b28f946be22c96480400ad91259f81f7d061cbf473632db5d0cec1b001ff`
- `research-ide/mathscope-m2/navier/actual-common-target-weighted-norms.mjs` — `6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a`
- `research-ide/mathscope-m2/navier/actual-background-residual-flatness.mjs` — `87b8291fa7b2d66cc8c3a78621adeef55745c750366abdb4ad486b47fc744cb5`
- `research-ide/mathscope-m2/navier/actual-common-band-background-residual.mjs` — `3d55f1cc8044631b6d45af357190a40d5a890b47bb35c5eba46a1d0f8011deee`
- `research-ide/mathscope-m2/navier/actual-background-residual-flatness-kernel.mjs` — `a5adab3dfccba3d6508cd2b4a9c3004c9ec432e1b084573f626e5f1892f5fd89`
- `research-ide/mathscope-m2/navier/actual-global-finite-residual.mjs` — `d5516d6e8ae8210545243bd1ad45132ffba3de30684b58381fcc135bda0c3983`
- `research-ide/mathscope-m2/navier/actual-positive-global-stress.mjs` — `77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1`
- `research-ide/mathscope-m2/navier/actual-pressure-stress-all-order-tail.mjs` — `3748cac5658e485d3c7c59a7aef4bb80a3ca6ba50de934bd3cacc5431d3ff66a`
- `research-ide/mathscope-m2/navier/actual-full-curl.mjs` — `4b90059d6aa43a262902ae9796431b26f7b041c84bbeab61782d8654b3f790e5`
- `research-ide/mathscope-m2/navier/research/ACTUAL_LOCAL_FULL_CURL_KO.md` — `ba605690f376af7d6daf1762cf965f98a0e6d35041b08e6dd27955c5cc4d3a7e`

작성 UTC: 2026-10-11T12:28:43.926313+00:00
