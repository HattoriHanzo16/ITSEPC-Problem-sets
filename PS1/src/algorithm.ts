/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  if (buckets.size === 0) {
    return [];
  }

  // Find the maximum bucket number
  const maxBucket = Math.max(...buckets.keys());
  
  // Initialize array with empty sets
  const result: Array<Set<Flashcard>> = new Array(maxBucket + 1);
  for (let i = 0; i <= maxBucket; i++) {
    result[i] = new Set<Flashcard>();
  }

  // Fill in the sets from the map
  for (const [bucketNum, cardSet] of buckets.entries()) {
    result[bucketNum] = cardSet;
  }

  return result;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  let minBucket = -1;
  let maxBucket = -1;

  // Find the first and last non-empty buckets
  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    if (bucket && bucket.size > 0) {
      if (minBucket === -1) {
        minBucket = i;
      }
      maxBucket = i;
    }
  }

  // Return undefined if no buckets contain cards
  if (minBucket === -1) {
    return undefined;
  }

  return { minBucket, maxBucket };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const result = new Set<Flashcard>();

  // For day 0, practice all cards in bucket 0
  if (day === 0) {
    const bucket0 = buckets[0];
    if (bucket0) {
      for (const card of bucket0) {
        result.add(card);
      }
    }
    return result;
  }

  // For day > 0, practice cards in buckets where bucket number divides the day
  // Only include cards from buckets that exist in the array
  if (day < buckets.length) {
    const bucket = buckets[day];
    if (bucket) {
      for (const card of bucket) {
        result.add(card);
      }
    }
  }

  return result;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  // Create a new map to avoid mutating the input
  const newBuckets = new Map<number, Set<Flashcard>>();
  
  // Copy all existing buckets
  for (const [bucketNum, cardSet] of buckets.entries()) {
    newBuckets.set(bucketNum, new Set(cardSet));
  }

  // Find the current bucket of the card
  let currentBucket = -1;
  for (const [bucketNum, cardSet] of newBuckets.entries()) {
    if (cardSet.has(card)) {
      currentBucket = bucketNum;
      cardSet.delete(card);
      break;
    }
  }

  // Determine the new bucket based on difficulty
  let newBucket: number;
  switch (difficulty) {
    case AnswerDifficulty.Wrong:
      newBucket = 0;
      break;
    case AnswerDifficulty.Hard:
      newBucket = currentBucket === -1 ? 0 : currentBucket;
      break;
    case AnswerDifficulty.Easy:
      newBucket = currentBucket === -1 ? 0 : currentBucket + 1;
      break;
  }

  // Add the card to its new bucket
  if (!newBuckets.has(newBucket)) {
    newBuckets.set(newBucket, new Set<Flashcard>());
  }
  newBuckets.get(newBucket)!.add(card);

  return newBuckets;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns a hint for the front of the flashcard.
 * @spec.requires card is a valid Flashcard.
 */
export function getHint(card: Flashcard): string {
  // If the card's back is empty or undefined, return empty string
  if (!card.back || card.back.length === 0) {
    return "";
  }

  // If the card's hint is empty, return empty string
  if (!card.hint || card.hint.length === 0) {
    return "";
  }

  // Return the first character of the answer
  return card.back.charAt(0);
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns statistics about learning progress.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function computeProgress(
  buckets: BucketMap,
  history: Array<{card: Flashcard; difficulty: AnswerDifficulty; timestamp: number}>
): {
  totalCards: number;
  masteredCards: number;
  strugglingCards: number;
  averageBucket: number;
} {
  // Count total cards and calculate average bucket
  let totalCards = 0;
  let totalBucketSum = 0;
  for (const cardSet of buckets.values()) {
    totalCards += cardSet.size;
    for (const card of cardSet) {
      // Find the bucket number for this card
      for (const [bucketNum, set] of buckets.entries()) {
        if (set.has(card)) {
          totalBucketSum += bucketNum;
          break;
        }
      }
    }
  }

  // Count mastered cards (cards in bucket 2 or higher)
  let masteredCards = 0;
  for (const [bucketNum, cardSet] of buckets.entries()) {
    if (bucketNum >= 2) {
      masteredCards += cardSet.size;
    }
  }

  // Count struggling cards (cards in bucket 0)
  const strugglingCards = buckets.get(0)?.size || 0;

  // Calculate average bucket
  const averageBucket = totalCards > 0 ? totalBucketSum / totalCards : 0;

  return {
    totalCards,
    masteredCards,
    strugglingCards,
    averageBucket,
  };
}
