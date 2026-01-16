export type DiffType = 'add' | 'remove' | 'equal';

export interface DiffPart {
  type: DiffType;
  value: string;
}

/**
 * Tokenizes text into words, punctuation, and spaces to allow for precise diffing.
 */
function tokenize(text: string): string[] {
  // Split by whitespace or non-word characters, keeping the delimiters
  // This regex matches: spaces, newlines, or sequences of word characters, or individual punctuation
  return text.split(/(\s+|[a-zA-Z0-9]+|[^a-zA-Z0-9\s])/).filter(t => t !== '');
}

/**
 * Calculates the differences between two texts at the word level.
 * Uses a basic Longest Common Subsequence (LCS) approach.
 */
export function calculateDiff(oldText: string, newText: string): DiffPart[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  
  const N = oldTokens.length;
  const M = newTokens.length;
  
  // Compute LCS Matrix
  // lcs[i][j] stores the length of LCS of oldTokens[0..i-1] and newTokens[0..j-1]
  const lcs = Array(N + 1).fill(0).map(() => Array(M + 1).fill(0));
  
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find the diff
  let i = N;
  let j = M;
  const parts: DiffPart[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      parts.unshift({ type: 'equal', value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      parts.unshift({ type: 'add', value: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      parts.unshift({ type: 'remove', value: oldTokens[i - 1] });
      i--;
    }
  }
  
  // Post-processing to merge adjacent spaces/punctuation into the previous block if beneficial
  // or simple cleanups (optional). For now, returning raw token diff.
  return parts;
}