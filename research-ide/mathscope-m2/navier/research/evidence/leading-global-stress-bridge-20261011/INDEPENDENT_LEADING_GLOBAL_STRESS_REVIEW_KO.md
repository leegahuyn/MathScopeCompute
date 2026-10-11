# Leading 전역 stress bridge 독립 검토

검토일: 2026-10-11 UTC. 검토자: 별도 수학 작업 agent `blueprint_audit`.
검토 대상은 원래 생성기, 새 bridge 본문, 재사용하는 독립 대수 kernel,
source attempt 2의 test/TAP/process/certificate와 설명 문서이다.
이번 검토에서는 새로운 source 프로세스를 실행하거나 원래 식을 수정하지 않았다.

## 결론과 적용 범위

**현재 표시한 leading n=0 범위에서 수학 오류를 발견하지 못했다.**
네 개의 실제 prefix 적분 및 같은 전역 M0의 소거 증명을 사용한 뒤,
원래 momentum 식을 독립 조립하여 원래 두 stress의 가중 미분과
소거시키는 연결이 성립한다. 양의 차수 stress, 공통 cutoff 무한합,
그 물리 잔차의 flatness 또는 새 Lean kernel 증명을 이 결과만으로
완료했다고 읽어서는 안 된다. 해당 false scope가 코드와 문서에 유지된다.

## 확인한 원래 식과 치환의 근거

1. F는 원래 heat-prepared 전역 F0이고 U,M,v는 같은 private pressure
   생성기의 원래 전역 tuple이다. 복사된 graph는 원래 고정 prefix를
   비교한다. 원래 leading을 임의 다항식 fixture로 교체하지 않는다.
2. I,J,S,Cp는 각각 2XF, 2XUF, U²−XF², F²의 **전체** 0..X
   적분이다. shared function 본문, 고정 하한, integrand의 외부 X
   비의존성, 상한 대입, X 미분 및 X/eta 혼합 미분을 각각 대조한다.
   integrand support가 끝나도 primitive의 누적 상수를 삭제하지 않는다.
3. Π0=P0(eta)+Cp를 사용한다. P0의 eta 의존성을 보존하며, 압력 축
   datum을 0으로 두지 않는다. Cp의 FTC가 실제 Π_X=F²를 제공한다.
4. M_X=U와 M_etaX=U_eta의 치환은 같은 private all-join M0 증명과
   실제 root 일치를 먼저 확인한 뒤 적용한다. v 재구성 역시 그 원래
   stream 공식을 사용한다. 원래 미분 표현식을 결과에서 지우지 않는다.
5. theta와 axial residual은 sourceScaledOperators의 시간, 수송,
   압력 및 radial viscosity로 독립 조립한다. stress의 음의 미분을
   residual의 정의로 삼지 않는다. 원래 axial viscosity의 지수 이동이
   첫 양의 차수에 해당하므로 leading 식에서만 빠지는 것이 맞다.
6. theta flux는 X*Ttheta이고 axial flux는 sqrt(2X)*Tz이다.
   따라서 검증식은 dX(X*Ttheta)+X*(rtheta/R)=0 및
   dX(sqrt(2X)*Tz)+rz=0이다. 원래 2X²F_X와 2XU_X shear의
   계수와 부호가 각각 맞으며, 둘 중 하나를 실제 원본에서 삭제한
   negative control이 실패한다. 일반 kernel의 뒤쪽 적분 부호 반전
   negative control도 실패한다.
7. weighted 항등식은 X>0에서 먼저 확인한다. 축에서는 원래 매끄러운
   source와 같은 한쪽 극한을 사용하며 M/X나 sqrt(2X)의 역수를
   X=0에 수치 대입하지 않는다. 네 prefix의 실제 축 값은 모두 0이다.

## 실행 영수증의 독립 대조

최종 source attempt 2의 TAP는 7/7 PASS, 내부 check 9개이다.
관측 exit code는 0, timeout은 false, elapsed는
19.38972227799968초, whole child peak RSS는 2,087,739,392 bytes이다.
입력 key를 잘못 쓴 attempt 1의 실패 영수증도 남겨 두었다.
attempt 2 process에 기재된 dependency/test 60개를 현재 파일과
다시 해시 대조했으며 불일치는 0개였다.

- 새 module SHA-256:
  `3712cf79954692e0e22082e3f5f25b2a7cc76efe8bc43f8433ed093bcdb15fa5`
- source test SHA-256:
  `c0a00011f0713a8a10c91857000581fade04334eac83754b30c09968afc9e85f`
- source attempt 2 process SHA-256:
  `51bdfa7759b2d9b84ff5004d7880ec8e1a91f2b900ae63075dd45813c3512cee`
- source attempt 2 certificate 파일 SHA-256:
  `ea50d6d6fa15762184df67398ae5516b57da9bbef4078348ca74bb46e9bb098c`
- compiler graph SHA-256:
  `9171fa919462a0cbbc5b370040f3c5fe496446372bcba3424580f944fcf4ac05`
  (127,242 nodes, canonical 5,020,033 bytes).

이 문서는 새 adjunct 검토 기록이다. 기존 process, TAP, certificate,
snapshot 또는 원래 source의 bytes를 바꾸지 않는다.
