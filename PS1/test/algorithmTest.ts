import assert from "assert";
import { AnswerDifficulty, Flashcard, BucketMap } from "../src/flashcards";
import {
  toBucketSets,
  getBucketRange,
  practice,
  update,
  getHint,
  computeProgress,
} from "../src/algorithm";

/*
 * Testing strategy for toBucketSets():
 * - Partition on input size: empty map, single bucket, multiple buckets
 * - Partition on bucket numbers: consecutive, non-consecutive
 * - Partition on bucket contents: empty sets, non-empty sets
 * - Partition on order: buckets in order, out of order
 */
describe("toBucketSets()", () => {
  it("should handle empty map", () => {
    const buckets = new Map<number, Set<Flashcard>>();
    const result = toBucketSets(buckets);
    assert.deepStrictEqual(result, []);
  });

  it("should handle single bucket with cards", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const bucket = new Set([card1, card2]);
    const buckets = new Map([[0, bucket]]);
    const result = toBucketSets(buckets);
    assert.deepStrictEqual(result, [bucket]);
  });

  it("should handle multiple buckets with gaps", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const bucket0 = new Set([card1]);
    const bucket2 = new Set([card2]);
    const buckets = new Map([
      [0, bucket0],
      [2, bucket2],
    ]);
    const result = toBucketSets(buckets);
    assert.deepStrictEqual(result, [bucket0, new Set(), bucket2]);
  });

  it("should handle buckets out of order", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const bucket1 = new Set([card1]);
    const bucket0 = new Set([card2]);
    const buckets = new Map([
      [1, bucket1],
      [0, bucket0],
    ]);
    const result = toBucketSets(buckets);
    assert.deepStrictEqual(result, [bucket0, bucket1]);
  });
});

/*
 * Testing strategy for getBucketRange():
 * - Partition on input size: empty array, single bucket, multiple buckets
 * - Partition on bucket contents: all empty, some empty, none empty
 * - Partition on range: single bucket, consecutive buckets, non-consecutive buckets
 * - Partition on position: range at start, middle, or end of array
 */
describe("getBucketRange()", () => {
  it("should return undefined for empty array", () => {
    const buckets: Array<Set<Flashcard>> = [];
    const result = getBucketRange(buckets);
    assert.strictEqual(result, undefined);
  });

  it("should return undefined for all empty buckets", () => {
    const buckets = [new Set<Flashcard>(), new Set<Flashcard>(), new Set<Flashcard>()];
    const result = getBucketRange(buckets);
    assert.strictEqual(result, undefined);
  });

  it("should handle single non-empty bucket", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = [new Set<Flashcard>(), new Set([card]), new Set<Flashcard>()];
    const result = getBucketRange(buckets);
    assert.deepStrictEqual(result, { minBucket: 1, maxBucket: 1 });
  });

  it("should handle multiple non-empty buckets", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = [
      new Set<Flashcard>(),
      new Set([card1]),
      new Set<Flashcard>(),
      new Set([card2]),
    ];
    const result = getBucketRange(buckets);
    assert.deepStrictEqual(result, { minBucket: 1, maxBucket: 3 });
  });

  it("should handle non-consecutive non-empty buckets", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = [
      new Set([card1]),
      new Set<Flashcard>(),
      new Set<Flashcard>(),
      new Set([card2]),
    ];
    const result = getBucketRange(buckets);
    assert.deepStrictEqual(result, { minBucket: 0, maxBucket: 3 });
  });
});

/*
 * Testing strategy for practice():
 * - Partition on day number: day 0, day 1, day > 1
 * - Partition on bucket contents: empty buckets, some buckets with cards
 * - Partition on bucket numbers: practice buckets exist, don't exist
 * - Partition on card distribution: cards in one bucket, multiple buckets
 */
describe("practice()", () => {
  it("should return empty set for empty buckets", () => {
    const buckets: Array<Set<Flashcard>> = [];
    const result = practice(buckets, 0);
    assert.deepStrictEqual(result, new Set<Flashcard>());
  });

  it("should return cards from bucket 0 on day 0", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = [new Set([card1, card2]), new Set<Flashcard>()];
    const result = practice(buckets, 0);
    assert.deepStrictEqual(result, new Set([card1, card2]));
  });

  it("should return cards from bucket 1 on day 1", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = [new Set<Flashcard>(), new Set([card1, card2])];
    const result = practice(buckets, 1);
    assert.deepStrictEqual(result, new Set([card1, card2]));
  });

  it("should return cards from multiple practice buckets", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const card3 = new Flashcard("Q3", "A3", "H3", []);
    const buckets = [
      new Set<Flashcard>(),
      new Set([card1]),
      new Set<Flashcard>(),
      new Set([card2, card3]),
    ];
    const result = practice(buckets, 3);
    assert.deepStrictEqual(result, new Set([card2, card3]));
  });

  it("should handle day number larger than bucket count", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = [new Set([card1]), new Set([card2])];
    const result = practice(buckets, 5);
    assert.deepStrictEqual(result, new Set<Flashcard>());
  });
});

/*
 * Testing strategy for update():
 * - Partition on difficulty: Wrong, Hard, Easy
 * - Partition on current bucket: bucket 0, bucket > 0
 * - Partition on card presence: card exists in buckets, card doesn't exist
 * - Partition on bucket transitions: move up, move down, stay same
 */
describe("update()", () => {
  it("should move card to bucket 0 on wrong answer", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>()],
      [1, new Set([card])],
    ]);
    const result = update(buckets, card, AnswerDifficulty.Wrong);
    assert.deepStrictEqual(result.get(0), new Set([card]));
    assert.deepStrictEqual(result.get(1), new Set<Flashcard>());
  });

  it("should move card up one bucket on easy answer", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>()],
      [1, new Set([card])],
    ]);
    const result = update(buckets, card, AnswerDifficulty.Easy);
    assert.deepStrictEqual(result.get(1), new Set<Flashcard>());
    assert.deepStrictEqual(result.get(2), new Set([card]));
  });

  it("should keep card in same bucket on hard answer", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>()],
      [1, new Set([card])],
    ]);
    const result = update(buckets, card, AnswerDifficulty.Hard);
    assert.deepStrictEqual(result.get(1), new Set([card]));
  });

  it("should handle card not in any bucket", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>()],
      [1, new Set<Flashcard>()],
    ]);
    const result = update(buckets, card, AnswerDifficulty.Easy);
    assert.deepStrictEqual(result.get(0), new Set([card]));
  });

  it("should handle multiple cards in buckets", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>()],
      [1, new Set([card1, card2])],
    ]);
    const result = update(buckets, card1, AnswerDifficulty.Easy);
    assert.deepStrictEqual(result.get(1), new Set([card2]));
    assert.deepStrictEqual(result.get(2), new Set([card1]));
  });
});

/*
 * Testing strategy for getHint():
 * - Partition on hint length: empty, short, long
 * - Partition on hint content: contains special characters, contains spaces
 * - Partition on hint position: at start, middle, end of answer
 * - Partition on answer length: shorter than hint, longer than hint
 */
describe("getHint()", () => {
  it("should return empty string for empty hint", () => {
    const card = new Flashcard("Q", "A", "", []);
    const result = getHint(card);
    assert.strictEqual(result, "");
  });

  it("should return first character of answer for short hint", () => {
    const card = new Flashcard("Q", "Answer", "H", []);
    const result = getHint(card);
    assert.strictEqual(result, "A");
  });

  it("should handle hint with special characters", () => {
    const card = new Flashcard("Q", "A!@#$%", "H", []);
    const result = getHint(card);
    assert.strictEqual(result, "A");
  });

  it("should handle hint with spaces", () => {
    const card = new Flashcard("Q", "A B C", "H", []);
    const result = getHint(card);
    assert.strictEqual(result, "A");
  });

  it("should handle long answer", () => {
    const card = new Flashcard("Q", "This is a very long answer", "H", []);
    const result = getHint(card);
    assert.strictEqual(result, "T");
  });
});

/*
 * Testing strategy for computeProgress():
 * - Partition on bucket contents: empty, some cards, all cards
 * - Partition on history: empty, some entries, many entries
 * - Partition on difficulty distribution: all wrong, all hard, all easy, mixed
 * - Partition on time: recent history, old history
 */
describe("computeProgress()", () => {
  it("should handle empty buckets and history", () => {
    const buckets = new Map<number, Set<Flashcard>>();
    const history: Array<{card: Flashcard; difficulty: AnswerDifficulty; timestamp: number}> = [];
    const result = computeProgress(buckets, history);
    assert.deepStrictEqual(result, {
      totalCards: 0,
      masteredCards: 0,
      strugglingCards: 0,
      averageBucket: 0,
    });
  });

  it("should calculate progress with some cards", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const card3 = new Flashcard("Q3", "A3", "H3", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set([card1])],
      [1, new Set([card2])],
      [2, new Set([card3])],
    ]);
    const history = [
      { card: card1, difficulty: AnswerDifficulty.Wrong, timestamp: Date.now() },
      { card: card2, difficulty: AnswerDifficulty.Hard, timestamp: Date.now() },
      { card: card3, difficulty: AnswerDifficulty.Easy, timestamp: Date.now() },
    ];
    const result = computeProgress(buckets, history);
    assert.deepStrictEqual(result, {
      totalCards: 3,
      masteredCards: 1,
      strugglingCards: 1,
      averageBucket: 1,
    });
  });

  it("should handle cards with no history", () => {
    const card1 = new Flashcard("Q1", "A1", "H1", []);
    const card2 = new Flashcard("Q2", "A2", "H2", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set([card1])],
      [1, new Set([card2])],
    ]);
    const history: Array<{card: Flashcard; difficulty: AnswerDifficulty; timestamp: number}> = [];
    const result = computeProgress(buckets, history);
    assert.deepStrictEqual(result, {
      totalCards: 2,
      masteredCards: 0,
      strugglingCards: 1,
      averageBucket: 0.5,
    });
  });

  it("should handle mixed difficulty history", () => {
    const card = new Flashcard("Q", "A", "H", []);
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set([card])],
    ]);
    const history = [
      { card, difficulty: AnswerDifficulty.Wrong, timestamp: Date.now() - 1000 },
      { card, difficulty: AnswerDifficulty.Hard, timestamp: Date.now() - 500 },
      { card, difficulty: AnswerDifficulty.Easy, timestamp: Date.now() },
    ];
    const result = computeProgress(buckets, history);
    assert.deepStrictEqual(result, {
      totalCards: 1,
      masteredCards: 0,
      strugglingCards: 1,
      averageBucket: 0,
    });
  });
});
