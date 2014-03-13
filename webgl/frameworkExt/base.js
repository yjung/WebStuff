/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


/// Helper: synchronously loads text file
function loadStringFromFile(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", encodeURI(url), false);
    xhr.send();
    return xhr.responseText;
}


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
    // tex params
    this.wrapMode = null;
    this.minFilter = null;
    this.magFilter = null;

    // material params for lighting
    this.diffuseColor = new VecMath.SFColor(.7, .7, .7);
    this.specularColor = new VecMath.SFColor(.3, .3, .3);
    // for transparency
    this.alpha = 1.0;

    // render state control
    this.sortKey = 0;
    this.solid = true;
    this.depthReadOnly = false;


    /**
     * TRANSFORM
     * */
    // world transform
    this.transform = VecMath.SFMatrix4f.identity();

    // bounding box min and max
    // to be calculated after positions are set
    this.min = new VecMath.SFVec3f(0, 0, 0);
    this.max = new VecMath.SFVec3f(0, 0, 0);


    /**
     * Helpers
     * */
    this.numSeconds = 60;
    this.animating = false;
};


/**
 * Bounding box calculation
 */
Drawable.prototype.calcBBox = function() {
    var coords = this.positions;
    var n = Math.floor(coords.length / 3) * 3;

    if (n >= 3) {
        var initVal = new VecMath.SFVec3f(coords[0], coords[1], coords[2]);
        this.min.setValues(initVal);
        this.max.setValues(initVal);

        for (var i=3; i<n; i+=3) {
            if (this.min.x > coords[i  ]) { this.min.x = coords[i  ]; }
            if (this.min.y > coords[i+1]) { this.min.y = coords[i+1]; }
            if (this.min.z > coords[i+2]) { this.min.z = coords[i+2]; }

            if (this.max.x < coords[i  ]) { this.max.x = coords[i  ]; }
            if (this.max.y < coords[i+1]) { this.max.y = coords[i+1]; }
            if (this.max.z < coords[i+2]) { this.max.z = coords[i+2]; }
        }
    }
};

/**
 * param should be object like this:
 * { positions: [], normals: [], colors: [], texCoords: [], indices: [] }
 * Note: only references are copied
 */
Drawable.prototype.setGeometry = function(param) {
    if (param) {
        if (param.positions) {
            this.positions = param.positions;
            this.calcBBox();
        }
        if (param.normals)
            this.normals = param.normals;
        if (param.colors)
            this.colors = param.colors;
        if (param.texCoords)
            this.texCoords = param.texCoords;
        if (param.indices)
            this.indices = param.indices;
    }
};

/**
 * param should be object like this:
 * { imgSrc: [], diffuseColor: null, specularColor: null, alpha: 1 }
 * Note: only references are copied
 */
Drawable.prototype.setAppearance = function(param) {
    if (param) {
        if (param.imgSrc)
            this.imgSrc = param.imgSrc;
        if (param.diffuseColor)
            this.diffuseColor = param.diffuseColor;
        if (param.specularColor)
            this.specularColor = param.specularColor;
        if (param.alpha !== undefined)
            this.alpha = +param.alpha;
    }
};

/**
 * @param transform SFMatrix4f
 */
Drawable.prototype.setTransform = function(transform) {
    if (transform)
        this.transform = transform;
};
