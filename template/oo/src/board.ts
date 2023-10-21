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
    //Values
    private generator: Generator<T>;
    private width: number;
    private height: number;
    private tiles: T[];

    constructor(generator: Generator<T>, width: number, height: number) {
        this.generator = generator;
        this.width = width;
        this.height = height;
        this.tiles = [];
        for (let i = 0; i < width * height; i++) {
            this.tiles.push(this.generator.next());
        }
    }

    addListener(listener: BoardListener<T>) {
    }

    piece(p: Position): T | undefined {
    }

    canMove(first: Position, second: Position): boolean {
    }

    move(first: Position, second: Position) {
    }
}
