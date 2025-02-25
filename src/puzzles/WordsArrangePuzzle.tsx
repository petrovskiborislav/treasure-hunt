import React, {useState} from "react";
import {DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";
import Confetti from "react-confetti";

// PlacedLetter is a type for the state of a single slot which can contain either a letter or null (empty).
type PlacedLetter = string | null;

// PlacedLetters is a type for the collection of all placed letters in a 2D array, representing the puzzle grid.
type PlacedLetters = PlacedLetter[][];

// SourceType is a type for different source types of a dragged item.
type SourceType =
    | { type: "available"; index: number }
    | { type: "placed"; wordIndex: number; letterIndex: number };

// Prefix constants for generating unique IDs for draggable items and droppable slots.
const LETTER_PREFIX = "letter-";
const SLOT_PREFIX = "slot-";

// DraggableLetter is a component representing a draggable letter in the pool or grid.
const DraggableLetter = ({letter, id}: { letter: string; id: string }) => {
    // Initialize the draggable behavior using the DnD Kit.
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({id});

    return (
        <div
            ref={setNodeRef} // Link the draggable element to the DnD context
            {...listeners} // Enable interactions like click and drag
            {...attributes} // Apply additional props needed for accessibility
            style={{
                transform: CSS.Translate.toString(transform),
                boxShadow: isDragging ? "0 8px 12px rgba(0, 0, 0, 0.3)" : undefined,
                cursor: "grab",
            }}
            className={`w-12 h-12 flex items-center justify-center 
                        text-xl font-bold rounded-full bg-pink-500 text-white 
                        shadow-md hover:scale-110 hover:shadow-lg`}
        >
            {letter}
        </div>
    );
};

// DroppableSlot is a component representing a single slot in the puzzle grid.
const DroppableSlot = ({
                           wordIndex,
                           letterIndex,
                           letter,
                           isCorrect,
                       }: {
    wordIndex: number;
    letterIndex: number;
    letter: PlacedLetter; // The current letter in the slot or null
    isCorrect: boolean; // Whether the letter is correctly placed
}) => {
    // Initialize the droppable behavior using the DnD Kit.
    const {setNodeRef} = useDroppable({id: `${SLOT_PREFIX}${wordIndex}-${letterIndex}`});

    return (
        <div
            ref={setNodeRef}
            className={`w-14 h-14 flex items-center justify-center border-2 rounded-lg 
                        text-xl font-semibold shadow-inner
                        ${
                isCorrect
                    ? "bg-green-400 text-white border-green-700 animate-pulse"
                    : "bg-pink-200 border-pink-500"
            }`}
        >
            {/* Display the letter if present or an underscore to indicate an empty slot*/}
            {letter ? <DraggableLetter letter={letter} id={`slotLetter-${wordIndex}-${letterIndex}`}/> : "_"}
        </div>
    );
};

// Puzzle1 is the main component managing the entire puzzle.
const WordsArrangePuzzle: React.FC<{ onSolve: () => void }> = ({onSolve}) => {
    // Define the correct answer to the puzzle as a 2D array of words and letters.
    const correctAnswer = "СЛАДУРО ТИ СИ МОЕТО СЪКРОВИЩЕ".split(" ").map((word) => word.split(""));

    // Shuffle the letters from the correct answer to create the pool of available letters.
    const shuffledLetters = correctAnswer.flat().sort(() => Math.random() - 0.5);

    // Helper function to create a deep clone of a 2D array (used to prevent direct mutation of state).
    const clone2DArray = (array: PlacedLetters) => array.map((row) => row.slice());

    // Helper function to check if the user's solution matches the correct answer.
    const isPuzzleSolved = (placedLetters: PlacedLetters, correctAnswer: PlacedLetters) => {
        return JSON.stringify(placedLetters) === JSON.stringify(correctAnswer);
    };

    // State to track the current placement of letters in the grid.
    const [placedLetters, setPlacedLetters] = useState<PlacedLetters>(
        correctAnswer.map((word) => word.map(() => null)) // Initially all null
    );

    // State to manage the pool of shuffled available letters.
    const [availableLetters, setAvailableLetters] = useState(shuffledLetters);

    // State to track the letter currently being dragged.
    const [activeLetter, setActiveLetter] = useState<string | null>(null);

    const [showConfetti, setShowConfetti] = useState(false);

    // handleDrop handles the placement of a letter into the grid or back to the pool.
    const handleDrop = (
        letter: string,
        targetWordIndex: number | null,
        targetLetterIndex: number | null,
        source: SourceType
    ) => {
        // Clone the current grid of placed letters to avoid state mutation.
        const updatedPlacedLetters = clone2DArray(placedLetters);
        let replacedLetter: string | null = null;

        // Remove the letter from its source location.
        if (source.type === "available") {
            // Remove from pool.
            setAvailableLetters((prev) => prev.filter((_, i) => i !== source.index));
        } else if (source.type === "placed") {
            // Remove from slot.
            updatedPlacedLetters[source.wordIndex][source.letterIndex] = null;
        }

        // Place the letter in the new target slot or return it to the pool if no valid target.
        if (targetWordIndex !== null && targetLetterIndex !== null) {
            // Capture replaced letter.
            replacedLetter = updatedPlacedLetters[targetWordIndex][targetLetterIndex];
            // Place letter in the slot.
            updatedPlacedLetters[targetWordIndex][targetLetterIndex] = letter;
        } else {
            // Add letter back to the available pool.
            setAvailableLetters((prev) => [...prev, letter]);
        }

        // Return any replaced letter to the pool,
        if (replacedLetter) {
            setAvailableLetters((prev) => [...prev, replacedLetter]);
        }

        // Update the state with the new grid of placed letters.
        setPlacedLetters(updatedPlacedLetters);

        // Check if the new placements solve the puzzle.
        if (isPuzzleSolved(updatedPlacedLetters, correctAnswer)) {
            // Trigger the provided onSolve callback.
            setShowConfetti(true);
            setTimeout(() => {onSolve();}, 6000);
        }
    };

    // handleDragEnd handles the end of a drag event (either drop or cancel).
    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (active && over) {
            // ID of the dragged item.
            const activeId = active.id.toString();
            // ID of the drop location.
            const overId = over.id.toString();

            if (activeId.startsWith(LETTER_PREFIX)) {
                // Dragging from the available pool.
                const activeIndex = parseInt(activeId.replace(LETTER_PREFIX, ""), 10);
                const letter = availableLetters[activeIndex];
                if (overId.startsWith(SLOT_PREFIX)) {
                    const [, targetWordIndex, targetLetterIndex] = overId.split("-").map(Number);
                    handleDrop(letter, targetWordIndex, targetLetterIndex, {
                        type: "available",
                        index: activeIndex,
                    });
                }
            } else if (activeId.startsWith("slotLetter-")) {
                // Dragging a letter from one slot to another or back to the pool.
                const [, sourceWordIndex, sourceLetterIndex] = activeId.split("-").map(Number);
                const letter = placedLetters[sourceWordIndex][sourceLetterIndex];
                if (overId.startsWith(SLOT_PREFIX)) {
                    const [, targetWordIndex, targetLetterIndex] = overId.split("-").map(Number);
                    handleDrop(letter!, targetWordIndex, targetLetterIndex, {
                        type: "placed",
                        wordIndex: sourceWordIndex,
                        letterIndex: sourceLetterIndex,
                    });
                } else {
                    handleDrop(letter!, null, null, {
                        type: "placed",
                        wordIndex: sourceWordIndex,
                        letterIndex: sourceLetterIndex,
                    });
                }
            }
        }

        // Reset the drag state.
        setActiveLetter(null);
    };

    const handleDragStart = (event: DragEndEvent) => {
        const activeID = event.active.id.toString();
        if (activeID.startsWith(LETTER_PREFIX)) {
            const activeIndex = parseInt(activeID.replace(LETTER_PREFIX, ""), 10);
            setActiveLetter(availableLetters[activeIndex]);
        } else if (activeID.startsWith("slotLetter-")) {
            const [, wordIndex, letterIndex] = activeID.split("-").map(Number);
            setActiveLetter(placedLetters[wordIndex][letterIndex]);
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-400 via-red-300 to-yellow-300 p-6">

                {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

                {/* Title */}
                <h2 className="text-3xl md:text-5xl text-center font-bold text-white mb-6">
                    Честита годишнина, любов моя 👩🏻‍❤️‍💋‍👨🏻!
                </h2>

                {/* Puzzle Grid */}
                <div
                    className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl justify-center shadow-lg border-4 border-pink-600 max-w-4xl">
                    {correctAnswer.map((word, wordIndex) => (
                        <div key={wordIndex} className="flex gap-2 p-4">
                            {word.map((correctLetter, letterIndex) => (
                                <DroppableSlot
                                    key={`${wordIndex}-${letterIndex}`}
                                    wordIndex={wordIndex}
                                    letterIndex={letterIndex}
                                    letter={placedLetters[wordIndex][letterIndex]}
                                    isCorrect={placedLetters[wordIndex][letterIndex] === correctLetter}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Draggable Letters */}
                <div className="flex flex-wrap gap-4 mt-8 justify-center">
                    {availableLetters.map((letter, index) => (
                        <DraggableLetter key={index} letter={letter} id={`${LETTER_PREFIX}${index}`}/>
                    ))}
                </div>

                {/* Drag Overlay (renders the dragged letter) */}
                <DragOverlay>
                    {activeLetter && (
                        <div
                            className="px-4 py-4 border-pink-500 text-white font-semibold flex items-center justify-center rounded-md animate-pulse">
                            {activeLetter}
                        </div>
                    )}
                </DragOverlay>

            </div>
        </DndContext>
    );
};

export default WordsArrangePuzzle;
