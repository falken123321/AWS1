export interface Position {
  row: number;
  col: number;
}

export interface Match<T> {
  matched: T;
  positions: Position[];
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

export function matchCheck<T>(
  board: Board<T>,
  first: Position,
  second: Position
): Match<T> {
  if (
    board.tiles[first.row * board.width + first.col] ===
    board.tiles[second.row * board.width + second.col]
  ) {
    return {
      matched: board.tiles[first.row * board.width + first.col],
      positions: [first, second],
    };
  } else {
    return {
      matched: undefined,
      positions: [],
    };
  }
}

export function invalidMovesCheck<T>(
  first: Position,
  second: Position
): boolean {
  //Sikre at man ikke kan lave moves på forskellige rows og cols
  if (first.row !== second.row && first.col !== second.col) {
    return true;
  } else {
    return false;
  }
}

export function canMove<T>(
  board: Board<T>,
  first: Position,
  second: Position
): boolean {
  if (
    !isPositionWithinBoardBounds(board, first) ||
    !isPositionWithinBoardBounds(board, second) ||
    matchCheck(board, first, second).matched !== undefined || // Sikre man ikke må move en tile hvis ikke det resultere i et match
    invalidMovesCheck(first, second) //Sikre at man ikke kan lave moves på forskellige rows og cols - aka skråt
  ) {
    return false;
  }
  return true;
}

function isPositionWithinBoardBounds<T>(
  board: Board<T>,
  position: Position
): boolean {
  const isRowValid = position.row >= 0 && position.row < board.height;
  const isColValid = position.col >= 0 && position.col < board.width;

  return isRowValid && isColValid;
}

export function move<T>(
  generator: Generator<T>,
  board: Board<T>,
  first: Position,
  second: Position
): MoveResult<T> {
  if (!canMove(board, first, second)) {
    return { board, effects: [] };
  } else {
    const effects: Effect<T>[] = [];

    const firstTile = board.tiles[first.row * board.width + first.col];
    const secondTile = board.tiles[second.row * board.width + second.col];

    board.tiles[first.row * board.width + first.col] = secondTile;
    board.tiles[second.row * board.width + second.col] = firstTile;

    //Check for matches
    const matches: Match<T>[] = [];
    //Check horizontal matches
    for (let row = 0; row < board.height; row++) {
      let match: Match<T> = { matched: undefined, positions: [] };
      for (let col = 0; col < board.width; col++) {
        const position: Position = { row, col };
        const tile = piece(board, position);
        if (tile === match.matched) {
          match.positions.push(position);
        } else {
          if (match.positions.length >= 3) {
            matches.push(match);
          }
          match = { matched: tile, positions: [position] };
        }
      }
      if (match.positions.length >= 3) {
        matches.push(match);
      }
    }

    //Check vertical matches
    for (let col = 0; col < board.width; col++) {
      let match: Match<T> = { matched: undefined, positions: [] };
      for (let row = 0; row < board.height; row++) {
        const position: Position = { row, col };
        const tile = piece(board, position);
        if (tile === match.matched) {
          match.positions.push(position);
        } else {
          if (match.positions.length >= 3) {
            matches.push(match);
          }
          match = { matched: tile, positions: [position] };
        }
      }
      if (match.positions.length >= 3) {
        matches.push(match);
      }
    }

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        effects.push({
          kind: "Match",
          match: matches[i],
        });
      }
    }
    if (matches.length > 0) {
      effects.push({ kind: "Refill" });
    }

    return { board, effects: effects };
  }
}
