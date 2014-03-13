/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


// our main rendering class
// http://www.khronos.org/registry/webgl/specs/latest/1.0/
var Renderer = function(canvas) {
    "use strict";
    //-------------------------------------------------------
    // private section, variables
    //-------------------------------------------------------

    // access to Renderer from inside other functions
    var that = this;

    // unsigned int indices GL extension
    var INDEX_UINT_EXT = null;

    var preamble =  "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
                    "  precision highp float;\n" +
                    "#else\n" +
                    "  precision mediump float;\n" +
                    "#endif\n\n";

    // vertex shader string
    var vertexShader = loadStringFromFile("vertexShader.glsl");

    // fragment shader string
    var fragmentShader = preamble +
                         loadStringFromFile("fragmentShader.glsl");


    // shader program object
    var shaderProgram = null;

    // more private module-global variables
    var lastFrameTime = 0;
    var needRender = true;

    // directional light (given in world space)
    var lightDir = (new VecMath.SFVec3f(-1, -1, -1)).normalize();

    // camera
    var centerOfRotation = new VecMath.SFVec3f(0, 0, 0);
    var viewMatrix = VecMath.SFMatrix4f.identity();
    var projectionMatrix = VecMath.SFMatrix4f.identity();

    // mouse state helpers
    var lastX = -1;
    var lastY = -1;
    var lastButton = 0;

    // container for our objects
    var drawables = [];


    //-------------------------------------------------------
    // private section, functions
    //-------------------------------------------------------

    // get GL context
    var gl = (function(canvas) {
        var context = null;
        var validContextNames = ['webgl', 'experimental-webgl'];
        var ctxAttribs = { alpha: true, depth: true, antialias: true, premultipliedAlpha: false };

        for (var i=0; i<validContextNames.length; i++) {
            // provide context name and context creation params
            if (context = canvas.getContext(validContextNames[i], ctxAttribs)) {
                console.log("Found '" + validContextNames[i] + "' context");
                // check for 32 bit indices extension (not avail. on all platforms)
                INDEX_UINT_EXT = context.getExtension("OES_element_index_uint");
                console.log((INDEX_UINT_EXT ? "" : "No ") + "32 bit indices available.");
                break;
            }
        }

        return context;
    })(canvas);

    // create shader part
    function getShader(source, type) {
        var shader = null;

        switch (type) {
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

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn(type + "Shader: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    // create shader program
    function initShader(vertexShaderStr, fragmentShaderStr) {
        var vs = getShader(vertexShaderStr, "vertex");
        var fs = getShader(fragmentShaderStr, "fragment");

        if (vs && fs) {
            var program = gl.createProgram();

            gl.attachShader(program, vs);
            gl.attachShader(program, fs);

            // explicitly bind positions to attrib index 0
            gl.bindAttribLocation(program, 0, "position");

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.warn("Could not link program: " + gl.getProgramInfoLog(program));
                return null;
            }

            findShaderVariables(program);

            return program;
        }

        return null;
    }

    // get uniform and attribute location
    function findShaderVariables(program) {
        var obj = null;
        var loc = null;
        var i, n, glErr;

        // get number of uniforms
        n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (i=0; i<n; i++) {
            obj = gl.getActiveUniform(program, i);

            glErr = gl.getError();
            if (glErr || !obj) {
                console.error("GL error on searching uniforms: " + glErr);
                continue;
            }

            loc = gl.getUniformLocation(program, obj.name);
            // dynamically attach uniform reference to program object
            program[obj.name] = loc;
        }

        // get number of attributes
        n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (i=0; i<n; i++) {
            obj = gl.getActiveAttrib(program, i);

            glErr = gl.getError();
            if (glErr || !obj) {
                console.error("GL error on searching attributes: " + glErr);
                continue;
            }

            loc = gl.getAttribLocation(program, obj.name);
            // dynamically attach attribute index to program object
            program[obj.name] = loc;
        }
    }

    // load texture
    function initTexture(url) {
        var texture = gl.createTexture();
        texture.ready = false;

        var image = new Image();
        image.crossOrigin = '';
        image.src = url;

        image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.bindTexture(gl.TEXTURE_2D, null);

            // save image size and ready state
            texture.width  = image.width;
            texture.height = image.height;
            texture.ready = true;

            // async image loader, trigger re-render
            needRender = true;
        };

        image.onerror = function() {
            console.error("Cannot load image '" + url + "'!");
        };

        return texture;
    }

    // init buffer objects (dynamically attach buffer reference to obj)
    function initBuffers(obj) {
        if (obj.indices.length) {
            obj.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            if (INDEX_UINT_EXT && obj.positions.length > 65535) {
                obj.indexType = gl.UNSIGNED_INT;
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(obj.indices), gl.STATIC_DRAW);
            }
            else {
                obj.indexType = gl.UNSIGNED_SHORT;
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);
            }
        }

        if (obj.positions.length) {
            obj.positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.positions), gl.STATIC_DRAW);
        }

        if (obj.normals.length) {
            obj.normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);
        }

        if (obj.colors.length) {
            obj.colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);
        }

        if (obj.texCoords.length) {
            obj.texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);
        }
    }

    // delete texture and buffer objects
    function cleanupBuffers(obj) {
        for (var j=0; j<obj.texture.length; ++j) {
            gl.deleteTexture(obj.texture[j]);
        }

        // delete VBOs, too
        if (obj.indexBuffer)
            gl.deleteBuffer(obj.indexBuffer);
        if (obj.positionBuffer)
            gl.deleteBuffer(obj.positionBuffer);
        if (obj.normalBuffer)
            gl.deleteBuffer(obj.normalBuffer);
        if (obj.colorBuffer)
            gl.deleteBuffer(obj.colorBuffer);
        if (obj.texCoordBuffer)
            gl.deleteBuffer(obj.texCoordBuffer);
    }

    // object specific render code
    function renderObject(obj, sp) {
        // activate shader
        gl.useProgram(sp);


        // set uniforms, first all matrices
        var modelView = viewMatrix.mult(obj.transform);
        var modelViewInvT = modelView.inverse().transpose();
        var modelViewProjection = projectionMatrix.mult(modelView);

        gl.uniformMatrix4fv(sp.normalMatrix, false, new Float32Array(modelViewInvT.toGL()));
        gl.uniformMatrix4fv(sp.modelViewMatrix, false, new Float32Array(modelView.toGL()));
        gl.uniformMatrix4fv(sp.modelViewProjectionMatrix, false, new Float32Array(modelViewProjection.toGL()));

        // set texture state
        for (var i=0, n=obj.texture.length; i<n; i++) {
            if (obj.texture[i] && obj.texture[i].ready) {
                gl.uniform1f(sp["tex"+i+"Loaded"], 1);
                gl.uniform1i(sp["tex"+i], i);

                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, obj.texture[i]);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            else {
                gl.uniform1f(sp["tex"+i+"Loaded"], 0);
            }
        }
        if (!n) {
            gl.uniform1f(sp.tex0Loaded, 0);
        }
        var hasTexCoords = (obj.texCoords.length > 0);

        // flag if vertex colors are given (for shader and attrib enable)
        var hasVertexColors = (obj.colors.length > 0);
        if (hasVertexColors) {
            gl.uniform1f(sp.vertexColors, 1);
        }
        else {
            gl.uniform1f(sp.vertexColors, 0);
        }

        // material
        gl.uniform3fv(sp.diffuseColor, obj.diffuseColor.toGL());
        gl.uniform3fv(sp.specularColor, obj.specularColor.toGL());

        // directional light (given in world space, but here converted to eye space)
        gl.uniform3fv(sp.lightDirection, viewMatrix.multMatrixVec(lightDir).toGL());


        // render object indexed, activate buffers
        if (obj.indices.length)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);

        if (sp.position !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
            gl.vertexAttribPointer( sp.position,  // index of attribute
                                    3,        // three position components (x,y,z)
                                    gl.FLOAT, // provided data type is float
                                    false,    // do not normalize values
                                    0,        // stride (in bytes)
                                    0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.position);
        }

        if (sp.normal !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
            gl.vertexAttribPointer( sp.normal,  // index of attribute
                                    3,        // three direction components (x,y,z)
                                    gl.FLOAT, // provided data type is float
                                    false,    // do not normalize values
                                    0,        // stride (in bytes)
                                    0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.normal);
        }

        if (sp.color !== undefined && hasVertexColors) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
            gl.vertexAttribPointer( sp.color,  // index of attribute
                                    4,        // four color components (r,g,b,a)
                                    gl.FLOAT, // provided data type
                                    false,    // normalize values
                                    0,        // stride (in bytes)
                                    0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.color);
        }

        if (sp.texcoord !== undefined && hasTexCoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
            gl.vertexAttribPointer( sp.texcoord,  // index of attribute
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

    // load textures and create VBOs for geometry
    function initializeObject(obj) {
        // add little animation helper
        obj.angle = 0;

        // init texture objects
        for (var j=0; j<obj.imgSrc.length; ++j) {
            obj.texture[j] = initTexture(obj.imgSrc[j]);
        }

        // init VBOs
        initBuffers(obj);
    }

    // init viewing matrix
    function initCameraMatrix() {
        centerOfRotation = new VecMath.SFVec3f(0, 0, 0);

        // view matrix
        var cam = VecMath.SFMatrix4f.lookAt(new VecMath.SFVec3f(0, 0, 3),   // eye
                                            centerOfRotation,               // at
                                            new VecMath.SFVec3f(0, 1, 0));  // up

        // directly store inverse matrix since more efficient than inverting camToWorld every frame
        viewMatrix = cam.inverse();
    }

    // rotate view (left btn)
    function rotateView(dx, dy) {
        var alpha = -(dy * 2 * Math.PI) / canvas.width;
        var beta = -(dx * 2 * Math.PI) / canvas.height;

        // we need to manipulate camToWorld, therefore invert
        var cam = viewMatrix.inverse();

        // eye position is translational part
        var eye = cam.e3();
        // origin of camera's reference frame is defined by CoR
        eye = eye.subtract(centerOfRotation);

        // get camera's up vector
        var up = cam.e1();
        // rotation matrix around up
        var mat = VecMath.Quaternion.axisAngle(up, beta).toMatrix();

        // calc rotated camera position (part 1)
        eye = mat.multMatrixPnt(eye);

        // get new viewing vector (we always look into direction of CoR)
        var v = eye.negate().normalize();
        // calc side vector (in case of identity matrix this would be x)
        var s = v.cross(up);

        // rotation matrix around side
        mat = VecMath.Quaternion.axisAngle(s, alpha).toMatrix();

        // calc rotated camera position (part 2)
        eye = mat.multMatrixPnt(eye);

        // again, get new viewing vector as the old one is invalid now
        v = eye.negate().normalize();
        // the new camera's base vectors (s, up, v) must be orthogonal
        up = s.cross(v);

        // shift eye back according to pivot point (i.e., CoR)
        eye = eye.add(centerOfRotation);

        // update camera matrix with new base vectors and eye position
        cam.setValue(s, up, v.negate(), eye);
        // alternatively use lookAt, but in both cases we need to invert
        //cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
        viewMatrix = cam.inverse();
    }

    // pan view (middle btn)
    function panView(dx, dy) {
        var tx = -2 * dx / canvas.width;
        var ty =  2 * dy / canvas.height;

        // we need to manipulate camToWorld, therefore invert
        var cam = viewMatrix.inverse();

        var eye = cam.e3();
        var up = cam.e1();
        var s = cam.e0();

        // add xy offset to camera position
        eye = eye.addScaled(up, ty);
        eye = eye.addScaled(s, tx);

        // add xy offset to look-at position
        centerOfRotation = centerOfRotation.addScaled(up, ty);
        centerOfRotation = centerOfRotation.addScaled(s, tx);

        // update camera matrix with lookAt() and invert again
        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
        viewMatrix = cam.inverse();
    }

    // zoom view (right btn)
    function zoomView(dx, dy) {
        // we need to manipulate camToWorld, therefore invert
        var cam = viewMatrix.inverse();

        var eye = cam.e3();

        var v = centerOfRotation.subtract(eye);
        var d = v.length();

        v = v.normalize();
        var up = cam.e1();

        var zoom = 2 * (dx + dy) / canvas.height;
        zoom = Math.min(zoom, d - 0.01);

        // move along viewing ray, scaled with zoom factor
        eye = eye.addScaled(v, zoom);

        // update camera matrix with lookAt() and invert again
        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
        viewMatrix = cam.inverse();
    }


    //-------------------------------------------------------
    // public section, methods
    //-------------------------------------------------------
    return {
        initialize: function() {
            if (!gl) {
                return false;
            }

            shaderProgram = initShader(vertexShader, fragmentShader);
            if (!shaderProgram) {
                return false;
            }

            var aspect = canvas.width / canvas.height;
            // projection matrix with fov = pi/4
            projectionMatrix = VecMath.SFMatrix4f.perspective(Math.PI / 4, aspect, 0.1, 1000);

            // init view matrix
            initCameraMatrix();

            lastFrameTime = Date.now();

            return true;
        },

        addObject: function(geometry, appearance, transform) {
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

        removeObject: function(index) {
            if (index >= 0 && index < drawables.length) {
                drawables.splice(index, 1);
                // TODO; cleanup corresponding GL objects
            }
        },

        getNumObjects: function() {
            return drawables.length;
        },

        cleanup: function() {
            var shaders = gl.getAttachedShaders(shaderProgram);
            var i;

            for (i=0; i<shaders.length; ++i) {
                gl.detachShader(shaderProgram, shaders[i]);
                gl.deleteShader(shaders[i]);
            }

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;

            for (i=0; i<drawables.length; i++) {
                cleanupBuffers(drawables[i]);
            }
        },

        drawScene: function() {
            gl.clearColor(0.2, 0.6, 0.3, 1.0);
            gl.clearDepth(1.0);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            // render shapes
            for (var i=0; i<drawables.length; i++) {
                renderObject(drawables[i], shaderProgram);
            }
        },

        animate: function(dT) {
            // update animation values
            // FIXME; this is only a stupid sample impl. to show some anims
            for (var i=0; i<drawables.length; i++) {
                var obj = drawables[i];
                if (obj.animating) {
                    obj.angle += (2 * Math.PI * dT) / obj.numSeconds;

                    //obj.transform = VecMath.SFMatrix4f.rotationY(-obj.angle);
                    obj.transform.setRotate(VecMath.Quaternion.axisAngle(new VecMath.SFVec3f(0,1,0), -obj.angle));

                    needRender = true;  // transform changed, need re-render
                }
            }
        },

        setDuration: function(s) {
            // one loop per numSeconds
            for (var i=0; i<drawables.length; i++) {
                drawables[i].numSeconds = s;
            }
        },

        toggleAnim: function() {
            var animating = false;
            for (var i=0; i<drawables.length; i++) {
                drawables[i].animating = !drawables[i].animating;
                animating = animating || drawables[i].animating;
            }
            return animating;
        },

        triggerRedraw: function() {
            // flag is checked every frame
            needRender = true;
        },

        // called in main loop
        tick: function(stats) {
            // first, calc new deltaT
            var currTime = Date.now();
            var dT = currTime - lastFrameTime;

            var fpsStr = (1000 / dT).toFixed(2);
            dT /= 1000;

            // then, update and render scene
            this.animate(dT);

            if (needRender)
                this.drawScene();

            // finally, show some statistics
            if (stats && needRender) {
                fpsStr = (currTime / 1000).toFixed(3) + "<br>dT: " + dT + "<br>fps: " + fpsStr;
                stats.innerHTML = fpsStr;
            }

            needRender = false;
            lastFrameTime = currTime;
        },

        // mouse and key input handlers
        onMouseMove: function (x, y, buttonState) {
            // TODO
        },

        onMouseDrag: function (x, y, buttonState) {
            var dx = x - lastX;
            var dy = y - lastY;

            if ( (buttonState & 1) ) {
                //left
                rotateView(dx, dy);
            }
            else if ( (buttonState & 4) ) {
                //middle
                panView(dx, dy);
            }
            else if ( (buttonState & 2) ) {
                //right
                zoomView(dx, dy);
            }

            lastX = x;
            lastY = y;
            lastButton = buttonState;
        },

        onMousePress: function (x, y, buttonState) {
            lastX = x;
            lastY = y;
            lastButton = buttonState;
        },

        onMouseRelease: function (x, y, buttonState) {
            lastX = x;
            lastY = y;
            lastButton = 0;
        },

        onMouseOut: function () {
            lastButton = 0;
        },

        onKeyDown: function(keyCode) {
            //console.log("pressed key " + keyCode);
            switch (keyCode) {
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

        onKeyUp: function(keyCode) {
            //console.log("released key " + keyCode);
            switch (keyCode) {
                case 13: /* return */
                    break;
                case 27: /* ESC */
                    break;
                default:
            }
        },

        onKeyPress: function(charCode) {
            //console.log("pressed key " + charCode);
            switch (charCode) {
                case  32: /* space */
                    break;
                case 43: /* + */
                    viewMatrix._23 += 0.05;
                    break;
                case 45: /* - */
                    viewMatrix._23 -= 0.05;
                    break;
                case 114: /* r */
                    initCameraMatrix();
                    break;
                default:
            }
        }
    }
};
