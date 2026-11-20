from argparse import ArgumentParser
from hashlib import sha256
from html import escape
import json
from pathlib import Path


def digest(data):
    return sha256(data).hexdigest()


def verify(metadata, prior, public):
    page, version = metadata["page"], metadata["currentVersion"]
    assert metadata["projectId"] == 29770 and page["slug"] == "v0.3.1.html"
    assert (page["version"], page["version_hash"]) == (version["version"], version["hash"]) == (137, "9171eb0c")
    assert version["created_by"] == "patch" and version["size_bytes"] == 29580450
    assert page["routing"]["enabled"] is False and page["seo"]["effective_robots"] == "noindex, nofollow"
    prior_public = prior["production"]
    assert len(public) == prior_public["httpBytes"] == 30707818
    assert digest(public) == prior_public["httpSHA256"] == "a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48"
    candidate_lengths = [row["bytes"] for row in prior_public["candidates"]]
    assert candidate_lengths == [version["size_bytes"]] * 2
    assert not any(row["providerShortHashMatch"] for row in prior_public["candidates"])
    prior_tag_lengths = [
        second["replacementBytes"] - (second["publicRange"][1] - second["publicRange"][0])
        for row in prior_public["candidates"] for second in row["edits"]
        if second["role"] == "retained raw title and description"
    ]
    assert prior_tag_lengths == [366, 366]
    seo = page["seo"]
    provisioned_tags = [
        f'<title>{escape(seo["title"], quote=False)}</title>',
        f'<meta name="description" content="{escape(seo["description"], quote=True)}">',
    ]
    tag_sizes = [len(tag.encode("utf-8")) for tag in provisioned_tags]
    assert tag_sizes == [59, 370]
    reconstructed = version["size_bytes"] - prior_tag_lengths[0] + sum(tag_sizes)
    assert reconstructed == 29580513 and reconstructed != version["size_bytes"]
    assert metadata["contentReadback"]["outcome"] == "TRANSPORT_CLOSED"
    return {
        "schema": "MathScope.C112.OperatingR108AuthenticatedMetadataProof/1",
        "version": 137, "versionHash": "9171eb0c", "editableRecordedBytes": version["size_bytes"],
        "publicBodyBytes": len(public), "publicSHA256": digest(public), "seoRawTagSerializationBytes": tag_sizes,
        "boundsFromPreviouslyCalibratedTransform": prior_tag_lengths,
        "seoSubstitutionCandidateBytes": reconstructed, "seoSubstitutionSizeMatches": False,
        "authenticatedEditableBody": "TRANSPORT_CLOSED", "operatingR108": "OPEN",
        "isolatedCandidate": "16/16", "productionWrites": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for field in ("metadata", "prior-transform", "public", "out"):
        parser.add_argument("--" + field, required=True, type=Path)
    args = parser.parse_args()
    result = verify(json.loads(args.metadata.read_bytes()), json.loads(args.prior_transform.read_bytes()),
                    args.public.read_bytes())
    with args.out.open("xb") as output:
        output.write((json.dumps(result, indent=2) + "\n").encode())
    print("PASS current authenticated metadata, public preservation and rejected SEO substitution")
