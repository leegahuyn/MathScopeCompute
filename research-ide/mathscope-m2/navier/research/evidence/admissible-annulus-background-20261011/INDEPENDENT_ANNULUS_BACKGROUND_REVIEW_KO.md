# 실제 환형 영역 배경의 독립 검토

검토일: 2026-10-11. 구현자와 별도로 `actual-admissible-annulus-background.mjs` 전체, 대응 한국어 증명, 기존 normalized cutoff·C2·physical 조건의 연결 및 source attempt2 기록을 검토했다. 이 문서가 다루는 한 band의 배경 구성과 C2 상수 이전에서 수학적 오류를 발견하지 못했다. 새 H나 전역 NS 잔차의 검토를 대신하지 않는다.

## 실행 증거와 원본 결속

현재 모듈 SHA256은 `76bbca4c7b271cbae95da8700bafd53ead3c7f89a7e161b847d19a8e5298fea9`이다. source attempt2의 51개 literal import SHA를 모두 현재 파일과 비교하여 일치함을 확인했다. 별도 process는 exit 0, 30.658149949초, peak RSS 2,470,400,000 bytes를 기록했고, process가 지정한 TAP와 source receipt의 SHA도 일치했다. source TAP 12/12와 generic kernel 8/8은 서로 다른 실행이다. 내부 source 결속 검사 수를 독립 정리 수로 더하지 않는다.

source graph는 512,747 nodes, canonical 21,439,364 bytes이며 SHA256은 `c2e0e84547b245eb3687ecc8b78d94badfcf3efbddc191b5f7ef2de6f65867ed`이다. 이 검토는 새 source 생성·재실행을 하지 않았고 원래 module, receipt, 문서를 수정하지 않았다.

## cutoff 확대의 정당성

실제 time cutoff는 원래 $\sigma_1$을 사용하는 $\chi(x)=1-\sigma_1(2x-1)$이다. 원래 radial $\sigma_2$로 대체하지 않았다. $a$가 고정 상수일 때 $E_q=q\partial_q$는 $x=aq$에서 $E_x$와 같으므로

$$
E_q^m[q^\nu\chi(aq)]
=q^\nu\sum_{j=0}^m {m\choose j}\nu^{m-j}E_x^j\chi(x)
$$

가 맞다. 추가 stream 항은 $E_x\chi=x\chi'(x)$이므로 한 차수 높은 Euler jet가 필요하고 실제 코드가 이를 유지한다. 이 논증은 보통의 $\partial_q^m$가 $a$에 독립이라고 가정하지 않는다.

$b_n\ge c_n$이고 cutoff가 살아 있을 수 있는 영역에서 $q\le b_n^{-1}$이면, 원래 실제 대각 조건으로 $B_{n,m}q^{nh}\le2^{-n}$이다. 나머지 $q^{nh}$와 곱한 후의 tail 및 $n\ge3$의 합 $\sum 2^{-n}q^{nh}\le q^{3h}/4\le q^{2h}/4$도 맞다. 유한 $n=1,2$ 블록의 원래 계수와 Euler shape 상수를 보존하므로 C2 상수를 동일하게 재사용할 수 있다. 같은 상수라는 결론과 같은 함수값이라는 결론을 구분한 범위도 적절하다.

## 한 band에서 정확한 활성 항

실제 선택 $\ell_A=\lceil\log(4b_1)/\log2\rceil$에서 $1/(8b_1)\le Q\le1/(4b_1)$이고 $q=Qs$, $s\in[1/2,2]$이면 $q\in[1/(16b_1),1/(2b_1)]$이다. 따라서 $b_1q\le1/2$와 $b_2q\ge1$은 실제 $b_2\ge16b_1$에서 따른다. 뒤의 모든 항은 doubling으로 같은 zero branch에 있다. 연결점에서 양의 차수 cutoff 미분도 flat zero이다. 이 때문에 전체 무한 cutoff 정의와 실제 $n=0,1$의 유한 표현을 동일시할 수 있다. 계산 예산 밖의 미지 계수를 임의로 0으로 둔 것이 아니다.

$\log b_1\ge(\ell_{\min}+10)\log2$는 $\ell_A\ge\ell_{\min}+12$와 $2Q\le q_*/128$를 준다. 아주 작은 원래 양수 $h$와 거대한 $\ell_A,Q$를 식으로 유지한 방식도 맞다. $b_2\ge2b_1$만으로는 같은 결과를 얻을 수 없다는 음성 대조는 실질적인 간격 오류를 검출한다.

다른 조건의 수열을 나중에 합칠 때는 이전 항을 반영해 다시 선택해야 한다. $b_1^{new}$를 키우고 기존 $b_2$를 그대로 두면 16배 간격이 깨질 수 있다. 올바른 통합은 $b_2^{new}\ge16b_1^{new}$, $b_n^{new}\ge2b_{n-1}^{new}$를 각 단계의 max에 넣는 재귀 선택이다. 현재 모듈의 수열은 이미 이 조건을 만족한다. 추후 통합 구현에 필요한 주의점이며 현재 결과의 오류는 아니다.

## 실제 장과 slow 미분

코드는 원래 `bootstrap.finalM`과 실제 $F_1,U_1,M_1,v_1$을 남기고 $q^{2h}$를 곱한다. extra stream cutoff는 첫 항에서 plateau이고 이후 항에서 zero이므로 정확히 소멸한다. 전체 확대 영역 $[X_a/2,2X_b]\times[-1,1]$을 쓰므로 이전 terminal 외부 공통-support 영역에 한정한 결론과 다르다.

slow $F$ 앞의 $s^{-A-1/2}$, $G$ 앞의 $s^{-A}$, radial 항 앞의 $\varepsilon s^{-1/2}$를 미분하기 전에 유지했다. 원래 implicit chart의 양수 root와 실제 profile 계수로부터 R/Z/T 2차까지 생성하므로, 정규화 인자가 없는 profile pullback의 도함수를 실제 slow 도함수로 혼동하지 않는다. $\eta=\pm1$의 원래 heat는 한쪽 jet이며 음의 heat 시간으로 연장하지 않는 범위도 적절하다.

## 판정 범위

이 검토가 승인하는 것은 distinct $b_n$ 선택의 실제 한 band 배경, 원래 C2 경계의 이전, 실제 1차 보정과 2차 이하 slow 미분 본문의 구성이다. 현재 모듈은 새 moving ODE·H·inverse weight를 만들지 않는다. 모든 band의 H, 안쪽 sqrt 경계 연장, 모든 차수의 physical 대각 선택, 전역 residual/flat error와 Lean 해석학 인스턴스도 이 결과로 완료되지 않는다.

첫 attempt의 선택적 undefined 메타데이터 직렬화 실패를 실제 실패로 보존하고, 여섯 계수 root의 명시적 추출로만 수정한 방식은 원래 source 수식을 바꾸지 않는다. 최종 정상 결과와 그 실패 기록을 분리한 현재 설명에 동의한다.
