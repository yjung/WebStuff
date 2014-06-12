var cube = {
    geometry: [],
    appearance: []
};

(function () {
    var sx = 0.5, sy = 0.5, sz = 0.5;

    cube.geometry.positions = [
        -sx,-sy,-sz,  -sx, sy,-sz,   sx, sy,-sz,   sx,-sy,-sz, //back   0, 0,-1
        -sx,-sy, sz,  -sx, sy, sz,   sx, sy, sz,   sx,-sy, sz, //front  0, 0, 1
        -sx,-sy,-sz,  -sx,-sy, sz,  -sx, sy, sz,  -sx, sy,-sz, //left  -1, 0, 0
        sx,-sy,-sz,   sx,-sy, sz,   sx, sy, sz,   sx, sy,-sz, //right  1, 0, 0
        -sx, sy,-sz,  -sx, sy, sz,   sx, sy, sz,   sx, sy,-sz, //top    0, 1, 0
        -sx,-sy,-sz,  -sx,-sy, sz,   sx,-sy, sz,   sx,-sy,-sz  //bottom 0,-1, 0
    ],

    cube.geometry.normals = [
        0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,
        0,0,1,   0,0,1,   0,0,1,   0,0,1,
        -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0,
        1,0,0,   1,0,0,   1,0,0,   1,0,0,
        0,1,0,   0,1,0,   0,1,0,   0,1,0,
        0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0
    ],

    cube.geometry.colors = [
        0,0,0,1,  0,1,0,1,  1,1,0,1,  1,0,0,1,
        0,0,1,1,  0,1,1,1,  1,1,1,1,  1,0,1,1,
        0,0,0,1,  0,0,1,1,  0,1,1,1,  0,1,0,1,
        1,0,0,1,  1,0,1,1,  1,1,1,1,  1,1,0,1,
        0,1,0,1,  0,1,1,1,  1,1,1,1,  1,1,0,1,
        0,0,0,1,  0,0,1,1,  1,0,1,1,  1,0,0,1
    ],

    cube.geometry.texCoords = [
        1,0, 1,1, 0,1, 0,0,
        0,0, 0,1, 1,1, 1,0,
        0,0, 1,0, 1,1, 0,1,
        1,0, 0,0, 0,1, 1,1,
        0,1, 0,0, 1,0, 1,1,
        0,0, 0,1, 1,1, 1,0
    ],

    cube.geometry.indices = [
        0,1,2, 2,3,0,
        4,7,5, 5,7,6,
        8,9,10, 10,11,8,
        12,14,13, 14,12,15,
        16,17,18, 18,19,16,
        20,22,21, 22,20,23
    ],

    cube.geometry.transform = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ],

    cube.geometry.angle = 0,
    cube.geometry.transMat = mat4.create(),
    cube.geometry.numSeconds = 2,
    cube.geometry.animating = false,

    cube.appearance.imgSrc = ["img/bachelor_frog.jpg"],
    cube.appearance.texture = null,
    cube.appearance.diffuseColor = vec3.fromValues(1, 0, 0),
    cube.appearance.specularColor = vec3.fromValues(0.5, 0.5, 0.5)

}());