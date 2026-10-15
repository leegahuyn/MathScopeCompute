# M3 실제 Picard 자연급수 증거 뷰

`render_native_view.py`는 SHA-256 고정 원본 n = 1 계수 그래프를 분석한
`native-domain-inventory.json`에서 독립적으로 열 수 있는 HTML을 생성한다.
실제 호출 157개를 분류한 `naturalSeriesFamilyInventory`가 필요하다.

```bash
python -B research-ide/mathscope-m3/picard-bridge-20261014/render_native_view.py \
  --input native-domain-inventory.json --output picard-domain-view.html
python -B -m unittest discover \
  -s research-ide/mathscope-m3/picard-bridge-20261014 -p 'test_native_view.py' -v
```

단일 HTML에 JSON과 표시 코드를 내장하며 외부 라이브러리나 네트워크 호출이 없다.
24개 인자족과 157개 원본 node ID를 검색하고, 실수 Y 인자의 범위가 확인된
함수족만 선택할 수 있다. 검색·범위 필터는 URL 해시에 보존한다.
모바일에서는 표 내부를 가로로 스크롤하고 나머지 본문은 세로로 읽는다.
키보드 검색·선택과 직접 표시한 값은 마우스 hover에 의존하지 않는다.

색상과 막대는 호출 수와 증거 범위를 구분한다. 녹색 node 1953 상계는 정확
유리수 분모 정리이고, 조건부 자연급수 노름은 실제 계수의 호환되는 jet 노름
Q·ρ와 인자 배치를 전제로 한다. 실수 Y 범위 확인은 급수 정칙성 또는 복소
영역 배치 증명이 아니다. `ρ/2` 후보 튜브, `1/4` 스타디움, `|η| < 5/4`
원판도 각각 다른 영역으로 표시한다.

뷰 생성 전 원본 그래프·함수 호출 수, 고정 SHA-256 메타데이터, node 1953
분모 연결, 모든 급수 호출의 중복 없는 분류 및 범위 요약을 검증한다.
뷰는 입력 JSON의 주장과 메타데이터를 검사하며 SQLite 증명 재실행을
대신하지 않는다. 수학적 증거는 `native_domain_audit.py`와
`natural_series_audit.py`가 생성한다.

N6-01 OPEN, N6-02 PARTIAL, M3 56/64와 230개 jet·38개 Guard·1,020개 PDE
잔여항을 고정 표시한다. 현재 분석에서 미증명인 전체 계수 노름이나 원본
N6 완료 상태를 입력에서 임의로 올리면 생성을 거부한다. 전역 판정이 실제
변경되면 원본 증거와 이 뷰의 범위를 함께 검토해야 한다.

단위 테스트용 함수족은 명시적으로 만든 가상 입력이다. 실제 분석 결과와
그 입력의 화면 검증을 구분하며, 실제 클라우드 JSON으로 생성한 HTML을
최종 검토 대상으로 사용한다.
