/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


/// Helper: synchronously loads text file
function loadStringFromFile(url)
{
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
var Drawable = function ()
{
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
    this.diffuseColor = vec3.fromValues(.7, .7, .7);
    this.specularColor = vec3.fromValues(.3, .3, .3);


    /**
     * TRANSFORM
     * */
        // world transform
    this.transform = mat4.create();

    /* Helpers
     * */
    this.numSeconds = 60;
    this.animating = false;
};


/**
 * param should be object like this:
 * { positions: [], normals: [], colors: [], texCoords: [], indices: [] }
 * Note: only references are copied
 */
Drawable.prototype.setGeometry = function (param)
{
    if (param)
    {
        if (param.positions)
            this.positions = param.positions;
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
 * { imgSrc: [], diffuseColor: null, specularColor: null }
 * Note: only references are copied
 */
Drawable.prototype.setAppearance = function (param)
{
    if (param)
    {
        if (param.imgSrc)
            this.imgSrc = param.imgSrc;
        if (param.diffuseColor)
            this.diffuseColor = param.diffuseColor;
        if (param.specularColor)
            this.specularColor = param.specularColor;
    }
};

/**
 * @param transform SFMatrix4f
 */
Drawable.prototype.setTransform = function (transform)
{
    if (transform)
        this.transform = transform;
};
