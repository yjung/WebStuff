var Renderer = function (canvas)
{
    "use strict";
    //-------------------------------------------------------
    // private section, variables
    //-------------------------------------------------------
    var that = this;              // access to Renderer from inside other functions
    var INDEX_UINT_EXT = null;    // unsigned int indices GL extension

    // Shader
    var vertexShader = getSourceSynch("shaders/vertexShader.glsl", "text");     // Vertexshader einlesen
    var fragmentShader = getSourceSynch("shaders/fragmentShader.glsl", "text"); // Fragmentshader einlesen
    var shaderProgram = null;                                                   // Deklaration Programm


    // Lichtquellen
    var lightDir = vec3.fromValues(-1, -1, -1);                                 // Direktionales Licht in Weltkoordinaten
    vec3.normalize(lightDir, lightDir);                                         // Lichtrichtung normalisiert

    // Kamera
    var rotationsMittelpunkt = vec3.fromValues(0, 0, 0);                        // Zentrum der Kameraansicht
    var kameraPostion = vec3.fromValues(0, 0, 3);                               // Kameraposition
    var aufVektor = vec3.fromValues(0, 1, 0);                                   // Auf-Vektor in Y
    var viewMatrix = mat4.create()                                              // Einheitsmatrix zur Deklaration
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

    /*  Uebergebenes Objekt obj mit Shaderprogramm sp rendern */
    function renderObject(obj, sp)
    {
        // activate shader
        gl.useProgram(sp);


        // set uniforms, first all matrices
        var modelView = mat4.create();
        mat4.multiply(modelView, viewMatrix, obj.transform);

        var modelViewInvT = mat4.create();
        mat4.invert(modelViewInvT, modelView);
        mat4.transpose(modelViewInvT, modelViewInvT);

        var modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projectionMatrix, modelView);

        gl.uniformMatrix4fv(sp.normalMatrix, false, new Float32Array(modelViewInvT));
        gl.uniformMatrix4fv(sp.modelViewMatrix, false, new Float32Array(modelView));
        gl.uniformMatrix4fv(sp.modelViewProjectionMatrix, false, new Float32Array(modelViewProjection));

        // set texture state
        for (var i = 0, n = obj.texture.length; i < n; i++)
        {
            if (obj.texture[i] && obj.texture[i].ready)
            {
                gl.uniform1f(sp["tex" + i + "Loaded"], 1);
                gl.uniform1i(sp["tex" + i], i);

                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, obj.texture[i]);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            else
            {
                gl.uniform1f(sp["tex" + i + "Loaded"], 0);
            }
        }
        if (!n)
        {
            gl.uniform1f(sp.tex0Loaded, 0);
        }
        var hasTexCoords = (obj.texCoords.length > 0);

        // flag if vertex colors are given (for shader and attrib enable)
        var hasVertexColors = (obj.colors.length > 0);
        if (hasVertexColors)
        {
            gl.uniform1f(sp.vertexColors, 1);
        }
        else
        {
            gl.uniform1f(sp.vertexColors, 0);
        }

        // material
        gl.uniform3fv(sp.diffuseColor, obj.diffuseColor);
        gl.uniform3fv(sp.specularColor, obj.specularColor);

        // directional light (given in world space, but here converted to eye space)
        var headlight = vec3.create();
        vec3.transformMat4(headlight, lightDir, viewMatrix);

        gl.uniform3fv(sp.lightDirection, headlight);


        // render object indexed, activate buffers
        if (obj.indices.length)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);

        if (sp.position !== undefined)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
            gl.vertexAttribPointer(sp.position,  // index of attribute
                3,        // three position components (x,y,z)
                gl.FLOAT, // provided data type is float
                false,    // do not normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.position);
        }

        if (sp.normal !== undefined)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
            gl.vertexAttribPointer(sp.normal,  // index of attribute
                3,        // three direction components (x,y,z)
                gl.FLOAT, // provided data type is float
                false,    // do not normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.normal);
        }

        if (sp.color !== undefined && hasVertexColors)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
            gl.vertexAttribPointer(sp.color,  // index of attribute
                4,        // four color components (r,g,b,a)
                gl.FLOAT, // provided data type
                false,    // normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.color);
        }

        if (sp.texcoord !== undefined && hasTexCoords)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
            gl.vertexAttribPointer(sp.texcoord,  // index of attribute
                2,        // two texCoord components (s,t)
                gl.FLOAT, // provided data type is float
                false,    // do not normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.texcoord);
        }


        // draw call
        if (obj.indices.length)
            gl.drawElements(gl.TRIANGLES, obj.indices.length, obj.indexType, 0);
        else
            gl.drawArrays(gl.TRIANGLES, 0, obj.positions.length / 3);


        // deactivate buffers
        if (sp.position !== undefined)
            gl.disableVertexAttribArray(sp.position);
        if (sp.normal !== undefined)
            gl.disableVertexAttribArray(sp.normal);
        if (sp.color !== undefined && hasVertexColors)
            gl.disableVertexAttribArray(sp.color);
        if (sp.texcoord !== undefined && hasTexCoords)
            gl.disableVertexAttribArray(sp.texcoord);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
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
        mat4.lookAt(viewMatrix, kameraPostion, rotationsMittelpunkt, aufVektor)     // viewmatrix mit veraenderten Werten neuschreiben
    }

    /*  Rotiere die Sicht per LMB */
    function rotateView(dx, dy)
    {
        var alpha = -(dy * 2 * Math.PI) / canvas.width;     // berrechnet einen von zwei Drehwinkeln anhand des Maus-Deltas
        var beta = -(dx * 2 * Math.PI) / canvas.height;     // beschreibt einen von zwei Drehwinkeln anhand des Maus-Deltas
//
//
        var cam = mat4.create();
        mat4.invert(cam, viewMatrix); // we need to manipulate camToWorld, therefore invert

        var up = vec3.fromValues(kameraPostion[0], kameraPostion[1] , kameraPostion[2]);

        // eye position is translational part
//        var eye = cam.e3();
        // origin of camera's reference frame is defined by CoR
        vec3.subtract(up, up, rotationsMittelpunkt);

//        var up = cam.e1();         // get camera's up vector
//        // rotation matrix around up
        var quatUp = quat.create();
        quat.setAxisAngle(quatUp, aufVektor, beta);

        var matUp  = mat4.create();
        mat4.fromQuat(matUp, quatUp);

        var eye = vec3.fromValues(matUp[0] * up[0] + matUp[1] * up[1] + matUp[2] * up[2] + matUp[3],
                                  matUp[4] * up[0] + matUp[5] * up[1] + matUp[6] * up[2] + matUp[7],
                                  matUp[8] * up[0] + matUp[9] * up[1] + matUp[10] * up[2] + matUp[11]);

        var v = vec3.create();

        vec3.negate(v,eye);       // get new viewing vector (we always look into direction of CoR)
        vec3.normalize(v,v);

        var s = vec3.create();
        vec3.cross(s, v, aufVektor);

        // rotation matrix around side

        var quatSide = quat.create();
        quat.setAxisAngle(quatSide, aufVektor, alpha);
        var matSide  = mat4.create();
        mat4.fromQuat(matSide, quatSide);

        var eye = vec3.fromValues(matSide[0] * up[0] + matSide[1] * up[1] + matSide[2] * up[2] + matSide[3],
                                  matSide[4] * up[0] + matSide[5] * up[1] + matSide[6] * up[2] + matSide[7],
                                  matSide[8] * up[0] + matSide[9] * up[1] + matSide[10] * up[2] + matSide[11]);



        vec3.negate(v,eye);       // get new viewing vector (we always look into direction of CoR)
        vec3.normalize(v,v);

        vec3.cross(aufVektor, s, v);
        vec3.add(aufVektor, aufVektor, rotationsMittelpunkt); // shift eye back according to pivot point (i.e., CoR)

//        // update camera matrix with new base vectors and eye position
//        cam.setValue(s, aufVektor, v.negate(), eye);

        vec3.negate(v,v);
//        viewMatrix = s[0], s[1], s[2], aufVektor[0],aufVektor[1], aufVektor[2], v[0], v[1], v[2], eye[0],eye[1],eye[1], 0, 0, 0, 1;
        viewMatrix[0] = s[0];
        viewMatrix[1] = s[1];
        viewMatrix[2] = s[2];
        viewMatrix[3] = 0;
        viewMatrix[4] = aufVektor[0];
        viewMatrix[5] = aufVektor[1];
        viewMatrix[6] = aufVektor[2];
        viewMatrix[7] = 0;
        viewMatrix[8] = v[0];
        viewMatrix[9] = v[1];
        viewMatrix[10] = v[2];
        viewMatrix[11] = 0;
        viewMatrix[12] = eye[0];
        viewMatrix[13] = eye[1];
        viewMatrix[14] = eye[2];
        viewMatrix[15] = 1;

        var einheit = mat4.create();


        mat4.invert(viewMatrix, viewMatrix);
        console.log(v[2]);
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
//        // we need to manipulate camToWorld, therefore invert
//        var cam = viewMatrix.inverse();
//
//        var eye = cam.e3();
//
//        var v = centerOfRotation.subtract(eye);
//        var d = v.length();
//
//        v = v.normalize();
//        var up = cam.e1();
//
//        var zoom = 2 * (dx + dy) / canvas.height;
//        zoom = Math.min(zoom, d - 0.01);
//
//        // move along viewing ray, scaled with zoom factor
//        eye = eye.addScaled(v, zoom);
//
//        // update camera matrix with lookAt() and invert again
//        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
//        viewMatrix = cam.inverse();
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

            shaderProgram = initShader(vertexShader, fragmentShader);           //Initialisiere Vertex und Fragment shader
            if (!shaderProgram)                                                 // Chek ob Shader Programm vorhanden
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

        addObject: function (geometry, appearance, transform)
        {
            // create drawable object
            var drawable = new Drawable();
            drawable.setAppearance(appearance);
            drawable.setGeometry(geometry);
            drawable.setTransform(transform);

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
            gl.clearColor(0.2, 0.6, 0.3, 1.0);
            gl.clearDepth(1.0);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            // render shapes
            for (var i = 0; i < drawables.length; i++)
            {
                renderObject(drawables[i], shaderProgram);
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

        onKeyDown: function (keyCode)
        {
            //console.log("pressed key " + keyCode);
            switch (keyCode)
            {
                case 37: /* left */
                    viewMatrix._03 -= 0.01;
                    break;
                case 38: /* up */
                    viewMatrix._13 += 0.01;
                    break;
                case 39: /* right */
                    viewMatrix._03 += 0.01;
                    break;
                case 40: /* down */
                    viewMatrix._13 -= 0.01;
                    break;
                default:
            }
        },

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

        onKeyPress: function (charCode)
        {
            //console.log("pressed key " + charCode);
            switch (charCode)
            {
                case  32: /* space */
                    break;
                case 43: /* + */
                    viewMatrix._23 += 0.05;
                    break;
                case 45: /* - */
                    viewMatrix._23 -= 0.05;
                    break;
                case 114: /* r */
                    updateCameraMatrix();
                    break;
                default:
            }
        }
    }
};