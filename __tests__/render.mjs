import * as WT from '../dist/world-tree';

function getTwoByOneDims(spriteWidth, spriteHeight) {
  return WT.TwoByOneIsometricRenderer.getDimensions(spriteWidth, spriteHeight);
}

module.exports = getTwoByOneDims;
