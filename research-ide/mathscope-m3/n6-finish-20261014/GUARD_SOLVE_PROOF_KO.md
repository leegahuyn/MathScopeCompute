# 남은 원본 guard 59개의 정확한 증명 시도

기존에 증명한 35개를 다시 새 성과로 세지 않는다. 각 나머지 guard의 원본 ID와 식을 유지하고, 실제 계산한 부호·적분 구간·capture 증거와 실패 이유를 저장한다. 모든 계산은 GitHub runner에서 수행한다.

원본 매개변수는 `T=exp(1048576)+10`, `h=exp(-8002T)`, `lambda=exp(-1000T)`, `co=1/256`이다. 지수함수의 엄격한 단조성으로 `0<h<lambda<1/100`, `0<rho=co*h<1/25600`을 얻는다. 따라서 `1-h`, `1-lambda`, `1-rho`와 `lambda-h`가 양수이다. 거대한 지수의 부동소수점 근삿값을 만들지 않는다.

원본 terminal 정규화는

`Qp=integral_1^3 exp((1-h)t)*rho*sigma'((t-1)/2)/(2(1-rho)) dt`

이다. 원본 step은 실수 전체에서 C∞이며 `0<=sigma'<=8`, `(0,1)`에서는 엄격히 양수이다. `[1/4,3/4]`에서 `sigma'>3^-16`이므로 원본 적분의 가운데 구간만으로 `Qp>rho/(2*3^16)>0`이다. 전체 구간에서는 `exp((1-h)t)<27`이므로 `Qp<216*rho/(1-rho)<1/100`이다. 원본 integrating-factor 식과 `lambda-h>0`, `-log(h)>4`에서 `Qb>132/25>5`를 얻는다. 따라서 `Qb/Qp>500`, 원본 wait는 양수이며 5보다 크다.

새 검산기는 적분 변수를 실수 전체가 아니라 **그 적분의 실제 유한 구간**에 제한한다. 예를 들어 `[1,3]`의 `1/t`는 매끄럽지만 `[0,1]`의 같은 식은 거절한다. 적분 함수와 움직이는 두 끝점이 원본 구간 및 각 매개변수의 열린 이웃에서 C∞이면, 각 고정 차수 미분에 대해 compactness로 국소 균등 dominating bound가 존재한다. 이 사실로 임의의 고정 차수 Leibniz 법칙을 정당화한다. 원본 Picard·전체 W/M/S 상계로 확장하지 않는다.

Opaque substitution은 전체 원본 함수의 인수와 숨은 capture를 먼저 감사한다. 치환할 좌표가 없으면 원본 **부분함수와 그 정의역**의 항등식이다. 실제 좌표 인수가 바뀌는 경우에는 원본 registry·미분 차수·모든 인수를 유지한 새 인수 튜플을 독립 구성한다. 이것은 함수의 존재나 전역 source image를 증명하지 않는다.

원본 annular bump가 `exp(-1/(t(1-t)))`, 외부값 0인 정확한 식인지 유리함수 다항식으로 검사한다. 약분으로 내부 pole을 숨기는 식은 거절한다. 임의 차수 미분은 bump에 끝점에서만 pole을 갖는 유리함수를 곱한 꼴이다. `t^-m exp(-1/t)->0`의 모든 m에 대한 지수 급수 상계로 모든 끝점 jet가 0임을 증명한다. 원본 전체 함수와 합성하려면 selector의 실제 전역 C∞ 정의역이 별도로 필요하다.

원본 slow image와 atlas scaling에는 정확한 보조정리를 추가한다. `R'=sqrt(r)R`, `Z'=r^(1/2-h)Z`, `T'=rT`, `s'=rs`이면 원본 implicit equation의 값은 r배이고 X와 eta는 보존된다. 그러나 **모든 실제 global candidate의 scaling과 평가 전 guard가 이 정리에 결합되었음을 검증하기 전에는 source image 관련 guard를 전역 해결로 세지 않는다.**

필요한 원본 node가 prefix에 없을 때만, 이미 Git에 보존된 3,892,594-node 압축 source stream을 runner 임시 SQLite로 한 번 읽는다. 모든 stream/member 해시를 검사하며 producer를 재계산하지 않는다. 임시 DB는 업로드하지 않고 선택된 원본 witness와 영수증만 남긴다. 입력 해시가 틀리면 수학적 미해결로 숨기지 않고 실행 자체를 실패시킨다.
