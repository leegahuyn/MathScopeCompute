# 실제 공분산의 유한 표시 band와 원래 인증 영역

## 현재 1..128 전체는 원래 충분조건 밖이다

[새 band 판정 모듈](../actual-covariance-band-admissibility.mjs)은 실제 원본 [operator](../actual-covariance-source-operator.mjs)와 [bounds producer](../actual-covariance-operator-bounds.mjs)를 소비하고, source profile 및 정확한 정수 문자열 `ellExact`만 받는다. h·행렬·bound·완료 flag는 입력할 수 없다.

원래 선택식은

\[
\ell_{\min}=\left\lceil\max\{8,S_{\min},(64/h)^2\}\right\rceil,
\qquad q_*=2^{-\ell_{\min}-4}.
\]

그 실제 operand root와 maximum/ceiling/buffer를 직접 결속한다. 고정 profile은

\[
h=\exp[-8002(\exp(1048576)+10)],
\qquad0<h<2^{-4096}
\]

이므로

\[
(64/h)^2>2^{8204},\qquad
\ell_{\min}>2^{8204}>128.
\]

현재 실행 예산이 지원하는 \(1\le\ell\le128\), \(s\in[1/2,2]\)에서

\[
q=2^{-\ell}s\ge2^{-129},\qquad q_*\le2^{-133},
\qquad q/q_*\ge16.
\]

따라서 이 범위에서 원래 충분조건의 member라고 판정할 수 없다. 이 결과 자체는 det(H) 비영성이나 weight 부호에 대한 반례가 아니다. 그런 정보는 이 certificate에서 `UNKNOWN`을 유지한다.

이 문서는 원문 (6.8)의 지정되지 않은 \(\ell_0,q_{\rm big}\)를 구현의 \(\ell_{\min},q_*\)와 동일하다고 추정하지 않는다. 이 certificate의 비멤버십 대상은 **현재 실제 bounds producer가 선택한 명시적인 충분조건 영역**이다.

## completed field가 leading field와 정확히 같은 별도 결론

원래 first canonical cutoff는 실제 zeroth-order norm \(B_{1,0}\ge1\)에서

\[
\log c_1\ge\frac{\log2+\log B_{1,0}}h,
\qquad c_1\ge2^{1/h}>2^{129}
\]

를 만족한다. 원래 canonical recipe의 \(c_n\ge2c_{n-1}\)를 사용하면 모든 \(n\ge1\)에서 \(c_nq>1\)이다. 원본 complete time cutoff는 argument 1 이상에서 0이고 모든 도함수도 0이다. 실제 field의 \(\sigma\chi'(\sigma)\) extra stream term까지 결속했다. 따라서 양의 order의 모든 항은 open neighborhood에서 정확히 소멸한다.

이 결론은 표시용 `terms:0`을 exact solution이라고 간주해서 얻은 것이 아니다. 원래 cutoff의 정확한 flat zero branch에서 얻는다. canonical normalized sequence 및 doubling을 유지하는 후속 enlargement에 대한 결과이며, 전역 physical/weighted selector 전체를 이미 완성했다고 주장하지 않는다.

현재 ell=1 geometry도 h를 유지하며 정확히

\[
Q=1/2,\ S_*=1,\ k=2,\ i(\ell)=0,\ c_i=2^{-1-h},
\qquad L_s=2^{-32+h}
\]

이다. 모든 finite band에서는 \(1/2<\epsilon=2^{-\ell h}<1\)이고 \(k=2\)다.

## 별도 ell=1 부호 장애

이 band 판정에는 weight 부호를 추가하지 않는다. 별도의 [실제 ell=1 비음수 해 장애](ACTUAL_COVARIANCE_ELL_ONE_OBSTRUCTION_KO.md)는 원래 terminal heat를 유지한 특정 대표점에서 두 Htheta column이 음수이고 actual target theta가 양수임을 도출한다. 이는 단순 충분조건 실패보다 강한 source-specific 결과다. 두 결론을 같은 flag로 섞지 않는다.

## 실행·보존 기록

최초 source 실행은 [원래 receipt](evidence/m2-continuation-20261011/actual-covariance-band-admissibility-source.json) 및 [원래 TAP](evidence/m2-continuation-20261011/actual-covariance-band-admissibility-source.tap)에 7/7로 기록되어 있다. 이 실행의 source/runner SHA는 당시 그대로 보존한다. 이후 source hash를 소급해서 덮어쓰지 않는다.

첫 구현 시 `Q=1/2`라는 수학적 값과 `exp(-ell*log2)`라는 원래 graph 표현을 혼동해 structural check가 실패한 기록은 [실패 JSON](evidence/m2-continuation-20261011/actual-covariance-band-admissibility-source.initial-failure.json)과 [실패 TAP](evidence/m2-continuation-20261011/actual-covariance-band-admissibility-source.initial-failure.tap)에 보존했다. 원래 source를 바꾸지 않고 checker가 실제 literal exp/log root를 결속하도록 수정했다. 이 실패를 의도적인 음성 대조 PASS로 세지 않는다.

후속 검토는 program.nodes 교체 또는 metadata 추가가 certificate hash에 영향을 줄 수 있는 초기 seal의 범위를 발견했다. program 전체 metadata와 고정 node prefix를 봉인했고, 이후 append를 receipt hash에서 제외한다. 수정 전 [module snapshot](evidence/m2-continuation-20261011/source-snapshots/actual-covariance-band-admissibility.before-program-seal.mjs)과 [runner snapshot](evidence/m2-continuation-20261011/source-snapshots/actual-covariance-band-admissibility-source.test.before-program-seal.mjs)을 보존했다. 이 snapshot들은 당시 bytes를 보존한 감사 자료이며 이동된 경로에서 독립 실행 가능한 프로젝트라고 주장하지 않는다.

수정된 seal은 ell=1 obstruction의 [combined source JSON](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-source-attempt1.json)과 [TAP](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-source-attempt1.tap)에서 **12/12 PASS, exit 0**으로 확인했다. 이 실행은 원본 graph 한 개만 생성했다. 원래 threshold/leading-cutoff 판정, copied/private object 거부, nodes/metadata 변조 거부, 실제 later append 후 certificate hash 불변을 함께 검사했다. `bandCertificate`의 고정 compiler hash는 `fb55e6c980dbd1047c0a92595e5b0c1d315e7035f7bc5318e269c60c8dcaf455`이며 218,081 nodes, 8,622,666 canonical bytes다. seal 수정 후에도 그 수학적 compiler 내용은 같고, 변경 방지 검사가 추가된 것이다.

최종 band module SHA는 `bec5a2cf72971baa8e276b308bd5b63bf369afa92313887cc088ff54f879e9a3`이다. combined runner의 SHA는 `2d56e34ac6c7588a96c345530f129217d33ab59ebb13b26eda85db679296c1fd`이며, source JSON SHA는 `01fe6e46397288916188f8812bae3924c678ce8641fa6e66c5662f3b1d9746f4`다. 새 실행에 포함된 52개 literal import 파일은 실행 전후 불변이다. 별도 band 전용 runner의 9개 검사 그룹을 새로 실행했다고 세지는 않는다.

수학적 범위는 source-bound 서면 증명과 구조·정수 비교다. 새로운 Lean kernel 증명, 실제 H 정밀 quadrature, 원문 전체 NS 증명 또는 M3 시작 권한으로 올리지 않는다.
