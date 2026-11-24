"""Check the actual exported indexed call roots on top of the field-body equality."""

from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json

from verify_live_repeat_form import PREFIX, checked


SLOTS = [17732748, 17732749, 17732750, 17732737, 17745430, 17745431, 17732752]
LIVE_RECEIPT_PIN = "ca3de67021672f2570381efdaae09b66052a7f00cc61836b81ed5bdb7bdc8ea7"


def assert_call(row, field, slots):
    assert row == {"op":"m3_coupled_indexed_partial","args":[field,slots,[0]*6]}


def run():
    cli = ArgumentParser(description=__doc__)
    cli.add_argument("--live", required=True, type=Path)
    cli.add_argument("--offline", required=True, type=Path)
    cli.add_argument("--field-equivalence", required=True, type=Path)
    cli.add_argument("--out", required=True, type=Path)
    opt = cli.parse_args()
    receipt = opt.field_equivalence.read_bytes()
    assert sha256(receipt).hexdigest() == LIVE_RECEIPT_PIN
    lv = json.loads(receipt)["liveIndexedRoots"]
    od = json.loads((opt.offline / "offline-replay1-offline-report.json").read_bytes())["roots"]
    live = [json.loads(line) for line in checked(opt.live / "active-repeat-indexed-append.jsonl","live").splitlines()]
    offline = [json.loads(line) for line in checked(opt.offline / "offline-replay1-offline-append.jsonl","offline").splitlines()]
    roots = []
    for l,o in zip(lv,od,strict=True):
        assert l["field"] == o["id"]
        live_root, offline_root = l["root"], o["root"]
        assert_call(live[live_root-PREFIX],l["field"],SLOTS)
        assert_call(offline[offline_root-PREFIX],o["id"],SLOTS)
        roots.append({"field":l["field"],"name":o["name"],"live":live_root,"offline":offline_root})
    bad_slots = SLOTS.copy()
    bad_slots[:2] = bad_slots[1],bad_slots[0]
    try:
        assert_call(live[lv[0]["root"]-PREFIX], lv[0]["field"],bad_slots)
    except AssertionError:
        bad_order_detected = True
    else:
        raise AssertionError("interchanged physical arguments passed")
    out={"status":"VERIFIED_INDEXED_CALL_BINDING","fieldBodyReceiptSHA256":LIVE_RECEIPT_PIN,
         "pairs":roots,"actualSlots":SLOTS,"derivativeOrder":[0]*6,
         "negativeControl":"Rejects swapped first and second actual slots",
         "badOrderDetected":bad_order_detected}
    opt.out.write_text(json.dumps(out,indent=2)+"\n",encoding="utf-8")


if __name__ == "__main__":
    run()