export const PI = Math.PI;
export const PI2 = PI * 2;
export const random = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const lerp = (a: number, b: number, f: number) => {
    return a + (b - a) * f;
}