# 정리 4.6 범위·감사기 검토와 실제 음성 대조 보존

**25개 원시 파일 / 455,419 bytes를 변경 없이 보존했고, 보존 검증은 302/302 `PRESERVATION_PASS`다. `N106Completed=false`이며 원래 69/1 판정과 모든 기존 verdict를 바꾸지 않았다.**

| 보존 원본 폴더 | 파일 수 | 원래 기록의 정확한 범위 |
| --- | ---: | --- |
| [theorem46-scope-review](raw/theorem46-scope-review/THEOREM46_SCOPE_REVIEW.md) | 4 | 428/428 기존 소스·판정 연결 검토. 정리 4.6(i)–(vi)의 동일 최종 프로파일 증거를 연결하며 새 kernel/Comparator 실행은 0이다. |
| [independent-terminal-auditor-review](raw/independent-terminal-auditor-review/reviewer-receipt-0001.json) | 4 | 74/74 감사기 소스·실제 입력 결속 검토. 실제 최종 Comparator artifact의 PASS가 아니다. |
| [negative-controls-0001](raw/terminal-auditor-negative-controls-0001/receipt.json) | 9 | 실제 취소 ZIP과 실제 성공 진단 ZIP을 구버전 감사기에 넣어 각각 exit 1 / `FAIL_OR_INCOMPLETE`로 거부한 기록. |
| [negative-controls-0002](raw/terminal-auditor-negative-controls-0002/receipt.json) | 8 | 35단계 순서·unit 위치를 보강한 최종 감사기도 같은 실제 비수용 입력 둘을 exit 1로 거부한 기록. |

음성 대조 영수증의 PASS는 **거부되어야 할 입력을 실제로 거부했다**는 의미다. 내부 artifact 감사는 모두 `FAIL_OR_INCOMPLETE`, `N106Completed=false`다. 첫 버전의 취소/진단 감사 수치는 109/174, 32/114이고, 최종 버전은 109/175, 32/115다. 이번 보존 작업에서는 이 감사나 대조를 재실행하지 않았다.

정리 4.6 범위 지도는 원래 leading-profile 수용 범위를 설명한다. 향후 실제 모든 필수 결과가 충족되면 새 판정에서 사용할 조건부 권고와 현재 판정을 구별한다. 기존 `fullOriginalTheorem46CertificationFlag=false`, `entireNewProfileLeanFormalized=false`를 이 보존 작업이나 원래 범위 검토가 변경하지 않았다.

## 경로와 사후 복원 출처

[source-mapping.json](source-mapping.json)은 121개 참조를 기록한다. 이 중 **118개는 저장소 내 상대 경로**로 기존 수학 자료·감사기 입력·원래 old/diagnostic 보존 패킷에 연결된다. 원본 ZIP을 중복 복사하지 않는다. **사용자 제공 PDF 3개는 원래 절대 경로·bytes·SHA만 보존하고 문서 원문을 추가 복사·공개하지 않았다.** 원래 source map/영수증의 PDF 참조 문자열도 바꾸지 않았다.

같은 절대 감사기 경로가 서로 다른 시점의 SHA를 가리킬 수 있어 경로와 SHA를 함께 식별자로 사용한다. 구버전 `83dcdd…`의 바이트는 원래 검토자가 보강 패치의 정확한 역변환으로 사후 복원했고, 실제 이전 실행에 기록된 SHA와 같다는 원시 설명을 그대로 남겼다. 이를 실행 전 채취한 스냅샷으로 표현하지 않는다. 최종 버전 SHA는 `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`다.

```sh
python -B verify_preserved_reviews.py
```

검증은 전체 저장소 안의 상대 경로를 사용하므로 원래 scratch 절대 경로 없이 재현된다. 외부 사용자 PDF는 읽지 않는다. 기존 reviewer/producer/auditor를 import하거나 실행하지 않고 원시 바이트·기록·참조만 검사한다. 새 영수증은 `--output`에 이 폴더 안의 새 이름을 지정한다. [preservation-receipt.json](preservation-receipt.json)의 302개는 보존 검사 수이며 새로운 수학 증명이나 N1-06 완료 수치가 아니다.
