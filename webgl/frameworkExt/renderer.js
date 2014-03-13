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
    var FP_TEXTURES_EXT = null;
    var FPL_TEXTURES_EXT = null;

    var preamble =  "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
                    "  precision highp float;\n" +
                    "#else\n" +
                    "  precision mediump float;\n" +
                    "#endif\n\n";

    // vertex shader string
    var vertexShader = loadStringFromFile("vertexShader.glsl");
    // foreground vertex shader
    var vertexShaderOverlay = loadStringFromFile("vertexShaderOverlay.glsl");
    // shadow pass vertex shader
    var vertexShaderShadow = loadStringFromFile("vertexShaderShadow.glsl");

    // fragment shader string
    var fragmentShader = preamble + loadStringFromFile("fragmentShader.glsl");
    // foreground fragment shader
    var fragmentShaderOverlay = preamble + loadStringFromFile("fragmentShaderOverlay.glsl");
    // shadow-pass fragment shader
    var fragmentShaderShadow = preamble + loadStringFromFile("fragmentShaderShadow.glsl");


    // shader program object for 3D objects
    var shaderProgram = null;
    // special shader for rendering foreground
    var shaderProgramOverlay = null;
    // shader for rendering shadow-pass
    var shaderProgramShadow = null;

    var showOverlay = false;
    var hasShadows  = false;
    var showShadowMap = false;  // for debug

    // more private module-global variables
    var lastFrameTime = 0;
    var needRender = true;
    // test variable for anim in overlay shader:
    var cycle = 0;

    // scene bounding box in world space
    var volume = new VecMath.BoxVolume();

    // camera
    var fieldOfView = Math.PI / 4;
    var centerOfRotation = new VecMath.SFVec3f(0, 0, 0);
    var viewMatrix = VecMath.SFMatrix4f.identity();
    var projectionMatrix = VecMath.SFMatrix4f.identity();

    // mouse state helpers
    var lastX = -1;
    var lastY = -1;
    var lastButton = 0;

    // directional light (given in world space)
    var lightDir = (new VecMath.SFVec3f(-1, -1, -1)).normalize();
    // point light (world space position)
    var pntLightPos = new VecMath.SFVec3f(4, 2.5, 0.5);
    // for shadows
    var lightProjMat = VecMath.SFMatrix4f.perspective(fieldOfView, 1, 2, 20);
    var lightMatrix  = VecMath.SFMatrix4f.lookAt(pntLightPos, centerOfRotation,
                                          new VecMath.SFVec3f(0,1,0)).inverse();

    // container for our objects
    var drawables = [];
    // window-sized, view-aligned quad as overlay
    var foreground = null;


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

                // check for floating point texture extension (not avail. on all platforms)
                FP_TEXTURES_EXT  = context.getExtension("OES_texture_float");
                FPL_TEXTURES_EXT = context.getExtension("OES_texture_float_linear");
                console.log((FP_TEXTURES_EXT  ? "" : "No ") + "FLOAT textures available " +
                            (FPL_TEXTURES_EXT ? "with" : "without") + " linear filtering.");

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
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
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
    function renderObject(obj, sp, projMat) {
        // activate shader
        gl.useProgram(sp);


        // set uniforms, first all matrices
        var modelView = obj.modelView;  //viewMatrix.mult(obj.transform);
        var modelViewInvT = modelView.inverse().transpose();
        var modelViewProjection = projMat.mult(modelView);

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

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, obj.wrapMode);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, obj.wrapMode);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, obj.minFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, obj.magFilter);
            }
            else {
                gl.uniform1f(sp["tex"+i+"Loaded"], 0);
            }
        }
        if (!n) {
            gl.uniform1f(sp.tex0Loaded, 0);
        }

        // TODO; don't calc matrix every frame even when it is not necessary
        var MVP_light = lightProjMat.mult(lightMatrix.mult(obj.transform));
        gl.uniformMatrix4fv(sp.MVP_light, false, new Float32Array(MVP_light.toGL()));
        gl.uniform1f(sp.curShadowUnit, hasShadows ? (n - 1) : -1);
        // for debug overlay, if shadows + overlay enabled
        gl.uniform1f(sp.showShadowMap, showShadowMap ? 1 : 0);

        // avoid errors when binding buffers that do not exist
        var hasTexCoords = (obj.texCoords.length > 0);
        // another flag if vertex colors are given (for shader and attrib enable)
        var hasVertexColors = (obj.colors.length > 0);
        gl.uniform1f(sp.vertexColors, hasVertexColors ? 1 : 0);

        // material
        gl.uniform3fv(sp.diffuseColor, obj.diffuseColor.toGL());
        gl.uniform3fv(sp.specularColor, obj.specularColor.toGL());
        gl.uniform1f(sp.alpha, obj.alpha);

        // lights (given in world space, but here converted to eye space)
        gl.uniform3fv(sp.lightDirection, viewMatrix.multMatrixVec(lightDir).toGL());
        gl.uniform3fv(sp.pntLightPosition, viewMatrix.multMatrixPnt(pntLightPos).toGL());

        // for animation in overlay shader
        gl.uniform1f(sp.cycle, cycle);

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

        obj.wrapMode  = gl.REPEAT;
        obj.minFilter = gl.LINEAR;
        obj.magFilter = gl.LINEAR;

        // init VBOs
        initBuffers(obj);
    }

    // calculates viewing ray through canvas position (x, y)
    function calcViewRay(x, y) {
        var wctocc = projectionMatrix.mult(viewMatrix);
        var cctowc = wctocc.inverse();

        var wMax = canvas.width  - 1;
        var hMax = canvas.height - 1;

        var rx = 2 *         x  / wMax - 1;
        var ry = 2 * (hMax - y) / hMax - 1;

        var from = cctowc.multFullMatrixPnt(new VecMath.SFVec3f(rx, ry, -1));
        var at   = cctowc.multFullMatrixPnt(new VecMath.SFVec3f(rx, ry,  1));
        // ray has members pos and dir
        var dir  = at.subtract(from);

        return new VecMath.Line(from, dir);
    }

    // init viewing matrix
    function initCameraMatrix() {
        centerOfRotation = new VecMath.SFVec3f(0, 0, 0);

        // view matrix (which looks into -z direction)
        var cam = VecMath.SFMatrix4f.lookAt(new VecMath.SFVec3f(0, 0, 5),   // eye
                                            centerOfRotation,               // at
                                            new VecMath.SFVec3f(0, 1, 0));  // up

        // directly store inverse matrix since more efficient than inverting camToWorld every frame
        viewMatrix = cam.inverse();
    }

    // moves camera such that all objects are visible
    function showAllObjects() {
        var r = volume.max.subtract(volume.min).multiply(0.5);
        var eye = volume.min.add(r);    // center of scene bbox

        // we need to manipulate camToWorld, therefore invert
        var cam = viewMatrix.inverse();
        centerOfRotation = VecMath.SFVec3f.copy(eye);

        // calc new camera position by adding offset d along -viewDir to bbox center (assumes w >= h)
        var d = 0.9 * r.length() / Math.tan(fieldOfView / 2.0);
        eye = eye.add(cam.e2().multiply(d));

        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, cam.e1());
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
        var diff = zoom - d + 0.01;

        // add z offset to look-at position, alternatively clamp
        if (diff >= 0)
            centerOfRotation = centerOfRotation.addScaled(v, diff);

        // move along viewing ray, scaled with zoom factor
        eye = eye.addScaled(v, zoom);

        // update camera matrix with lookAt() and invert again
        cam = VecMath.SFMatrix4f.lookAt(eye, centerOfRotation, up);
        viewMatrix = cam.inverse();
    }

    // initialize framebuffer object and associated texture
    function initFBO(w, h, type) {
        var tex = gl.createTexture();
        tex.width  = w;
        tex.height = h;
        tex.ready  = true;

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        var fbo = gl.createFramebuffer();
        var rb  = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE) {
            console.warn("FBO status: " + status);
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { fbo: fbo, rbo: rb, tex: tex, width: w, height: h };
    }

    // initialize foreground for post-processing effects
    function initOverlay() {
        // window-sized, view-aligned quad
        var geometry = {
            positions: [ -1, -1, 0,  1, -1, 0,  1, 1, 0,  -1, 1, 0 ],
            indices:   [ 0, 1, 2,  2, 3, 0 ]
        };

        foreground = new Drawable();
        foreground.setGeometry(geometry);

        // init GL objects
        initializeObject(foreground);

        // enable render to float texture, if possible
        var type = gl.UNSIGNED_BYTE;

        if (FP_TEXTURES_EXT) {
            type = gl.FLOAT;
            if (!FPL_TEXTURES_EXT) {
                foreground.minFilter = gl.NEAREST;
                foreground.magFilter = gl.NEAREST;
            }
        }
        foreground.wrapMode = gl.CLAMP_TO_EDGE;  // NPOT

        // init offscreen render target
        var res = 1; // 1 / 10;
        foreground.renderTarget = initFBO(canvas.width*res, canvas.height*res, type);
        foreground.texture[0]   = foreground.renderTarget.tex;

        // also holds target for shadow rendering pass to ease debugging and variable use
        // TODO; decouple shadow target from foreground overlay (generally, that's ugly)!
        res = 512;
        foreground.shadowTarget = initFBO(res, res, type);
        foreground.texture[1]   = foreground.shadowTarget.tex;

        // HACK; matrix is not needed for overlay, but renderObject() expects one,
        // so just set an identity matrix to avoid accessing an undefined value...
        foreground.modelView = VecMath.SFMatrix4f.identity();
    }

    // z-sorting and rendering of all objects according to given camera matrix and shader
    function sortAndRenderAll(cameraMatrix, projMat, sp, zSorting) {
        var obj = null;
        var zPos = [];
        var i, n = drawables.length;

        // first, do z-sorting for transparency
        if (zSorting) {
            for (i=0; i<n; i++) {
                obj = drawables[i];
                // dynamically attach matrix to object to avoid second calculation
                obj.modelView = cameraMatrix.mult(obj.transform);

                var center = obj.min.add(obj.max).multiply(0.5);
                center = obj.modelView.multMatrixPnt(center);

                zPos.push( { index: i, z: center.z, sortKey: obj.sortKey } );
            }

            // we are lazy and sort everything (incl. opaque objects)
            zPos.sort(function(a, b) {
                if (a.sortKey == b.sortKey) {
                    return a.z - b.z;
                }
                else {
                    return a.sortKey - b.sortKey;
                }
            });
        }

        // render shapes
        for (i=0; i<n; i++) {
            obj = drawables[zSorting ? zPos[i].index : i];

            if (!zSorting) {
                obj.modelView = cameraMatrix.mult(obj.transform);
            }
            else {
                // dis- or enable buffer depth write
                gl.depthMask(!obj.depthReadOnly);
            }

            // dis- or enable backface culling
            if (obj.solid)
                gl.enable(gl.CULL_FACE);
            else
                gl.disable(gl.CULL_FACE);

            renderObject(obj, sp, projMat);
        }
    }


    //-------------------------------------------------------
    // public section, methods
    //-------------------------------------------------------
    return {
        initialize: function() {
            if (!gl) {
                return false;
            }

            // standard shader for 3D objects
            shaderProgram = initShader(vertexShader, fragmentShader);
            // foreground shader
            shaderProgramOverlay = initShader(vertexShaderOverlay, fragmentShaderOverlay);
            // shadow-pass shader
            shaderProgramShadow = initShader(vertexShaderShadow, fragmentShaderShadow);

            if (!shaderProgram || !shaderProgramOverlay || !shaderProgramShadow) {
                console.error("Cannot compile or link shaders!");
                return false;
            }

            // also inits both fbo's...
            initOverlay();

            var aspect = canvas.width / canvas.height;
            // projection matrix
            projectionMatrix = VecMath.SFMatrix4f.perspective(fieldOfView, aspect, 0.1, 100);

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

            // update scene bounding box
            // first transform min/max of drawable with its modeling matrix
            var vol = new VecMath.BoxVolume(drawable.min, drawable.max);
            vol.transform(drawable.transform);
            // then, extend current scene bounds with transformed object bounds
            volume.extendBounds(vol.min, vol.max);

            // initialize drawable
            initializeObject(drawable);
            // push back
            drawables.push(drawable);

            return drawable;
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
            if (hasShadows) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, foreground.shadowTarget.fbo);
                gl.viewport(0, 0, foreground.shadowTarget.width, foreground.shadowTarget.height);

                // color buffer needs to be initialized with white since 1 means max depth
                gl.clearColor(1, 1, 1, 1);
                gl.clearDepth(1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                gl.enable(gl.CULL_FACE);

                sortAndRenderAll(lightMatrix, lightProjMat, shaderProgramShadow, false);

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            // bind render target
            if (showOverlay) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, foreground.renderTarget.fbo);

                // from here on, everything is drawn into fbo only
                gl.viewport(0, 0, foreground.renderTarget.width, foreground.renderTarget.height);
            }
            else {
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

            //gl.clearColor(0, 0, 0, 0);
            gl.clearColor(0.4, 0.4, 0.5, 1.0);
            gl.clearDepth(1.0);
            // clear framebuffer
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            //gl.colorMask(true, true, true, true);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            // first sorts, then renders all 3d objects
            sortAndRenderAll(viewMatrix, projectionMatrix, shaderProgram, true);

            gl.disable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(true);
            gl.disable(gl.DEPTH_TEST);

            // finally, draw foreground
            if (showOverlay) {
                // deactivate offscreen target
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                // ...and reset viewport size
                gl.viewport(0, 0, canvas.width, canvas.height);

                // depending on browser implementation, states need to be explicitly set
                gl.clearColor(0, 0, 0, 1);
                gl.clearDepth(1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                gl.disable(gl.BLEND);
                gl.disable(gl.CULL_FACE);
                gl.depthMask(true);
                gl.disable(gl.DEPTH_TEST);

                renderObject(foreground, shaderProgramOverlay, projectionMatrix);
            }
        },

        animate: function(dT) {
            // update animation values
            // FIXME; this is only a stupid sample impl. to show some anims
            for (var i=0; i<drawables.length; i++) {
                var obj = drawables[i];
                if (obj.animating) {
                    obj.angle += (2 * Math.PI * dT) / obj.numSeconds;

                    //obj.transform = VecMath.SFMatrix4f.rotationY(obj.angle);
                    obj.transform.setRotate(VecMath.Quaternion.axisAngle(new VecMath.SFVec3f(0,1,0), obj.angle));

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

        enableOverlay: function(on) {
            showOverlay = on;
        },

        enableShadows: function(on) {
            hasShadows = on;

            for (var i=0, n=drawables.length; i<n; i++) {
                var obj = drawables[i];

                // add or remove shadow texture
                if (hasShadows) {
                    obj.texture.push(foreground.texture[1]);
                }
                else {
                    obj.texture.pop();
                }
            }
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
            cycle = ((cycle += dT) > 1.0) ? 0.0 : cycle;

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

        resetView: function() {
            initCameraMatrix();
        },

        showAll: function() {
            showAllObjects();
        },

        // mouse and key input handlers
        onMouseMove: function (x, y, buttonState) {
            /*
            // just a funny but stupid test
            var ray = calcViewRay(x, y);

            var obj = drawables[0];
            var scale = 0.01;

            obj.transform.setTranslate(ray.pos.add(ray.dir.multiply(scale)));
            obj.transform.setScale(new VecMath.SFVec3f(scale, scale, scale));   // HACK to make obj visible
            */
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
                    //viewMatrix._03 -= 0.01;
                    pntLightPos.x -= 0.25;
                    break;
                case 38: /* up */
                    //viewMatrix._13 += 0.01;
                    pntLightPos.y += 0.25;
                    break;
                case 39: /* right */
                    //viewMatrix._03 += 0.01;
                    pntLightPos.x += 0.25;
                    break;
                case 40: /* down */
                    //viewMatrix._13 -= 0.01;
                    pntLightPos.y -= 0.25;
                    break;
                default:
            }
            if (keyCode >= 37 && keyCode <= 40)
                lightMatrix = VecMath.SFMatrix4f.lookAt(pntLightPos, centerOfRotation,
                                                 new VecMath.SFVec3f(0,1,0)).inverse();
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
                    //viewMatrix._23 += 0.05;
                    pntLightPos.z += 0.25;
                    break;
                case 45: /* - */
                    //viewMatrix._23 -= 0.05;
                    pntLightPos.z -= 0.25;
                    break;
                case  97: /* a */
                    showAllObjects();
                    break;
                case 114: /* r */
                    initCameraMatrix();
                    break;
                case 115: /* s */
                    // if shadows on and foreground activated, shadow map is shown
                    showShadowMap = !showShadowMap;
                    break;
                default:
            }
            if (charCode == 43 || charCode == 45)
                lightMatrix = VecMath.SFMatrix4f.lookAt(pntLightPos, centerOfRotation,
                                                 new VecMath.SFVec3f(0,1,0)).inverse();
        }
    }
};
