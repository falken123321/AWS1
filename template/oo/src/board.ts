export type Generator<T> = { next: () => T };

export type Position = {
    row: number;
    col: number;
};

export type Match<T> = {
    matched: T;
    positions: Position[];
};

export type BoardEvent<T> = {
    kind: "Match" | "Refill";
    match?: Match<T>;
};

export type BoardListener<T> = {
    (event: BoardEvent<T>): void;
};

//export type MoveResult<T> = {
//board: Board<T>;
//effects: BoardEvent < T > [];
//};

export class Board<T> {
    private generator: Generator<T>;
    private width: number;
    private height: number;
    private tiles: T[][];
    private listeners: BoardListener<T>[];

    constructor(generator: Generator<T>, width: number, height: number) {
        this.generator = generator;
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.listeners = [];
        for (let row = 0; row < height; row++) {
            const rowTiles: T[] = [];
            for (let col = 0; col < width; col++) {
                rowTiles.push(generator.next());
            }
            this.tiles.push(rowTiles);
        }
    }

    addListener(listener: BoardListener<T>) {
        this.listeners.push(listener);
    }

    isWithinBounds(value, min, max) {
        return value >= min && value < max;
    }

    piece(p: Position): T | undefined {
        if (!this.isPositionWithinBoardBounds(p)) return undefined;
        if (this.isWithinBounds(p.row, 0, this.height) && this.isWithinBounds(p.col, 0, this.width)) {
            return this.tiles[p.row][p.col];
        }


        return undefined;
    }

    positions(): Position[] {
        const positions: Position[] = [];
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                positions.push({ row, col });
            }
        }
        return positions;
    }

    invalidMovesCheck(first: Position, second: Position): boolean {
        if (first.row !== second.row && first.col !== second.col) {
            return true;
        }
        return false;
    }

    isPositionWithinBoardBounds(position: Position): boolean {
        if (
            position.row < 0 ||
            position.row >= this.height ||
            position.col < 0 ||
            position.col >= this.width
        ) {
            return false;
        }
        return true;
    }

    matchCheck(first: Position, second: Position): Match<T> {
        if (
            this.tiles[first.row][first.col] === this.tiles[second.row][second.col]
        ) {
            return {
                matched: this.tiles[first.row][first.col],
                positions: [first, second],
            };
        } else {
            return {
                matched: undefined,
                positions: [],
            };
        }
    }

    canMove(first: Position, second: Position): boolean {
        if (
            !this.isPositionWithinBoardBounds(first) ||
            !this.isPositionWithinBoardBounds(second) ||
            this.matchCheck(first, second).matched !== undefined || // Sikre man ikke må move en tile hvis ikke det resultere i et match
            this.invalidMovesCheck(first, second) //Sikre at man ikke kan lave moves på forskellige rows og cols - aka skråt
        ) {
            return false;
        }
        return true;
    }

    findMatches(): Match<T>[] {
        const matches: Match<T>[] = [];

        // Check horizontal matches
        for (let row = 0; row < this.height; row++) {
            let match: Match<T> = { matched: undefined, positions: [] };
            for (let col = 0; col < this.width; col++) {
                const position: Position = { row, col };
                const tile = this.piece(position);
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

        // Check vertical matches
        for (let col = 0; col < this.width; col++) {
            let match: Match<T> = { matched: undefined, positions: [] };
            for (let row = 0; row < this.height; row++) {
                const position: Position = { row, col };
                const tile = this.piece(position);
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

        return matches;
    }

    move(first: Position, second: Position) {
        if (!this.canMove(first, second)) {
            return;
        }

        const effects: BoardEvent<T>[] = [];

        // Swap tiles
        const firstTile = this.tiles[first.row * this.width + first.col];
        const secondTile = this.tiles[second.row * this.width + second.col];
        this.tiles[first.row * this.width + first.col] = secondTile;
        this.tiles[second.row * this.width + second.col] = firstTile;

        let matchesFound = true;

        while (matchesFound) {
            const matches: Match<T>[] = this.findMatches();

            if (matches.length > 0) {
                const positionsToRemove = new Set<string>();

                for (let match of matches) {
                    effects.push({
                        kind: "Match",
                        match: match,
                    });

                    // Mark matched tiles for removal
                    for (let position of match.positions) {
                        positionsToRemove.add(`${position.row}-${position.col}`);
                    }
                }

                // Shift tiles down and replace matched tiles
                for (let col = 0; col < this.width; col++) {
                    let emptyRow = this.height - 1;
                    for (let row = this.height - 1; row >= 0; row--) {
                        const positionKey = `${row}-${col}`;
                        if (!positionsToRemove.has(positionKey)) {
                            if (row !== emptyRow) {
                                this.tiles[emptyRow * this.width + col] =
                                    this.tiles[row * this.width + col];
                            }
                            emptyRow--;
                        }
                    }

                    // Fill the empty spaces with new tiles
                    while (emptyRow >= 0) {
                        this.tiles[emptyRow * this.width + col] = this.generator.next();
                        emptyRow--;
                    }
                }

                effects.push({ kind: "Refill" });
            } else {
                matchesFound = false;
            }
        }

        return { effects: effects };
    }
}
