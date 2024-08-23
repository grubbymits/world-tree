import { Point3D, Vector3D } from './utils/geometry3d.ts'
import { PhysicalEntity, MovableEntity } from './entity.ts'
import { EntityEvent } from './events.ts'

// Work around for having a static variable and jest not having the support.
class AudioContextMock {
  constructor() { }
}
const AudioContext = window.AudioContext || AudioContextMock;

export class AudioController {
  static _context: AudioContext = new AudioContext();
  static _sources: Map<number, AudioBufferSourceNode> =
    new Map<number, AudioBufferSourceNode>();
  static _panners: Map<number, PannerNode> = new Map<number, PannerNode>();

  private static _id = 0;

  public static async create(name: string): Promise<number> {
    const source_id = this._id;
    this._id++;
    await fetch(name).then((response) => response.arrayBuffer())
      .then((buffer) => this._context.decodeAudioData(buffer))
      .then((decoded) => {
        const source = new AudioBufferSourceNode(this._context, {
          buffer: decoded,
        });
        this._sources.set(source_id, source);
      })
      .catch((e) => console.error('could not load: ', name));
    return source_id;
  }

  public static ensureEnabled(): void {
    if (this._context.state === "suspended") {
      this._context.resume();
    }
  }

  public static play(id: number, volume = 1, loop = false) {
    console.assert(this._sources.has(id));
    const source = this._sources.get(id)!;
    source.loop = loop;
    const gainNode = this._context.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode).connect(this._context.destination);
    source.start();
  }

  public static loopPanningBackground(id: number, entityIds: Array<number>, volume: number) {
    console.assert(this._sources.has(id));
    const source = this._sources.get(id)!;
    const gainNode = this._context.createGain();
    gainNode.gain.value = volume;

    for (let entity_id of entityIds) {
      console.assert(this._panners.has(entity_id));
      const panner = this._panners.get(entity_id)!;
      source.connect(panner).connect(gainNode).connect(this._context.destination);
    }
    source.loop = true;
    source.start();
  }

  public static playPanningOnce(id: number, entity: PhysicalEntity, volume = 1, loop = false) {
    console.assert(this._sources.has(id));
    console.assert(this._panners.has(entity.id));
    const source = this._sources.get(id)!;
    const panner = this._panners.get(entity.id)!;

    source.loop = loop;
    const gainNode = this._context.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode).connect(panner).connect(this._context.destination);
    source.start();
  }

  public static addPanningEntity(entity: PhysicalEntity): void {
    // https://github.com/mdn/webaudio-examples/blob/main/panner-node/main.js
    const panner = new PannerNode(this._context, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 0,
      coneOuterGain: 0,
      orientationX: 1,
      orientationY: 0,
      orientationZ: 0,
    });
    const setPos = () => {
      // Convert from left-hand to right-hand.
      panner.positionX.value = entity.x;
      panner.positionY.value = entity.z;
      panner.positionZ.value = entity.y;
    };
    entity.addEventListener(EntityEvent.Moving, () => {
      setPos();
    });
    setPos();
    this._panners.set(entity.id, panner);
  }

  public static setListeningEntity(entity: PhysicalEntity): void {
    const setPos = () => {
      // Convert from left-hand to right-hand.
      this._context.listener.positionX.value = entity.x;
      this._context.listener.positionY.value = entity.z;
      this._context.listener.positionZ.value = entity.y;
    };
    entity.addEventListener(EntityEvent.Moving, () => {
      setPos();
    });
    setPos();

    entity.addEventListener(EntityEvent.FaceDirection, () => {
    });
  }

  public static setListeningPosition(location: Point3D): void {
    // Convert from left-hand to right-hand.
    this._context.listener.positionX.value = location.x;
    this._context.listener.positionY.value = location.z;
    this._context.listener.positionZ.value = location.y;
  }
}
