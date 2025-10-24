import config from "./config";

/* Attempting to reduce memory usage :/ */
const CircleManager = (size: number) => {
    const positions = new Float32Array(size * 2);
    const velocity = new Float32Array(size * 2);
    const radiuses = new Float32Array(size * 2);

    return {
        size: size,

        init(i: number, x: number, y: number, r: number, vx: number, vy: number) {
            positions[i * 2] = x;
            positions[i * 2 + 1] = y;
            velocity[i * 2] = vx;
            velocity[i * 2 + 1] = vy;
            radiuses[i] = r;
        },

        getX(i: number) {
            return positions[i * 2];
        },

        getY(i: number) {
            return positions[i * 2 + 1];
        },

        getVX(i: number) {
            return velocity[i * 2];
        },

        getVY(i: number) {
            return velocity[i * 2 + 1];
        },

        getRadius(i: number) {
            return radiuses[i];
        },

        update(i: number, dt: number) {
            const xi = i * 2;
            const yi = xi + 1;
            const vx = velocity[xi];
            const vy = velocity[yi];
            const r = radiuses[i];
            const max = config.mapSize;

            positions[xi] += vx * dt;
            positions[yi] += vy * dt;

            // handle bounds
            if (positions[xi] <= r) {
                positions[xi] = r;
                velocity[xi] = -vx;
            } else if (positions[xi] >= max - r) {
                positions[xi] = max - r;
                velocity[xi] = -vx;
            }

            if (positions[yi] <= r) {
                positions[yi] = r;
                velocity[yi] = -vy;
            } else if (positions[yi] >= max - r) {
                positions[yi] = max - r;
                velocity[yi] = -vy;
            }
        }
    }
}

export default CircleManager;