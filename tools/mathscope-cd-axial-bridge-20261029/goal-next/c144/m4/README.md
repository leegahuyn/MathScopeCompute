# M4 R1-08 운영본 읽기 전용 검증

**VERIFIED · 운영 v137의 Natural 모듈과 부모 실행 두 개.** WebsitePublisher 프로젝트 29770의 이력이 현행 운영판을 v137/9171eb0c, 저장본 29,580,450바이트로 표시한다. 작업 #17의 기록 #30432도 같은 판과 Git 커밋 093db151718a, 세 실행 해시를 연결한다. 공개 응답 30,707,818바이트 안에서 새 Natural 모듈의 연속 구간은 [30,241,389, 30,542,047)이다. 300,658바이트는 공식 이력의 v136→v137 저장 크기 차이와 같다. 정확한 Git 조각을 네 인자로 렌더링한 HTML 및 런타임 JavaScript가 해당 구간과 바이트 단위로 일치한다. 세 데이터 파일의 SHA-256과 정규화 실행 해시, Natural→Brho·pressure 및 Brho→pressure 참조를 독립적으로 재계산했다. Git Python 생산 코드와 작성 증명의 SHA-256도 Natural 데이터가 선언한 값과 일치한다. [운영 Natural 패널](https://project29770.websitepublisher.ai/v0.3.1.html#m3-natural) · [연결 Git 커밋](https://github.com/leegahuyn/MathScopeCompute/commit/093db151718a206b14b5c4f878a52957626f0ea7)

**VERIFIED · 브라우저 실행 관찰.** 실제 운영 페이지에서 열린 패널이 같은 Natural 실행 해시로 verified를 보고했고, 축 평가 33행을 렌더링했으며, 실행 JSON·그림 PNG·보기 링크 버튼을 활성화했다. 상태 행에 RELEASE HOLD가 표시됐다. 버튼 상태를 읽었고 클릭이나 공개 변경은 없었다. 33행은 각각 η=0에서 source call template을 평가한 결과다. Phi와 u의 검증 샘플 격자는 각각 17×74와 17×65이고, 범위와 미검증 항목이 데이터 및 공개 패널에 명시돼 있다. [운영 Natural 패널](https://project29770.websitepublisher.ai/v0.3.1.html#m3-natural)

**CONDITIONAL · 공개 모듈 역적용.** 위 연속 구간을 삭제한 공개 응답 후보 30,407,160바이트에 그 구간을 원위치하면 v137 공개 응답을 정확히 복원한다. 이 후보와 공식 v136의 전체 바이트를 비교할 수 있는 자료는 확보하지 못했다. WebsitePublisher 작업 이력은 연결 메모를 반환했고 편집 원문은 제공하지 않았다. 공개 응답과 공식 저장 크기에는 1,127,368바이트 차이가 있다. 이 차이를 없앤 편집 원문을 재현했다고 가정하지 않았다.

**OPEN · 운영 M4 R1-08.** 확인한 코드는 실제 natural 해의 샘플을 표시하며, 최종 A–D 물리장과 전역 native 호출 범위를 미인증으로 표시한다. R1-08 운영 대상의 전체 편집 원문과 독립 인수시험은 여전히 필요하다. 별도 비공개 후보 16/16과 구별되는 v137 공식 판정은 M3 62/64, 운영 M4 0/16, Y 33/523, 최종 제트 0/67, RELEASE HOLD다.

공개 응답을 인자로 넣어 재실행한다.

    node verify_operating_v137_delta.cjs path/to/production-public.html

입력은 상위 C143 증거의 production-public.html 또는 같은 SHA-256으로 확인한 공개 응답이다. 이 디렉터리의 네 원본 파일은 Git blob에서 그대로 읽은 바이트다. 각 파일의 blob SHA-1과 SHA-256은 재현 로그에 기록했다. 브라우저·이력 JSON은 읽기 전용 관측 기록이다. 스크립트는 이 관측 기록과 정적 입력을 대조한다.
