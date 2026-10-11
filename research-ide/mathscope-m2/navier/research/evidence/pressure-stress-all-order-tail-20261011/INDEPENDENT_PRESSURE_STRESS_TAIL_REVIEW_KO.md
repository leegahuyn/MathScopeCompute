# 압력·응력의 모든 유한 미분 차수 경계 독립 검토

검토자는 `/root`이다. 실제 source 생성기와 Gaussian/Stirling 대수, 같은 prepared graph의 실제 응력 접합 증거, source 실행 기록을 읽고 대조했다. 검토 자체는 새로운 source 실행으로 합산하지 않는다.

## 첫 응력의 바깥 경계

원래 `E(delta)=exp(-4/delta^2)`와 완전한 heat 계수 B를 유지한다. `Q_0=delta^-6`, `Q_(j+1)=Q_j'+8 delta^-3 Q_j`는 모든 유한 j에 대한 정확한 Laurent 재귀이다. 최고 pole은 `6+3j`, 계수는 `8^j`이다.

`d_delta(E delta^-3)=E delta^-6 (8-3delta^2)`와 `delta<=1/4`에서 `8-3delta^2>=125/16`을 사용한다. 따라서 backward primitive의 값은 `(16/125) E delta^-3`로 제어된다. 양의 차수에서는 primitive를 미분하고 B의 모든 Leibniz 항을 유지한다. 원래 X의 계수와 `X^-r`도 보존한다.

`partial_X=-X^-1 partial_delta`로부터 `partial_X^r=(-1)^r X^-r sum_j c(r,j) partial_delta^j`를 얻으며, unsigned Stirling 재귀 `c(r+1,j)=c(r,j-1)+r c(r,j)`를 사용한다. 생성기의 모든 binomial 항과 이 좌표 전환을 확인했다.

역사적인 m=0 packet은 B·heat·응력의 원래 식과 접합 권한만 제공한다. 새 m차 결과는 그 동일 식을 새로 미분해 만든다. 과거 cap16의 유한 목록을 임의 차수 결과로 확대하지 않는다. 이 결과는 `D^I T1 / zeta`에 유한 pole을 허용하는 경계이며, 모든 `D^I(T1/zeta)`가 유계라는 다른 주장이 아니다.

## 압력·높은 차수 응력·물리 미분

압력과 signed 응력의 실제 Cartesian profile을 사용한다. 축 근방에서 응력은 실제로 0이며, 압력은 원래 매끄러운 primitive라서 축에서의 잘못된 방사 나눗셈을 만들지 않는다. 물리 미분의 계수, 원래 시간 cutoff의 Euler 미분, `1/L`의 모든 필요한 미분을 양의 majorant에 포함한다. 지수 손실 `2A+m`은 n과 독립이다.

n>=2에서는 양의 zeta가 있는 고정된 compact 내부 구간에서 두 종류를 별도로 생성한다: `D^I(Tn/zeta)`와 `(D^I Tn)/zeta`. 서로를 같은 미분으로 취급하지 않는다. 실제 전역 소거와 양끝의 모든 고정 차수 접합 증명을 prerequisite으로 검사한다.

## 관측된 실행과 범위

실제 n1/n2, m=1 source 실행은 **6/6, 관측 exit0**, 41.51328338299936초, peak RSS 2,174,418,944 bytes이다. 필요한 FTC 51개와 실제 생성 51개가 일치하며, 기존 m=0 source seed 3개는 따로 기록한다. Gaussian/Stirling generic 검사는 **5/5**이고, 독립 비교는 차수 0–20에서 실행했다.

생성기 SHA-256은 `3748cac5658e485d3c7c59a7aef4bb80a3ca6ba50de934bd3cacc5431d3ff66a`, 대수 모듈은 `178436f36b24239da7a9f9c6cd63ef6081502080fbd43e636ebaf843fa2c6b22`이다. 실제 program graph는 `531086fae99d2eddf3756edc0b064dc2db25926d3c605a8826fa1b9e7c5ad545`이다.

유한 차수 재귀와 source smoothness의 귀납은 모든 고정된 유한 미분 차수에 적용된다. 유한 실행은 명시된 m=1까지이다. norm 상수는 정확한 source 적분 표현이며 수치 적분 완료를 뜻하지 않는다. 공통 무한 cutoff 선택, 전체 물리 잔차 flatness와 M3 시작은 별도 의무로 남긴다.
