import { Board, canPlaceAllPieces } from "@/constants/games/block-blast/Board";
import { PieceData, getRandomPiece, getRandomPieceWorklet, getSeededPiece } from "@/constants/games/block-blast/Piece";

export type Hand = (PieceData | null)[]

// Bounded reroll cap for board-aware dealing below. A solvable hand is found
// on the first attempt in the overwhelming majority of cases (early exit —
// see canPlaceAllPieces); this only gets exercised on a nearly-full board,
// where it also converges fast since few placements remain to search.
const MAX_DEAL_ATTEMPTS = 60;

export function createRandomHand(size: number): Hand {
	const hand = new Array<PieceData | null>(size);
	for (let i = 0; i < size; i++) {
		hand[i] = getRandomPiece();
	}
	return hand;
}

export function createRandomHandWorklet(size: number): Hand {
	"worklet";
	const hand = new Array<PieceData | null>(size);
	for (let i = 0; i < size; i++) {
		hand[i] = getRandomPieceWorklet();
	}
	return hand;
}

// Ranked mode only: hand pulled from the seeded generator, threading the
// PRNG state forward so refills continue the same deterministic sequence.
export function createSeededHand(size: number, rngState: number): { hand: Hand; nextState: number } {
	"worklet";
	const hand = new Array<PieceData | null>(size);
	let state = rngState;
	for (let i = 0; i < size; i++) {
		const { piece, nextState } = getSeededPiece(state);
		hand[i] = piece;
		state = nextState;
	}
	return { hand, nextState: state };
}

// Board-aware dealing (both modes): reroll until the whole hand is provably
// solvable against the current board, so a player only ever loses to a bad
// placement choice, never to an unsolvable hand ("no bad luck" — product
// decision, 2026-07-21). Classic keeps unseeded Math.random(); Ranked keeps
// threading the seeded PRNG state through every attempt (including rejected
// ones) so it stays reproducible for a given play-through, though the final
// accepted hand now depends on live board state, not just the calendar seed —
// Ranked's piece sequence is no longer guaranteed identical across players.
export function createPlayableRandomHand(size: number, board: Board): Hand {
	let hand: Hand = createRandomHand(size);
	for (let attempt = 0; attempt < MAX_DEAL_ATTEMPTS; attempt++) {
		if (canPlaceAllPieces(board, hand as PieceData[])) {
			return hand;
		}
		hand = createRandomHand(size);
	}
	return hand;
}

export function createPlayableRandomHandWorklet(size: number, board: Board): Hand {
	"worklet";
	let hand: Hand = createRandomHandWorklet(size);
	for (let attempt = 0; attempt < MAX_DEAL_ATTEMPTS; attempt++) {
		if (canPlaceAllPieces(board, hand as PieceData[])) {
			return hand;
		}
		hand = createRandomHandWorklet(size);
	}
	return hand;
}

export function createPlayableSeededHand(size: number, board: Board, rngState: number): { hand: Hand; nextState: number } {
	"worklet";
	let state = rngState;
	for (let attempt = 0; attempt < MAX_DEAL_ATTEMPTS; attempt++) {
		const result = createSeededHand(size, state);
		state = result.nextState;
		if (canPlaceAllPieces(board, result.hand as PieceData[])) {
			return { hand: result.hand, nextState: state };
		}
	}
	// Exhausted attempts — board has genuinely no room for any combination;
	// deal anyway and let the real (non-"bad luck") game-over check catch it.
	return createSeededHand(size, state);
}
