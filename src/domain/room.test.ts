import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  roomPeerId,
} from "@/domain/room";

describe("room codes", () => {
  it("normalizes manually entered codes", () => {
    assert.equal(normalizeRoomCode("  kqzpt "), "KQZPT");
    assert.equal(isValidRoomCode("  kqzpt "), true);
  });

  it("accepts only five letters", () => {
    assert.equal(isValidRoomCode("KQZPT"), true);
    assert.equal(isValidRoomCode("KQZP"), false);
    assert.equal(isValidRoomCode("KQZP1"), false);
    assert.equal(isValidRoomCode("KQZPTU"), false);
  });

  it("derives the deterministic PeerJS identifier", () => {
    assert.equal(roomPeerId("kqzpt"), "cagette-KQZPT");
    assert.throws(() => roomPeerId("bad"), /five letters/);
  });

  it("can generate a reproducible five-letter code", () => {
    const values = [0, 0.04, 0.08, 0.12, 0.16];
    let index = 0;

    assert.equal(
      createRoomCode(() => values[index++]),
      "ABCDE"
    );
  });
});
