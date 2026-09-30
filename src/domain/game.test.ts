import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_POINTS_PER_ROUND,
  MAX_SCORE_DISTANCE_KM,
  pointsForDistance,
  scoreForGuess,
} from "@/domain/game";

describe("scoreForGuess", () => {
  it("awards the maximum score for an exact position", () => {
    const result = scoreForGuess(
      { lat: 43.6, lng: 1.44 },
      { lat: 43.6, lng: 1.44 }
    );

    assert.equal(result.points, MAX_POINTS_PER_ROUND);
    assert.equal(result.distanceKm, 0);
  });

  it("returns zero at and beyond the maximum scoring distance", () => {
    assert.equal(pointsForDistance(MAX_SCORE_DISTANCE_KM), 0);
    assert.equal(pointsForDistance(MAX_SCORE_DISTANCE_KM + 1), 0);
  });

  it("keeps the score proportional to the distance across France", () => {
    assert.equal(pointsForDistance(MAX_SCORE_DISTANCE_KM / 2), 2500);
  });

  it("returns no points when a player has not submitted a guess", () => {
    assert.deepEqual(scoreForGuess({ lat: 43.6, lng: 1.44 }, null), {
      distanceKm: 0,
      points: 0,
    });
  });
});
