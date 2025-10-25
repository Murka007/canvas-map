import CircleManager from "./Circle";
import config from "./config";
import { getDistance, getMidpoint, lerp, PI2, random } from "./Math";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const ctx = canvas.getContext("2d", { alpha: false })!;

const viewport = {
    w: 1920,
    h: 1080
} as const;

let zoom = 0.05;
let scale = 1;
let lscale = 0;
let dpr = 1;

const camera = {
    x: config.mapSize / 2,
    y: config.mapSize / 2,
    lx: config.mapSize / 2,
    ly: config.mapSize / 2,
}

const mouse = {
    x: 0,
    y: 0,
    dragging: false
}

const resize = () => {
    dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    scale = Math.max(width / viewport.w, height / viewport.h) * dpr * zoom;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    if (lscale === 0) {
        lscale = scale;
    }
}
resize();
window.addEventListener("resize", resize);

const handleZoom = (factor: number, midX: number, midY: number) => {
    zoom = Math.min(factor, 1);

    const screen_w = canvas.width / scale;
    const screen_h = canvas.height / scale;
    const world_start = {
        x: (midX / scale - screen_w / 2) + camera.x,
        y: (midY / scale - screen_h / 2) + camera.y
    } as const;

    resize();

    const nscreen_w = canvas.width / scale;
    const nscreen_h = canvas.height / scale;
    const world_end = {
        x: (midX / scale - nscreen_w / 2) + camera.x,
        y: (midY / scale - nscreen_h / 2) + camera.y
    } as const;

    camera.x += world_start.x - world_end.x;
    camera.y += world_start.y - world_end.y;
}

window.addEventListener("wheel", event => {
    const factor = 1.15;
    if (event.deltaY < 0) {
        zoom *= factor;
    } else {
        zoom /= factor;
    }

    const rect = canvas.getBoundingClientRect();
    const mouse_x = (event.clientX - rect.left) * dpr;
    const mouse_y = (event.clientY - rect.top) * dpr;
    handleZoom(zoom, mouse_x, mouse_y);
});

canvas.addEventListener("mousedown", event => {
    mouse.dragging = true;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

const draggingReset = () => {
    mouse.dragging = false;
}
canvas.addEventListener("mouseup", draggingReset);
canvas.addEventListener("mouseleave", draggingReset);

const handleMove = (x: number, y: number) => {
    if (!mouse.dragging) return;
    const diffX = (x - mouse.x) / scale * dpr;
    const diffY = (y - mouse.y) / scale * dpr;
    camera.x -= diffX;
    camera.y -= diffY;
    mouse.x = x;
    mouse.y = y;
}

canvas.addEventListener("mousemove", event => {
    handleMove(event.clientX, event.clientY);
});

let lastTouchDistance: number | null = null;

canvas.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        mouse.dragging = true;
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
    } else if (e.touches.length === 2) {
        lastTouchDistance = getDistance(e.touches[0], e.touches[1]);
    }
});

canvas.addEventListener("touchmove", event => {
    event.preventDefault();

    if (event.touches.length === 1 && mouse.dragging) {
        const touch = event.touches[0];
        handleMove(touch.clientX, touch.clientY);
    } else if (event.touches.length === 2) {
        const dist = getDistance(event.touches[0], event.touches[1]);
        const mid = getMidpoint(event.touches[0], event.touches[1]);
        const rect = canvas.getBoundingClientRect();
        const midX = (mid.x - rect.left) * dpr;
        const midY = (mid.y - rect.top) * dpr;

        if (lastTouchDistance) {
            const factor = dist / lastTouchDistance;
            handleZoom(zoom * factor, midX, midY);
        }

        lastTouchDistance = dist;
    }
}, { passive: false });

canvas.addEventListener("touchend", e => {
    if (e.touches.length < 2) lastTouchDistance = null;

    // important to resync to avoid "snapping"
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        mouse.dragging = true;
    } else if (e.touches.length === 0) {
        mouse.dragging = false;
    }
});

const circleManager = CircleManager(5_000);
for (let i = 0; i < circleManager.size; i++) {
    const r = Math.floor(1500 / (i + 1) * 10) + 300;
    const x = random(r, config.mapSize - r);
    const y = random(r, config.mapSize - r);
    const angle = Math.random() * PI2;

    const speed = random(1, 10);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    circleManager.init(i, x, y, r, vx, vy,);
}

const renderText = (text: string) => {
    ctx.save();
    ctx.font = "600 20px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#f1f1f1";
    ctx.strokeStyle = "#4d4848";
    ctx.lineWidth = 6;
    ctx.letterSpacing = "4px";
    ctx.lineJoin = "round";
    ctx.strokeText(text, 5, 5);
    ctx.fillText(text, 5, 5);
    ctx.restore();
}

const times: number[] = [];
let lastTime = performance.now();
let currentFPS = 0;

let dtStart = performance.now();
const render = () => {
    requestAnimationFrame(render);

    // FPS COUNTER (MORE ACCURATE)
    const now = performance.now();
    while (times.length > 0 && times[0]! <= now - 1000) {
        times.shift();
    }

    times.push(now);
    const fps = times.length;
    if (now - lastTime >= 1000) {
        currentFPS = fps;
        lastTime = now;
    }

    const dt = now - dtStart;
    dtStart = now;

    const blend = (1 - Math.exp(-10 * dt / 1000)) * 0.4;
    camera.lx = lerp(camera.lx, camera.x, blend);
    camera.ly = lerp(camera.ly, camera.y, blend);
    lscale = lerp(lscale, scale, blend);

    const screenW = canvas.width / lscale;
    const screenH = canvas.height / lscale;

    ctx.clearRect(0, 0, screenW, screenH);
    ctx.fillStyle = "#98b979";
    ctx.fillRect(0, 0, screenW, screenH);

    const viewX = camera.lx - screenW / 2;
    const viewY = camera.ly - screenH / 2;
    
    ctx.save();
    ctx.setTransform(lscale, 0, 0, lscale, 0, 0);
    ctx.translate(-viewX, -viewY);
    ctx.fillStyle = "#a6ca85";
    ctx.fillRect(0, 0, config.mapSize, config.mapSize);

    ctx.fillStyle = "#D66969";
    for (let i=0;i<circleManager.size;i++) {
        circleManager.update(i, dt);
        
        const x = circleManager.getX(i);
        const y = circleManager.getY(i);
        const r = circleManager.getRadius(i);

        // skip rendering
        if (x + r < viewX || x - r > viewX + screenW ||
            y + r < viewY || y - r > viewY + screenH) continue;
        
        ctx.beginPath();
        ctx.arc(x, y, r, 0, PI2);
        ctx.fill();
    }
    ctx.restore();

    renderText(`Entities: ${circleManager.size}, FPS: ${currentFPS}`);
}

requestAnimationFrame(render);

if (import.meta.hot) {
    import.meta.hot.accept();
}