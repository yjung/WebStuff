var kugel = {
    geometrie: [],
    aussehen: []
};


(function ()
{
    // Geometrie-Berechnung
    kugel.geometrie.positions = [];
    kugel.geometrie.normals = [];
    kugel.geometrie.texCoords = [];
    kugel.geometrie.indices = [];

    var r = 0.5;
    var latitudeBands = 24, longitudeBands = 24;
    var numLongitudeBands = longitudeBands + 1;

    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
    {
        var theta = (latNumber * Math.PI) / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
        {
            var phi = (longNumber * 2.0 * Math.PI) / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

            var u = 1.0 - longNumber / longitudeBands;
            var v = 1.0 - latNumber / latitudeBands;

            kugel.geometrie.positions.push(r * x, r * y, r * z);
            kugel.geometrie.normals.push(x, y, z);
            kugel.geometrie.texCoords.push(u, v);

            if (latNumber < latitudeBands && longNumber < longitudeBands)
            {
                var first = latNumber * numLongitudeBands + longNumber;
                var second = numLongitudeBands + first;

                kugel.geometrie.indices.push(second, first, first + 1);
                kugel.geometrie.indices.push(second + 1, second, first + 1);
            }
        }
    }
    // Aussehen definieren
    kugel.aussehen.imgSrc = ["img/htg.jpg"];
    kugel.aussehen.diffuseColor = vec3.fromValues(0, 0, 1);
}());

