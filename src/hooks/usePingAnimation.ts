import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to manage the ping animation loop.
 * @param durationMs Real-time duration of the animation in milliseconds.
 */
export const usePingAnimation = (durationMs: number = 15000) => {
    const [isPinging, setIsPinging] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100

    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const startPing = () => {
        if (isPinging) return;
        setIsPinging(true);
        setProgress(0);
        startTimeRef.current = performance.now();
    };

    const stopPing = () => {
        setIsPinging(false);
        setProgress(0);
        cancelAnimationFrame(animationRef.current);
    };

    useEffect(() => {
        if (!isPinging) return;

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;

            if (elapsed >= durationMs) {
                setProgress(100);
                setIsPinging(false);
                return;
            }

            setProgress((elapsed / durationMs) * 100);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPinging, durationMs]);

    return {
        isPinging,
        progress,
        startPing,
        stopPing
    };
};
