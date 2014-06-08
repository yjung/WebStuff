var wuerfel = {
    geometrie: [],
    aussehen: []
};
//


(function ()
{
    wuerfel.geometrie.positions = [];
    wuerfel.geometrie.normals = [];
    wuerfel.geometrie.texCoords = [];
    wuerfel.geometrie.indices = [];
    wuerfel.geometrie.color = [];

    // the object's vertices

    wuerfel.geometrie.positions = [
        // Front face
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,

        // Back face
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,

        // Top face
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,

        // Right face
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,

        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5
    ],

        wuerfel.geometrie.normals = [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            // Right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Left
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0
        ],

        // the object's texture coordinates
        wuerfel.geometrie.texCoords = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ],

        // the object's vertex colors
        wuerfel.geometrie.colors = [
            // Front face
            1.0, 0.0, 0.0, 1,
            1.0, 0.0, 0.0, 1,
            1.0, 0.0, 0.0, 1,
            1.0, 0.0, 0.0, 1,

            // Back face
            0.0, 1.0, 0.0, 1,
            0.0, 1.0, 0.0, 1,
            0.0, 1.0, 0.0, 1,
            0.0, 1.0, 0.0, 1,

            // Top face
            0.0, 0.0, 1.0, 1,
            0.0, 0.0, 1.0, 1,
            0.0, 0.0, 1.0, 1,
            0.0, 0.0, 1.0, 1,

            // Bottom face
            1.0, 1.0, 0.0, 1,
            1.0, 1.0, 0.0, 1,
            1.0, 1.0, 0.0, 1,
            1.0, 1.0, 0.0, 1,

            // Right face
            0.0, 1.0, 1.0, 1,
            0.0, 1.0, 1.0, 1,
            0.0, 1.0, 1.0, 1,
            0.0, 1.0, 1.0, 1,

            // Left face
            1.0, 1.0, 1.0, 1,
            1.0, 1.0, 1.0, 1,
            1.0, 1.0, 1.0, 1,
            1.0, 1.0, 1.0, 1
        ],

        wuerfel.geometrie.indices = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ],

        // for animation
        // matrix elements must be provided in column major order!
        wuerfel.geometrie.transform = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ],


        wuerfel.geometrie.angle = 0,
        wuerfel.geometrie.transMat = mat4.create(),
        wuerfel.geometrie.numSeconds = 2,
        wuerfel.geometrie.animating = false,

        // Aussehen
        wuerfel.aussehen.imgSrc = ["img/htg.jpg"],
        wuerfel.aussehen.texture = null,
        wuerfel.aussehen.diffuseColor = vec3.fromValues(1, 0, 0),
        wuerfel.aussehen.specularColor = vec3.fromValues(0.5, 0.5, 0.5)


}());