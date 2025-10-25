export const PI = Math.PI;
export const PI2 = PI * 2;
export const random = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const lerp = (a: number, b: number, f: number) => {
    return a + (b - a) * f;
}

export const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

export const getMidpoint = (touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
});