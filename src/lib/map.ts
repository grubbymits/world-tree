
class Location {
  constructor(readonly private _blocking: boolean,
              readonly private _x: number,
              readonly private _y: number,
              readonly private _id: number) {
  }

  get id(): number {
    return this._id;
  }

  get blocked(): boolean {
    return this._blocking;
  }
  
  get spriteId(): number {
    return this._spriteId;
  }
  
  set spriteId(id: number): void {
    this._spriteId = id;
  }
}

abstract GameMap {
  constructor(protected _width: number, protected _height: number) { }
  abstract get location(x: number, y: number): Location;
  abstract get neighbours(location: Location): Array<Location>;
  abstract get drawCoord(x: number, y: number): number[2];
  
  set spriteId(x: number, y: number, id: number): void {
    this.location(x, y).spriteId = id;
  }
  
  get spriteId(x: number, y: number): number {
    return this.location(x, y).spriteId;
  }
}

class SquareGrid extends GameMap {
  constructor(width: number, height: number) {
    super(width, height);
    
    private readonly this._neighbourOffsets: number[][] =
      [ [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1] ];
        
    let id: number = 0;
    for (let x = 0; x < this._width; x++) {
      this._locations[x]: Array<Location>;
      for (let y = 0; y < this._height; y++) {
        this.locations[x][y] = new Location(false, x, y, id)
        ++id;
      }
    }
  }
  
  get location(x: number, y: number): Location {
    return this._locations[x][y];
  }
  
  get neighbours(location: Location): Array<Location> {
    let neighbours = Array<Location>;
    
    for (let offset in this._neighbourOffsets) {
      let neighbour: Location = this.location(centre.x + offset[0], centre.y + offset[1]);
      neighbours.push(neighbour);
    }
    return neighbours;
  }
  
  get drawCoord(x: number, y: number): number[2] {
    return [x, y];
  }
}
