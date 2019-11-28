import { NORM_2D, NORM_3D, NORM_4D, SQUISH_2D, SQUISH_3D, SQUISH_4D, STRETCH_2D, STRETCH_3D, STRETCH_4D, base2D, base3D, base4D, gradients2D, gradients3D, gradients4D, lookupPairs2D, lookupPairs3D, lookupPairs4D, p2D, p3D, p4D } from "./constants.js";
var Contribution2 = /** @class */ (function () {
    function Contribution2(multiplier, xsb, ysb) {
        this.dx = -xsb - multiplier * SQUISH_2D;
        this.dy = -ysb - multiplier * SQUISH_2D;
        this.xsb = xsb;
        this.ysb = ysb;
    }
    return Contribution2;
}());
var Contribution3 = /** @class */ (function () {
    function Contribution3(multiplier, xsb, ysb, zsb) {
        this.dx = -xsb - multiplier * SQUISH_3D;
        this.dy = -ysb - multiplier * SQUISH_3D;
        this.dz = -zsb - multiplier * SQUISH_3D;
        this.xsb = xsb;
        this.ysb = ysb;
        this.zsb = zsb;
    }
    return Contribution3;
}());
var Contribution4 = /** @class */ (function () {
    function Contribution4(multiplier, xsb, ysb, zsb, wsb) {
        this.dx = -xsb - multiplier * SQUISH_4D;
        this.dy = -ysb - multiplier * SQUISH_4D;
        this.dz = -zsb - multiplier * SQUISH_4D;
        this.dw = -wsb - multiplier * SQUISH_4D;
        this.xsb = xsb;
        this.ysb = ysb;
        this.zsb = zsb;
        this.wsb = wsb;
    }
    return Contribution4;
}());
function shuffleSeed(seed) {
    var newSeed = new Uint32Array(1);
    newSeed[0] = seed[0] * 1664525 + 1013904223;
    return newSeed;
}
var OpenSimplexNoise = /** @class */ (function () {
    function OpenSimplexNoise(clientSeed) {
        this.initialize();
        this.perm = new Uint8Array(256);
        this.perm2D = new Uint8Array(256);
        this.perm3D = new Uint8Array(256);
        this.perm4D = new Uint8Array(256);
        var source = new Uint8Array(256);
        for (var i = 0; i < 256; i++)
            source[i] = i;
        var seed = new Uint32Array(1);
        seed[0] = clientSeed;
        seed = shuffleSeed(shuffleSeed(shuffleSeed(seed)));
        for (var i = 255; i >= 0; i--) {
            seed = shuffleSeed(seed);
            var r = new Uint32Array(1);
            r[0] = (seed[0] + 31) % (i + 1);
            if (r[0] < 0)
                r[0] += i + 1;
            this.perm[i] = source[r[0]];
            this.perm2D[i] = this.perm[i] & 0x0e;
            this.perm3D[i] = (this.perm[i] % 24) * 3;
            this.perm4D[i] = this.perm[i] & 0xfc;
            source[r[0]] = source[i];
        }
    }
    OpenSimplexNoise.prototype.array2D = function (width, height) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
            output[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                output[x][y] = this.noise2D(x, y);
            }
        }
        return output;
    };
    OpenSimplexNoise.prototype.array3D = function (width, height, depth) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
            output[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                output[x][y] = new Array(depth);
                for (var z = 0; z < depth; z++) {
                    output[x][y][z] = this.noise3D(x, y, z);
                }
            }
        }
        return output;
    };
    OpenSimplexNoise.prototype.array4D = function (width, height, depth, wLength) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
            output[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                output[x][y] = new Array(depth);
                for (var z = 0; z < depth; z++) {
                    output[x][y][z] = new Array(wLength);
                    for (var w = 0; w < wLength; w++) {
                        output[x][y][z][w] = this.noise4D(x, y, z, w);
                    }
                }
            }
        }
        return output;
    };
    OpenSimplexNoise.prototype.noise2D = function (x, y) {
        var stretchOffset = (x + y) * STRETCH_2D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var squishOffset = (xsb + ysb) * SQUISH_2D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var inSum = xins + yins;
        var hash = (xins - yins + 1) |
            (inSum << 1) |
            ((inSum + yins) << 2) |
            ((inSum + xins) << 4);
        var value = 0;
        for (var c = this.lookup2D[hash]; c !== undefined; c = c.next) {
            var dx = dx0 + c.dx;
            var dy = dy0 + c.dy;
            var attn = 2 - dx * dx - dy * dy;
            if (attn > 0) {
                var px = xsb + c.xsb;
                var py = ysb + c.ysb;
                var indexPartA = this.perm[px & 0xff];
                var index = this.perm2D[(indexPartA + py) & 0xff];
                var valuePart = gradients2D[index] * dx + gradients2D[index + 1] * dy;
                value += attn * attn * attn * attn * valuePart;
            }
        }
        return value * NORM_2D;
    };
    OpenSimplexNoise.prototype.noise3D = function (x, y, z) {
        var stretchOffset = (x + y + z) * STRETCH_3D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var zs = z + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var zsb = Math.floor(zs);
        var squishOffset = (xsb + ysb + zsb) * SQUISH_3D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var dz0 = z - (zsb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var zins = zs - zsb;
        var inSum = xins + yins + zins;
        var hash = (yins - zins + 1) |
            ((xins - yins + 1) << 1) |
            ((xins - zins + 1) << 2) |
            (inSum << 3) |
            ((inSum + zins) << 5) |
            ((inSum + yins) << 7) |
            ((inSum + xins) << 9);
        var value = 0;
        for (var c = this.lookup3D[hash]; c !== undefined; c = c.next) {
            var dx = dx0 + c.dx;
            var dy = dy0 + c.dy;
            var dz = dz0 + c.dz;
            var attn = 2 - dx * dx - dy * dy - dz * dz;
            if (attn > 0) {
                var px = xsb + c.xsb;
                var py = ysb + c.ysb;
                var pz = zsb + c.zsb;
                var indexPartA = this.perm[px & 0xff];
                var indexPartB = this.perm[(indexPartA + py) & 0xff];
                var index = this.perm3D[(indexPartB + pz) & 0xff];
                var valuePart = gradients3D[index] * dx +
                    gradients3D[index + 1] * dy +
                    gradients3D[index + 2] * dz;
                value += attn * attn * attn * attn * valuePart;
            }
        }
        return value * NORM_3D;
    };
    OpenSimplexNoise.prototype.noise4D = function (x, y, z, w) {
        var stretchOffset = (x + y + z + w) * STRETCH_4D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var zs = z + stretchOffset;
        var ws = w + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var zsb = Math.floor(zs);
        var wsb = Math.floor(ws);
        var squishOffset = (xsb + ysb + zsb + wsb) * SQUISH_4D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var dz0 = z - (zsb + squishOffset);
        var dw0 = w - (wsb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var zins = zs - zsb;
        var wins = ws - wsb;
        var inSum = xins + yins + zins + wins;
        var hash = (zins - wins + 1) |
            ((yins - zins + 1) << 1) |
            ((yins - wins + 1) << 2) |
            ((xins - yins + 1) << 3) |
            ((xins - zins + 1) << 4) |
            ((xins - wins + 1) << 5) |
            (inSum << 6) |
            ((inSum + wins) << 8) |
            ((inSum + zins) << 11) |
            ((inSum + yins) << 14) |
            ((inSum + xins) << 17);
        var value = 0;
        for (var c = this.lookup4D[hash]; c !== undefined; c = c.next) {
            var dx = dx0 + c.dx;
            var dy = dy0 + c.dy;
            var dz = dz0 + c.dz;
            var dw = dw0 + c.dw;
            var attn = 2 - dx * dx - dy * dy - dz * dz - dw * dw;
            if (attn > 0) {
                var px = xsb + c.xsb;
                var py = ysb + c.ysb;
                var pz = zsb + c.zsb;
                var pw = wsb + c.wsb;
                var indexPartA = this.perm[px & 0xff];
                var indexPartB = this.perm[(indexPartA + py) & 0xff];
                var indexPartC = this.perm[(indexPartB + pz) & 0xff];
                var index = this.perm4D[(indexPartC + pw) & 0xff];
                var valuePart = gradients4D[index] * dx +
                    gradients4D[index + 1] * dy +
                    gradients4D[index + 2] * dz +
                    gradients4D[index + 3] * dw;
                value += attn * attn * attn * attn * valuePart;
            }
        }
        return value * NORM_4D;
    };
    OpenSimplexNoise.prototype.initialize = function () {
        var contributions2D = [];
        for (var i = 0; i < p2D.length; i += 4) {
            var baseSet = base2D[p2D[i]];
            var previous = null;
            var current = null;
            for (var k = 0; k < baseSet.length; k += 3) {
                current = new Contribution2(baseSet[k], baseSet[k + 1], baseSet[k + 2]);
                if (previous === null)
                    contributions2D[i / 4] = current;
                else
                    previous.next = current;
                previous = current;
            }
            current.next = new Contribution2(p2D[i + 1], p2D[i + 2], p2D[i + 3]);
        }
        this.lookup2D = [];
        for (var i = 0; i < lookupPairs2D.length; i += 2) {
            this.lookup2D[lookupPairs2D[i]] = contributions2D[lookupPairs2D[i + 1]];
        }
        var contributions3D = [];
        for (var i = 0; i < p3D.length; i += 9) {
            var baseSet = base3D[p3D[i]];
            var previous = null;
            var current = null;
            for (var k = 0; k < baseSet.length; k += 4) {
                current = new Contribution3(baseSet[k], baseSet[k + 1], baseSet[k + 2], baseSet[k + 3]);
                if (previous === null)
                    contributions3D[i / 9] = current;
                else
                    previous.next = current;
                previous = current;
            }
            current.next = new Contribution3(p3D[i + 1], p3D[i + 2], p3D[i + 3], p3D[i + 4]);
            current.next.next = new Contribution3(p3D[i + 5], p3D[i + 6], p3D[i + 7], p3D[i + 8]);
        }
        this.lookup3D = [];
        for (var i = 0; i < lookupPairs3D.length; i += 2) {
            this.lookup3D[lookupPairs3D[i]] = contributions3D[lookupPairs3D[i + 1]];
        }
        var contributions4D = [];
        for (var i = 0; i < p4D.length; i += 16) {
            var baseSet = base4D[p4D[i]];
            var previous = null;
            var current = null;
            for (var k = 0; k < baseSet.length; k += 5) {
                current = new Contribution4(baseSet[k], baseSet[k + 1], baseSet[k + 2], baseSet[k + 3], baseSet[k + 4]);
                if (previous === null)
                    contributions4D[i / 16] = current;
                else
                    previous.next = current;
                previous = current;
            }
            current.next = new Contribution4(p4D[i + 1], p4D[i + 2], p4D[i + 3], p4D[i + 4], p4D[i + 5]);
            current.next.next = new Contribution4(p4D[i + 6], p4D[i + 7], p4D[i + 8], p4D[i + 9], p4D[i + 10]);
            current.next.next.next = new Contribution4(p4D[i + 11], p4D[i + 12], p4D[i + 13], p4D[i + 14], p4D[i + 15]);
        }
        this.lookup4D = [];
        for (var i = 0; i < lookupPairs4D.length; i += 2) {
            this.lookup4D[lookupPairs4D[i]] = contributions4D[lookupPairs4D[i + 1]];
        }
    };
    return OpenSimplexNoise;
}());
export default OpenSimplexNoise;
