import { Button } from "@/components/retroui/Button";
import { useState, useEffect, useRef } from "react"
import confetti from "canvas-confetti"

const config = {
    period: 6000,
    steps: 500,
    epsilon: 0.5,
    periodMultiplier: 0.7,
}

function useAnimator(setCursorState: (cursorState: number) => void, shouldStop: boolean, cutNumber: number) {
    const startTimeRef = useRef<number>(Date.now())
    const animationFrameRef = useRef<number | undefined>(undefined)
    const prevCutNumberRef = useRef<number>(cutNumber)
    const prevPeriodRef = useRef<number>(config.period)

    useEffect(() => {
        if (shouldStop) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
            return
        }

        if (cutNumber !== prevCutNumberRef.current) {
            const now = Date.now()
            
            if (cutNumber === 0 && prevCutNumberRef.current > 0) {
                startTimeRef.current = now
            } else {
                const oldPeriod = prevPeriodRef.current
                const newPeriod = config.period * Math.pow(config.periodMultiplier, cutNumber)
                const elapsedInOldPeriod = (now - startTimeRef.current) % oldPeriod
                const relativePosition = elapsedInOldPeriod / oldPeriod
                const elapsedInNewPeriod = relativePosition * newPeriod
                startTimeRef.current = now - elapsedInNewPeriod
            }
            
            prevCutNumberRef.current = cutNumber
            prevPeriodRef.current = config.period * Math.pow(config.periodMultiplier, cutNumber)
        }

        const animate = () => {
            if (shouldStop) {
                return
            }

            const now = Date.now()
            const currentPeriod = config.period * Math.pow(config.periodMultiplier, cutNumber)
            const elapsed = (now - startTimeRef.current) % currentPeriod
            const halfPeriod = currentPeriod / 2

            if (elapsed < halfPeriod) {
                const progress = elapsed / halfPeriod
                setCursorState(Math.floor(progress * config.steps))
            } else {
                const progress = (elapsed - halfPeriod) / halfPeriod
                setCursorState(Math.floor((1 - progress) * config.steps))
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [setCursorState, shouldStop, cutNumber])
}

export const Bread = ({ breadState, cutNumber }: { breadState: [number, number]; cutNumber: number }) => {
    const maxCutNumber = 5;
    const intensity = Math.min(cutNumber / maxCutNumber, 1) * 0.5;
    
    const r = Math.floor(209 * (1 - intensity));
    const g = Math.floor(162 * (1 - intensity));
    const b = Math.floor(96 * (1 - intensity));
    
    const backgroundColor = `rgb(${r}, ${g}, ${b})`;
    
    return (
        <div
            className="absolute top-6 inset-0 rounded-full h-36 border-4 border-black"
            style={{
                backgroundColor: backgroundColor,
                clipPath: `inset(0 ${100 - breadState[1]}% 0 ${breadState[0]}%)`,
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 30px,
                    rgba(0, 0, 0, 0.1) 10px,
                    rgba(0, 0, 0, 0.1) 60px
                )`,
            }}
        />
    )
}

export const SlicedPiece = ({
    start,
    end,
    onAnimationEnd,
    cutNumber
}: {
    start: number;
    end: number;
    onAnimationEnd: () => void;
    cutNumber: number;
}) => {
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => {
            setIsAnimating(true)
        })
    }, [])

    const maxCutNumber = 5;
    const intensity = Math.min(cutNumber / maxCutNumber, 1) * (cutNumber > 2 ? 1 : 0);
    
    const r = Math.floor(209 * (1 - intensity));
    const g = Math.floor(162 * (1 - intensity));
    const b = Math.floor(96 * (1 - intensity));
    
    const backgroundColor = `rgb(${r}, ${g}, ${b})`;

    return (
        <div
            className={`absolute top-6 inset-0 rounded-full transition-all duration-500 ease-in h-36 border-4 border-black`}
            style={{
                backgroundColor: backgroundColor,
                clipPath: `inset(0 ${100 - end}% 0 ${start}%)`,
                transform: isAnimating ? `translateY(100%) scale(0.8)` : 'translateY(0) scale(1)',
                opacity: isAnimating ? 0 : 1,
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 30px,
                    rgba(0, 0, 0, 0.1) 10px,
                    rgba(0, 0, 0, 0.1) 60px
                )`,
            }}
            onTransitionEnd={onAnimationEnd}
        />
    )
}

export const Cursor = ({
    percentage,
    cutNumber,
}: {
    percentage: number;
    cutNumber: number;
}) => {
    const maxCutNumber = 4;
    const intensity = Math.min(cutNumber / maxCutNumber, 1);

    const glowSize = intensity * 25;
    const glowOpacity = intensity * 0.9;

    const lerp = (a: number, b: number) => a + (b - a) * intensity;
    const topColor = `rgba(${lerp(0, 255)}, ${lerp(0, 180)}, ${lerp(
        0,
        60
    )}, 1)`; // black -> orange
    const midColor = `rgba(${lerp(0, 255)}, ${lerp(0, 60)}, ${lerp(
        0,
        0
    )}, 0.9)`; // black -> red
    const bottomColor = `rgba(${lerp(0, 140)}, 0, 0, 0.75)`; // dark -> deep red

    return (
        <div
            className="absolute top-0 bottom-0 w-1 h-48"
            style={{
                left: `${percentage}%`,
                transform: "translateX(-50%)",

                background: `
                    linear-gradient(
                        to bottom,
                        ${topColor},
                        ${midColor},
                        ${bottomColor}
                    )
                `,

                boxShadow: `
                    0 0 ${glowSize}px rgba(255, 80, 0, ${glowOpacity}),
                    0 0 ${glowSize * 1.5}px rgba(255, 40, 0, ${glowOpacity * 0.7}),
                    0 0 ${glowSize * 2}px rgba(255, 0, 0, ${glowOpacity * 0.4})
                `,
            }}
        />
    );
};



export function CutBread(breadState: [number, number], percentage: number): { status: "playing" | "lost" | "won"; newBreadState: [number, number] } {
    if (percentage < breadState[0] || percentage > breadState[1]) {
        return {
            status: "lost",
            newBreadState: breadState,
        }
    }

    const keepLeft = percentage - breadState[0] < breadState[1] - percentage
    if (keepLeft) {
        return {
            status: percentage - breadState[0] < config.epsilon ? "lost" : "playing",
            newBreadState: [breadState[0], percentage] as [number, number],
        }
    } else {
        return {
            status: breadState[1] - percentage < config.epsilon ? "lost" : "playing",
            newBreadState: [percentage, breadState[1]] as [number, number],
        }
    }
}

export default function SlicingHard() {
    const [cursorState, setCursorState] = useState(0)
    const [breadState, setBreadState] = useState<[number, number]>([0, 100])
    const [status, setStatus] = useState<"playing" | "lost" | "won">("playing")
    const [cutNumber, setCutNumber] = useState(0)
    useAnimator(setCursorState, status !== "playing", cutNumber)
    const percentage = (cursorState / config.steps) * 100
    const [slicedPiece, setSlicedPiece] = useState<{ start: number; end: number } | null>(null)

    const handleCut = () => {
        const { status, newBreadState } = CutBread(breadState, percentage)
        setStatus(status)

        if (status === "playing") {
            // Determine which piece is being removed
            const keepLeft = percentage - breadState[0] < breadState[1] - percentage
            if (keepLeft) {
                // Right piece is being removed
                setSlicedPiece({ start: percentage, end: breadState[1] })
            } else {
                // Left piece is being removed
                setSlicedPiece({ start: breadState[0], end: percentage })
            }

            // Update bread state after a short delay to allow animation
            setTimeout(() => {
                setBreadState(newBreadState)
            }, 50)

            const newCutNumber = cutNumber + 1
            setCutNumber(newCutNumber)


        } else {
        }
    }

    const handleSlicedPieceAnimationEnd = () => {
        setSlicedPiece(null)
    }

    const handleRestart = () => {
        setStatus("playing")
        setBreadState([0, 100])
        setSlicedPiece(null)
        setCutNumber(0)
    }

    const cutMap = (cutNumber: number) => {
        if (cutNumber <= 3) {
            return "💩 Generational aura debt."
        } else if (cutNumber <= 4) {
            return "🤓☝️ Go back to easy mode where you belong."
        } else if (cutNumber <= 5) {
            return "👲 U make the asian dad proud. But can do better!"
        } else if (cutNumber <= 6) {
            return "👁️👄👁️ wow okay err what"
        } else {
            return "🧙‍♂️ How did you even get here??"
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
        <div
            className="flex flex-col items-center justify-start h-128 p-8 gap-8"
            style={{ userSelect: 'none' }}
        >
            <div className="flex flex-col items-center justify-center">
                <p className="text-md font-bold text-red-500">Hard Mode</p>
                <h1 className="text-2xl font-bold">
                    {status === "playing" && `Cut number ${cutNumber}`}
                    {status === "lost" && <span className="text-black-500">
                        You have managed {cutNumber} cuts. {cutMap(cutNumber)}
                    </span>}
                    {status === "won" && <span className="text-green-500">You won!</span>}
                </h1>
            </div>

            <div className="relative w-128 h-48 flex">
                <Bread breadState={breadState} cutNumber={cutNumber} />
                {slicedPiece && (
                    <SlicedPiece
                        start={slicedPiece.start}
                        end={slicedPiece.end}
                        onAnimationEnd={handleSlicedPieceAnimationEnd}
                        cutNumber={cutNumber}
                    />
                )}
                <Cursor percentage={percentage} cutNumber={cutNumber} />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
                <Button
                    className="bg-red-500 text-white hover:bg-red-400"
                    onClick={
                        status === "playing" ? handleCut :
                            status === "lost" ? handleRestart : handleRestart
                    }
                >
                    {status === "playing" ? "Cut!" : status === "lost" ? "Restart" : "Restart"}
                </Button>
            </div>

        </div>
        </div>
    )
}

