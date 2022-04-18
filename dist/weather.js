import { Direction, getAdjacentCoord } from "./physics.js";
export class Rain {
    constructor(_pos, _moisture, _direction) {
        this._pos = _pos;
        this._moisture = _moisture;
        this._direction = _direction;
        this._finished = false;
    }
    static init(waterLevel, surface) {
        this._waterLevel = waterLevel;
        this._surface = surface;
        this._moistureGrid = new Array();
        for (let y = 0; y < surface.depth; y++) {
            this._moistureGrid.push(new Float32Array(surface.width));
        }
    }
    static get clouds() { return this._clouds; }
    static get totalClouds() { return this._totalClouds; }
    static get totalRain() { return this._totalRainDropped; }
    static get moistureGrid() { return this._moistureGrid; }
    static add(pos, moisture, direction) {
        this._clouds.push(new Rain(pos, moisture, direction));
        this._totalClouds++;
    }
    get x() { return this._pos.x; }
    get y() { return this._pos.y; }
    get pos() { return this._pos; }
    get moisture() { return this._moisture; }
    get direction() { return this._direction; }
    get finished() { return this._finished; }
    set pos(p) { this._pos = p; }
    set moisture(m) { this._moisture = m; }
    set finished(f) { this._finished = f; }
    dropMoisture(moisture) {
        Rain.moistureGrid[this.y][this.x] += moisture;
        this._moisture -= moisture;
        Rain._totalRainDropped += moisture;
        return this._moisture <= 0;
    }
    update() {
        if (this.finished) {
            return true;
        }
        let nextCoord = getAdjacentCoord(this.pos, this.direction);
        if (!Rain._surface.inbounds(nextCoord)) {
            this.finished = true;
            return true;
        }
        let current = Rain._surface.at(this.x, this.y);
        if (current.height <= Rain._waterLevel) {
            this.pos = nextCoord;
            return false;
        }
        let next = Rain._surface.at(nextCoord.x, nextCoord.y);
        let multiplier = (next.height / current.height);
        let total = 0.01 + (0.05 * this.moisture * multiplier);
        let available = Math.min(this.moisture, total);
        this.finished = this.dropMoisture(available);
        if (this.finished) {
            return true;
        }
        if (next.terrace > current.terrace) {
            let dirA = (this.direction + 1) % Direction.Max;
            let dirB = (this.direction + Direction.NorthWest) % Direction.Max;
            let pointA = getAdjacentCoord(this.pos, dirA);
            let pointB = getAdjacentCoord(this.pos, dirB);
            let numClouds = 2;
            if (Rain._surface.inbounds(pointA) && Rain._surface.inbounds(pointB)) {
                Rain.add(pointA, this.moisture / 3, dirA);
                Rain.add(pointB, this.moisture / 3, dirB);
                numClouds = 3;
            }
            else if (Rain._surface.inbounds(pointA)) {
                Rain.add(pointA, this.moisture / 2, dirA);
            }
            else if (Rain._surface.inbounds(pointB)) {
                Rain.add(pointB, this.moisture / 2, dirB);
            }
            else {
                this.pos = nextCoord;
                return false;
            }
            this.moisture /= numClouds;
        }
        this.pos = nextCoord;
        return false;
    }
}
Rain.rain = 0.5;
Rain._clouds = Array();
Rain._totalClouds = 0;
Rain._totalRainDropped = 0;
