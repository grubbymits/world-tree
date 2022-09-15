import { Direction, getAdjacentCoord } from "./physics.js";
import { Point2D } from "./geometry.js";
class Cloud {
    constructor(_pos, _moisture, _direction, _rain) {
        this._pos = _pos;
        this._moisture = _moisture;
        this._direction = _direction;
        this._rain = _rain;
    }
    get x() { return this._pos.x; }
    get y() { return this._pos.y; }
    get pos() { return this._pos; }
    get moisture() { return this._moisture; }
    get rain() { return this._rain; }
    get minHeight() { return this.rain.minHeight; }
    get direction() { return this._direction; }
    get surface() { return this.rain.surface; }
    set pos(p) { this._pos = p; }
    set moisture(m) { this._moisture = m; }
    dropMoisture(multiplier) {
        let moisture = this.moisture * 0.1 * multiplier;
        this.moisture -= moisture;
        this.rain.addMoistureAt(this.pos, moisture);
    }
    move() {
        while (this.surface.inbounds(this.pos)) {
            let nextCoord = getAdjacentCoord(this.pos, this.direction);
            if (!this.surface.inbounds(nextCoord)) {
                this.dropMoisture(1);
                return;
            }
            let current = this.surface.at(this.x, this.y);
            if (current.height <= this.minHeight || current.terrace < 1) {
                this.pos = nextCoord;
                continue;
            }
            let next = this.surface.at(nextCoord.x, nextCoord.y);
            const multiplier = next.terrace > current.terrace ? 1.5 : 1;
            this.dropMoisture(multiplier);
            this.pos = nextCoord;
        }
    }
}
export class Rain {
    constructor(_surface, _minHeight, moisture, direction) {
        this._surface = _surface;
        this._minHeight = _minHeight;
        this._clouds = Array();
        this._totalClouds = 0;
        this._moistureGrid = new Array();
        for (let y = 0; y < this.surface.depth; y++) {
            this._moistureGrid.push(new Float32Array(this.surface.width));
        }
        switch (direction) {
            default:
                console.assert('unhandled direction');
                break;
            case Direction.North: {
                const y = this.surface.depth - 1;
                for (let x = 0; x < this.surface.width; x++) {
                    this.addCloud(new Point2D(x, y), moisture, direction);
                }
                break;
            }
            case Direction.East: {
                const x = 0;
                for (let y = 0; y < this.surface.depth; y++) {
                    this.addCloud(new Point2D(x, y), moisture, direction);
                }
                break;
            }
            case Direction.South: {
                const y = 0;
                for (let x = 0; x < this.surface.width; x++) {
                    this.addCloud(new Point2D(x, y), moisture, direction);
                }
                break;
            }
            case Direction.West: {
                const x = this.surface.width - 1;
                for (let y = 0; y < this.surface.depth; y++) {
                    this.addCloud(new Point2D(x, y), moisture, direction);
                }
                break;
            }
        }
    }
    get clouds() { return this._clouds; }
    get totalClouds() { return this._totalClouds; }
    get surface() { return this._surface; }
    get minHeight() { return this._minHeight; }
    get moistureGrid() { return this._moistureGrid; }
    moistureAt(x, y) {
        return this._moistureGrid[y][x];
    }
    addMoistureAt(pos, moisture) {
        this.moistureGrid[pos.y][pos.x] += moisture;
    }
    addCloud(pos, moisture, direction) {
        this.clouds.push(new Cloud(pos, moisture, direction, this));
        this._totalClouds++;
    }
    run() {
        while (this.clouds.length != 0) {
            let cloud = this.clouds[this.clouds.length - 1];
            this.clouds.pop();
            cloud.move();
        }
    }
}
