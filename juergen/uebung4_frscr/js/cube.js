var cube = {
    // the object's vertices
    vertices: [

    ],
    // the object's vertex colors
    colors: [
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        1,   0,   0,
        1,   0,   0,
        1,   0,   0
    ],
    // the object's texture coordinates
    texCoords: [
        0,   0,
        1,   0,
        0,   1,
        1,   1,
        0.5, 1,
        0,   0,
        1,   0

    ],
    // index array for drawing a quad (consisting of two tris)
    indices: [
        0, 1, 2,
        3, 2, 1,
        4, 5, 6
    ],

    // for animation
    // matrix elements must be provided in column major order!
    transform: [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ],
    angle: 0,
    numSeconds: 2,
    animating: false,

    // texture
    imgSrc: "altedachziegeln_512.jpg",
    texture: null
};