import { PieceData } from '@/constants/games/block-blast/Piece';
import { DndProvider, DndProviderProps, Rectangle } from '@mgcrea/react-native-dnd';
import React, { forwardRef, useImperativeHandle } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { ReduceMotion, runOnJS, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Board, BoardBlockType, JS_emptyPossibleBoardSpots, PossibleBoardSpots, XYPoint, breakLines, clearHoverBlocks, createPossibleBoardSpots, emptyPossibleBoardSpots, isGameOver, newEmptyBoard, placePieceOntoBoard, updateHoveredBreaks } from '@/constants/games/block-blast/Board';
import { GameHud } from '@/components/games/block-blast/GameHud';
import BlockGrid from '@/components/games/block-blast/BlockGrid';
import { createPlayableRandomHand, createPlayableRandomHandWorklet, createPlayableSeededHand } from '@/constants/games/block-blast/Hand';
import HandPieces from '@/components/games/block-blast/HandPieces';
import { getTodaysDailySeed } from '@/constants/games/block-blast/Rng';

export type BlockBlastMode = 'ranked' | 'classic';

export interface GameOverInfo {
	finalScore: number;
	moveCount: number;
	finalBoardState: Board;
}

export interface GameHandle {
	// Classic mode's coin-continue: clears the board and deals a fresh hand
	// without resetting score — Ranked never uses this (no continuing a
	// seeded run after game over).
	continueGame: () => void;
}

const BOARD_LENGTH = 8;
const HAND_SIZE = 3;

// layout = active/dragging piece's real bounding box (e.g. 92x46 for a 2-wide
// piece) — must use its actual width/height here, not a fixed cell size, or
// every multi-cell piece (i.e. every piece in this game) gets a shrunken,
// overly strict drop-detection window and drops keep bouncing back.
const pieceOverlapsRectangle = (layout: Rectangle, other: Rectangle) => {
	"worklet";
	if (other.width == 0 && other.height == 0) {
		return false;
	}

	return (
		layout.x < other.x + other.width &&
		layout.x + layout.width > other.x &&
		layout.y < other.y + other.height &&
		layout.y + layout.height > other.y
	);
};

const SPRING_CONFIG_MISSED_DRAG = {
	mass: 1,
	damping: 1,
	stiffness: 500,
	overshootClamping: true,
	restDisplacementThreshold: 0.01,
	restSpeedThreshold: 0.01,
	reduceMotion: ReduceMotion.Never,
}

function decodeDndId(id: string): XYPoint {
	"worklet";
	return {x: Number(id[0]), y: Number(id[2])}
}

function impactAsyncHelper(style: Haptics.ImpactFeedbackStyle) {
	Haptics.impactAsync(style);
}

function runPiecePlacedHaptic() {
	"worklet";
	runOnJS(impactAsyncHelper)(Haptics.ImpactFeedbackStyle.Light);
}

interface GameProps {
	mode: BlockBlastMode;
	onGameOver: (info: GameOverInfo) => void;
	bestScore?: number;
	coinCount?: number;
	onPausePress?: () => void;
}

export const Game = forwardRef<GameHandle, GameProps>(({mode, onGameOver, bestScore, coinCount, onPausePress}, ref) => {
	// Ranked: seeded on mount (per-game IST seed). Classic: unseeded, own
	// randomness, coins allowed. Both modes deal board-aware hands (see
	// Hand.tsx) — on a fresh empty board this always succeeds on the first try.
	const initialBoard = newEmptyBoard(BOARD_LENGTH);
	const initialDeal = mode === 'ranked'
		? createPlayableSeededHand(HAND_SIZE, initialBoard, getTodaysDailySeed())
		: { hand: createPlayableRandomHand(HAND_SIZE, initialBoard), nextState: 0 };

	const board = useSharedValue(initialBoard);
	const draggingPiece = useSharedValue<number | null>(null);
	const possibleBoardDropSpots = useSharedValue<PossibleBoardSpots>(JS_emptyPossibleBoardSpots(BOARD_LENGTH));
	const hand = useSharedValue(initialDeal.hand);
	const rngState = useSharedValue(initialDeal.nextState);
	const score = useSharedValue(0);
	const moveCount = useSharedValue(0);
	const gameOverReported = useSharedValue(false);

	useImperativeHandle(ref, () => ({
		continueGame: () => {
			const freshBoard = newEmptyBoard(BOARD_LENGTH);
			board.value = freshBoard;
			hand.value = createPlayableRandomHand(HAND_SIZE, freshBoard);
			gameOverReported.value = false;
		},
	}), [board, hand, gameOverReported]);

	const handleDragEnd: DndProviderProps["onDragEnd"] = ({ active, over }) => {
		"worklet";
		if (over) {
			if (draggingPiece.value == null) {
				return;
			}

			const dropIdStr = over.id.toString();
			const {x: dropX, y: dropY} = decodeDndId(dropIdStr);
			const piece: PieceData = hand.value[draggingPiece.value!]!;

			// the block is gonna fit, let's place the block
			// we'll do the haptics now
			if (Platform.OS != 'web')
				runPiecePlacedHaptic();

			moveCount.value += 1;

			const newBoard = clearHoverBlocks([...board.value]);
			placePieceOntoBoard(newBoard, piece, dropX, dropY, BoardBlockType.FILLED)
			const linesBroken = breakLines(newBoard);

			// Scoring (locked rule): 1 line = 100; n>=2 lines = 100n + 10n; full clear = +250 (stacks).
			if (linesBroken > 0) {
				let lineScore = 100 * linesBroken;
				if (linesBroken >= 2) lineScore += 10 * linesBroken;
				score.value += lineScore;
			}

			let boardIsEmpty = true;
			for (let y = 0; y < BOARD_LENGTH; y++) {
				for (let x = 0; x < BOARD_LENGTH; x++) {
					if (newBoard[y][x].blockType == BoardBlockType.FILLED) { boardIsEmpty = false; break; }
				}
				if (!boardIsEmpty) break;
			}
			if (boardIsEmpty) score.value += 250;

			const newHand = [...hand.value];
			newHand[draggingPiece.value!] = null;

			// is hand empty?
			let empty = true
			for (let i = 0; i < HAND_SIZE; i++) {
				if (newHand[i] != null) {
					empty = false;
					break;
				}
			}
			let finalHand = newHand;
			if (empty) {
				if (mode === 'ranked') {
					const refill = createPlayableSeededHand(HAND_SIZE, newBoard, rngState.value);
					finalHand = refill.hand;
					rngState.value = refill.nextState;
				} else {
					finalHand = createPlayableRandomHandWorklet(HAND_SIZE, newBoard);
				}
			}

			hand.value = finalHand;
			board.value = newBoard;

			if (!gameOverReported.value && isGameOver(newBoard, finalHand)) {
				gameOverReported.value = true;
				runOnJS(onGameOver)({ finalScore: score.value, moveCount: moveCount.value, finalBoardState: newBoard });
			}
		} else {
			board.value = clearHoverBlocks([...board.value]);
		}
		draggingPiece.value = null;
		possibleBoardDropSpots.value = emptyPossibleBoardSpots(BOARD_LENGTH);
	};

	const handleBegin: DndProviderProps["onBegin"] = (event, meta) => {
		"worklet";
		const handIndex = Number(meta.activeId.toString());
		if (hand.value[handIndex] != null) {
			draggingPiece.value = handIndex;
			possibleBoardDropSpots.value = createPossibleBoardSpots(board.value, hand.value[handIndex]);
		}
	};

	const handleFinalize: DndProviderProps["onFinalize"] = ({ state }) => {
		"worklet";
		if (state !== State.END) {
			draggingPiece.value = null;
		}
	};

	const handleUpdate: DndProviderProps["onUpdate"] = (event, {activeId, activeLayout, droppableActiveId}) => {
		"worklet";
		if (!droppableActiveId) {
			board.value = clearHoverBlocks([...board.value]);
			return;
		}

		if (draggingPiece.value == null) {
			return;
		}

		const dropIdStr = droppableActiveId.toString();
		const {x: dropX, y: dropY} = decodeDndId(dropIdStr);
		const piece: PieceData = hand.value[draggingPiece.value!]!;

		const newBoard = clearHoverBlocks([...board.value]);
		updateHoveredBreaks(newBoard, piece, dropX, dropY);

		board.value = newBoard
	}

	return (
		<LinearGradient colors={GRADIENT_COLORS} style={styles.root}>
			<SafeAreaView style={styles.root}>
				<GestureHandlerRootView style={styles.root}>
					<View style={styles.root}>
						<GameHud score={score} bestScore={bestScore} coinCount={coinCount} onPausePress={onPausePress}></GameHud>
						<DndProvider shouldDropWorklet={pieceOverlapsRectangle} springConfig={SPRING_CONFIG_MISSED_DRAG} onBegin={handleBegin} onFinalize={handleFinalize} onDragEnd={handleDragEnd} onUpdate={handleUpdate}>
							<BlockGrid board={board} possibleBoardDropSpots={possibleBoardDropSpots} hand={hand} draggingPiece={draggingPiece}></BlockGrid>
							<HandPieces hand={hand}></HandPieces>
						</DndProvider>
					</View>
				</GestureHandlerRootView>
			</SafeAreaView>
		</LinearGradient>
	);
})

Game.displayName = 'Game';

// Blue-purple jewel-tone gradient, loosely inspired by the reference mockup
// (not a pixel-for-pixel match). The grid panel (BlockGrid.tsx) uses a
// distinct deeper tone so it reads as its own surface against this gradient.
const GRADIENT_COLORS = ['#1b1140', '#2a1a5e', '#3b1c63'] as const;

const styles = StyleSheet.create({
	root: {
		width: '100%',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 0,
		overflow: 'hidden',
	}
})

export default Game;
