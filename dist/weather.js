import { Direction, getDirectionCoords } from "./physics.js";
export class Rain {
    constructor(_x, _y, _moisture, _direction) {
        this._x = _x;
        this._y = _y;
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
    static get moistureGrid() { return this._moistureGrid; }
    static add(x, y, moisture, direction) {
        this._clouds.push(new Rain(x, y, moisture, direction));
        this._totalClouds++;
    }
    get finished() { return this._finished; }
    dropMoisture(moisture) {
        Rain.moistureGrid[this._y][this._x] += moisture;
        this._moisture -= moisture;
        return this._moisture <= 0;
    }
    update() {
        if (this._finished) {
            return true;
        }
        let nextCoord = getDirectionCoords(this._x, this._y, this._direction);
        if (!Rain._surface.inbounds(nextCoord)) {
            this._finished = true;
            return true;
        }
        let current = Rain._surface.at(this._x, this._y);
        if (current.height <= Rain._waterLevel) {
            this._x = nextCoord.x;
            this._y = nextCoord.y;
            return false;
        }
        let next = Rain._surface.at(nextCoord.x, nextCoord.y);
        let multiplier = (next.height / current.height);
        let total = 0.01 + (0.05 * this._moisture * multiplier);
        let available = Math.min(this._moisture, total);
        this._finished = this.dropMoisture(available);
        if (this._finished) {
            return true;
        }
        if (next.terrace > current.terrace) {
            let dirA = (this._direction + 1) % Direction.Max;
            let dirB = (this._direction + Direction.NorthWest) % Direction.Max;
            let pointA = getDirectionCoords(this._x, this._y, dirA);
            let pointB = getDirectionCoords(this._x, this._y, dirB);
            let numClouds = 2;
            if (Rain._surface.inbounds(pointA) && Rain._surface.inbounds(pointB)) {
                Rain.add(pointA.x, pointA.y, this._moisture / 3, dirA);
                Rain.add(pointB.x, pointB.y, this._moisture / 3, dirB);
                numClouds = 3;
                console.log("splitting a cloud into three parts");
            }
            else if (Rain._surface.inbounds(pointA)) {
                Rain.add(pointA.x, pointA.y, this._moisture / 2, dirA);
            }
            else if (Rain._surface.inbounds(pointB)) {
                Rain.add(pointB.x, pointB.y, this._moisture / 2, dirB);
            }
            else {
                this._x = nextCoord.x;
                this._y = nextCoord.y;
                return false;
            }
            this._moisture /= numClouds;
        }
        this._x = nextCoord.x;
        this._y = nextCoord.y;
        return false;
    }
}
Rain.rain = 0.5;
Rain._clouds = Array();
Rain._totalClouds = 0;
