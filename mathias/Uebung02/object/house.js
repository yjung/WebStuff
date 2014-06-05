// container for our first object
return myFirstObject = {
// the object's vertices
                vertices: [
                    -0.5, -0.5, 0,
                     0.5, -0.5, 0,
                    -0.5,  0.5, 0,
                     0.5,  0.5, 0,
                    //-0.5,  0.5, 0,
                    // 0.5,  0.5, 0,
                     0, 1, 0
                ],
                // the object's vertex colors
                colors: [
                    1, 1, 0,
                    1, 0, 0,
                    0, 1, 0,
                    0, 0, 1,
                    1, 1, 1
                ],
                // the object's texture coordinates
                texCoords: [
                    0, 0,
                    1, 0,
                    0, 1,
                    1, 1,
                    0.5, 0
                ],
                // index array for drawing a quad (consisting of two tris)
                indices: [
                    0, 1, 2,
                    3, 2, 1,
                    2, 3, 4
                    //0, 1, 2, 3, 4
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
                imgSrc: "../img/todo.jpg",
                texture: null
            };