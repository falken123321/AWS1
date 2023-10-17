export interface Position {
  row: number;
  col: number;
}

export interface Board<T> {
  width: number;
  height: number;
  tiles: T[];
}

export interface Effect<T> {
  kind: "Match" | "Refill";
  match?: {
    matched: T;
    positions: Position[];
  };
}

export interface Generator<T> {
  next(): T;
}

export type MoveResult<T> = {
  board: Board<T>;
  effects: Effect<T>[];
};

export function create<T>(
  generator: Generator<T>,
  width: number,
  height: number
): Board<T> {
  const tiles: T[] = [];
  for (let i = 0; i < width * height; i++) {
    tiles.push(generator.next());
  }
  return {
    width,
    height,
    tiles,
  };
}

export function positions<T>(board: Board<T>): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}

export function piece<T>(board: Board<T>, position: Position): T | undefined {
  if (
    position.row < 0 ||
    position.row >= board.height ||
    position.col < 0 ||
    position.col >= board.width
  ) {
    return undefined;
  }
  return board.tiles[position.row * board.width + position.col];
}

export function canMove<T>(
  board: Board<T>,
  first: Position,
  second: Position
): boolean {
  const canMoveOneStep =
    (Math.abs(first.row - second.row) === 1 && first.col === second.col) ||
    (Math.abs(first.col - second.col) === 1 && first.row === second.row);

  if (canMoveOneStep) {
    if (board[second.row][second.col] !== null) return false;
    return true;
  }

  return false;
}

export function move<T>(
  generator: Generator<T>,
  board: Board<T>,
  first: Position,
  second: Position
): MoveResult<T> {}
