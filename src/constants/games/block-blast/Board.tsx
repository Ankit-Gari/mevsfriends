import { Color } from "@/constants/games/block-blast/Color";
import { getRandomPieceColor, PieceData } from "@/constants/games/block-blast/Piece";

export const GRID_BLOCK_SIZE = 46;
export const HAND_BLOCK_SIZE = 22;
export const HITBOX_SIZE = 12;
export const DRAG_JUMP_LENGTH = 116;

export interface XYPoint {
  x: number;
  y: number;
}

export enum BoardBlockType {
  EMPTY,
  HOVERED,
  HOVERED_BREAK_FILLED,
  HOVERED_BREAK_EMPTY,
  FILLED,
}

export interface BoardBlock {
  blockType: BoardBlockType;
  color: Color;
  hoveredBreakColor: Color;
}

export type Board = BoardBlock[][];

export function newEmptyBoard(boardLength: number): Board {
  return new Array(boardLength).fill(null).map(() => {
    return new Array(boardLength).fill(null).map(() => {
      return {
        blockType: BoardBlockType.EMPTY,
        color: getRandomPieceColor(), // used in the load up animation where blocks show on the grid
        hoveredBreakColor: { r: 0, g: 0, b: 0 },
      };
    });
  });
}

export type PossibleBoardSpots = number[][];

export function emptyPossibleBoardSpots(
  boardLength: number,
): PossibleBoardSpots {
  "worklet";
  return new Array(boardLength).fill(null).map(() => {
    return new Array(boardLength).fill(null).map(() => {
      return 0;
    });
  });
}

export function JS_emptyPossibleBoardSpots(
  boardLength: number,
): PossibleBoardSpots {
  return new Array(boardLength).fill(null).map(() => {
    return new Array(boardLength).fill(null).map(() => {
      return 0;
    });
  });
}
export function createPossibleBoardSpots(
  board: Board,
  piece: PieceData | null,
): PossibleBoardSpots {
  "worklet";
  const boardLength = board.length;
  if (piece == null) {
    return [];
  }
  const pieceHeight = piece.matrix.length;
  const pieceWidth = piece.matrix[0].length;
  const fitPositions: PossibleBoardSpots = emptyPossibleBoardSpots(boardLength);

  for (let boardY = 0; boardY <= boardLength - pieceHeight; boardY++) {
    for (let boardX = 0; boardX <= boardLength - pieceWidth; boardX++) {
      let canFit = true;

      for (let pieceY = 0; pieceY < pieceHeight; pieceY++) {
        for (let pieceX = 0; pieceX < pieceWidth; pieceX++) {
          if (
            piece.matrix[pieceY][pieceX] === 1 &&
            board[boardY + pieceY][boardX + pieceX].blockType ==
              BoardBlockType.FILLED
          ) {
            canFit = false;
            break;
          }
        }
        if (!canFit) break;
      }

      if (canFit) {
        fitPositions[boardY][boardX] = 1;
      }
    }
  }

  return fitPositions;
}

export function clearHoverBlocks(board: Board): Board {
  "worklet";
  const boardLength = board.length;
  for (let y = 0; y < boardLength; y++) {
    for (let x = 0; x < boardLength; x++) {
      const blockType = board[y][x].blockType;
      if (
        blockType == BoardBlockType.HOVERED ||
        blockType == BoardBlockType.HOVERED_BREAK_EMPTY
      ) {
        board[y][x].blockType = BoardBlockType.EMPTY;
      } else if (blockType == BoardBlockType.HOVERED_BREAK_FILLED) {
        board[y][x].blockType = BoardBlockType.FILLED;
      }
    }
  }
  return board;
}

export function placePieceOntoBoard(
  board: Board,
  piece: PieceData,
  dropX: number,
  dropY: number,
  blockType: BoardBlockType,
) {
  "worklet";
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[0].length; x++) {
      if (piece.matrix[y][x] == 1) {
        board[dropY + y][dropX + x].blockType = blockType;
        board[dropY + y][dropX + x].color = piece.color;
      }
    }
  }
}

export function updateHoveredBreaks(
  board: Board,
  piece: PieceData,
  dropX: number,
  dropY: number,
) {
  "worklet";
  const boardLength = board.length;
  const tempBoard = [...board];
  placePieceOntoBoard(tempBoard, piece, dropX, dropY, BoardBlockType.HOVERED);

  const rowsToClear = new Set<number>();
  const colsToClear = new Set<number>();

  for (let row = 0; row < boardLength; row++) {
    if (
      tempBoard[row].every(
        (cell) =>
          cell.blockType == BoardBlockType.FILLED ||
          cell.blockType == BoardBlockType.HOVERED,
      )
    ) {
      rowsToClear.add(row);
    }
  }

  for (let col = 0; col < boardLength; col++) {
    if (
      tempBoard.every(
        (row) =>
          row[col].blockType == BoardBlockType.FILLED ||
          row[col].blockType == BoardBlockType.HOVERED,
      )
    ) {
      colsToClear.add(col);
    }
  }

  const count = rowsToClear.size + colsToClear.size;

  if (count > 0) {
    rowsToClear.forEach((row) => {
      for (let col = 0; col < boardLength; col++) {
        if (board[row][col].blockType == BoardBlockType.FILLED) {
          board[row][col].blockType = BoardBlockType.HOVERED_BREAK_FILLED;
          board[row][col].hoveredBreakColor = piece.color;
        } else {
          board[row][col].blockType = BoardBlockType.HOVERED_BREAK_EMPTY;
        }
      }
    });

    colsToClear.forEach((col) => {
      for (let row = 0; row < boardLength; row++) {
        if (board[row][col].blockType == BoardBlockType.FILLED) {
          board[row][col].blockType = BoardBlockType.HOVERED_BREAK_FILLED;
          board[row][col].hoveredBreakColor = piece.color;
        } else {
          board[row][col].blockType = BoardBlockType.HOVERED_BREAK_EMPTY;
        }
      }
    });
  }
}

export function breakLines(board: Board): number {
  "worklet";
  const boardLength = board.length;
  const rowsToClear = new Set<number>();
  const colsToClear = new Set<number>();

  for (let row = 0; row < boardLength; row++) {
    if (board[row].every((cell) => cell.blockType == BoardBlockType.FILLED)) {
      rowsToClear.add(row);
    }
  }

  for (let col = 0; col < boardLength; col++) {
    if (board.every((row) => row[col].blockType == BoardBlockType.FILLED)) {
      colsToClear.add(col);
    }
  }

  const count = rowsToClear.size + colsToClear.size;

  if (count > 0) {
    rowsToClear.forEach((row) => {
      for (let col = 0; col < boardLength; col++) {
        board[row][col].blockType = BoardBlockType.EMPTY;
      }
    });

    colsToClear.forEach((col) => {
      for (let row = 0; row < boardLength; row++) {
        board[row][col].blockType = BoardBlockType.EMPTY;
      }
    });
  }

  return count;
}

export function forEachBoardBlock(board: Board, each: ((block: BoardBlock, x: number, y: number) => boolean) | ((block: BoardBlock, x: number, y: number) => void)) {
  const length = board.length;
  for (let y = 0; y < length; y++) {
    for (let x = 0; x < length; x++) {
      each(board[y][x], x, y);
    }
  }
}

function cloneBoard(board: Board): Board {
  "worklet";
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

// Board-aware dealing check: does some order + placement of ALL of `pieces`
// exist that never gets stuck? Used to guarantee dealt hands are always
// solvable — a player should only ever lose to a bad placement choice, never
// to an unsolvable hand ("no bad luck" — product decision, 2026-07-21).
// This is a real trade-off: it makes hand generation depend on live board
// state, so Ranked's piece sequence is no longer byte-identical across
// players (see Hand.tsx createPlayable*Hand for where this is consumed).
export function canPlaceAllPieces(board: Board, pieces: PieceData[]): boolean {
  "worklet";
  if (pieces.length === 0) return true;
  const boardLength = board.length;
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const spots = createPossibleBoardSpots(board, piece);
    for (let y = 0; y < boardLength; y++) {
      for (let x = 0; x < boardLength; x++) {
        if (spots[y][x] !== 1) continue;
        const simBoard = cloneBoard(board);
        placePieceOntoBoard(simBoard, piece, x, y, BoardBlockType.FILLED);
        breakLines(simBoard);
        const remaining = pieces.slice(0, i).concat(pieces.slice(i + 1));
        if (canPlaceAllPieces(simBoard, remaining)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Ranked mode game-over check: none of the offered pieces can legally
// be placed anywhere on the board.
export function isGameOver(board: Board, hand: (PieceData | null)[]): boolean {
  "worklet";
  for (let i = 0; i < hand.length; i++) {
    const piece = hand[i];
    if (piece == null) continue;
    const spots = createPossibleBoardSpots(board, piece);
    for (let y = 0; y < spots.length; y++) {
      for (let x = 0; x < spots[y].length; x++) {
        if (spots[y][x] === 1) return false;
      }
    }
  }
  return true;
}
