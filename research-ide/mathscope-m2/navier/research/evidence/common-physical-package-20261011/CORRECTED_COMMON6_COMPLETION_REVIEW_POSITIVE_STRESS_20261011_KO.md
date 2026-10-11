# 원문 radial map 교정 후 common source6 완료 검토

검토자: `positive_stress`. 검토 시각: 2026-10-11T15:22:47.927799+00:00.

## 판정과 범위

**교정된 원문 물리 지도에 대해 G-CURL과 G-N5의 재검증을 닫고, 같은 원본의 G-POS 및 G-N4 결속을 재확인할 근거가 충족되었다.** 원문 식, 현재 생성자의 정량 논증, 실제 source 객체의 연결, 최종 원본 실행 및 바이트 동일성을 함께 읽은 판정이다. 소프트웨어 검사 8개 자체를 전칭 해석학 정리의 증명으로 사용하지 않는다.

앞선 source5는 당시 만들어진 지도에 관한 실행 이력으로 보존한다. 빠진 계수 2를 포함하는 원문 지도의 현재 완료 근거는 새 source6이다. 이전 완료 부록과 실행 대기 계획은 덮어쓰지 않았다. 본 기록은 G-NUM의 숫자점/source4·설치 pin·Worker·browser·replay를 대신하지 않으며, 전체 M2 또는 M3 시작을 발급하지 않는다. Gate와 runtime 파일도 수정하지 않았다.

## 직접 확인한 실행과 출처

| 항목 | 실제 관측 |
|---|---|
| 시작 UTC | 2026-10-11T14:56:31.226920+00:00 |
| 종료 UTC | 2026-10-11T15:19:38.221310+00:00 |
| 외부 종료 / source | exit 0, timeout false, complete true |
| 최종 TAP | 8 성공; 실패·취소·생략·todo 각각 0 |
| 경과 시간 | 1386.959551577초 |
| 회수된 child의 peak RSS | 4,942,114,816 bytes |
| 실행 시점 HEAD | `5ca41e7da8f1338e81ac66dde9026bbdab313d69` |
| 현재 source 및 실행 snapshot | 각각 118/118 SHA 일치, 불일치 0 |

Source, process, TAP 로그를 각각 읽고 기록된 SHA를 직접 재계산했다. 여덟 실제 package 생성 횟수는 각각 1이다. N4 assertion 6개와 E_B assertion 5개는 모두 통과했고 validator는 대체 source를 생성하지 않았다. 최종 test8은 private 객체 복제 거부, 허용한 append 이후 기존 graph hash의 안정성, 기존 source와 함수 정의의 불변을 확인한다.

메모리는 종료·회수된 child의 RUSAGE 값과 source 직접 로그의 최대 RSS 4,788,162,560 bytes를 사용한다. Process JSON의 `/proc` sampler 값은 이 PID namespace에서 실제 Node RSS를 대표하지 않으므로 실제 전체 process tree 크기로 해석하지 않는다. 원래 process receipt는 수정하지 않았고 이 관측 한계를 여기와 JSON 부록에 구분해 기록했다.

## 원문 식의 실제 연결

원문 NS PDF SHA `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`, 인쇄 p.63 식 (6.2)의 정확한 식은

\[
d_r=2\big((1+h)\rho_g-h\kappa_s\big),\qquad
\kappa_s=1/100000,
\quad \rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)}.
\]

`assertions.originalTorusMap`의 retained root는 `dr=actualDr=627589`이고 실제 physical certificate의 map과 같다. 기록된 20개 typed 연산 노드를 별도 Python 비교로 재구성하여 h/Lambda/Tg/rho/kappa/dr 여섯 본문을 모두 대조했다. 바깥 2가 빠진 옛 식은 같지 않으며, `oldMissingFactorAccepted:false`도 실제 비교와 일치한다. h의 원래 정의 `exp(-8002*(exp(1048576)+10))`와 parameter expression SHA `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`가 유지된다. h를 0으로 바꾸지 않았다.

원래 `epsilon=Q^h`와 palette floor를 함께 쓰면

\[
M_i=r_c^{-\rho_g}\epsilon^{-\kappa_s}S^{-\rho_g},
\qquad 1\le r_c<T_g.
\]

따라서 기존 전역 장부의 전체 `epsilon^(-kappa_s)` 상계가 그대로 맞는다. 반대 방향으로도 `M_i>epsilon^(-kappa_s)/(3S)`이며, 이전 숫자 증명에서 사용하던 더 약한 half-kappa 하한을 유지할 수 있다. 고정 radial 미분마다 실제 falling product와 radius 하한을 적용하므로 새로운 숨은 epsilon 손실을 도입하지 않는다. 실제 물리 Q 손실 장부는 이미 full kappa_s를 포함하고 있다.

Common5와 공유되는 현재 파일 111개는 동일하고, 기존 변경 파일은 정확히 5개이다. `actual-common-global-wave-bounds`, `actual-covariance-source-certificate`, `actual-full-curl`, `source-geometry`는 같은 원문 helper를 소비하며, 공통 source test는 원문 map assertion을 추가했다. 새 helper와 runner 2개, 이전 진단 runner/helper 제외 4개가 현재 118파일 closure를 이룬다. 과거 snapshot 또는 실행 commit의 파일을 과거 manifest SHA와 먼저 일치시킨 뒤 다섯 diff를 읽었다. N4/E_B, Gaussian 유한 차수 장부, 공통 covariance 본문은 이전 검토 bytes 그대로다.

## 교정된 실제 graph 결과

| 패키지 | 노드 수 | 새 graph SHA-256 | source5와 관계 |
|---|---:|---|---|
| 공통 family | 622,781 | `bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219` | 동일 |
| 자체 band | 627,497 | `5912d073e58d1f587395d4478b5ad704f63530f8bd5219cca54da1d95c39f3ff` | 동일 |
| 완전한 physical curl | 719,973 | `458943ba604fac2a89abf0263147526a00adc6393445796ba7cfcbd7e4ae4843` | 교정된 새 그래프 |
| weighted target N0/N1 | 627,405 | `ac6f39969928e481c32690336686e360e3f23efa51ce39332b73f53e5deecdd6` | 동일 |
| 전역 wave 상계 | 628,525 | `68f6ffacafac722fbe45174ab84c3e0e1a59171ed9f7cc4b59d8633f4be17f8c` | 교정된 새 그래프 |
| 전역 primary covariance | 720,452 | `79d2ffc302ab2db900b8432dcc5d23d7c85f12d996da244ed421b904dfbdb3cf` | 교정된 새 그래프 |
| 배경 flatness 정리 | 884,353 | `1301fe662653d92f24acf8df74567f51dc3efa0a0142d059da854fa41160ebce` | 동일 |
| 실제 E_B | 728,256 | `94f70753a08e381e39e3656a78ec35d8a4a1497484b1852fb8da3cca5ba7bc07` | 교정된 새 그래프 |

Radial map을 소비하지 않는 family/band/target/배경 flatness는 동일한 그래프로 남는 것이 정상이다. 영향을 받는 physical/globalWave/covariance/E_B는 새 그래프로 생성되었다. 숫자점 source4와 symbolic common6 사이에서 정수 root ID를 동일시하지 않는다.

## 네 관문의 수학적 적용

### G-POS와 G-CURL

실제 C3 및 velocity/pressure/stress의 모든 diagonal 조건, n=1 weighted endpoint 상수, `b_2>=16 b_1`와 이후 재귀 gap은 같은 b_n에 결속되어 있다. 전역 영역 `q<2^(-(ell0+4))`에서 원래 band cutoff가 활성인 모든 ell은 공통 양성 전제를 만족한다. 각 label은 자기 원래 대표점·rounded carrier·두 Volterra 계·H·target을 생성한다. 한 label의 계산값으로 다른 label을 대체하지 않는다.

열린 annulus에서 `y_j>=c_y*zeta>0`이고, H inverse 및 sqrt의 모든 고정 차수 Leibniz 재귀는 원래 target의 두 flat 지수와 유한 boundary pole을 유지한다. 경계에서는 inverse/sqrt를 평가하기 전에 가중된 원래 식을 0으로 연장한다. 원래 chi/psi와 slow partition의 flat join, 안쪽·바깥쪽 Gaussian이 smooth extension을 준다. Eta 끝점은 원래 T>=0 측의 한쪽 heat regularity이다.

Physical curl은 full phase, 두 sign, sqrt(y), 원래 압력, 움직이는 normal, 원통 기저와 connection, 원래 chi/psi/slow partition을 보존한다. 실제 40성분 third variations와 19개 mixed identity가 공간 2차·시간 1차 물리 NS 입력에 결속되어 있다. 각 항의 실제 Cartesian curl과 supported extension, 내부의 locally finite 합으로 전역 divergence 0을 얻는다.

### G-N4

Full leading heat, I/J/S/Cp moments, axis pressure와 두 shear, positive coefficient의 다섯 conservative moment가 실제 finite cancellation에 남아 있다. n=1의 완전히 수렴하는 heat-subtracted angular moment와 남은 viscosity tail, 모든 ordered quadratic pair, radial stream chi-prime commutator와 그 도함수도 포함한다.

실제 E_B는 같은 physical graph의 독립 background NS vector와 원래 stress divergence의 합이다. Source roots `728203,728204,728205`는 이 합을 나타내며 사전에 0으로 정의되지 않았다. 원래 M_eta와 독립 derivative body 차이는 source prefix 및 실제 본문 항등식으로 확인하고 나서만 사용한다.

고정 미분 차수 m와 원하는 decay P에 대해 같은 b_J plateau와 diagonal 꼬리 부등식으로 실제 무한 cutoff tuple과 유한 J tuple을 비교한다. 물리 손실 `2A+1+m`은 truncation N과 독립이다. 실제 finite source constructor와 전칭 귀납 논증이 이 같은 E_B의 모든 고정 차수 flatness를 지지한다. 이번 실행은 N=2, m=0, P=1이며, 거대한 symbolic J의 literal graph를 실행했다고 표시하지 않는다.

본 검토자는 G-N4 일부 본문의 작성자다. 따라서 이 부분을 자신의 코드에 대한 두 번째 독립 검토로 세지 않는다. 이미 보존된 root 검토와 ns_proof_audit의 finite/common residual 및 source5 cross-premise 검토가 독립 수학 읽기를 담당하고, 이번 기록은 불변 본문을 새 실행에 연결한다.

### G-N5와 N6로 남기는 것

원래 moving system의 안정한 Duhamel 재귀, 같은 Gaussian P, 실제 background C_(m+3)와 target norm 0..m+1을 사용하는 모든 고정 차수 장부를 유지한다. 없는 고차 norm을 C2로 대신하지 않는다. 두 boundary 지수, 모든 mesh label의 수, 최대 두 active band와 양의 infinite tail을 포함한다. Flat constant의 인자 2와 이미 모든 band를 더한 tail을 구분한다.

시간 cutoff 힘은 `psi_prime * complete curl`의 실제 물리식이다. Primary만으로 바꾸거나 psi로 나누지 않는다. 동일 source 상수와 Gaussian band 합으로 이 힘의 모든 고정 미분을 원하는 q 차수로 제어한다. 전체 uncorrected NS 잔차의 flatness를 주장하지 않는다.

Covariance의 target 항등식은 primary에 실제 theta 평균과 정규화 Haar 평균을 모두 취한 식이다. 원래 full NS의 점별 비선형 곱을 평균으로 바꾸지 않는다. 실제 full residual, curl remainder, self-advection 및 eikonal 항을 N6 입력으로 유지한다. Signed inverse는 입력의 M_alpha 소속 또는 U in W_(1/2)를 임의로 발급하지 않는다. N6 correction, N7 종단 구성, N8 재구성은 아직 이 package의 결론이 아니다.

## 남는 별도 판정

이 새 실행과 불변 원본 논증을 함께 읽은 범위에서, 네 비수치 관문을 추가로 막는 수학적 의존성을 발견하지 못했다. 실제 source4의 270 도함수, 정확한 양의 배율과 두 w_minus VALUE, fresh runtime source/Worker/browser/replay의 근거는 별도 G-NUM 및 배포 판정에 연결해야 한다. 이 문서는 그 검사를 대체하지 않는다. 새 actual analytic Lean instance를 실행했다는 주장도 하지 않는다.

기존 실패, timeout, 잘못된 옛 지도의 성공 이력과 원래 해시는 그대로 보존한다. 교정된 성공은 과거 실패를 음성 대조나 성공으로 재분류하지 않는다.

## 고정 실행 SHA

- Source6 JSON: `ac98143158c9e7abc6bd656e687269f183bb803ecdc036edb8a3937edc24bc01`
- Observed process JSON: `586afe71fa150a1525836903caabc9ff95fa80adadf12ad90d2e735b965eda82`
- 최종 TAP 로그: `5428a6e1a0570d81e202b020da88b77b56e8fc6f08978f92a23f09bd80878fe0`

별도 JSON 부록에는 전체 비교 결과, 원문 20-node binding, 여덟 graph, 원본 assertion과 독립 검토 참조 SHA를 함께 보존했다.
