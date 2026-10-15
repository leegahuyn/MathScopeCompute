# 원본 natural 호출의 바깥 적분 범위 계약

natural_outer_range_proof.py는 보수적으로 추출한 원본 533개 호출의 Y 인수에 관한 **조건부 범위 계약**을 만든다. 전체 g의 실제 호출 영역이나 eta 치환, 원본 Guard 의무가 해결되었다고 선언하지 않는다. 특히 outside-left 가지에 쓰는 비음수 selector 전제는 정확한 정규화 식과 함께 남기며, 실제 물리·native 호출자가 이를 만족함은 별도의 의무다.

cloud 실행은 같은 workflow에서 Stage3가 새로 만든 전체 source cache를 읽는다. 고정 Stage3 해시와 실제 gzip/detached-header 결합을 확인하고, 인증된 fixed/g21 정의, 136186개 보수적 ID와 84개 등록부, 533개 원본 호출 ID·node 해시를 다시 맞춘다. arbitrary SQLite 파일을 독립 인증한다고 말하지 않는다. source cache는 필요한 원본 경로를 지연 조회하므로 노트북에 원본 큰 graph를 내려받을 필요가 없다.

Y가 좌표와 독립적이면 상수 자체의 범위를 증명한다. 첫 적분의 양 끝이 독립적으로 고정되어 있으면 그 binder 범위로 증명한다. 나머지는 실제 enclosing lazy guard의 각 가지에서 아래로 걸으며, 중간의 모든 적분을 통과해 정확한 변수 endpoint와 중첩 scope를 유지한다. 원본의 같은 DAG node라도 환경이 다르면 따로 검사한다. 새로운 binder는 그 변수에 관한 옛 composite constraint까지 가린다. 적분 몸체만 새 scope를 얻고 양 끝 식은 바깥 scope로 평가한다.

계산은 정확한 유리수 및 원본 양수 매개변수의 대수식으로 이루어진다. 공통 log 항의 소거와 log/exp 단조성은 사용하지만, 알려지지 않은 순서나 무한 endpoint에 수치를 넣지 않는다. 닫힌 경계점을 임의로 제거하지 않는다. Y가 음수이거나 증명한 상계 41/10에 닿는 보수적 경우, 알려지지 않은 native/guard, 빠진 원본 경로는 명시적인 미해결 항목이다. 로그의 0 하계는 음의 무한대 하계로 남으며 로그의 정의역 자체를 이 범위 검사로 대신하지 않는다.

작은 표준 라이브러리 대조군은 알려지지 않은 순서·parameter, 무한 endpoint, 변수 binder, binder shadowing, endpoint capture, 닫힌 상계 및 같은 DAG의 서로 다른 guard 환경을 검사한다. 작은 fixture는 원본 graph의 인증 증거가 아니다.

미해결 의무는 실제 g/등록부의 formal-to-actual parameter 치환, 각 selector의 비음수 실제 호출 전제, eta가 원래 I 또는 공통 tube 안에 있다는 사실, 원시 inverse/log/sqrt의 전부 정의됨, unattached 보수적 source 사용의 정확한 분류다. g의 압력 적분 J를 더 작은 chart로 제한하지 않는다. 이 모듈의 모든 실행은 새 원본 Guard/Jet/PDE 소거 수를 0으로 유지한다.
