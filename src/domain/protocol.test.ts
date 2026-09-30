import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isClientMessage, isServerMessage } from "@/domain/protocol";

describe("multiplayer protocol", () => {
  it("accepts versioned client messages from the documented protocol", () => {
    assert.equal(
      isClientMessage({
        type: "verify",
        version: 1,
        secret: "not_logged_in",
        playerName: "Alice",
        rejoinCode: null,
        tz: "Europe/Paris",
      }),
      true
    );
    assert.equal(
      isClientMessage({
        type: "place",
        version: 1,
        roundNumber: 1,
        coordinates: { lat: 48.8566, lng: 2.3522 },
        final: true,
      }),
      true
    );
  });

  it("rejects unknown, malformed, or unsupported messages", () => {
    assert.equal(isClientMessage({ type: "unknown", version: 1 }), false);
    assert.equal(isClientMessage({ type: "leaveGame", version: 2 }), false);
    assert.equal(
      isClientMessage({
        type: "place",
        version: 1,
        roundNumber: 0,
        coordinates: { lat: "48.8566", lng: 2.3522 },
        final: true,
      }),
      false
    );
  });

  it("recognizes server errors without throwing on arbitrary data", () => {
    assert.equal(
      isServerMessage({
        type: "gameJoinError",
        version: 1,
        message: "Room not found",
      }),
      true
    );
    assert.equal(isServerMessage(null), false);
    assert.equal(isServerMessage({ type: "game", version: 1 }), false);
  });
});
