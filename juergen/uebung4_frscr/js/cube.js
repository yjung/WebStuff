var cube = {

    vertices: [
        0, 0, 1, // A - 0
        1, 0, 1, // B - 1
        0, 1, 1, // C - 2
        1, 1, 1, // D - 3
        0, 1, 0, // E - 4
        1, 1, 0, // F - 5
        0, 0, 0, // G - 6
        1, 0, 0  // H - 7
    ],
    // the object's vertex colors
    colors: [
        1,   0,   0,   // A - 0
        0.5, 0.5, 0.5, // B - 1
        0.5, 0.5, 0.5, // C - 2
        0.5, 0.5, 0.5, // D - 3
        0.5, 0.5, 0.5, // E - 4
        1,   0,   0,   // F - 5
        1,   0,   0,   // G - 6
        1,   0,   0    // H - 7
    ],
    // the object's texture coordinates
    texCoords: [
        0,   0,
        1,   0,
        0,   1,
        1,   1,
        0.5, 1,
        0,   0,
        1,   0,
        0,   1

    ],
    // index array for drawing a quad (consisting of two tris)
    indices: [
     // vorne
     // A  B  C
        0, 1, 2,
     // B  D  C
        1, 3, 2,

     // oben
     // C  D  E
        2, 3, 4,
     // D  F  E
        3, 5, 4,

     // links
     // H  G  E
        7, 6, 4,
     // E  F  H
        4, 5, 7,

     // rechts
     // B  H  D
        1, 7, 3,
     // H  F  D
        7, 5, 3,

     // hinten
     // C  G  A
        2, 6, 0,
     // C  E  G
        2, 4, 6

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
    animating: false

    // texture
   // imgSrc: "altedachziegeln_512.jpg",
   // texture: null
};