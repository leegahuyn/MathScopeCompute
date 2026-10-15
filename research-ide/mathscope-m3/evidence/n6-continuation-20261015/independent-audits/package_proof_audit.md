# 독립 검토 결과 — 2026-10-15

이 검토는 패키지 원본을 수정하지 않았다. 모든 24개 SHA-256 manifest 항목이 일치한다. 기존 16개 Guard ID는 새 소거 6개와 OPEN 10개로 정확히 분할되며, 각 ID의 원래 명제 해시가 일치한다. 230개 Jet ID와 순서, 169/197/654개 PDE 행, originalUniversalRequirements가 보존되었다. 이 장부 일치 자체는 수학적 증명이 아니다.

패키지의 독립 기호 수학 테스트 9개를 새로 실행하여 모두 통과했다. 실제 원본을 사용하는 SourceTests는 입력·SQLite가 없는 이 환경에서 재실행하지 못했다. 과거 49개 통과 기록을 새 실행 결과로 재사용하지 않는다.

## 중요한 입력 결합 결함

Stage 3의 `prepare_source`는 전체 gzip의 해시, node stream, 그 안의 첫 header record를 인증한다. 그런데 `inherited/direct_discharge.py:336` 및 `remaining_closure.py:297`은 이후 별도 `header.json`을 읽어서 registry를 만든다. 이 별도 파일이 인증된 gzip header와 같다는 검사가 없다. Stage 4 결과 장부에는 단일 slow monotone root 정의 해시는 들어가지만, 다른 registry 정의 해시 대부분은 별도 Jet 감사 파일에만 들어간다. 따라서 Stage 4 장부의 해시 일치도 이 빈틈을 모두 메우지 않는다.

수정 모듈은 `work/header_binding_audit/header_binding.py`이다. `bind_header_to_gzip(source_gzip, detached_header)`는 먼저 두 header의 JSON 구조를 키 순서·공백을 정규화하여 비교하고, 동등한 경우 gzip에서 읽은 header와 검증 영수증을 반환한다. 새 continuation은 이를 Stage 4 호출 전에 실행하고, 이후 registry는 반환된 gzip header로 만들어야 한다. 기존 Stage 3의 전체 source 인증도 계속 실행해야 한다. 두 검사는 서로 다른 의무를 다룬다.

23개 음성·양성 테스트가 새로 통과했다. 중첩 registry의 누락·추가, 문자열로 인코딩한 정의 변경, true와 1, 1과 1.0, 배열 순서, 중복 JSON 키, 무한값·NaN, 부정확한 UTF-8, 한계 초과, binary float로는 같아지는 서로 다른 정확 decimal을 거부한다. 작은 fixture는 이 equality gate의 동작만 검사하며 원본 그래프의 인증이나 정칙성을 증명하지 않는다.

## 수학적 판단

명시된 원래 양의 반지름 chart와 허용된 고정 band 범위에서, 6개 Guard의 서술된 증명에 대한 반례는 찾지 못했다. 다만 공식 장부 반영 전 실제 source 재실행과 위 registry 인증 빈틈의 보완이 필요하다.

조건부 pressure 보조정리는 제시한 공동 연속성 전제하에서 타당하다. 고정 compact 방사형 구간과 이동 위상·Haar 평균 인자를 포함한 compact 근방에서 g, g_Z, g_Y0, g_Y1이 연속이면 공통 지배 상수가 생기며, 먼저 P_Z를 정당화한 뒤 H의 미분·적분 교환을 정당화한다. D=∂R+Ψ′(R)(∂Y0+v1∂Y1)에 대해 DH=0이고, cutoff를 포함한 압력에는 −χ′(R)∫H가 남는다. 이 검산은 원본 g가 연속이라는 증명이 아니다.

theta가 자유 변수로 나타나지 않는다는 사실만으로 적분의 실제 존재가 따라오지 않는다. 따라서 이 사실만으로 theta 관련 두 Guard를 무조건부 소거해서는 안 된다. 새로운 무조건부 Guard·Jet·PDE 소거는 0개다. 원본 g에 대한 새로운 비영 PDE 반례도 얻지 않았다.
