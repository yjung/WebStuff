var Renderer = function (canvas)
{
    "use strict";
    //-------------------------------------------------------
    // private section, variables
    //-------------------------------------------------------
    var that = this;              // access to Renderer from inside other functions
    var INDEX_UINT_EXT = null;    // unsigned int indices GL extension

    // Shader
    var vs_Position = getSourceSynch("shaders/vs_position.glsl", "text");     // Vertexshader einlesen
    var fs_Phong = getSourceSynch("shaders/fs_phong-Shading.glsl", "text"); // Fragmentshader einlesen
    var fs_Cel = getSourceSynch("shaders/fs_cel.glsl");
    var sp_Phong = null;                                                   // Deklaration Programm
    var sp_Cel = null;

    // Lichtquellen
    var lightDir = vec3.fromValues(-1, -1, -1);                                 // Direktionales Licht in Weltkoordinaten
    vec3.normalize(lightDir, lightDir);                                         // Lichtrichtung normalisiert

    // Kamera
    var rotationsMittelpunkt = vec3.fromValues(0, 0, 0);                        // Zentrum der Kameraansicht
    var kameraPostion = vec3.fromValues(0, 0, -3);                               // Kameraposition
    var aufVektor = vec3.fromValues(0, 1, 0);                                   // Auf-Vektor in Y
    var viewMatrix = mat4.create();                                              // Einheitsmatrix zur Deklaration
    var projectionMatrix = mat4.create();                                       // Einheitsmatrix zur Deklaration

    // mouse state helpers
    var lastX = -1;             // Letzte X-Position
    var lastY = -1;             // Letzte Y-Position
    var lastButton = 0;
    var lastFrameTime = 0;      // Zeit des letzten Frames

    // Objekte-Array
    var drawables = [];         // Allgemeine Sammelung ohne Unterscheidung nach Objekten bzw. zugehoerigen Shadern

    var gl = getContext(canvas);

    //-------------------------------------------------------
    // private section, functions
    //-------------------------------------------------------

    /* WebGL-Context fuer das Canvas erzeugen*/
    function getContext(canvas)
    {
        var context = null;
        var validContextNames = ['webgl'];
        var ctxAttribs = {
            alpha: true,
            depth: true,
            antialias: true,
            premultipliedAlpha: false
        };

        for (var i = 0; i < validContextNames.length; i++)
        {
            try
            {
                // provide context name and context creation params
                if (context = canvas.getContext(validContextNames[i], ctxAttribs))
                {
                    console.log("Found '" + validContextNames[i] + "' context");
                    break;
                }
            } catch (e)
            {
                console.warn(e);
            } // shouldn't happen on modern browsers
        }
        return context;
    };

    /* Shader erzeugen. source : ShaderCode, type : "vertex" / "fragment"  */
    function getShader(source, type)
    {
        var shader = null;
        switch (type)
        {
            case "vertex":
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case "fragment":
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            console.warn(type + "Shader: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    /* Shaderprogramm aus uebergebenen Verstex- und Fragmentshader */
    function initShader(vertexShaderStr, fragmentShaderStr)
    {
        var vs = getShader(vertexShaderStr, "vertex");
        var fs = getShader(fragmentShaderStr, "fragment");

        if (vs && fs)
        {
            var program = gl.createProgram();

            gl.attachShader(program, vs);
            gl.attachShader(program, fs);

            // explicitly bind positions to attrib index 0
            gl.bindAttribLocation(program, 0, "position");

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            {
                console.warn("Could not link program: " + gl.getProgramInfoLog(program));
                return null;
            }

            findShaderVariables(program);

            return program;
        }

        return null;
    }

    /* Arrays fuer den Zugriff auf die uniforms und attributes eines Programms erzeugen */
    function findShaderVariables(program)
    {
        var obj = null;
        var loc = null;
        var i, n, glErr;

        // get number of uniforms
        n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (i = 0; i < n; i++)
        {
            obj = gl.getActiveUniform(program, i);

            glErr = gl.getError();
            if (glErr || !obj)
            {
                console.error("GL error on searching uniforms: " + glErr);
                continue;
            }

            loc = gl.getUniformLocation(program, obj.name);
            // dynamically attach uniform reference to program object
            program[obj.name] = loc;
        }

        // get number of attributes
        n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (i = 0; i < n; i++)
        {
            obj = gl.getActiveAttrib(program, i);

            glErr = gl.getError();
            if (glErr || !obj)
            {
                console.error("GL error on searching attributes: " + glErr);
                continue;
            }

            loc = gl.getAttribLocation(program, obj.name);
            // dynamically attach attribute index to program object
            program[obj.name] = loc;
        }
    }

    /* Bilddatei von url einladen und als WebGL-Textur initialisieren.*/
    function initTexture(url)
    {
        var texture = gl.createTexture();
        texture.ready = false;

        var image = new Image();
        image.crossOrigin = '';
        image.src = url;

        image.onload = function ()
        {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.bindTexture(gl.TEXTURE_2D, null);

            // save image size and ready state
            texture.width = image.width;
            texture.height = image.height;
            texture.ready = true;
        };

        image.onerror = function ()
        {
            console.error("Cannot load image '" + url + "'!");
        };

        return texture;
    }

    /* Buffer-Objects dynamisch an uebergebenem Objekt obj initialisieren */
    function initBuffers(obj)
    {
        if (obj.indices.length)                                                                         // Falls indices vorhanden
        {
            obj.indexBuffer = gl.createBuffer();                                                        // Buffer zur Grafikkarte erzeugen
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);                                    // Diesen Buffer spezifizieren und einbinden
            if (INDEX_UINT_EXT && obj.positions.length > 65535)
            {                                       // Pruefen ob Uint32Array noetig
                obj.indexType = gl.UNSIGNED_INT;                                                        // ggf. UNSINGED_INT als Tyo
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(obj.indices), gl.STATIC_DRAW);   // Speicherallokation und Buffering
            }
            else
            {                                                                                      // anderfalls
                obj.indexType = gl.UNSIGNED_SHORT;                                                      // UNSIGNED_SHORT als Typ ausreichend
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);   // Speicherallokation und Buffering
            }
        }

        if (obj.positions.length)
        {                                                                     // Falls positions vorhanden
            obj.positionBuffer = gl.createBuffer();                                                     // Buffer zur Grafikkarte erzeugen
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);                                         // Diesen Buffer spezifizieren und einbinden
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.positions), gl.STATIC_DRAW);            // Speicherallokation und Buffering
        }

        if (obj.normals.length)
        {                                                                       // Falls normals vorhanden
            obj.normalBuffer = gl.createBuffer();                                                       // Buffer zur Grafikkarte erzeugen
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);                                           // Diesen Buffer spezifizieren und einbinden
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);              // Speicherallokation und Buffering
        }

        if (obj.colors.length)
        {                                                                        // Falls positions vorhanden
            obj.colorBuffer = gl.createBuffer();                                                        // Buffer zur Grafikkarte erzeugen
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);                                            // Diesen Buffer spezifizieren und einbinden
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);               // Speicherallokation und Buffering
        }

        if (obj.texCoords.length)
        {                                                                     // Falls positions vorhanden
            obj.texCoordBuffer = gl.createBuffer();                                                     // Buffer zur Grafikkarte erzeugen
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);                                         // Diesen Buffer spezifizieren und einbinden
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);            // Speicherallokation und Buffering
        }
    }

    /* Texturen- und Buffer-Objekte des uebergebenen Objekt obj loeschen */
    function cleanupBuffers(obj)
    {
        // Texturen loeschen
        for (var j = 0; j < obj.texture.length; ++j)
        {      // Fuer alle Texturen des Objekts
            gl.deleteTexture(obj.texture[j]);               // Die Textur loeschen
        }
        // Buffer-Objekte loeschen
        if (obj.indexBuffer)                                // Falls Buffer vorhanden
            gl.deleteBuffer(obj.indexBuffer);               // loeschen
        if (obj.positionBuffer)                             // Falls Buffer vorhanden
            gl.deleteBuffer(obj.positionBuffer);            // loeschen
        if (obj.normalBuffer)                               // Falls Buffer vorhanden
            gl.deleteBuffer(obj.normalBuffer);              // loeschen
        if (obj.colorBuffer)                                // Falls Buffer vorhanden
            gl.deleteBuffer(obj.colorBuffer);               // loeschen
        if (obj.texCoordBuffer)                             // Falls Buffer vorhanden
            gl.deleteBuffer(obj.texCoordBuffer);            // loeschen
    }

    /* Dynamisch Matrix-Uniform-Variablen fuer den Vertex-Shader setzen.*/
    function setMatrixUniforms(obj) {

        // set uniforms, first all matrices
        var modelView = mat4.create();
        mat4.multiply(modelView, viewMatrix, obj.transform);

        var modelViewInvT = mat4.create();
        mat4.invert(modelViewInvT, modelView);
        mat4.transpose(modelViewInvT, modelViewInvT);

        var modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projectionMatrix, modelView);

        gl.uniformMatrix4fv(obj.shaderprogram.normalMatrix, false, modelViewInvT);
        gl.uniformMatrix4fv(obj.shaderprogram.modelViewMatrix, false, modelView);
        gl.uniformMatrix4fv(obj.shaderprogram.modelViewProjectionMatrix, false, modelViewProjection);
        gl.uniformMatrix4fv(obj.shaderprogram.projectionMatrix, false, projectionMatrix);
    }

    /* Dynamisch pruefen ob Textur / Vertex-Color vorhanden.*/
    function setTextureColorState(obj){
        for (var i = 0, n = obj.texture.length; i < n; i++)
        {
            if (obj.texture[i] && obj.texture[i].ready)
            {
                gl.uniform1f(obj.shaderprogram["tex" + i + "Loaded"], 1);
                gl.uniform1i(obj.shaderprogram["tex" + i], i);

                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, obj.texture[i]);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            else
            {
                gl.uniform1f(obj.shaderprogram["tex" + i + "Loaded"], 0);
            }
        }
        if (!n)
        {
            gl.uniform1f(obj.shaderprogram.tex0Loaded, 0);
        }

        // flag if vertex colors are given (for shader and attrib enable)
        var hasVertexColors = (obj.colors.length > 0);

        if (hasVertexColors)
        {
            gl.uniform1f(obj.shaderprogram.vertexColors, 1);                // Shader-Flag auf true
        }
        else
        {
            gl.uniform1f(obj.shaderprogram.vertexColors, 0);                // Shader-Flag auf false
        }
        return hasVertexColors;                                             // Flag an renderObject zurueckliefern
    }

    /* Dynamisch Lichtkonstanten an Shaderprogramm uebergeben. */
    function setLightUniforms(obj){
        // directional light (given in world space, but here converted to eye space)
        var headlight = vec3.create();
        vec3.transformMat4(headlight, lightDir, viewMatrix);

        gl.uniform3fv(obj.shaderprogram.lightDirection, headlight);
    }

    function setMaterialUniforms(obj){
        gl.uniform3fv(obj.shaderprogram.diffuseColor, obj.diffuseColor);
        gl.uniform3fv(obj.shaderprogram.specularColor, obj.specularColor);
    }

    function bufferData(obj, hasColors){

        var hasVertexColors = hasColors;

        if (obj.indices.length)                                             // hat das Object Indices?
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);        // ggf. Buffern
        }

        if (obj.shaderprogram.position !== undefined)                       // Definition von position pruefen
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);             // Buffer als Aktuellen setzen
            gl.vertexAttribPointer(obj.shaderprogram.position,              // Mit Shader-Attribut assozieren
                3,                                                          // 3 Werte (x,y,z)
                gl.FLOAT,                                                   // Werte sind vom Typ float
                false,                                                      // Werte nicht normalisiere
                0,                                                          // stride (in bytes)
                0);                                                         // offset (in bytes)
            gl.enableVertexAttribArray(obj.shaderprogram.position);         // aktivieren
        }

        if (obj.shaderprogram.normal !== undefined)                         // Definition von normal pruefen
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);               // Buffer als Aktuellen setzen
            gl.vertexAttribPointer(obj.shaderprogram.normal,                // Mit Shader-Attribut assozieren
                3,                                                          // 3 Werte (x,y,z)
                gl.FLOAT,                                                   // Werte sind vom Typ float
                false,                                                      // Werte nicht normalisieren
                0,                                                          // stride (in bytes)
                0);                                                         // offset (in bytes)
            gl.enableVertexAttribArray(obj.shaderprogram.normal);           // aktivieren
        }
        // Flag fuer colors setzen
        if (obj.shaderprogram.color !== undefined && hasVertexColors)       // Flag pruefen
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);                // Buffer als Aktuellen setzen
            gl.vertexAttribPointer(obj.shaderprogram.color,                 // Mit Shader-Attribut assozieren
                4,                                                          // 4 Werte fuer color (r,g,b,a)
                gl.FLOAT,                                                   // Werte sind vom Typ float
                false,                                                      // Werte nicht normalisieren
                0,                                                          // stride (in bytes)
                0);                                                         // offset (in bytes)
            gl.enableVertexAttribArray(obj.shaderprogram.color);            // aktivieren
        }

        var hasTexCoords = (obj.texCoords.length > 0);                      // Flag fuer texCoords setzen
        if (obj.shaderprogram.texcoord !== undefined && hasTexCoords)       // Flag pruefen
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);             // Buffer als Aktuellen setzen
            gl.vertexAttribPointer(obj.shaderprogram.texcoord,              // Mit Shader-Attribut assozieren
                2,                                                          // 2 Werte fuer Koordinate (s,t)
                gl.FLOAT,                                                   // Werte sind vom Typ float
                false,                                                      // Werte nicht normalisieren
                0,                                                          // stride (in bytes)
                0);                                                         // offset (in bytes)
            gl.enableVertexAttribArray(obj.shaderprogram.texcoord);         // aktivieren
        }
    }

    /*  Uebergebenes Objekt obj mit Shaderprogramm sp rendern */
    function renderObject(obj)
    {
        // activate shader
        gl.useProgram(obj.shaderprogram);

        setMatrixUniforms(obj);                                 // Matrizen zur Berechnung im Shaderprogramm des Objekts initialisieren
        var hasVertexColors = setTextureColorState(obj);        // Texturstatus im Shaderprogramm des Objekts initialisieren und Flag speichern
        setLightUniforms(obj);                                  // Lichtkonstanten im Shaderprogramm des Objekts initialisieren
        setMaterialUniforms(obj);                               // Materialkonstanten des Objekts im Shader setzen
        bufferData(obj, hasVertexColors);                       // Buffert die VBOs zur Grafikkarte

        // Draw-Call
        if (obj.indices.length)                                                     // Indices fuer Objekt vorhanden?
        {
            gl.drawElements(gl.TRIANGLES, obj.indices.length, obj.indexType, 0);    // ggf. nach Indices zeichnen
        }else
        {
            gl.drawArrays(gl.TRIANGLES, 0, obj.positions.length / 3);               // ggf. immer 3 Vertice pro Face
        }

        // deactivate buffers
        deaktiviereBuffer(obj);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /* Buffer leeren */
    function deaktiviereBuffer(obj){
        // Pruefen ob Flags gesetzt wurden
        var hasTexCoords = (obj.texCoords.length > 0);  // Flag fuer texCoords da?
        var hasVertexColors = (obj.colors.length > 0);  // Flag fuer colors da?

        if (obj.shaderprogram.position !== undefined)                   // Falls position vorhanden
            gl.disableVertexAttribArray(obj.shaderprogram.position);    // deaktivieren
        if (obj.shaderprogram.normal !== undefined)                     // Falls normal vorhanden
            gl.disableVertexAttribArray(obj.shaderprogram.normal);      // deaktivieren
        if (obj.shaderprogram.color !== undefined && hasVertexColors)   // Falls color vorhanden
            gl.disableVertexAttribArray(obj.shaderprogram.color);       // deaktivieren
        if (obj.shaderprogram.texcoord !== undefined && hasTexCoords)   // Falls texCoord vorhanden
            gl.disableVertexAttribArray(obj.shaderprogram.texcoord);    // deaktivieren
    }

    /*  Lade Texturen und erzeuge Vertexbuffer-Objekte für die Geometrien */
    function initializeObject(obj)
    {
        // add little animation helper
        //Füge animationshelfer hinzu(--)
        obj.angle = 0;

        // initialisiere Textur-Objekt
        for (var j = 0; j < obj.imgSrc.length; ++j)
        {
            obj.texture[j] = initTexture(obj.imgSrc[j]);
        }

        // initialisiere VertexBuffer-Objekt
        initBuffers(obj);
    }

    /*  Initialisiere View-Matrix */
    function updateCameraMatrix()
    {
        var rotationsMittelpunkt = vec3.fromValues(0,0,0);
        var eye = vec3.fromValues(0,0,-3);
        var up = vec3.fromValues(0,1,0);

        // view matrix
        var cam =  mat4.create();
        mat4.lookAt(cam, eye,rotationsMittelpunkt, up);

        mat4.invert(viewMatrix, cam);
    }

    /*  Rotiere die Sicht per LMB */
    function rotateView(dx, dy)
    {
        if(dx != 0|| dy != 0)
        {

            /* Drehwinkel fuer Rotation ueber Quaternionen anhand der Maus-Deltas definiren (in Radians)*/
            var alpha = -(dy * 2 * Math.PI) / canvas.width;     // berrechnet einen von zwei Drehwinkeln anhand des Maus-Deltas
            var beta = -(dx * 2 * Math.PI) / canvas.height;     // beschreibt einen von zwei Drehwinkeln anhand des Maus-Deltas


            /* Viewmatrix wird zur Manipulation zwischengespeichert und nach Abschluss neu zugewiesen*/
            var cam = mat4.create();                            // Einheitsmatrix zur Repraesentation der Kamera
            mat4.invert(cam, viewMatrix);                       // Invertierung weil wir die Kamera selbst verschieben

            /* Translationsteil und Auf-Vektor werden zur Manipulation extrahiert*/
            var eye = vec3.fromValues(cam[12], cam[13], cam[14]);  // Translationsteil der Kamera
            vec3.subtract(eye, eye, rotationsMittelpunkt);          // Rotationszentrum vorbereitend abziehen (Wichtig falls nicht bei 0,0,0)
            var up = vec3.fromValues(cam[4], cam[5], cam[6]);      // Auf-Vektor

            /* Quaternion zur Rotation anhand Delta-X erstellen und in Matrix ueberfuehren */
            var quatUp = quat.create();             // Quaternion erstellen
            quat.setAxisAngle(quatUp, up, beta);    // Mit Delta-X initialisieren
            var mat = mat4.create();               // Einheitsmatrix
            mat4.fromQuat(mat, quatUp);             // Matrix aus Quaternion initialisieren

            /* Neuen Translationsteil bestimmen: 3x4-Matrix aus Quaternionrotation * urspruenglichen Translationsteil */
            vec3.set(eye, mat[0] * eye[0] + mat[4] * eye[1] + mat[8] * eye[2] + mat[12],
                    mat[1] * eye[0] + mat[5] * eye[1] + mat[9] * eye[2] + mat[13],
                    mat[2] * eye[0] + mat[6] * eye[1] + mat[10] * eye[2] + mat[14]);

            // Blickrichtung korrigieren
            var v = vec3.create();      // Einheitsvektor
            vec3.negate(v, eye);         // Negieren um wieder ins Zentrum zu schauen
            vec3.normalize(v, v);        // Normalisieren

            // Seitenvektor aus Kreuzprodukt von Blickrichtung und Auf-Vektor bestimmen
            var s = vec3.create();      // Einheitsvektor zum Speichern des Kreuzprodukts
            vec3.cross(s, v, up);       // Kreuzprodukt von Blickrichtung und Auf-Vektor

            /* Quaternion zur Rotation anhand Delta-Y erstellen und in Matrix ueberfuehren */
            var quatSide = quat.create();           // Quaternion erstellen
            quat.setAxisAngle(quatSide, s, alpha);  // Mit Delta-X initialisieren
            mat4.fromQuat(mat, quatSide);           // Matrix aus Quaternion initialisieren

            /* Neuen Translationsteil bestimmen: 3x4-Matrix aus Quaternionrotation * urspruenglichen Translationsteil */
            vec3.set(eye,   mat[0] * eye[0] + mat[4] * eye[1] + mat[8] * eye[2] + mat[12],
                            mat[1] * eye[0] + mat[5] * eye[1] + mat[9] * eye[2] + mat[13],
                            mat[2] * eye[0] + mat[6] * eye[1] + mat[10] * eye[2] + mat[14]);


            vec3.negate(v, eye);     // Negieren um wieder ins Zentrum zu schaue
            vec3.normalize(v, v);    // Normalisieren

            // Seitenvektor aus Kreuzprodukt von Blickrichtung und Auf-Vektor bestimmen
            vec3.cross(up, s, v);
            // Position des Rotationszentrum aufaddieren um uerspruenglichen Abstand zu diesem wiederherzustellen
            vec3.add(eye, eye, rotationsMittelpunkt);   // Addition Translationsteil und Rotationszentrums-Position
            vec3.negate(v, v);  // // Negieren um wieder ins Zentrum zu schauen

            // Viewmatrix mit den errechneten Bestandteilen umschreiben
            viewMatrix[0] = s[0];       // vm00 Seitenvektor (X-Teil)
            viewMatrix[1] = s[1];       // vm10 Seitenvektor (X-Teil)
            viewMatrix[2] = s[2];       // vm20 Seitenvektor (X-Teil)
            viewMatrix[3] = 0;          // vm30 Seitenvektor (X-Teil)

            viewMatrix[4] = up[0];      // vm01 Auf-Vektor (Y-Teil)
            viewMatrix[5] = up[1];      // vm11 Auf-Vektor (Y-Teil)
            viewMatrix[6] = up[2];      // vm21 Auf-Vektor (Y-Teil)
            viewMatrix[7] = 0;          // vm31 Auf-Vektor (Y-Teil)

            viewMatrix[8] = v[0];       // vm02 Blickrichtung (Z-Teil)
            viewMatrix[9] = v[1];       // vm12 Blickrichtung (Z-Teil)
            viewMatrix[10] = v[2];      // vm22 Blickrichtung (Z-Teil)
            viewMatrix[11] = 0;         // vm32 Blickrichtung (Z-Teil)

            viewMatrix[12] = eye[0];    // vm03 Translationsteil
            viewMatrix[13] = eye[1];    // vm13 Translationsteil
            viewMatrix[14] = eye[2];    // vm23 Translationsteil
            viewMatrix[15] = 1;         // vm33 Translationsteil

            mat4.invert(viewMatrix, viewMatrix);    // Kamera wieder invertieren
        }
    }

    /*  Rotiere die Sicht per MMB */
    function panView(dx, dy)
    {
//        var tx = -2 * dx / canvas.width;
//        var ty =  2 * dy / canvas.height;
//
//        // we need to manipulate camToWorld, therefore invert
//        var cam = viewMatrix.inverse();
//
//        var eye = cam.e3();
//        var up = cam.e1();
//        var s = cam.e0();
//
//        // add xy offset to camera position
//        eye = eye.addScaled(up, ty);
//        eye = eye.addScaled(s, tx);
//
//        // add xy offset to look-at position
//        centerOfRotation = centerOfRotation.addScaled(up, ty);
//        centerOfRotation = centerOfRotation.addScaled(s, tx);
//
//        // update camera matrix with lookAt() and invert again
//        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
//        viewMatrix = cam.inverse();
    }

    /*  Rotiere die Sicht per RMB */
    function zoomView(dx, dy)
    {
        var cam = mat4.create();
        mat4.invert(cam, viewMatrix);

        /* Translationsteil und Auf-Vektor werden zur Manipulation extrahiert*/
        var eye = vec3.fromValues(cam[12], cam[13], cam[14]);  // Translationsteil der Kamera
        vec3.subtract(eye, eye, rotationsMittelpunkt);         // Rotationszentrum vorbereitend abziehen (Wichtig falls nicht bei 0,0,0)
        var up = vec3.fromValues(cam[4], cam[5], cam[6]);      // Auf-Vektor

        var v = vec3.create();                              // Einheitsvektor
        vec3.subtract(v, rotationsMittelpunkt, eye);        // Vektor von Rotationszentrum zur Kamera

        var d = vec3.length(v);                             // Laenge von Vektor von Rotationszentrum zur Kamera fuer Distanz
        vec3.normalize(v,v)                                 // Laenge von Vektor von Rotationszentrum zur Kamera normalisieren

        var up = vec3.fromValues(cam[4], cam[5], cam[6]);   // Auf-Vektor
        var zoom = 2 * (dx + dy) / canvas.height;           // Zoom-Wert in Abhaengigkeit zur Canvas-Groesse
        zoom = Math.min(zoom, d - 0.01);                    // Zoom auf maximal 0.01 vor Rotationsmittelpunkt beschraenken

        vec3.scale(v, v, zoom);
        vec3.add(eye,eye,v);                                // Zoom durch Veschiebung in Blickrichtung

        mat4.lookAt(cam, eye, rotationsMittelpunkt, up);    // Kamera mit neuen Werten initialisieren
//        mat4.invert(viewMatrix, cam);                       // Kamera wieder invertieren und an viewMatrix uebergeben
        mat4.copy(viewMatrix, cam);

    }


    //-------------------------------------------------------
    // public section, methods
    //-------------------------------------------------------

    return {
        initialize: function ()
        {
            if (!gl)                                                            //Check ob GL vorhanden
            {
                return false;
            }

            sp_Phong = initShader(vs_Position, fs_Phong);   //Initialisiere Vertex und Fragment Shader fuer Phong
            sp_Cel = initShader(vs_Position, fs_Cel);   //Initialisiere Vertex und Fragment Shader fuer Cel
            if (!sp_Phong || !sp_Cel)                                 // Chek ob Shader Programm vorhanden
            {
                return false;
            }

            var aspect = canvas.width / canvas.height;

            mat4.perspective(projectionMatrix, 45, aspect, 0.1, 1000)

            // init view matrix
            updateCameraMatrix();

            lastFrameTime = Date.now();

            return true;
        },

        /* Vorher initialisierte Shaderprogramme fuer objektspezifische Zuweisung verfuegbar machen. */
        getShaderprogram : function (nameShaderprogramm){
            switch (nameShaderprogramm)
            {
                case "sp_Phong":
                    return sp_Phong;
                case "sp_Cel":
                    return sp_Cel;
//                default:
            }
        },

        addObject: function (geometry, appearance, shaderprogramm, transform)
        {
            // create drawable object
            var drawable = new Drawable();
            drawable.setAppearance(appearance);
            drawable.setGeometry(geometry);
            drawable.setTransform(transform);
            drawable.setShaderprogram(shaderprogramm);

            // initialize drawable
            initializeObject(drawable);
            // push back
            drawables.push(drawable);
        },

        removeObject: function (index)
        {
            if (index >= 0 && index < drawables.length)
            {
                drawables.splice(index, 1);
                // TODO; cleanup corresponding GL objects
            }
        },

        getNumObjects: function ()
        {
            return drawables.length;
        },

        cleanup: function ()
        {
            var shaders = gl.getAttachedShaders(shaderProgram);
            var i;

            for (i = 0; i < shaders.length; ++i)
            {
                gl.detachShader(shaderProgram, shaders[i]);
                gl.deleteShader(shaders[i]);
            }

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;

            for (i = 0; i < drawables.length; i++)
            {
                cleanupBuffers(drawables[i]);
            }
        },

        drawScene: function ()
        {
            gl.clearColor(0.5, 0.5, 0.5, 1.0);                      // Color-Buffer mit Hintergrundfarbe ueberschreiben
            gl.clearDepth(1.0);                                     // Depth-Buffer mit groesstem Wert (1) zuruecksetzen

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            // Renderaufruf
            for (var i = 0; i < drawables.length; i++)  // Fuer alle Objekte der Szene
            {
                renderObject(drawables[i]);             // Render Objekt i
            }
        },

        animate: function (dT)
        {
            // update animation values
            // FIXME; this is only a stupid sample impl. to show some anims
            for (var i = 0; i < drawables.length; i++)
            {
                var obj = drawables[i];
                if (obj.animating)
                {
                    obj.angle += (2 * Math.PI * dT) / obj.numSeconds;

                    //obj.transform = VecMath.SFMatrix4f.rotationY(-obj.angle);
//                    obj.transform.setRotate(VecMath.Quaternion.axisAngle(new VecMath.SFVec3f(0,1,0), -obj.angle));

                    mat4.rotateY(obj.transform, obj.transform, obj.angle);
                }
            }
        },

        setDuration: function (s)
        {
            // one loop per numSeconds
            for (var i = 0; i < drawables.length; i++)
            {
                drawables[i].numSeconds = s;
            }
        },

        toggleAnim: function ()
        {
            var animating = false;
            for (var i = 0; i < drawables.length; i++)
            {
                drawables[i].animating = !drawables[i].animating;
                animating = animating || drawables[i].animating;
            }
            return animating;
        },

        // called in main loop
        tick: function (stats)
        {
            // first, calc new deltaT
            var currTime = Date.now();
            var dT = currTime - lastFrameTime;

            var fpsStr = (1000 / dT).toFixed(2);
            dT /= 1000;

            // then, update and render scene
            this.animate(dT);

            this.drawScene();

            // finally, show some statistics
            if (stats)
            {
                fpsStr = (currTime / 1000).toFixed(3) + "<br>dT: " + dT + "<br>fps: " + fpsStr;
                stats.innerHTML = fpsStr;
            }
            lastFrameTime = currTime;
        },

        // mouse and key input handlers
        onMouseMove: function (x, y, buttonState)
        {
            // TODO
        },

        onMouseDrag: function (x, y, buttonState)
        {
            var dx = x - lastX;
            var dy = y - lastY;

            if ((buttonState & 1))
            {
                //left
                rotateView(dx, dy);
            }
            else if ((buttonState & 4))
            {
                //middle
                panView(dx, dy);
            }
            else if ((buttonState & 2))
            {
                //right
                zoomView(dx, dy);
            }

            lastX = x;
            lastY = y;
            lastButton = buttonState;
        },

        onMousePress: function (x, y, buttonState)
        {
            lastX = x;
            lastY = y;
            lastButton = buttonState;
        },

        onMouseRelease: function (x, y, buttonState)
        {
            lastX = x;
            lastY = y;
            lastButton = 0;
        },

        onMouseOut: function ()
        {
            lastButton = 0;
        },

        /* Steuerung ueber Pfeiltasten */
        onKeyDown: function (keyCode)
        {
            switch (keyCode)
            {
                case 37: /* left */
                    viewMatrix[12] -= 0.01;
                    break;
                case 38: /* up */
                    viewMatrix[13] += 0.01;
                    break;
                case 39: /* right */
                    viewMatrix[12] += 0.01;
                    break;
                case 40: /* down */
                    viewMatrix[13] -= 0.01;
                    break;
                default:
            }
        },

        /* leer */
        onKeyUp: function (keyCode)
        {
            //console.log("released key " + keyCode);
            switch (keyCode)
            {
                case 13: /* return */
                    break;
                case 27: /* ESC */
                    break;
                default:
            }
        },

        /* Zoom ueber + und - Tasten*/
        onKeyPress: function (charCode)
        {
            //console.log("pressed key " + charCode);
            switch (charCode)
            {
                case  32: /* space */
                    break;
                case 43: /* + */

                    viewMatrix[14] += 0.05;
                    break;
                case 45: /* - */
                    viewMatrix[14] -= 0.05;
                    break;
                case 114: /* r */
                    updateCameraMatrix();
                    break;
                default:
            }
//            updateCameraMatrix();
        }
    }
};