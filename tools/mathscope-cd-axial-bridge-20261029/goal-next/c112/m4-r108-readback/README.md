# Operating R1-08 metadata readback

The authenticated page index and version ledger agree that the operating release is version 137, short hash 9171eb0c, and the stored page body has 29,580,450 bytes. The public snapshot retains the preceding 30,707,818-byte digest. Both reads concern the current operating page. The connector returned SEO and routing metadata through the index. A separate index read requesting content and limited to that single slug ended with “Transport closed”. No operating write occurred.

The SEO fields are useful distinct evidence, since the public transform previously removed raw title and description tags. Serializing the provider SEO fields as those legacy tags would add 429 bytes, against the 366-byte insertion admitted by the calibrated same-length inverse. It would create a 29,580,513-byte candidate, outside the version ledger's recorded size. The stored SEO fields do not recover the stripped editable text through this direct substitution. The earlier exact round-trip ambiguity and operating R1-08 remain open. The isolated candidate remains 16/16. RELEASE HOLD.

Replay with the frozen metadata, committed C87 provider transform receipt and the read-only public snapshot.

~~~text
python -B verify_authenticated_metadata.py --metadata authenticated-metadata.json --prior-transform PROVIDER_TRANSFORM --public PUBLIC_COPY --out FRESH_OUTPUT.json
~~~
