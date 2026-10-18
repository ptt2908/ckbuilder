# Week 8 Research — DOB Studio / Decoder Explorer

**Status:** Research completed; DOB/0 library test passed on host; RISC-V execution in CKB VM remains unresolved  
**Scope:** Understand DOB/0 inputs, metadata, decoder flow, and a minimal safe validation plan before building a demo  
**Decision status:** Research candidate only; no capstone selected

---

## 1. Research question

Can we build a small DOB Studio that helps a creator define a DOB/0 Cluster pattern, preview how sample DNA becomes traits, and inspect the decoder configuration before minting? Could that extend the Spore Badge work already present in the CKBuilder reference repository?

This note records protocol research and a proposed experiment. It does **not** claim that we have run the decoder or sent a transaction.

## 2. What a DOB is

The current Spore documentation expands DOB as **Digital Object**. The DOB protocol family is built on Spore and gives a shared interpretation model for digital assets:

- **DNA** is data specific to an individual DOB and is supplied when the Spore is minted.
- **Pattern** describes how to interpret the DNA and is shared by a set of DOBs through their Cluster.
- **Decoder** interprets the DNA using that Pattern. Its configuration is specified by the Cluster.

In short: **DNA + Pattern + Decoder → traits**, with later rendering able to turn structured output into an image. DOB is therefore not itself a rendering server or a Spore contract. It is a protocol convention layered on Spore, with interpretation tools around it.

The reference Week 8 report calls DOB “Digital On-chain Bitmap.” The current official Spore docs say “Digital Object”; this report follows the official terminology.

## 3. DOB/0 data model

A DOB/0 Cluster stores a UTF-8 JSON description. The relevant metadata contains a version, a decoder locator, and a pattern. A Spore DOB points to that Cluster and uses the content type `dob/0`.

Conceptually, the records look like this:

```json
{
  "description": "Example collection",
  "dob": {
    "ver": 0,
    "decoder": {
      "type": "code_hash",
      "hash": "..."
    },
    "pattern": [
      ["BackgroundColor", "String", 0, 1, "options", ["red", "blue"]],
      ["Level", "Number", 1, 1, "range", [1, 10]],
      ["Seed", "Number", 2, 2, "raw"]
    ]
  }
}
```

```json
{
  "contentType": "dob/0",
  "content": { "dna": "..." },
  "clusterId": "..."
}
```

The exact serialized Spore content is bytes; the JSON above is a readable representation. The official examples encode the JSON as UTF-8 bytes.

### Pattern fields

The universal DOB/0 pattern is a JSON array. Each entry describes:

`[name, type, offset, len, pattern, args]`

- `name`: trait name.
- `type`: output type, such as `String` or `Number`.
- `offset` and `len`: the DNA segment to interpret.
- `pattern`: interpretation rule.
- `args`: optional rule parameters.

The official DOB/0 documentation describes these rules:

- `options`: select a value from a configured list.
- `range`: numeric output within the configured range; the documented interval is `[min, max)`.
- `raw` with `Number`: parse the DNA segment as an unsigned little-endian number.
- `raw` with `String`: return the DNA segment as prefixed hex.
- `utf8`: interpret a segment as UTF-8 text, ignoring trailing zero bytes.

Offsets and lengths refer to DNA bytes, not characters in the displayed hex string. Segments extending beyond DNA length are trimmed by the protocol description. A useful demo should make this byte-versus-hex distinction visible because it is an easy source of mistakes.

## 4. Decode flow and trust boundaries

The basic flow is:

1. The creator defines a Cluster description containing the DOB/0 version, decoder locator, and pattern.
2. The creator mints a Spore whose content type is `dob/0`, whose content contains DNA, and whose `cluster_id` points to that Cluster.
3. A decoder receives the DNA bytes and Pattern bytes and returns structured trait output.
4. A DOB rendering layer may consume that output to construct a visual representation.

A decoder may be located by a `code_hash` or a `type_id` under the current DOB/0 specification. The standalone server documentation describes fetching/caching decoder binaries and executing them in an embedded `ckb-vm`. This makes the execution environment more consistent than running arbitrary native decoder code. It does not by itself mean that every front end or server displays an independently verified result: the application still needs to identify the Cluster metadata and decoder it used, and users need a way to inspect that provenance.

The first demo should stop at JSON traits. Adding SVG/image rendering introduces additional parsing, image-fetching, and presentation behavior that is not needed to validate the core DOB/0 interpretation.

## 5. A reproducible reference example

The upstream `spore-dob-0` repository documents a command-line example using:

- DNA: `ac7b88`
- Pattern:
  - Name: options list
  - Age: range 0–100
  - Score: raw number

The upstream README shows the expected traits as Ethan, 23, and 136. These are **upstream's published example output**, not a result we have reproduced locally. Our experiment must run the sample independently and record the actual command, tool versions, output, and any mismatch.

The Spore Cookbook also contains a fuller example that creates a Cluster with a pattern and mints a `dob/0` Spore. That example sends transactions; we will use it to understand the shape of the SDK calls, not as the first demo step.

## 6. Product idea: DOB Studio / Decoder Explorer

### User problem

A creator must keep DNA layout, Cluster pattern, decoder version, and decoder locator consistent. If these do not line up, the displayed traits may be wrong or decoding may fail. Current SDK examples demonstrate the protocol, but a beginner still has to reason about byte offsets and decoder configuration.

### Proposed small tool

A browser-based authoring and inspection tool could:

1. Let a user edit a DOB/0 pattern and enter sample DNA.
2. Validate the pattern structure and show offsets against the DNA bytes.
3. Run the selected DOB/0 decoder and display the returned traits.
4. Show which decoder and Cluster metadata were used.
5. In a later milestone, load an existing Spore/Cluster by ID and compare its stored configuration with the rendered traits.

The first usable version should be a **preview and learning tool**, not a credential issuer. It should not claim credential authenticity or revocation guarantees merely because a Spore is on-chain.

### Fit with our work

The CKBuilder reference repo already has a Spore Badge Platform with wallet connection, mint, gallery, and melt flows. Those are useful references for eventual integration, but the existing Week 6 app does not appear to provide DOB/0 pattern authoring or decoder inspection. The distinct contribution would be the interpretation and preview layer, not another generic badge/credential minting flow.

Potential reuse:

- Spore mint/gallery UI concepts and existing SDK usage.
- Wallet and Testnet setup, only after the local decoding spike works.
- The current Week 8 research folder and its source-tracking approach.

New work likely required:

- DOB/0 pattern editor and validation.
- A decoder execution path or integration with the official decoder service.
- Clear display of DNA bytes, byte offsets, decoded traits, and decoder provenance.
- Handling invalid DNA, malformed patterns, missing decoder binaries, and unsupported versions.

## 7. Risks and open questions

1. **Decoder provenance:** how will the UI show that the configured decoder hash matches the binary actually used?
2. **Pattern validation:** which errors can be checked before invoking the decoder, and which are decoder-specific?
3. **Rendering scope:** should an MVP stop at traits, or is visual rendering necessary for a convincing user demo?
4. **Version compatibility:** the first spike should target DOB/0 only. DOB/1 has a different processing/rendering purpose and should not be silently treated as equivalent.
5. **Execution safety:** keep decoder execution in the intended VM/sandbox path; do not execute fetched binaries as native programs.
6. **On-chain actions:** creating a Cluster or Spore is a separate step involving a signed transaction. The research and first decode experiment do not require a wallet or an on-chain transaction.

## 8. Proposed demo sequence

### Phase A — raw decoder check (no wallet, no transaction)

- Use the fixed DNA and pattern from the upstream DOB/0 decoder example.
- Run the published RISC-V decoder through its documented `ckb-vm-runner` path, or use the official standalone server's raw-input interface if its current interface is verified first.
- Record OS/runtime/tool versions, exact input, exact output, errors, and whether the upstream expected output is reproduced.

### Phase B — small DOB Studio proof

- Provide editable DNA and pattern fields.
- Display the DNA as bytes and visually mark each pattern segment.
- Invoke the decoder and render traits as JSON/table.
- Add malformed pattern and short-DNA cases to understand failure behavior.

### Phase C — optional Testnet integration

Only after Phases A and B are understood, decide whether to query an existing DOB or mint a test Cluster/Spore. Do not sign or broadcast a transaction as part of the raw decoder spike.

## 9. Local experiment

### Environment

- Folder: `D:/CKB_prj/ckbuilder/week-08/dob0-decoder-demo/`
- OS/toolchain: Windows; Rust 1.98.1 and Cargo 1.98.1
- Sources cloned for the experiment: official `spore-dob-0` decoder and `nervosnetwork/ckb-vm`
- No wallet was connected and no CKB transaction was created or broadcast.

### Host-side DOB/0 library check

Command: `cargo test --lib -- --nocapture` in the cloned `spore-dob-0` directory.

Result: **1 test passed, 0 failed.** This executes the decoder library logic as a host unit test. It does **not** prove that the RISC-V binary runs successfully inside CKB VM.

Observed output:

```json
[
  {"name":"Name","traits":[{"String":"Ethan"}]},
  {"name":"Age","traits":[{"Number":23}]},
  {"name":"Score","traits":[{"Number":136}]},
  {"name":"DNA","traits":[{"String":"aabbcc"}]},
  {"name":"URL","traits":[{"String":"http://127.0.0.1:8090"}]},
  {"name":"Value","traits":[{"Timestamp":13417386}]}
]
```

The test uses DNA `ac7b88aabbcc687474703a2f2f3132372e302e302e313a383039300000` and the pattern printed by the upstream test. The first three values match the repository's documented small example. The additional values confirm byte offsets, little-endian numeric interpretation, raw hex strings, and UTF-8 decoding in this test case.

### CKB VM execution status

The separate RISC-V-in-VM run is **not yet successful**:

- The decoder source needed a one-line local compatibility cast in `src/main.rs` for the current Rust compiler's `CStr::from_ptr` pointer type. This change is only in the isolated clone.
- The current VM runner's default mode requires the `asm` feature. Building that feature stopped because no Clang compiler is installed.
- Running the guest in interpreter mode stopped on invalid instruction `0x44A6252F`. The guest was built for `riscv64imac`; the runner configuration enables IMC/B/MOP. The instruction appears to require an extension not enabled by that runner configuration.
- Rebuilding without the RISC-V A feature also failed because the decoder's `spinning_top` dependency uses atomic compare-exchange.

This looks like a toolchain/ISA compatibility issue between the current decoder source/build target and the VM runner setup, not a failed DOB pattern test. This is an observed limitation; the exact compatibility fix still needs confirmation.

## 10. Current conclusion

DOB Studio remains a strong Week 8 research candidate: the protocol model and DOB/0 interpretation are clear, and the repository's host-side library test independently reproduced the expected trait mapping. The proposed product still has a useful narrow scope: make DNA bytes, pattern segments, decoded traits, and decoder provenance visible together.

We have a reproducible host-side decode result, but not yet a verified CKB VM run. Before a Testnet integration, the next technical step is to resolve the RISC-V/VM compatibility or use the official standalone decoder server in its supported embedded-VM configuration. The capstone decision should wait until that execution path and the preview experience are validated.

## Sources

### Primary protocol and implementation references

- [Spore Docs — DOB Protocol Family](https://docs.spore.pro/dob/Introduction)
- [Spore Docs — DOB/0 Protocol](https://docs.spore.pro/dob/dob0-protocol)
- [Spore DOB Cookbook — basic loot example](https://github.com/sporeprotocol/dob-cookbook/blob/main/examples/dob0/0.basic-loot.ts)
- [Spore Protocol — DOB/0 decoder interface and example output](https://github.com/sporeprotocol/spore-dob-0)
- [Spore Protocol — standalone DOB decoder server](https://github.com/sporeprotocol/dob-decoder-standalone-server)
- [CKB CCC docs — Spore Protocol guide](https://github.com/ckb-devrel/ccc/blob/master/packages/docs/content/docs/guides/spore-protocol.mdx)


