import test from 'node:test';
import assert from 'node:assert/strict';
import { overlapsFootprint, bevelBox } from '../features/gunfight-materials.js';
const box={minX:-2,maxX:2,minZ:-4,maxZ:4,cx:0,cz:0};
test('cargo collision follows rotation, not its old footprint',()=>{
 const turned={...box,angle:Math.PI/2};
 assert.equal(overlapsFootprint(box,3,0,.3),false);
 assert.equal(overlapsFootprint(turned,3,0,.3),true);
 assert.equal(overlapsFootprint(box,0,3,.3),true);
 assert.equal(overlapsFootprint(turned,0,3,.3),false);
});
test('a slanted container blocks its centre and allows its clear side',()=>{
 const angled={...box,angle:-.36};
 assert.equal(overlapsFootprint(angled,0,0,.34),true);
 assert.equal(overlapsFootprint(angled,7,0,.34),false);
 assert.equal(overlapsFootprint(angled,0,7,.34),false);
});
test('bevelled gun parts preserve requested physical dimensions',()=>{
 const geometry=bevelBox(.12,.14,.53);geometry.computeBoundingBox();
 const size=geometry.boundingBox.max.clone().sub(geometry.boundingBox.min);
 assert.ok(Math.abs(size.x-.12)<1e-6);assert.ok(Math.abs(size.y-.14)<1e-6);assert.ok(Math.abs(size.z-.53)<1e-6);geometry.dispose();
});
