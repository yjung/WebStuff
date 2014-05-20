/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


/**
 * DRAWABLE
 *
 * Contains drawable definition
 * */
var Drawable = function() {
    "use strict";

    /**
     * GEOMETRY
     * */
    // the object's vertices
    this.positions = [];
    // the object's vertex normals
    this.normals = [];
    // the object's vertex colors
    this.colors = [];
    // the object's texture coordinates
    this.texCoords = [];
    // index array
    this.indices = [];

    // VBOs
    this.indexBuffer = null;
    this.positionBuffer = null;
    this.normalBuffer = null;
    this.colorBuffer = null;
    this.texCoordBuffer = null;


    /**
     * APPEARANCE
     * */
    // texture (gl objects and url's)
    this.texture = [];
    this.imgSrc = [];

    // TODO; material params for lighting


    /**
     * TRANSFORM
     * */
    // world transform
    this.transform = VecMath.SFMatrix4f.identity();


    /**
     * Helpers
     * */
    this.numSeconds = 1;
    this.animating = false;
};
