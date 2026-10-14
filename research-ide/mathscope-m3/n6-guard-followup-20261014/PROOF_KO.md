# 실제 recursion 중단 2개에 대한 후속 검증

선행 실행 38523108728의 원본 guard 42·59는 수학적 반례가 아니라 Python 호출 스택 한계로 중단되었다. 이 작업은 원본 식과 조건을 그대로 유지하고, 깊은 scalar DAG의 순회를 명시적 스택으로 바꾼다. 모든 등록 함수의 전체 본문 capture와 모든 native implicit/series/Volterra 계수를 기존 독립 감사 규칙으로 다시 연다. 자원 중단과 미검토 연산은 계속 미해결로 보존한다.

본문이 한 인수를 사용하지 않아도 실제 인수의 정의역 의존성은 삭제하지 않는다. 전체 실제 인수와 그 정의역이 모두 치환 binder를 포함하지 않고, 원본 함수 본문 및 모든 native 계수에 숨은 capture가 없을 때만 치환이 부분함수 자체와 그 정의역을 바꾸지 않는다고 판정한다. 이 경우 원본 registry·전체 인수 튜플·미분 차수는 전부 그대로이다. 새 함수의 존재·미분 가능성·source image나 N6 인증은 주장하지 않는다.

4000층 scalar DAG, 숨은 capture, 사용되지 않는 실제 인수의 정의역, 추가 y>0 조건, 적분 binder 범위, 순환과 자원 중단에 대한 음성 대조군을 포함한다. 실제 4,238개 행 감사도 runner에서 수행하고 실패한 원본 registry ID·행 번호·정확한 이유를 작은 결과에 보존한다. 전 행 구조가 맞더라도 전체 실제 호출의 정의역을 검증하기 전에는 image 관련 guard 수를 올리지 않는다.

추가 검사는 indexed field의 각 행에서 실제 `localBody`·`localParameters`를 해당 원본 local expression registry와 정확히 비교한다. 중복을 제외한 모든 실제 local body를 다시 열고, 그 안의 native implicit·series·Volterra 계수까지 동일한 독립 감사를 적용한다. 전역 인수·계수·guard만 맞고 local body에 숨은 좌표가 남는 경우와, local body 안 native 계수에 숨은 좌표가 남는 경우를 모두 거절한다. 현재 source byte/hash를 확인하는 것만으로 lexical capture 증명을 대신하지 않는다.

원본 guard 6의 실제 operand45는 좌표가 없는 상수 `4-sqrt(2)`이다. `1^2<2<2^2`와 양의 제곱근의 단조성으로 `2<4-sqrt(2)<3`을 정확히 증명한다. 이 결론에는 source image·label·sampling 전제가 없다. 원본 식의 여섯 scalar node를 보존하고, 상수4를1로 또는 radicand2를16으로 바꾼 두 변조를 거절한다.

실제 후속 결과에서 기존 행 감사의 미일치 188개는 모두 `m3GlobalBlocks` 38개에 속했다. 고정된 원본 kernel에서 이 registry는 sparse native pulse 변분 matrix block cache이며 indexed chart field가 아니다. 실제 indexed field 28개의 4,050행은 모두 구조 검사를 통과했다. 원래 188개 진단을 보존하면서 두 종류를 구분하고, pulse의 native domain을 chart 구조 검사로 인증하지 않는다.

원본 denominator125·238에는 전체 scalar DAG의 **모든 sink에서 모든 inverse 사용처까지**의 평가 경로를 검사한다. op마다 expression child와 literal source ID·차수를 엄격히 구분한다. 각 node에서 모든 부모 경로의 보장 조건을 교집합으로 합치고, 실제 piecewise의 중간 가지에만 `0<selector<1` 조건을 추가한다. 적분 binder·opaque 치환·미검토 미분 환경을 통과할 때는 외부 조건을 버린다. 모든 inverse 사용처에 같은 중간 가지 조건이 남고 원본 분모가 정확히 `selector*(1-selector)`일 때만 활성 평가 경로에서 분모가 양수임을 판정한다. selector의 존재나 flat join·source image는 이 판정으로 해결하지 않는다. unguarded inverse sink 추가·외부 가지 이동·적분 변수 shadowing·literal ID 혼동을 음성 대조군으로 검사한다. 원본 전체 DAG에서 조건이 성립하지 않으면 그대로 OPEN이다.
