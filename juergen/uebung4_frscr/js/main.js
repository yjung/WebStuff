checkWebGL();


// our main rendering class
// http://www.khronos.org/registry/webgl/specs/latest/1.0/
var Renderer = function(canvas) {
    //-------------------------------------------------------
    // private section, variables
    //-------------------------------------------------------


    document.addEventListener('keypress', function (evt) {
        switch (evt.charCode) {
            case 43: /* + */
                break;
            case 45: /* - */
                break;
        }
    }, true);

    document.addEventListener('keydown', function (evt) {
        switch (evt.keyCode) {
            case 37: /* left */
                break;
            case 38: /* up */
                break;
            case 39: /* right */
                break;
            case 40: /* down */
                break;
        }
    }, true);

    // access to Renderer from inside other functions
    var that = this;

    // shader program object
    var shaderProgram = null;

    var lastFrameTime = 0;
    var needRender = true;


    //-------------------------------------------------------
    // private section, functions
    //-------------------------------------------------------

    // get GL context
    var gl = getContext(canvas);

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
        obj.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);

        obj.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);

        obj.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);

        obj.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);
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

            myFirstObject.texture = initTexture(myFirstObject.imgSrc);

            initBuffers(myFirstObject);

            lastFrameTime = Date.now();

            return true;
        },

        cleanup: function() {
            var shaders = gl.getAttachedShaders(shaderProgram);

            for (var i=0; i<shaders.length; ++i) {
                gl.detachShader(shaderProgram, shaders[i]);
                gl.deleteShader(shaders[i]);
            }

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;

            if (myFirstObject.texture)
                gl.deleteTexture(myFirstObject.texture);

            // delete VBOs, too
            gl.deleteBuffer(myFirstObject.indexBuffer);
            gl.deleteBuffer(myFirstObject.positionBuffer);
            gl.deleteBuffer(myFirstObject.colorBuffer);
            gl.deleteBuffer(myFirstObject.texCoordBuffer);
        },

        drawScene: function() {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clearDepth(1.0);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            // activate shader
            gl.useProgram(shaderProgram);

            // set uniforms
            gl.uniformMatrix4fv(shaderProgram.transMat, false, new Float32Array(myFirstObject.transform));

            if (myFirstObject.texture && myFirstObject.texture.ready) {
                gl.uniform1f(shaderProgram.texLoaded, 1);
                gl.uniform1i(shaderProgram.tex, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, myFirstObject.texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                //gl.generateMipmap(gl.TEXTURE_2D);
            }
            else {
                gl.uniform1f(shaderProgram.texLoaded, 0);
            }

            // render object indexed
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myFirstObject.indexBuffer);

            gl.bindBuffer(gl.ARRAY_BUFFER, myFirstObject.positionBuffer);
            gl.vertexAttribPointer(shaderProgram.position,  // index of attribute
                3,        // three position components (x,y,z)
                gl.FLOAT, // provided data type is float
                false,    // do not normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(shaderProgram.position);

            gl.bindBuffer(gl.ARRAY_BUFFER, myFirstObject.colorBuffer);
            gl.vertexAttribPointer(shaderProgram.color,  // index of attribute
                3,        // three color components (r,g,b)
                gl.FLOAT, // provided data type
                false,    // normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(shaderProgram.color);

            gl.bindBuffer(gl.ARRAY_BUFFER, myFirstObject.texCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.texCoord,  // index of attribute
                2,        // two texCoord components (s,t)
                gl.FLOAT, // provided data type is float
                false,    // do not normalize values
                0,        // stride (in bytes)
                0);       // offset (in bytes)
            gl.enableVertexAttribArray(shaderProgram.texCoord);

            // draw call
            gl.drawElements(gl.TRIANGLES, myFirstObject.indices.length, gl.UNSIGNED_SHORT, 0);

            gl.disableVertexAttribArray(shaderProgram.position);
            gl.disableVertexAttribArray(shaderProgram.color);
            gl.disableVertexAttribArray(shaderProgram.texCoord);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, null);
        },

        animate: function(dT) {
            // update animation values
            if (myFirstObject.animating) {
                //myFirstObject.angle += -(2 * Math.PI * dT) / myFirstObject.numSeconds;

                //  myFirstObject.transform[12] = 0.5 * Math.sin(myFirstObject.angle);
                //  myFirstObject.transform[13] = 0.5 * Math.cos(myFirstObject.angle);
                myFirstObject.angle += (2 * Math.PI * dT) / myFirstObject.numSeconds;

                myFirstObject.transform[0] = Math.cos(myFirstObject.angle);
                myFirstObject.transform[1] = -Math.sin(myFirstObject.angle);
                myFirstObject.transform[4] = Math.sin(myFirstObject.angle);
                myFirstObject.transform[5] = Math.cos(myFirstObject.angle);


                needRender = true;  // transform changed, need re-render
            }
        },

        setDuration: function(s) {
            // one loop per numSeconds
            myFirstObject.numSeconds = s;
        },

        toggleAnim: function() {
            myFirstObject.animating = !myFirstObject.animating;
            return myFirstObject.animating;
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
        }
    }
};

// Application object, used to minimize global variables
var MyApp = {
    renderer: null,

    setDuration: function(event) {
        if (this.renderer && (!event || event.keyCode == 13)) {
            var numSeconds = +document.getElementById("sec").value;
            this.renderer.setDuration(numSeconds);
        }
    },

    toggleAnim: function(btn) {
        if (this.renderer) {
            var anim = this.renderer.toggleAnim();
            btn.innerHTML = anim ? "Stop Animation" : "Start Animation";
        }
    },

    // cleanup
    shutdown: function() {
        if (this.renderer) {
            this.renderer.cleanup();
            this.renderer = null;
        }
    },

    // main entry point
    initialize: function() {
        var that = this;
        var canvas = document.getElementById("glCanvas");

        this.renderer = new Renderer(canvas);

        if (this.renderer.initialize()) {
            var statsDiv = document.getElementById("time");

            (function mainLoop() {
                that.renderer.tick(statsDiv);
                window.requestAnimationFrame(mainLoop);
            })();
        }
        else {
            console.error("Could not initialize WebGL!");
            this.renderer = null;
        }
    }
};

// Refactoring
function checkWebGL() {
    // make sure browser knows requestAnimationFrame method
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function () {
            return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback, element) {
                    window.setTimeout(callback, 16);
                };
        })();
    }
}

function getContext(canvas){
    var context = null;
    var validContextNames = ['webgl', 'experimental-webgl'];
    var ctxAttribs = { alpha: true, depth: true, antialias: true, premultipliedAlpha: false };

    for (var i=0; i<validContextNames.length; i++) {
        try {
            // provide context name and context creation params
            if (context = canvas.getContext(validContextNames[i], ctxAttribs)) {
                console.log("Found '" + validContextNames[i] + "' context");
                break;
            }
        }
        catch (e) { console.warn(e); }  // shouldn't happen on modern browsers
    }

    return context;
}

function getSourceSynch(url, type) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
}