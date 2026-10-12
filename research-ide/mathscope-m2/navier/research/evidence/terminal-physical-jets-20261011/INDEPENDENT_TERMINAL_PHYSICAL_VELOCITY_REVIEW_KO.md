# 실제 terminal physical curl·속도 미분의 독립 수학 검토

## 결론

새 actual-physical-jet-kernel.mjs, actual-terminal-physical-velocity-jets.mjs, 실제 source runner, 최종 attempt 2 JSON/log 및 별도 process 관측을 읽었다. 선언한 **선택 terminal band·고정 label·열린 slow chart**에서 원래 potential의 전체 물리 curl, 공간 2차 속도 미분, 시간 1차 속도 미분, 원래 pressure gradient를 구성한다는 결과에 수학적 오류를 찾지 못했다. 새 전체 source를 재실행하지 않은 독립 읽기 검토다.

이 결과는 원래 canonical cutoff 배경을 쓰는 해당 terminal member에 관한 것이다. 새 annulus의 확대 cutoff 배경과 동일한 실행물이라고 간주하지 않는다. 전체 label 합, 전역 NS 잔차, flat-error, 전체 수치 enclosure 또는 M3 완료로 승격하지 않는다.

## 1. 실제 물리 좌표와 시간 부호

현재 band의 원래 좌표는

\[
r=\sqrt Q R,\quad z=Q^D Z,\quad t=1-QT.
\]

originalPhysicalMap은 기존 ell=1 producer에서 rectangle basis의 고정 식만 읽는다. Q, epsilon, palette floor, c_i, L_s, k, 원래 mesh label은 모두 인증된 새 terminal member의 값을 사용하며 실제 root를 독립 재구성해 비교한다. 관측된 현재 Q와 옛 Q가 서로 다르다는 검사도 있다.

원래 radial primitive를 \(\Lambda^i(\sqrt Q R)^{d_r}\)로 남기고

\[
a(R)=\partial_R\{\Lambda^i(\sqrt Q R)^{d_r}\}
\]

를 실제 AD로 만든다. 뒤의 두 미분도 같은 본문에서 생성한다. 고정 수치 a를 대입하지 않았다.

원래 rectangle basis는 \(v_r\cdot v_t=0\), \(|v_r|^2=|v_t|^2=D_g\)이다. 따라서 원래 \(Y_i=v_r A(R)+v_t T_g^i(1-QT)\)의 실제 inverse rectangle 좌표에서 \(\xi_R=a(R),v_R=0,\xi_T=0,v_T=-QT_g^i/c_i\)이다. \(c_i=T_g^iQ^{1+h}\) 및 \(\epsilon=Q^h\)가 있으므로 \(-\epsilon v_T=1\)이다. 따라서 정규화한 물리 미분은 정확히

\[
D_r=\partial_R+a(R)\partial_\xi,\quad
D_z=\epsilon\partial_Z,\quad
D_t=-\epsilon\partial_T+\partial_v.
\]

물리 시간 전체 scale은 \(Q^{-1-h}\)이다. 느린 \(-\partial_T/Q\)와 빠른 \(\partial_v/Q^{1+h}\)를 하나로 합치는 위 식의 부호와 epsilon 위치를 확인했다.

## 2. Cartesian 기저와 반복 미분

코드는 실제 cylindrical potential을 먼저

\[
A_x=\cos\theta A_r-\sin\theta A_\theta,\quad
A_y=\sin\theta A_r+\cos\theta A_\theta,\quad A_z=A_z
\]

로 회전한다. 그 뒤

\[
D_x=\cos\theta D_r-\frac{\sin\theta}{R}\partial_\theta,
\qquad
D_y=\sin\theta D_r+\frac{\cos\theta}{R}\partial_\theta
\]

를 반복 적용한다. 1/R, sin, cos, a(R)를 매번 미분하므로 angular connection, a_R, a_RR이 빠지지 않는다. curl의 3개 성분, gradient 9개, 대칭 Hessian 18개, 시간 미분 3개, pressure gradient 3개가 실제로 생성된다.

각 부호에서 div(curl) 1개, 공간 mixed velocity 9개, 공간·시간 potential commutator 9개의 정확한 대수 항등식이 있다. 이 대수 검사에서는 local share의 partial을 기호로 취급한다. 이에 별도로 사용된 **모든** local partial이 원래 본문의 canonical AD와 같다는 materialization 검사가 수행된다. 두 역할을 혼동하지 않았다. 실제 각 부호의 사용 partial은 133개이며 potential의 사용 최대 차수는 3이다. 원래 Volterra v 미분과 R-v 혼합 미분을 원래 ODE RHS로 확인하는 별도 source 검사도 통과했다.

이는 원래 함수의 필요한 smoothness 및 공통 chart에서의 매개변수 미분 정당화를 소비하는 exact functional 결과다. 미계산된 높은 차수를 0으로 선언하는 경로는 없다.

## 3. 원래 압력, 진동 및 Q scale

원래 움직이는 pressure row

\[
\pi_{\rm row}=\frac{n^TK-n'^T}{k|n|^2}
\]

를 그대로 사용한다. pressure는

\[
-\eta_\beta\sqrt\epsilon\sqrt y\,\chi\psi
  (\pi_{\rm row}\cdot t)\sin(k\Phi)
\]

이다. 이 전체 본문을 미분하므로 y, cutoff, pressure row 자체의 미분이 남는다. 원래 real potential \(\operatorname{Re}(iCe^{ik\Phi})=-C\sin(k\Phi)\)와 부호가 일관된다.

| 물리량 | 전체 Q scale |
|---|---|
| potential | \(Q^{1/2-A}\) |
| velocity | \(Q^{-A}\) |
| 공간 1차 velocity | \(Q^{-A-1/2}\) |
| 공간 2차 velocity | \(Q^{-A-1}\) |
| 시간 1차 velocity | \(Q^{-A-1-h}\) |
| pressure | \(Q^{-2A}\) |
| pressure gradient | \(Q^{-2A-1/2}\) |

입력 originalBodies에는 아직 위 Q scale이 곱해지지 않았다. adapter가 fixedScale을 확인하고 각 결과에 scale을 한 번 곱한다. 이전 harmonic의 scale을 다시 중복 적용하지 않았다. h>0와 Q>0의 원본 지수도 보존한다.

각 원래 conjugate pair의 1/2를 합한 real body가 입력이므로 그 real body를 다시 두 배 하지 않는다. 코드의 half-pair 검사는 이 대수 사실만 확인한다. 서로 다른 두 source sign의 실제 rectangle 합성은 그 뒤의 별도 유한 합이다.

## 4. 실제 rectangle 합성과 안전한 fast support

미분은 독립 R,Z,T,theta,xi,v 좌표에서 먼저 수행된다. 각 결과를 그 부호의 실제 rectangle에 합성하고 원래 physical Y_i를 대입한다. 각 부호의 40개 scalar composition은 원래 본문 share의 값이 materialize됨을 확인하며, 독립 xi,v,Y_i 및 template grid 좌표가 모두 소거됐음을 검사한다. 공유 함수는 명시적 본문이 있는 0차 composition이므로 미지의 oracle이 아니다.

fast v가 [0,L_s] 밖이거나 xi가 [-r_0,r_0] 밖이면 함수 전체의 zero guard가 Volterra 평가보다 먼저 놓인다. 원래 fast cutoff가 더 안쪽에서 평탄하게 사라지므로 이 guard는 실제 jet을 바꾸지 않는다. nearest-integer lift 경계와 활성 rectangle 지지는 떨어져 있다. 반올림 label의 불연속을 미분하지 않았다.

slow Xplus 경계에서 인공적으로 0 연장하지 않는다. 원래 pressure나 제곱근의 정의역 바깥 값을 계산한 다음 0을 곱해서 숨기는 구성도 아니다. slow stress edge 및 모든 label의 합은 이번 범위 밖이다.

## 5. 최종 실행과 불변성 확인

최종 generic 실행은 6/6 PASS, exit 0이다. 실제 source attempt 2는 12/12 검사, 11/11 내부 source 결속을 통과했다. 별도 process-runtime JSON은 tools.write_stdin session 19131의 실제 exit 0 관측을 기록하므로 runner가 스스로 쓴 exitCode와 구분된다.

- 실행 기준 commit: fdf2ea19d373e7bb280913db6403c4103af145c0.
- 실제 graph: 390,953 nodes, 16,081,246 canonical bytes.
- graph SHA256: 6518b019dec5277b480a28fcf752297589b0deb6b69dfd112f83fe59049777cc.
- 실제 source 시간: 89,726.211122 ms; peak RSS: 2,829,660,160 bytes.
- 원래 harmonic graph: 235374c4fe2bfe79912ed0a653c594864fc6a221c92f1142bef5ac0665bf0cd6을 재현했다.
- 실행 전후 literal import 72개가 일치하며, 이번 독립 읽기에서도 72개 현재 파일의 SHA가 기록과 모두 일치했다.
- source JSON SHA256: 5f2a73e9dcc4a7ba86a7529c1a296a1d4ac52add3d044931cddfdcb19338c2db.
- process JSON SHA256: c2201fa810fc53405138d1a661217feabfee0dc6252c7fb527fb0c387ddfbba2.
- kernel SHA256: 0f496101e5228d29f60d311abcd99bee727f0ab203af5a43ed4241cab109268e.
- adapter SHA256: a2a054e3b7a1c5cae8ac66b1d949b4356754a01edcc1a05772096e67cf57437f.

원래 harmonic prefix, 함수 정의, 실제 geometry와 source roots가 private seal로 결속된다. Hessian을 0으로 교체하거나 옛 c_i를 주입하거나 share 본문을 수정하거나 전역 완료 flag를 바꾸면 거부된다. 이후 독립 graph append가 이미 발급한 physical/harmonic 해시를 바꾸지 않는 검사도 통과했다.

최초 attempt 1은 대표점 metadata까지 generic kernel의 엄격한 6좌표 입력으로 펼쳐 넘겨 거절됐다. 수정은 실제 좌표 tuple을 정확히 6개로 추출한 것이며, 물리 미분 공식의 변경이 아니다. 그 실패 JSON/log/process와 당시 source snapshot이 별도로 보존되어 있다. 개발 중 실패를 의도된 수학 음성대조로 재분류하지 않았다.

## 6. 판정의 한계

검토한 결과는 canonical source의 한 실제 admissible terminal band와 같은 고정 label의 두 부호에 한정된다. 실제 전체 공간 Hessian과 시간 1차 및 압력 gradient를 functional graph로 구성했다는 것과, 그 값을 엄밀 수치 구간으로 평가했다는 것은 다르다. 후자는 false이다.

모든 label의 무한 합, 전역 physical residual 및 flat-error, annulus 전체의 다른 cutoff 배경으로의 이전, 새 해석학 Lean, Worker·browser 실행은 이 source 기록에서 증명하거나 관측하지 않았다. 관련 false scope를 유지하는 것이 정확하다. 원래 label 전체를 다루는 보편 정리에는 개별 label의 무한 실행 대신, 동일한 source template와 실제 균일 norm·수렴 추정을 추가로 결속해야 한다.
