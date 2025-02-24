import React, { useRef, useState, useEffect, useCallback } from "react";

interface Ball {
    number: number; // 0 is the cue ball; all other numbers count toward the sum.
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    active: boolean; // false once pocketed (except for cue ball which resets)
    initialX: number;
    initialY: number;
}

const canvasWidth = 800;
const canvasHeight = 400;
// A lower friction constant means the balls will slow down faster.
const baseFrictionPerSec = 0.85;
const pocketRadius = 30;

const pockets = [
    { x: 0, y: 0 },
    { x: canvasWidth, y: 0 },
    { x: 0, y: canvasHeight },
    { x: canvasWidth, y: canvasHeight },
];

// Compute valid targets based on available numbers that use at least 7 balls.
const computeValidTargets = (numbers: number[]): number[] => {
    const results = new Set<number>();
    const n = numbers.length;

    const recurse = (index: number, count: number, sum: number) => {
        if (index === n) {
            if (count >= 7) {
                results.add(sum);
            }
            return;
        }
        // Include the current number.
        recurse(index + 1, count + 1, sum + numbers[index]);
        // Exclude the current number.
        recurse(index + 1, count, sum);
    };

    recurse(0, 0, 0);
    return Array.from(results);
};

const availableBallNumbers = [2, 3, 7, 8, 11, 13, 17, 5, 6, 9, 12, 10];

const generateRandomTarget = () => {
    const validTargets = computeValidTargets(availableBallNumbers);
    // Calculate the max possible sum (i.e. all available ball numbers)
    const maxPossibleSum = availableBallNumbers.reduce((acc, v) => acc + v, 0);

    // Filter targets to be safe (this should always be true as subset-sums are naturally <= maxPossibleSum)
    const feasibleTargets = validTargets.filter((target) => target <= maxPossibleSum);

    if (feasibleTargets.length === 0) {
        return maxPossibleSum;
    }

    return feasibleTargets[Math.floor(Math.random() * feasibleTargets.length)];
};

const BilliardsInteractivePuzzle: React.FC<{ onSolve: () => void }> = ({ onSolve }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastTimeRef = useRef<number | null>(null);

    const [feedback, setFeedback] = useState<string>("");
    const [aiming, setAiming] = useState<boolean>(false);
    const [aimPos, setAimPos] = useState<{ x: number; y: number } | null>(null);
    const [pocketedCount, setPocketedCount] = useState<number>(0);
    const [pocketedSum, setPocketedSum] = useState<number>(0);
    const [targetSum, setTargetSum] = useState<number>(generateRandomTarget());
    const [balls, setBalls] = useState<Ball[]>([]);

    const resetGame = () => {
        setBalls((prevBalls) =>
            prevBalls.map((ball) => ({
                ...ball,
                x: ball.initialX,
                y: ball.initialY,
                vx: 0,
                vy: 0,
                active: true,
            }))
        );
        setPocketedCount(0);
        setPocketedSum(0);
        const newTarget = generateRandomTarget();
        setTargetSum(newTarget);
        setFeedback(`Sum exceeded target! Game reset. New target is ${newTarget}.`);
    };

    useEffect(() => {
        const initialBalls: Ball[] = [
            {
                number: 0,
                x: 100,
                y: canvasHeight / 2,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "white",
                active: true,
                initialX: 100,
                initialY: canvasHeight / 2,
            },
            {
                number: 2,
                x: 400,
                y: 80,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FF69B4",
                active: true,
                initialX: 400,
                initialY: 80,
            },
            {
                number: 3,
                x: 600,
                y: 200,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#DB7093",
                active: true,
                initialX: 600,
                initialY: 200,
            },
            {
                number: 7,
                x: 700,
                y: 320,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#C71585",
                active: true,
                initialX: 700,
                initialY: 320,
            },
            {
                number: 8,
                x: 450,
                y: 250,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FFB6C1",
                active: true,
                initialX: 450,
                initialY: 250,
            },
            {
                number: 11,
                x: 550,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FFC0CB",
                active: true,
                initialX: 550,
                initialY: 100,
            },
            {
                number: 13,
                x: 350,
                y: 150,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FF82AB",
                active: true,
                initialX: 350,
                initialY: 150,
            },
            {
                number: 17,
                x: 650,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FF1493",
                active: true,
                initialX: 650,
                initialY: 300,
            },
            {
                number: 5,
                x: 250,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#F08080",
                active: true,
                initialX: 250,
                initialY: 100,
            },
            {
                number: 6,
                x: 200,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#FA8072",
                active: true,
                initialX: 200,
                initialY: 300,
            },
            {
                number: 9,
                x: 500,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#CD5C5C",
                active: true,
                initialX: 500,
                initialY: 300,
            },
            {
                number: 12,
                x: 300,
                y: 350,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "#B22222",
                active: true,
                initialX: 300,
                initialY: 350,
            },
            {
                number: 10,
                x: 300,
                y: 200,
                vx: 0,
                vy: 0,
                radius: 15,
                color: "magenta",
                active: true,
                initialX: 300,
                initialY: 200,
            },
        ];
        setBalls(initialBalls);
        lastTimeRef.current = performance.now();
    }, []);

    // Improved collision resolution using velocity swapping for the normal components.
    // This method assumes equal masses and simulates elastic collision.
    const handleBallCollisions = (balls: Ball[]) => {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ballA = balls[i];
                const ballB = balls[j];
                if (!ballA.active || !ballB.active) continue;

                const dx = ballB.x - ballA.x;
                const dy = ballB.y - ballA.y;
                const dist = Math.hypot(dx, dy);
                const minDist = ballA.radius + ballB.radius;

                if (dist < minDist && dist > 0) {
                    // Normalized collision normal.
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Compute normal velocities for each ball.
                    const vAn = ballA.vx * nx + ballA.vy * ny;
                    const vBn = ballB.vx * nx + ballB.vy * ny;

                    // Compute tangential components.
                    const vA_tangential_x = ballA.vx - vAn * nx;
                    const vA_tangential_y = ballA.vy - vAn * ny;
                    const vB_tangential_x = ballB.vx - vBn * nx;
                    const vB_tangential_y = ballB.vy - vBn * ny;

                    // Swap the normal components.
                    ballA.vx = vA_tangential_x + vBn * nx;
                    ballA.vy = vA_tangential_y + vBn * ny;
                    ballB.vx = vB_tangential_x + vAn * nx;
                    ballB.vy = vB_tangential_y + vAn * ny;

                    // Positional correction to resolve overlap.
                    const overlap = minDist - dist;
                    ballA.x -= (overlap / 2) * nx;
                    ballA.y -= (overlap / 2) * ny;
                    ballB.x += (overlap / 2) * nx;
                    ballB.y += (overlap / 2) * ny;
                }
            }
        }
    };

    // Main physics update.
    const updatePhysics = useCallback((dt: number) => {
        // dt is in milliseconds; convert to seconds.
        const dtSec = dt / 100;
        setBalls((prevBalls) => {
            const newBalls = prevBalls.map((ball) => {
                if (!ball.active) return ball;
                const updated = { ...ball };
                // Update position.
                updated.x += updated.vx * dtSec;
                updated.y += updated.vy * dtSec;
                // Apply friction.
                const frictionMultiplier = Math.pow(baseFrictionPerSec, dtSec);
                updated.vx *= frictionMultiplier;
                updated.vy *= frictionMultiplier;

                // Bounce off boundaries.
                if (updated.x - updated.radius < 0 || updated.x + updated.radius > canvasWidth) {
                    updated.vx = -updated.vx;
                    updated.x = Math.max(updated.radius, Math.min(canvasWidth - updated.radius, updated.x));
                }
                if (updated.y - updated.radius < 0 || updated.y + updated.radius > canvasHeight) {
                    updated.vy = -updated.vy;
                    updated.y = Math.max(updated.radius, Math.min(canvasHeight - updated.radius, updated.y));
                }
                return updated;
            });

            handleBallCollisions(newBalls);

            // Check for pocketing.
            newBalls.forEach((ball) => {
                pockets.forEach((pocket) => {
                    const dx = ball.x - pocket.x;
                    const dy = ball.y - pocket.y;
                    if (Math.hypot(dx, dy) < pocketRadius) {
                        if (ball.number === 0) {
                            // Cue ball penalty.
                            ball.x = ball.initialX;
                            ball.y = ball.initialY;
                            ball.vx = 0;
                            ball.vy = 0;
                            setFeedback("Foul! Cue ball pocketed. Try again.");
                        } else if (ball.active) {
                            ball.active = false;
                            const newSum = pocketedSum + ball.number;
                            const newCount = pocketedCount + 1;
                            setPocketedSum(newSum);
                            setPocketedCount(newCount);
                            setFeedback(`Pocketed ball ${ball.number}. Count: ${newCount}, Sum: ${newSum}.`);

                            if (newSum > targetSum) {
                                resetGame();
                            } else if (newCount >= 7 && newSum === targetSum) {
                                setFeedback(`Puzzle solved! You reached ${newSum} in ${newCount} balls.`);
                                setTimeout(() => {
                                    onSolve();
                                }, 2000);
                            }
                        }
                    }
                });
            });

            return newBalls;
        });
    }, [pocketedCount, pocketedSum, targetSum, onSolve]);

    useEffect(() => {
        let animationFrameId: number;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const render = (timestamp: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
            const dt = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            updatePhysics(dt);

            // Clear the canvas.
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = "#8B008B";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw pockets.
            pockets.forEach((pocket) => {
                ctx.beginPath();
                ctx.arc(pocket.x, pocket.y, pocketRadius, 0, 2 * Math.PI);
                ctx.fillStyle = "#4B0082";
                ctx.fill();
            });

            // Draw balls.
            balls.forEach((ball) => {
                if (!ball.active) return;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
                ctx.fillStyle = ball.color;
                ctx.fill();

                if (ball.number !== 0) {
                    ctx.fillStyle = "black";
                    ctx.font = "bold 14px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`${ball.number}`, ball.x, ball.y);
                }
            });

            // Draw the aiming line.
            if (aiming && aimPos) {
                const cue = balls.find((b) => b.number === 0);
                if (cue) {
                    ctx.beginPath();
                    ctx.moveTo(cue.x, cue.y);
                    ctx.lineTo(aimPos.x, aimPos.y);
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [aimPos, aiming, balls, updatePhysics, onSolve]);

    // Start aiming when clicking near the cue ball.
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const cueBall = balls.find((b) => b.number === 0);
        if (cueBall) {
            const distance = Math.hypot(mouseX - cueBall.x, mouseY - cueBall.y);
            if (distance < cueBall.radius + 5) {
                setAiming(true);
                setAimPos({ x: mouseX, y: mouseY });
            }
        }
    };

    // Update aim position when moving the mouse.
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!aiming) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setAimPos({ x: mouseX, y: mouseY });
    };

    // On mouse up, determine the direction and speed.
    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!aiming) return;
        setAiming(false);
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setBalls((prevBalls) =>
            prevBalls.map((ball) => {
                if (ball.number === 0 && ball.active) {
                    // Direction from cue ball to aim endpoint.
                    const dx = mouseX - ball.x;
                    const dy = mouseY - ball.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance > 0) {
                        // Normalize and scale the speed.
                        const unitX = dx / distance;
                        const unitY = dy / distance;
                        const power = Math.min(distance * 0.5, 1000);
                        ball.vx = unitX * power;
                        ball.vy = unitY * power;
                    }
                }
                return ball;
            })
        );
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{ background: "linear-gradient(135deg, #FFC0CB, #FFF0F5)" }}
        >
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#C71585" }}>
                Random Sum Billiards Puzzle
            </h2>
            <p className="text-xl mb-2" style={{ color: "#8B0000" }}>
                Pocket balls until you have at least 7 and their total equals {targetSum}.
            </p>
            <div
                className="mb-4 p-2 rounded"
                style={{
                    backgroundColor: "#ffe4e1",
                    color: "#800000",
                    border: "2px dashed #C71585",
                }}
            >
                Pocketed: {pocketedCount} balls | Current Sum: {pocketedSum}
            </div>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="mb-4 border-4"
                style={{ borderColor: "#C71585", boxShadow: "0 0 15px rgba(199,21,133,0.5)" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
            {feedback && <div className="text-2xl" style={{ color: "#C71585" }}>{feedback}</div>}
        </div>
    );
};

export default BilliardsInteractivePuzzle;