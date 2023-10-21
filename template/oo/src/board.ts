export type Generator<T> = { next: () => T }

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = {
    kind: "Match" | "Refill",
    match?: Match<T>
};

export type BoardListener<T> = {
    (event: BoardEvent<T>): void
};

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

    piece(p: Position): T | undefined {
        if (p.row >= 0 && p.row < this.height && p.col >= 0 && p.col < this.width) {
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
            this.tiles[first.row * this.width + first.col] ===
            this.tiles[second.row * this.width + second.col]
        ) {
            return {
                matched: this.tiles[first.row * this.width + first.col],
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

    move(first: Position, second: Position) {
        if (!this.canMove(first, second)) {
            return
        }

        //Swap tiles
        const temp = this.tiles[first.row * this.width + first.col];
        this.tiles[first.row * this.width + first.col] = this.tiles[second.row * this.width + second.col];
        this.tiles[second.row * this.width + second.col] = temp;

        this.matchCheck(first, second);
    }
}
