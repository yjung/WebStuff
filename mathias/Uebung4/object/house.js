var house = {
    // the object's vertices
    vertices: [
        -0.5, 0, -2.5,
        0.5, -0, -2.5,
        -0.5, 0.5, -2.5,
        0.5, 0.5, -2.5,
        0, 0.75, -2.5,
        -0.75, 0.5, -2.5,
        0.75, 0.5, -2.5

    ],
    // the object's vertex colors
    colors: [
        0.5, 0.5, 0.5,	//
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0
    ],
    // the object's texture coordinates
    texCoords: [
        0.25, 0,
        0.75, 0,
        0.25, 0.5,
        0.75, 0.5,
        0.5, 1,
        0, 0.75,
        1, 0.75,
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
    transMat: mat4.create(),
    numSeconds: 2,
    animating: false,

    // texture
    imgSrc: "img/todo.jpg",
    texture: null
};