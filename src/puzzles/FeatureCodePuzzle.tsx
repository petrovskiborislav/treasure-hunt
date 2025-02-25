import React, {useState} from "react";
import {DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable,} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";
import Confetti from "react-confetti";

/**
 * Generates a random cipher mapping where each Cyrillic letter in the specified set
 * is mapped to a unique number. The numbers are randomly shuffled for every execution.
 *
 * @returns {Record<string, number>} An object where keys are Cyrillic letters
 * and values are unique randomly shuffled numbers.
 */
const generateRandomCipherMapping = (): Record<string, number> => {
    const letters = [
        "А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И",
        "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т",
        "У", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ю", "Я",
    ];
    const numbers = Array.from({length: letters.length}, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    const mapping: Record<string, number> = {};
    letters.forEach((letter, index) => {
        mapping[letter] = numbers[index];
    });
    return mapping;
};

const cipherMapping = generateRandomCipherMapping();

/**
 * Represents a cell in a crossword puzzle grid.
 *
 * @interface CrosswordCell
 */
interface CrosswordCell {
    row: number;
    col: number;
    solution: string;
    cipher: number;
    userLetter: string;
    preFilled: boolean;
}

/**
 * Represents a draggable tile in a user interface or game.
 *
 * This interface defines the necessary properties for a tile that can be dragged
 * by the user. It is typically used in scenarios where visual components
 * representing letters or pieces need to be interactable.
 *
 * Properties:
 * - `id`: A unique identifier for the draggable tile. This is used to
 *   distinguish this tile from others within the same context.
 * - `letter`: A character associated with the tile, which may be used
 *   for display purposes or gameplay mechanics.
 */
interface DraggableTile {
    id: string;
    letter: string;
}

/**
 * Represents the definition of a word, including its textual value, positions
 * on a grid, and optional settings for prefilling.
 *
 * @interface WordDefinition
 *
 * @property {string} text
 * The actual text of the word.
 *
 * @property {{ row: number; col: number; letter: string }[]} positions
 * Specifies the positions of each letter of the word on a grid, including the
 * row, column, and letter value.
 *
 * @property {boolean} [prefillStart]
 * Optional property indicating whether the word should start*/
interface WordDefinition {
    text: string;
    positions: { row: number; col: number; letter: string }[];
    prefillStart?: boolean;
}

/**
 * Represents an array of word definitions with their respective positions in a grid.
 * Each word contains its text representation, whether it should prefill the start,
 * and an array of positions specifying where each letter of the word is located in
 * the grid along with its coordinates (row and column).
 *
 * @type {WordDefinition[]}
 */
const words: WordDefinition[] = [
    {
        text: "ПАНДУРКОВЦИ",
        prefillStart: true,
        positions: Array.from("ПАНДУРКОВЦИ").map((letter, i) => ({
            row: 4,
            col: 2 + i,
            letter,
        })),
    },
    {
        text: "БЪЛГАРИЯ",
        prefillStart: false,
        positions: Array.from("БЪЛГАРИЯ").map((letter, i) => ({
            row: i,
            col: 3,
            letter,
        })),
    },
    {
        text: "ЛЮБОВ",
        prefillStart: true,
        positions: Array.from("ЛЮБОВ").map((letter, i) => ({
            row: 2,
            col: 8 + i,
            letter,
        })),
    },
    {
        text: "КОМЕТА",
        prefillStart: false,
        positions: Array.from("КОМЕТА").map((letter, i) => ({
            row: 4 + i,
            col: 8,
            letter,
        })),
    },
    {
        text: "СЛЪНЦЕ",
        prefillStart: false,
        positions: Array.from("СЛЪНЦЕ").map((letter, i) => ({
            row: 1,
            col: 1 + i,
            letter,
        })),
    },
    {
        text: "МАГИЯ",
        prefillStart: false,
        positions: Array.from("МАГИЯ").map((letter, i) => ({
            row: 9,
            col: 7 + i,
            letter,
        })),
    },
    {
        text: "ДОМ",
        prefillStart: false,
        positions: Array.from("ДОМ").map((letter, i) => ({
            row: 4 + i,
            col: 5,
            letter,
        })),
    },
    {
        text: "ОВЦА",
        prefillStart: false,
        positions: Array.from("ОВЦА").map((letter, i) => ({
            row: 2 + i,
            col: 11,
            letter,
        })),
    },
    {
        text: "ЕЛЕКТРИКА",
        prefillStart: true, // The first letter Е will be prefilled.
        positions: Array.from("ЕЛЕКТРИКА").map((letter, i) => ({
            row: 7,
            col: 8 + i,
            letter,
        })),
    },
];

/**
 * Constructs a board for a crossword puzzle as a record where the key represents
 * the coordinates of each cell in the format "row-col" and the value is detailed
 * information about the cell.
 *
 * @function
 * @returns {Record<string, CrosswordCell>} A record mapping cell coordinates in the
 * format "row-col" to their respective information, such as row, column, solution letter,
 * cipher mapping, user-provided letter, and whether the cell is pre-filled.
 */
const buildBoard = (): Record<string, CrosswordCell> => {
    const board: Record<string, CrosswordCell> = {};
    words.forEach((word) => {
        word.positions.forEach((pos, i) => {
            const key = `${pos.row}-${pos.col}`;
            const existing = board[key];
            board[key] = {
                row: pos.row,
                col: pos.col,
                solution: pos.letter,
                cipher: cipherMapping[pos.letter],
                userLetter: existing?.userLetter || "",
                preFilled: existing?.preFilled || (word.prefillStart ? i === 0 : false),
            };
        });
    });
    return board;
};

/**
 * Builds an array of draggable tiles from a given crossword board.
 * Filters the board to exclude cells that are pre-filled, then maps
 * the remaining cells to draggable tile objects with an id and corresponding letter.
 * The resulting tiles are shuffled randomly before being returned.
 *
 * @param {Record<string, CrosswordCell>} board - The crossword board represented as an object,
 * where the keys are string identifiers and the values are CrosswordCell objects.
 * @returns {DraggableTile[]} An array of draggable tile objects each containing an id and letter,
 * shuffled in random order.
 */
const buildPoolTiles = (board: Record<string, CrosswordCell>): DraggableTile[] =>
    Object.values(board)
        .filter((cell) => !cell.preFilled)
        .map((cell) => ({id: `tile-${cell.row}-${cell.col}`, letter: cell.solution}))
        .sort(() => Math.random() - 0.5);

/**
 * DraggableTileComp is a React functional component that renders a draggable tile UI element.
 * It utilizes the `useDraggable` hook to provide drag-and-drop functionality.
 *
 * Props:
 * - tile: An object of type `DraggableTile` that contains data about the tile, including its `id` and `letter`.
 *
 * Behavior:
 * - The component is styled dynamically based on its drag state.
 * - When dragging, the tile changes its cursor to "grabbing" and increases its z-index for visibility.
 * - It supports attributes and listeners required for drag-and-drop operations.
 *
 * Styles:
 * - The component has inherent styles such as a rounded shape, text at the center, and a background color.
 * - Hovering over the tile adds a shadow effect.
 */
const DraggableTileComp: React.FC<{ tile: DraggableTile }> = ({tile}) => {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: tile.id,
        data: {tile},
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 10 : 1,
        cursor: isDragging ? "grabbing" : "grab",
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className="w-12 h-12 flex items-center justify-center text-xl font-bold rounded-full bg-purple-700 text-white shadow-md hover:shadow-lg"
        >
            {tile.letter}
        </div>
    );
};

/**
 * DroppableCellComp is a React functional component that represents an individual cell
 * within a crossword grid. The component supports interaction and conditionally styles
 * itself based on its state, such as being solved or displaying an incorrect answer.
 *
 * @component
 * @param {Object} props - The props object.
 * @param {CrosswordCell} props.cell - An object representing the details of a crossword cell,
 * including its position, cipher, solution, and user-entered letter.
 * @param {boolean} props.incorrect - A flag indicating if the user's entered letter is incorrect.
 * @param {boolean} props.glow - A flag to toggle a glowing effect on the cell.
 * @returns {JSX.Element} A styled div element representing the cell, with child elements
 * displaying the cipher and the current letter or solution.
 */
const DroppableCellComp: React.FC<{ cell: CrosswordCell; incorrect: boolean; glow: boolean }> = ({
                                                                                                     cell,
                                                                                                     incorrect,
                                                                                                     glow
                                                                                                 }) => {
    const {setNodeRef} = useDroppable({id: `${cell.row}-${cell.col}`});

    const solved = cell.preFilled || (cell.userLetter !== "" && cell.userLetter === cell.solution);
    const baseClasses =
        "relative w-14 h-14 flex items-center justify-center border-2 rounded-lg text-xl font-semibold shadow-inner transition-colors duration-200";
    const solvedClasses = "bg-purple-300 text-white border-purple-500";
    const emptyClasses = "bg-yellow-100 text-gray-800 border-yellow-500";
    const errorClasses = incorrect ? "border-red-500 shake" : "";
    const glowClasses = glow ? "glow-cell" : "";

    return (
        <div ref={setNodeRef}
             className={`${baseClasses} ${solved ? solvedClasses : emptyClasses} ${errorClasses} ${glowClasses}`}>
            <span className="absolute top-1 left-1 text-xs text-purple-700">{cell.cipher}</span>
            <span className="font-bold">{solved ? cell.solution : cell.userLetter}</span>
        </div>
    );
};

const FeatureCodePuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    const [board, setBoard] = useState<Record<string, CrosswordCell>>(buildBoard());
    const [poolTiles, setPoolTiles] = useState(buildPoolTiles(board));
    const [incorrect, setIncorrect] = useState<string | null>(null);
    const [activeTile, setActiveTile] = useState<DraggableTile | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Check if the whole puzzle is solved
    const puzzleSolved = Object.values(board).every(
        (cell) => cell.preFilled || (cell.userLetter !== "" && cell.userLetter === cell.solution)
    );

    /**
     * Handles the drag start event for draggable elements.
     *
     * @function
     * @param {Object} param - The parameter object containing the active element's data.
     * @param {any} param.active - The currently active draggable element.
     * @returns {void}
     *
     * This function determines the corresponding tile from the poolTiles array
     * based on the active draggable element's ID. It sets the active tile using
     * the setActiveTile method. If no matching tile is found, it sets the active
     * tile to null.
     */
    const handleDragStart = ({active}: any) => {
        const tile = poolTiles.find((p) => p.id === active.id) || null;
        setActiveTile(tile);
    };

    /**
     * Handles the drag end event for a draggable tile.
     *
     * This function is triggered when a drag action for a tile ends. It determines if the dragged tile can be placed
     * into a target board cell based on specific conditions. If valid, the board is updated, the tile is removed
     * from the pool, and it checks if all cells have been correctly solved. If the puzzle is completed, a success event
     * is triggered.
     *
     * If the dragged tile cannot be placed in the target cell or the tile's letter does not match the solution,
     * additional feedback and state updates are provided.
     *
     * @param {object} param0 - The drag event details.
     * @param {object} param0.active - The currently active draggable tile being dragged.
     * @param {object} param0.over - The target cell the tile is dropped over.
     */
    const handleDragEnd = ({active, over}: DragEndEvent) => {
        setActiveTile(null);
        if (!over) return;

        const draggedTile = poolTiles.find((tile) => tile.id === active.id);
        const targetCell = board[over.id];

        if (draggedTile && targetCell && !targetCell.preFilled && !targetCell.userLetter) {
            if (draggedTile.letter === targetCell.solution) {
                const updatedCell = {...targetCell, userLetter: draggedTile.letter};
                const updatedBoard = {...board, [over.id]: updatedCell};
                setBoard(updatedBoard);
                setPoolTiles((prev) => prev.filter((tile) => tile.id !== active.id));

                const solved =
                    Object.values(updatedBoard).every(
                        (cell) => cell.preFilled || (cell.userLetter !== "" && cell.userLetter === cell.solution)
                    );
                if (solved) {
                    setShowConfetti(true);
                    setTimeout(() => {
                        onSolve();
                    }, 6000);
                }
            } else {
                setIncorrect(over.id.toString());
                setTimeout(() => setIncorrect(null), 800);
            }
        }
    };

    /**
     * Renders a grid structure based on the current state of the game board.
     *
     * This function computes the grid layout dynamically using the board data.
     * It calculates the maximum rows and columns required to generate the grid.
     * Cells are either rendered as interactive, droppable components or as empty
     * placeholders, depending on their existence in the board data structure.
     *
     * If the puzzle is solved, cells that belong to the word "ПАНДУРКОВЦИ" will
     * be highlighted with a glow effect.
     *
     * @function
     * @returns {JSX.Element[]} An array of JSX elements representing the rows of the grid.
     */
    const renderGrid = () => {
        const cells = Object.values(board);
        const maxRow = Math.max(...cells.map((c) => c.row));
        const maxCol = Math.max(...cells.map((c) => c.col));

        // Get positions for the word "ПАНДУРКОВЦИ"
        const pandurkovciPositions = words.find((w) => w.text === "ПАНДУРКОВЦИ")?.positions || [];

        const grid = Array.from({length: maxRow + 1}, (_, row) =>
            Array.from({length: maxCol + 1}, (_, col) => {
                const key = `${row}-${col}`;
                const cell = board[key];
                // Add glow if the puzzle is solved and cell belongs to ПАНДУРКОВЦИ
                const glow = puzzleSolved && pandurkovciPositions.some((pos) => pos.row === row && pos.col === col);

                return cell ? (
                    <DroppableCellComp key={key} cell={cell} incorrect={incorrect === key} glow={glow}/>
                ) : (
                    <div key={key} className="w-14 h-14"/>
                );
            })
        );

        return grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
                {row}
            </div>
        ));
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative transition-colors duration-500"
            style={{
                background: "linear-gradient(135deg, #7b68ee, #ffeb3b)",
                backgroundSize: "200% 200%",
                animation: "gradientTransition 12s ease infinite",
            }}
        >
            {showConfetti && <Confetti recycle={false} numberOfPieces={500}/>}

            <style>
                {`
          @keyframes gradientTransition {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes glow {
            from {
              box-shadow: 0 0 10px yellow;
            }
            to {
              box-shadow: 0 0 20px yellow;
            }
          }
          .glow-cell {
            animation: glow 1s ease-in-out infinite alternate;
            box-shadow: 0 0 20px yellow;
          }
          @keyframes shake {
            0% { transform: translateX(0px); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0px); }
          }
          .shake {
            animation: shake 0.4s ease;
          }
        `}
            </style>

            <h2 className="text-3xl md:text-5xl text-center font-bold text-white mb-6">
                Част от нашата бъдещата история 🌠!
            </h2>

            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {renderGrid()}
                <DragOverlay>
                    {activeTile && (
                        <div
                            className="w-12 h-12 flex items-center justify-center text-xl font-bold rounded-full bg-purple-700 text-white shadow-md">
                            {activeTile.letter}
                        </div>
                    )}
                </DragOverlay>
                <div className="flex flex-wrap gap-3 mt-6 justify-center">
                    {poolTiles.map((tile) => (
                        <DraggableTileComp key={tile.id} tile={tile}/>
                    ))}
                </div>
            </DndContext>
        </div>
    );
};

export default FeatureCodePuzzle;