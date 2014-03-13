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

    var preamble =  "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
                    "  precision highp float;\n" +
                    "#else\n" +
                    "  precision mediump float;\n" +
                    "#endif\n\n";

    // vertex shader string
    var vertexShader =  "attribute vec3 position;\n" +
                        "attribute vec2 texCoord;\n" +
                        "attribute vec3 color;\n" +
                        "uniform mat4 transMat;\n" +
                        "varying vec3 vColor;\n" +
                        "varying vec2 vTexCoord;\n" +
                        "void main() {\n" +
                        "    vColor = color;\n" +
                        "    vTexCoord = texCoord;\n" +
                        "    vec4 pos = transMat * vec4(position, 1.0);\n" +
                        "    gl_Position = pos;\n" +
                        "}\n";

    // fragment shader string
    var fragmentShader = preamble +
                        "uniform sampler2D tex0;\n" +
                        "uniform float tex0Loaded;\n" +
                        "varying vec3 vColor;\n" +
                        "varying vec2 vTexCoord;\n" +
                        "void main() {\n" +
                        "    vec4 color = vec4(vColor, 1.0);\n" +
                        "    if (tex0Loaded == 1.0 && gl_FrontFacing)\n" +
                        "        color = texture2D(tex0, vTexCoord);\n" +
                        "    gl_FragColor = color;\n" +
                        "}\n";

    // shader program object
    var shaderProgram = null;

    // more private module-global variables
    var lastFrameTime = 0;
    var needRender = true;

    // camera
    var viewMatrix = VecMath.SFMatrix4f.identity();
    var projectionMatrix = VecMath.SFMatrix4f.identity();

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
            //gl.bindAttribLocation(program, 0, "position");

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
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);
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


        // set uniforms
        var modelview = viewMatrix.mult(obj.transform);
        var modelviewProjection = projectionMatrix.mult(modelview);
        gl.uniformMatrix4fv(sp.transMat, false, new Float32Array(modelviewProjection.toGL()));

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

        if (sp.color !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
            gl.vertexAttribPointer( sp.color,  // index of attribute
                                    3,        // three color components (r,g,b)
                                    gl.FLOAT, // provided data type
                                    false,    // normalize values
                                    0,        // stride (in bytes)
                                    0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.color);
        }

        if (sp.texCoord !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
            gl.vertexAttribPointer( sp.texCoord,  // index of attribute
                                    2,        // two texCoord components (s,t)
                                    gl.FLOAT, // provided data type is float
                                    false,    // do not normalize values
                                    0,        // stride (in bytes)
                                    0);       // offset (in bytes)
            gl.enableVertexAttribArray(sp.texCoord);
        }

        
        // draw call
        if (obj.indices.length)
            gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
        else
            gl.drawArrays(gl.TRIANGLES, 0, obj.positions.length / 3);
        

        // deactivate buffers
        if (sp.position !== undefined)
            gl.disableVertexAttribArray(sp.position);
        if (sp.normal !== undefined)
            gl.disableVertexAttribArray(sp.normal);
        if (sp.color !== undefined)
            gl.disableVertexAttribArray(sp.color);
        if (sp.texCoord !== undefined)
            gl.disableVertexAttribArray(sp.texCoord);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // load textures and create VBOs for geometry
    function initializeObject(obj) {
        // also create or load object
        obj.positions = [
            -0.5, -0.5, 0,
             0.5, -0.5, 0,
            -0.5,  0.5, 0,
             0.5,  0.5, 0,
             0,    1,   0
        ];
        obj.normals = [];
        obj.colors = [
            1, 1, 0,
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
            1, 1, 1
        ];
        obj.texCoords = [
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0.5, 0
        ];
        // index array for drawing a quad (consisting of two tris)
        obj.indices = [
            0, 1, 2,
            3, 2, 1,
            2, 3, 4
        ];

        // add little animation helper
        obj.angle = 0;

        // tex img
        obj.imgSrc.push("models/todo.jpg");


        // finally, init textures and VBOs
        for (var j=0; j<obj.imgSrc.length; ++j) {
            obj.texture[j] = initTexture(obj.imgSrc[j]);
        }

        initBuffers(obj);
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

            // create drawable object
            var myFirstObject = new Drawable();
            // initialize drawable
            initializeObject(myFirstObject);
            // push back
            drawables.push(myFirstObject);

            viewMatrix = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(0, 0, 2.5)).inverse();
            projectionMatrix = VecMath.SFMatrix4f.perspective(0.785398, 1.0, 0.1, 1000);

            lastFrameTime = Date.now();

            return true;
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
            //gl.enable(gl.CULL_FACE);

            // render shapes
            for (var i=0; i<drawables.length; i++) {
                renderObject(drawables[i], shaderProgram);
            }
        },

        animate: function(dT) {
            // update animation values
            // FIXME; this is only a stupid sample impl.
            for (var i=0; i<drawables.length; i++) {
                var obj = drawables[i];
                if (obj.animating) {
                    obj.angle += (2 * Math.PI * dT) / obj.numSeconds;

                    //obj.transform._03 = 0.5 * Math.cos(obj.angle);
                    //obj.transform._13 = 0.5 * Math.sin(obj.angle);
                    obj.transform = VecMath.SFMatrix4f.rotationY(-obj.angle);

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
            var obj = drawables.length ? drawables[0] : null;
            if (obj) {
                obj.animating = !obj.animating;
                return obj.animating;
            }
            return false;
        },

        triggerRedraw: function() {
            // flag is checked every frame
            needRender = true;
        },

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
            // TODO
            console.log(x + ", " + y + "; " + buttonState);
        },

        onMousePress: function (x, y, buttonState) {
            // TODO
        },

        onMouseRelease: function (x, y, buttonState) {
            // TODO
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
                    viewMatrix._23 += 0.01;
                    break;
                case 45: /* - */
                    viewMatrix._23 -= 0.01;
                    break;
                default:
            }
        }
    }
};
