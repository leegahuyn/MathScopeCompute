# 실제 cutoff 확대·전체 annulus 배경의 독립 검토

검토자는 새 물리 curl/속도 미분 모듈을 담당하는 별도 agent이다. 이 검토에서는 구현이나 실행 기록을 수정하지 않았으며, 큰 source 작업을 다시 실행하지 않았다. 최종 모듈, 수학 설명, 실제 source attempt2와 별도 process 기록을 읽고 모든 literal import의 현재 SHA256을 직접 비교했다. 아래에 명시한 범위에서 수학적 결함을 발견하지 못했다.

## 1. cutoff 확대와 normalized 경계

원래 time cutoff는 $e^{-1/x}$의 smooth 연결이며, radial square seed로 바뀌지 않았다. $E_q=q\partial_q$, $x=aq$와 고정된 $a>0$에 대해

\[
E_q^m(q^\nu\chi(aq))
=q^\nu\sum_{j=0}^m{m\choose j}\nu^{m-j}E_x^j\chi(x)
\]

가 성립한다. 코드의 추가 stream 항은 $x\chi'(x)=E_x\chi(x)$이므로 같은 합에서 cutoff 미분 차수를 $j+1$로 올리는 것이 맞다. 직접 AD와 Euler 식의 비교, $\nu$ 항 및 추가 stream 미분 누락을 거절하는 대조도 확인했다. 이 논증은 보통의 $\partial_q^m$에 scale 손실이 없다는 주장이 아니다.

$b_n\ge c_n$에서 원래 실제 대각 조건 $B_{n,m}c_n^{-nh}\le2^{-n}$을 그대로 쓸 수 있다. cutoff support에서는 $q\le1/b_n\le1/c_n$이므로 $B_{n,m}q^{nh}\le2^{-n}$이며, 남은 $q^{nh}$가 원래 normalized tail의 인자이다. support 밖에서는 cutoff와 그 모든 미분이 영이다. $n=1,2$의 실제 finite 계수 경계와 원래 cutoff shape를 보존하므로 C2 상수의 이전도 정당하다. $q\le1$에서 $\sum_{n\ge3}2^{-n}q^{nh}\le\frac14q^{3h}\le\frac14q^{2h}$라는 합과 원래 extra stream 항의 처리를 확인했다.

모듈은 같은 C2 root를 재계산해 비교하지만 그 비교만으로 새 배경의 경계를 증명한 것은 아니다. 앞의 scale 확대 부등식이 그 이전을 정당화한다. 새 배경과 canonical 배경의 함수값이 같다는 주장은 없다.

## 2. 새 dyadic band의 전체 구간

새 선택은 실제 canonical 및 유한 physical constraints를 포함하는 maximum으로 $b_1,b_2$를 정의한다. $b_1\ge2^{\ell_{\min}+10}$, $b_2\ge16b_1$ 및

\[
\ell_A=\left\lceil\frac{\log(4b_1)}{\log2}\right\rceil,\qquad Q=2^{-\ell_A}
\]

에서 $1/(8b_1)\le Q\le1/(4b_1)$를 얻는다. 따라서 $s\in[1/2,2]$, $q=Qs$ 전체에

\[
\frac1{16b_1}\le q\le\frac1{2b_1}
\]

가 적용된다. 이때 $b_1q\le1/2$이므로 첫 cutoff는 1이고 모든 양의 차수 cutoff 미분은 영이다. $b_2q\ge1$이며 이후 수열은 증가하므로 둘째 항부터 모든 cutoff와 미분이 영이다. 원래 smooth cutoff의 flat 연결점도 이 닫힌 구간에 포함된다. 계수 생성 개수로 뒷부분을 잘라낸 것이 아니다.

또한 $\ell_A\ge\ell_{\min}+12$이므로 $2Q\le q_*/128$가 맞다. 이 계산은 원래 source의 충분조건을 만족하는 새 band 선택이며, 미지의 원문 $\ell_0,q_{\rm big}$ 값을 계산했다는 뜻이 아니다. 비율 16이 필요한 위치와 2, 8, 15를 거절하는 exact arithmetic 대조를 확인했다.

## 3. 실제 계수 본문과 slow 차트

최종 유한 본문은 실제 계수의 $F_0+q^{2h}F_1$, $U_0+q^{2h}U_1$, $(Xv_0+q^{2h}Xv_1)/\sqrt{2X}$ 및 $M_0+q^{2h}M_1$이다. $M_0$에는 원래 완료된 bootstrap.finalM을 유지한다. $F_1$을 버리거나 다른 단순 profile로 바꾼 흔적은 없다. 이후 모든 doubling continuation의 항이 실제 cutoff로 영이므로 같은 한 band 본문을 준다.

slow 차트 $s-Z^2s^{2h}-T=0$, $X=R^2/(2s)$, $\eta=Z/s^D$를 보존하며 미분 전에 각각 $s^{-A-1/2}$, $s^{-A}$, $\epsilon s^{-1/2}$를 붙인다. 이는 차트 곡률이나 slow 인자를 생략한 profile derivative가 아니다. 실제 source에서는 각 함수의 전체 차수 2 이하 R/Z/T jet 10개씩을 생성한다. $\eta=\pm1$에서는 원래 heat의 한쪽 jet를 쓰며 음의 heat 시간으로의 연장은 주장하지 않는다.

영역은 기존 C2 producer의 확대 annulus $[X_a/2,2X_b]$이다. 이 단계는 이전의 terminal exterior $X>X_+$에만 의존하지 않는다. 다만 이 넓은 배경 영역에서 새 pulse/H가 인증되었다는 결론은 아직 내리지 않는다.

## 4. 인증 범위와 실행 기록

source-only threshold는 실제 C2 상수 및 원래 leading 방향 경계를 사용하며 대표점 범위를 제거한 뒤 자유 좌표가 남지 않는다. 이것만으로 새 두 부호 ODE 또는 $H$의 양성까지 인증할 수는 없다. 코드가 actualNewPulseOperatorChecked, actualNewCovarianceHConstructed, actualNewPositiveWeightsProved를 모두 false로 유지하는 것은 정확하다. 원래 수열과 구별되는 새 $b_n$ 배경을 쓰므로 기존 terminal pulse의 증명을 새 배경에 자동 이전하지 않는 것도 확인했다.

실제 physical 조건은 $n=1,m\le1$ 및 $n=2,m\le2$의 유한 prefix이다. 모든 차수 physical cutoff 선택, inner flat square-root extension, 전역 물리 residual/flat-error 및 M3 gate 완료는 이 기록으로 증명되지 않는다.

최종 source attempt2는 외부 검사 12/12, 내부 source 결속 11/11 PASS이며 별도 process 기록에서 exit 0, timedOut false이다. graph는 512747 nodes, canonical 21439364 bytes, SHA256 c2e0e84547b245eb3687ecc8b78d94badfcf3efbddc191b5f7ef2de6f65867ed이다. process wall time은 30658.14994900029 ms, peak RSS는 2470400000 bytes이다.

실행 당시 51개 literal import의 현재 SHA256을 모두 직접 확인했으며 불일치는 0개였다. source receipt SHA256은 24a13e2a41ab5f19cf196176320e4716d52b63fe6773d0df87b648d0fd72c63d, 별도 process receipt SHA256은 f96c103edd5480b24afc4ec6ec20be8cb6fe8cb766acd84fe3ecce2e9f5a115d이다. 첫 serialization 실패와 당시 byte snapshot은 별도 보존되어 있고 성공 실행이나 계획한 음성 대조로 재분류되지 않았다.

이 검토는 exact source 구성·기록·서면 부등식의 독립 읽기 검토이다. 실제 수치 적분, Worker, Browser, Lean kernel을 새로 실행한 기록은 아니다.
