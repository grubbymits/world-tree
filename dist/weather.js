import { Direction, getDirectionCoords } from "./physics.js";
export class Rain {
    constructor(_x, _y, _moisture, _waterLevel, _booster, _direction, _surface) {
        this._x = _x;
        this._y = _y;
        this._moisture = _moisture;
        this._waterLevel = _waterLevel;
        this._booster = _booster;
        this._direction = _direction;
        this._surface = _surface;
        this._finished = false;
    }
    static get clouds() { return this._clouds; }
    static add(x, y, moisture, waterLevel, booster, direction, surface) {
        this._clouds.push(new Rain(x, y, moisture, waterLevel, booster, direction, surface));
    }
    get finished() { return this._finished; }
    update() {
        if (this._finished) {
            return true;
        }
        let nextCoord = getDirectionCoords(this._x, this._y, this._direction);
        if (!this._surface.inbounds(nextCoord)) {
            this._finished = true;
            return true;
        }
        let current = this._surface.at(this._x, this._y);
        if (current.height <= this._waterLevel) {
            this._x = nextCoord.x;
            this._y = nextCoord.y;
            return false;
        }
        let next = this._surface.at(nextCoord.x, nextCoord.y);
        let multiplier = (next.height / current.height) * this._booster;
        let total = 0.01 + (0.05 * this._moisture * multiplier);
        if (total > this._moisture) {
            current.moisture += this._moisture;
            this._finished = true;
        }
        else {
            current.moisture += total;
            this._moisture -= total;
            this._finished = this._moisture <= 0;
        }
        if (this._finished) {
            return true;
        }
        if (next.terrace > current.terrace) {
            let dirA = (this._direction + 1) % Direction.Max;
            let dirB = (this._direction + Direction.NorthWest) % Direction.Max;
            let pointA = getDirectionCoords(this._x, this._y, dirA);
            let pointB = getDirectionCoords(this._x, this._y, dirB);
            let numClouds = 2;
            if (this._surface.inbounds(pointA) && this._surface.inbounds(pointB)) {
                Rain.add(pointA.x, pointA.y, this._moisture / 3, this._waterLevel, this._booster, dirA, this._surface);
                Rain.add(pointB.x, pointB.y, this._moisture / 3, this._waterLevel, this._booster, dirB, this._surface);
                numClouds = 3;
            }
            else if (this._surface.inbounds(pointA)) {
                Rain.add(pointA.x, pointA.y, this._moisture / 2, this._waterLevel, this._booster, dirA, this._surface);
            }
            else if (this._surface.inbounds(pointB)) {
                Rain.add(pointB.x, pointB.y, this._moisture / 2, this._waterLevel, this._booster, dirB, this._surface);
            }
            else {
                this._x = nextCoord.x;
                this._y = nextCoord.y;
                return this._finished;
            }
            this._moisture /= numClouds;
        }
        this._x = nextCoord.x;
        this._y = nextCoord.y;
        return this._finished;
    }
}
Rain.rain = 0.5;
Rain._clouds = Array();
