var sphere = {
    geometry: [],
    appearance: []
};

(function () {

    sphere.geometry.positions = [];
    sphere.geometry.normals = [];
    sphere.geometry.texCoords = [];
    sphere.geometry.indices = [];

    // calculating sphere geometry
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

            sphere.geometry.positions.push(r * x, r * y, r * z);
            sphere.geometry.normals.push(x, y, z);
            sphere.geometry.texCoords.push(u, v);

            if (latNumber < latitudeBands && longNumber < longitudeBands)
            {
                var first = latNumber * numLongitudeBands + longNumber;
                var second = numLongitudeBands + first;

                sphere.geometry.indices.push(second, first, first + 1);
                sphere.geometry.indices.push(second + 1, second, first + 1);
            }
        }
    }

    sphere.appearance.imgSrc = ["img/bachelor_frog.jpg"];
    sphere.appearance.diffuseColor = vec3.fromValues(0, 0, 1);
    sphere.appearance.specularColor = vec3.fromValues(0.5, 0.5, 0.5);
    sphere.appearance.alpha = 0.8;

}());