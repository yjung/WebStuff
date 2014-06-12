/**
 * OBJ Loader taken from online resources of following book
 * (with minor compatibility modifications and fixes + texture support):
 * Matsuda, Kouichi; Lea, Rodger:
 * WebGL Programming Guide: Interactive 3D Graphics Programming with WebGL.
 * Addison Wesley, 2013.
 * https://sites.google.com/site/webglbook/    (ch. 10)
 */


//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

// OBJDoc object
// Constructor
var OBJDoc = function (fileName) {
    this.fileName = fileName;
    this.mtls = new Array(0);      // Initialize the property for MTL
    this.objects = new Array(0);   // Initialize the property for Object
    this.positions = new Array(0);  // Initialize the property for Vertex
    this.normals = new Array(0);   // Initialize the property for Normal
    this.colors = new Array(0);
    this.texCoords = new Array(0);
};

// Parsing the OBJ file
OBJDoc.prototype.parse = function (fileString, scale, reverse) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null); // Append null
    var index = 0;    // Initialize index of line

    var currentObject = new OBJObject("NN");
    var currentMaterialName = "";
    this.objects.push(currentObject);

    // Parse line by line
    var line;         // A string in the line to be parsed
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
        sp.init(line);                  // init StringParser
        var command = sp.getWord();     // Get command
        if (command == null)
            continue;  // check null command

        switch (command) {
            case '#':
                continue;  // Skip comments
            case 'mtllib':     // Read Material chunk
                var path = this.parseMtllib(sp, this.fileName);
                var mtl = new MTLDoc(path);   // Create MTL instance
                this.mtls.push(mtl);
                var request = new XMLHttpRequest();
                request.onload = function () {
                        onReadMTLFile(this.responseText, mtl);
                };
                request.open('GET', path, false);  // Create a request to acquire the file
                request.send();                   // Send the request
                continue; // Go to the next line
            case 'o':
            case 'g':   // Read Object name
                var object = this.parseObjectName(sp);
                this.objects.push(object);
                currentObject = object;
                continue; // Go to the next line
            case 'v':   // Read vertex
                var vertex = this.parseVertex(sp, scale);
                this.positions.push(vertex);
                continue; // Go to the next line
            case 'vn':   // Read normal
                var normal = this.parseNormal(sp);
                this.normals.push(normal);
                continue; // Go to the next line
            case 'vt':  // tex coord
                var tc = this.parseTexCoord(sp);
                this.texCoords.push(tc);
                continue;
            case 'usemtl': // Read Material name
                currentMaterialName = this.parseUsemtl(sp);
                continue; // Go to the next line
            case 'f': // Read face
                var face = this.parseFace(sp, currentMaterialName, this.positions, reverse);
                currentObject.addFace(face);
                continue; // Go to the next line
        }
    }

    return true;
};

OBJDoc.prototype.parseMtllib = function (sp, fileName) {
    // Get directory path
    var i = fileName.lastIndexOf("/");
    var dirPath = "";
    if (i > 0) dirPath = fileName.substr(0, i + 1);

    var word = sp.getWord();
    i = word.lastIndexOf(".");
    if (i > 0) {
        var suffix = word.substr(i + 1);
        if (suffix.toLowerCase() == "obj") {
            word = word.substr(0, i + 1) + "mtl";
            return word;
        }
    }

    return dirPath + word;   // Get path
};

OBJDoc.prototype.parseObjectName = function (sp) {
    var name = sp.getWord();
    return (new OBJObject(name));
};

OBJDoc.prototype.parseVertex = function (sp, scale) {
    var x = sp.getFloat() * scale;
    var y = sp.getFloat() * scale;
    var z = sp.getFloat() * scale;
    return (new VecMath.SFVec3f(x, y, z));
};

OBJDoc.prototype.parseNormal = function (sp) {
    var x = sp.getFloat();
    var y = sp.getFloat();
    var z = sp.getFloat();
    return (new VecMath.SFVec3f(x, y, z));
};

OBJDoc.prototype.parseTexCoord = function (sp) {
    var x = sp.getFloat();
    var y = sp.getFloat();
    return (new VecMath.SFVec2f(x, y));
};

OBJDoc.prototype.parseUsemtl = function (sp) {
    return sp.getWord();
};

OBJDoc.prototype.parseFace = function (sp, materialName, positions, reverse) {
    var face = new Face(materialName);
    // get indices
    for (; ;) {
        var word = sp.getWord();
        if (word == null) break;
        var subWords = word.split('/');
        if (subWords.length >= 1) {
            var vi = +subWords[0] - 1;
            face.vIndices.push(vi);
        }
        if (subWords.length >= 2) {
            var ti = +subWords[1] - 1;
            face.tIndices.push(ti);
        }
        if (subWords.length >= 3) {
            var ni = +subWords[2] - 1;
            face.nIndices.push(ni);
        } else {
            face.nIndices.push(-1);
        }
    }

    // calc normal
    var v0 = [
        positions[face.vIndices[0]].x,
        positions[face.vIndices[0]].y,
        positions[face.vIndices[0]].z];
    var v1 = [
        positions[face.vIndices[1]].x,
        positions[face.vIndices[1]].y,
        positions[face.vIndices[1]].z];
    var v2 = [
        positions[face.vIndices[2]].x,
        positions[face.vIndices[2]].y,
        positions[face.vIndices[2]].z];

    var normal = calcNormal(v0, v1, v2);
    if (normal == null) {
        if (face.vIndices.length >= 4) {
            var v3 = [
                positions[face.vIndices[3]].x,
                positions[face.vIndices[3]].y,
                positions[face.vIndices[3]].z];
            normal = calcNormal(v1, v2, v3);
        }
        if (normal == null) {
            normal = [0.0, 1.0, 0.0];
        }
    }
    if (reverse) {
        normal[0] = -normal[0];
        normal[1] = -normal[1];
        normal[2] = -normal[2];
    }
    face.normal = new VecMath.SFVec3f(normal[0], normal[1], normal[2]);

    // Divide to triangles if face contains over 3 points.
    if (face.vIndices.length > 3) {
        var n = face.vIndices.length - 2;
        var newVIndices = new Array(n * 3);
        var newNIndices = new Array(n * 3);
        for (var i = 0; i < n; i++) {
            var i3 = i * 3;
            newVIndices[i3    ] = face.vIndices[0];
            newVIndices[i3 + 1] = face.vIndices[i + 1];
            newVIndices[i3 + 2] = face.vIndices[i + 2];
            newNIndices[i3    ] = face.nIndices[0];
            newNIndices[i3 + 1] = face.nIndices[i + 1];
            newNIndices[i3 + 2] = face.nIndices[i + 2];
        }
        face.vIndices = newVIndices;
        face.nIndices = newNIndices;
    }
    face.numIndices = face.vIndices.length;

    return face;
};

// Analyze the material file
function onReadMTLFile(fileString, mtl) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null);           // Append null
    var index = 0;              // Initialize index of line

    // Parse line by line
    var line;      // A string in the line to be parsed
    var name = ""; // Material name
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
        sp.init(line);                  // init StringParser
        var command = sp.getWord();     // Get command
        if (command == null)
            continue;  // check null command

        switch (command) {
            case '#':
                continue;    // Skip comments
            case 'newmtl': // Read Material chunk
                name = mtl.parseNewmtl(sp);    // Get name
                continue; // Go to the next line
            case 'Kd':   // Read normal
                if (name == "") continue; // Go to the next line because of Error
                var material = mtl.parseRGB(sp, name);
                mtl.materials.push(material);
                //name = "";
                continue; // Go to the next line
            case 'map_Kd':
                if (name == "") continue; // Go to the next line because of Error
                var tex = mtl.parseTexName(sp, name);
                if (tex.texture) {
                    var i = mtl.fileName.lastIndexOf("/");
                    var dirPath = "";
                    if (i > 0) {
                        dirPath = mtl.fileName.substr(0, i + 1);
                        tex.texture = dirPath + tex.texture;
                    }
                    mtl.texture = tex.texture;
                }
                mtl.materials.push(tex);
                name = "";
                continue; // Go to the next line
        }
    }
    mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function () {
    if (this.mtls.length == 0) return true;
    for (var i = 0; i < this.mtls.length; i++) {
        if (!this.mtls[i].complete) return false;
    }
    return true;
};

// Find color by material name
OBJDoc.prototype.findColor = function (name) {
    for (var i = 0; i < this.mtls.length; i++) {
        for (var j = 0; j < this.mtls[i].materials.length; j++) {
            if (this.mtls[i].materials[j].name == name) {
                return this.mtls[i].materials[j].color;
            }
        }
    }
    return (new VecMath.SFColorRGBA(0.7, 0.7, 0.7, 1));
};

OBJDoc.prototype.findTexture = function (name) {
    for (var i = 0; i < this.mtls.length; i++) {
        if (this.mtls[i].texture)
            return this.mtls[i].texture;
        for (var j = 0; j < this.mtls[i].materials.length; j++) {
            if (this.mtls[i].materials[j].name == name) {
                return this.mtls[i].materials[j].texture;
            }
        }
    }
    return null;
};

//------------------------------------------------------------------------------
// Retrieve the information for drawing 3D model
OBJDoc.prototype.getDrawingInfo = function () {
    // Create an arrays for vertex coordinates, normals, colors, and indices
    var numIndices = 0;
    var i;
    for (i = 0; i < this.objects.length; i++) {
        numIndices += this.objects[i].numIndices;
    }
    var numVertices = numIndices;
    var positions = new Array(numVertices * 3);
    var normals   = new Array(numVertices * 3);
    var colors    = new Array(numVertices * 4);
    var texCoords = new Array(numVertices * 2);
    var indices   = new Array(numIndices);

    // Set vertex, normal and color
    var index_indices = 0;
    var texture = null;
    for (i = 0; i < this.objects.length; i++) {
        var object = this.objects[i];
        for (var j = 0; j < object.faces.length; j++) {
            var face = object.faces[j];
            var color = this.findColor(face.materialName);
            texture = texture || this.findTexture(face.materialName);
            var faceNormal = face.normal;
            for (var k = 0; k < face.vIndices.length; k++) {
                var i2 = index_indices * 2;
                var i3 = index_indices * 3;
                var i4 = index_indices * 4;
                // Set index
                indices[index_indices] = index_indices;
                // Copy vertex
                var vIdx = face.vIndices[k];
                var vertex = this.positions[vIdx];
                positions[i3 + 0] = vertex.x;
                positions[i3 + 1] = vertex.y;
                positions[i3 + 2] = vertex.z;
                // Copy color
                colors[i4 + 0] = color.r;
                colors[i4 + 1] = color.g;
                colors[i4 + 2] = color.b;
                colors[i4 + 3] = color.a;
                // Copy normal
                var nIdx = face.nIndices[k];
                if (nIdx >= 0) {
                    var normal = this.normals[nIdx];
                    normals[i3 + 0] = normal.x;
                    normals[i3 + 1] = normal.y;
                    normals[i3 + 2] = normal.z;
                } else {
                    normals[i3 + 0] = faceNormal.x;
                    normals[i3 + 1] = faceNormal.y;
                    normals[i3 + 2] = faceNormal.z;
                }
                if (this.texCoords.length) {
                    var tIdx = face.tIndices[k];
                    var tc = this.texCoords[tIdx];
                    texCoords[i2 + 0] = tc.x;
                    texCoords[i2 + 1] = tc.y;
                }
                index_indices++;
            }
        }
    }

    return new DrawingInfo(positions, normals, colors, texCoords, indices, texture);
};

//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function (fileName) {
    this.complete = false; // MTL is configured correctly
    this.materials = new Array(0);
    this.fileName = fileName;
};

MTLDoc.prototype.parseNewmtl = function (sp) {
    return sp.getWord();         // Get name
};

MTLDoc.prototype.parseRGB = function (sp, name) {
    var r = sp.getFloat();
    var g = sp.getFloat();
    var b = sp.getFloat();
    return (new Material(name.trim(), r, g, b, 1));
};

MTLDoc.prototype.parseTexName = function (sp, name) {
    var tex = sp.getWord();
    var mat = new Material(name.trim());
    mat.texture = tex.trim();
    return mat;
};

//------------------------------------------------------------------------------
// Material Object
//------------------------------------------------------------------------------
var Material = function (name, r, g, b, a) {
    this.name = name;
    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined)
        this.color = new VecMath.SFColorRGBA(r, g, b, a);
    else
        this.color = new VecMath.SFColorRGBA(.7,.7,.7, 1);
    this.texture = null;
};

//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function (name) {
    this.name = name;
    this.faces = new Array(0);
    this.numIndices = 0;
};

OBJObject.prototype.addFace = function (face) {
    this.faces.push(face);
    this.numIndices += face.numIndices;
};

//------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function (materialName) {
    if (!materialName)
        this.materialName = "";
    else
        this.materialName = materialName;
    this.vIndices = new Array(0);
    this.nIndices = new Array(0);
    this.tIndices = new Array(0);
};

//------------------------------------------------------------------------------
// DrawInfo Object
//------------------------------------------------------------------------------
var DrawingInfo = function (positions, normals, colors, texCoords, indices, texName) {
    this.positions = positions;
    this.normals = normals;
    this.colors = colors;
    this.texCoords = texCoords;
    this.indices = indices;

    this.textureName = texName;
};

//------------------------------------------------------------------------------
// Constructor
var StringParser = function (str) {
    this.str = null;   // Store the string specified by the argument
    this.index = 0;    // Position in the string to be processed
    this.init(str);
};

// Initialize StringParser object
StringParser.prototype.init = function (str) {
    this.str = str;
    this.index = 0;
};

// Skip delimiters
StringParser.prototype.skipDelimiters = function () {
    for (var i = this.index, len = this.str.length; i < len; i++) {
        var c = this.str.charAt(i);
        // Skip TAB, Space, '(', ')
        if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') continue;
        break;
    }
    this.index = i;
};

// Skip to the next word
StringParser.prototype.skipToNextWord = function () {
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    this.index += (n + 1);
};

// Get word
StringParser.prototype.getWord = function () {
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    if (n == 0) return null;
    var word = this.str.substr(this.index, n);
    this.index += (n + 1);

    return word;
};

// Get integer
StringParser.prototype.getInt = function () {
    return parseInt(this.getWord());
};

// Get floating number
StringParser.prototype.getFloat = function () {
    return parseFloat(this.getWord());
};

// Get the length of word
function getWordLength(str, start) {
    var n = 0;
    for (var i = start, len = str.length; i < len; i++) {
        var c = str.charAt(i);
        if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"')
            break;
    }
    return i - start;
}

//------------------------------------------------------------------------------
// Common function
//------------------------------------------------------------------------------
function calcNormal(p0, p1, p2) {
    // v0: a vector from p1 to p0, v1; a vector from p1 to p2
    var v0 = new Array(3);
    var v1 = new Array(3);
    for (var i = 0; i < 3; i++) {
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p1[i];
    }

    // The cross product of v0 and v1
    var c = new Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];

    // Normalize the result
    var v = new VecMath.SFVec3f(c[0], c[1], c[2]);
    v = v.normalize();
    return v.toGL();
}
