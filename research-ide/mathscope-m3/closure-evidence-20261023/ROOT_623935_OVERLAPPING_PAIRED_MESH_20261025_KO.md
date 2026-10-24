# 실제 대표점이 두 개의 원본 메시 셀에 동시에 속해도 역근은 같지 않다

2026-10-25. 원본 PR #30 및 운영 사이트 수정 없음.

## 인증 원본
첫 post-Signed FiveMap 4,420,257-node AST SHA-256
`a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`.
원본 native `#623935`의 선택 Z `#623921`, 중점 T `#623934`.
source `0<h<2^-4096`.

## 모든 h에 독립인 정확한 대표점

`E=3^6=729, delta=3/(4E)=1/972`,
`Xa=Xrep=1/2, Xb=3/2, srep=1, Rrep=1,
etaRep=Zrep=1/(2E), Trep=1-1/(4E²)`.

같은 반경·시간 메시 인덱스 `r=t=729`와 이웃 z 인덱스
`z0=0`, `z1=1` 모두 원본 `Rrep,Zrep,Trep`를 자기 메시
박스 **엄격한 내부(반경 폐셀)**에 갖는다.
따라서 기존 원본 sRep=1 서명 투영 영상 정리는 두 셀 모두에 적용된다.

두 셀에 대해
`a=1/2`, `b=(1+delta)²=946729/944784`,
`m=1-delta=971/972`, `M=1+delta=973/972`이다.
따라서 `L=0`; `1<b<2`와 `0<2h<1`에 의해
`U²=(b-m)/b^(2h)>(b-m)/2>(7/(4E))²`.

- z0는 `[-delta,delta]`; 원본이 선택한 **음의**
  Z 중점은 `Z0=-delta/2=-1/1944`.
- z1은 `[1/(4E),7/(4E)]`; 음의 교집합은 공집합이고
  **양의** Z 중점은 `Z1=1/E=1/729`.

`a<m`이고 `b-2/E²>M`; `Z_i²<=1/E²`이므로
두 셀 모두 원본 T clamp가 `[m,M]`로 일치해
`T0=T1=(m+M)/2=1`을 선택한다.

그러나 `Z0²\ne Z1²`이고
`F_i(s)=s-Z_i²s^(2h)-1`은 `[1/2,2]`에서 엄격히 증가한다.
따라서 두 원본 inverse 호출은 **서로 다른 유일한 근**을 출력한다.
각 호출의 실수 영상 소속 및 분모 `2s>=1`은 유효하다.

## 정확한 해석

이 예시는 조건부 영상 소속을 **개별 셀 단위로** 증명하더라도
서로 겹치는 셀들의 선택 Z/T/역근이 자동으로 동일해지지는
않음을 보인다. 이것이 곧 전체 물리장 불연속을 뜻하지는 않는다.
원래 네트워크의 **실제 selector, mesh weight, cutoff, gluing**
및 모든 미분차수의 상쇄/평탄 접합을 확인해야 한다.

원본 `#623935` source signed Z C⁰ 점프 반례는
`ROOT_623935_C0_SIGNED_SWITCH_AND_MESH_GAP_20261025_KO.md`에 별도 보존.
이웃 셀 예시는 **실제 소스 대표점과 두 메시 모두의 소속**을
만족한다는 점에서 임의 메시 반례와 구별된다.
다만 같은 native 런타임이 실제로 두 셀을 어떻게 결합하는지는 미검증이다.

## 실제 실행 및 엄격한 상태

코드:
`prove_original_root623935_overlapping_mesh_nonidentity.py`,
`test_prove_original_root623935_overlapping_mesh_nonidentity.py`.

SHA 인증 원본 테스트 CI:
https://github.com/leegahuyn/MathScopeCompute/actions/runs/40132927059
— **27 tests PASS**, CI SUCCESS. 실제 final A–D 전체장은 아님.

**114/114 조건부**, 전체 native 호출 범위 OPEN,
원본 Y **33/523 인증, 490 OPEN**, final jets **0/67**,
M3 **62/64** (N7-06·N8-05 OPEN), M4 **0/16**,
**RELEASE HOLD**.
