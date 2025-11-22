import { Button } from "@/components/retroui/Button";
import { useState, useEffect, useRef } from "react"
import confetti from "canvas-confetti"

const config = {
    period: 5000, // 3 seconds
    steps: 500,
    epsilon: 0.5,
    winSlices: 5,
}

function useAnimator(setCursorState: (cursorState: number) => void, shouldStop: boolean) {
    const startTimeRef = useRef<number>(Date.now())
    const animationFrameRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        if (shouldStop) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
            return
        }

        const animate = () => {
            if (shouldStop) {
                return
            }

            const now = Date.now()
            const elapsed = (now - startTimeRef.current) % config.period
            const halfPeriod = config.period / 2

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
    }, [setCursorState, shouldStop])
}

const Bread = ({ breadState }: { breadState: [number, number] }) => {
    return (
        <div
            className="absolute top-6 inset-0 rounded-full h-36 border-4 border-black"
            style={{
                backgroundColor: '#d1a260', // beige
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

const ConfettiOnWin = () => {
    const end = Date.now() + 300
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#A66CFF"];
    const frame = () => {
        if (Date.now() > end) return
        confetti({
            particleCount: 10,
            angle: 60,
            spread: 75,
            startVelocity: 60,
            origin: { x: 0, y: 0.5 },
            colors: colors,
        })
        confetti({
            particleCount: 10,
            angle: 120,
            spread: 75,
            startVelocity: 60,
            origin: { x: 1, y: 0.5 },
            colors: colors,
        })
        requestAnimationFrame(frame)
    }
    frame()
}

const SlicedPiece = ({
    start,
    end,
    onAnimationEnd
}: {
    start: number;
    end: number;
    onAnimationEnd: () => void
}) => {
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => {
            setIsAnimating(true)
        })
    }, [])

    return (
        <div
            className={`absolute top-6 inset-0 rounded-full transition-all duration-500 ease-in h-36 border-4 border-black`}
            style={{
                backgroundColor: '#d1a260',
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

const Cursor = ({ percentage }: { percentage: number }) => {
    return (
        <div
            className="absolute top-0 bottom-0 w-1 bg-black h-48"
            style={{
                left: `${percentage}%`,
                transform: 'translateX(-50%)',
            }}
        />
    )
}

function CutBread(breadState: [number, number], percentage: number): { status: "playing" | "lost" | "won"; newBreadState: [number, number] } {
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

export default function Slicing() {
    const [cursorState, setCursorState] = useState(0)
    const [breadState, setBreadState] = useState<[number, number]>([0, 100])
    const [status, setStatus] = useState<"playing" | "lost" | "won">("playing")
    useAnimator(setCursorState, status !== "playing")
    const percentage = (cursorState / config.steps) * 100
    const [slicedPiece, setSlicedPiece] = useState<{ start: number; end: number } | null>(null)
    const [cutNumber, setCutNumber] = useState(0)

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

            if (newCutNumber >= config.winSlices && status === "playing") {
                setStatus("won")
                ConfettiOnWin()
            }
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

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen p-8 gap-8"
            style={{ userSelect: 'none' }}
        >
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">
                    {status === "playing" && `Make ${config.winSlices} cuts!`}
                    {status === "lost" && <span className="text-red-500">You lost!</span>}
                    {status === "won" && <span className="text-green-500">You won!</span>}
                </h1>
            </div>

            <div className="relative w-96 h-48 flex">
                <Bread breadState={breadState} />
                {slicedPiece && (
                    <SlicedPiece
                        start={slicedPiece.start}
                        end={slicedPiece.end}
                        onAnimationEnd={handleSlicedPieceAnimationEnd}
                    />
                )}
                <Cursor percentage={percentage} />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
                <Button
                    onClick={
                        status === "playing" ? handleCut :
                            status === "lost" ? handleRestart : handleRestart
                    }
                >
                    {status === "playing" ? "Cut!" : status === "lost" ? "Restart" : "Restart"}
                </Button>
                <p className="font-bold text-red-500">
                    {cutNumber}
                </p>
            </div>
        </div>
    )
}

