// Initialisierung
checkWebGL();

// Application wuerfel, used to minimize global variables
var Anwendung = createApp();

var viewMat = mat4.create();
var projectionMat = mat4.create();
var modelViewProjection = mat4.create();


// our main rendering class
var Renderer = function (canvas) {
    //-------------------------------------------------------
    // private section, variables
    //-------------------------------------------------------

    // Event-Listener
    //canvas.setAttribute("tabindex", "0");

    document.addEventListener('keypress', function (evt) {
        switch (evt.charCode) {
            case 43: /* + */
                var zoomVec = vec4.fromValues(0, 0, 0.25, 0);
                mat4.translate(viewMat, viewMat, zoomVec);
                break;
            case 45: /* - */
                var zoomVec = vec4.fromValues(0, 0, -0.25, 0);
                mat4.translate(viewMat, viewMat, zoomVec);
                break;
        }
    }, true);

    document.addEventListener('keydown', function (evt) {
        switch (evt.keyCode) {
            case 37: /* left */
                var transVec = vec4.fromValues(-0.25, 0, 0, 0);
                mat4.translate(viewMat, viewMat, transVec);
                break;
            case 38: /* up */
                var transVec = vec4.fromValues(0, 0.25, 0, 0);
                mat4.translate(viewMat, viewMat, transVec);
                break;
            case 39: /* right */
                var transVec = vec4.fromValues(0.25, 0, 0, 0);
                mat4.translate(viewMat, viewMat, transVec);
                break;
            case 40: /* down */
                var transVec = vec4.fromValues(0, -0.25, 0, 0);
                mat4.translate(viewMat, viewMat, transVec);
                break;
        }
    }, true);

    canvas.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
    }, false);

    canvas.addEventListener('mouseup', function (evt) {
        switch (evt.button) {
                case 0: /* left */
                    console.log("Left");
//                var transVec = vec4.fromValues(-0.25, 0, 0, 0);
//                mat4.translate(viewMat, viewMat, transVec);
                    break;
                case 2: /* up */
                    console.log("Right");
//                var transVec = vec4.fromValues(0, 0.25, 0, 0);
//                mat4.translate(viewMat, viewMat, transVec);
                    break;
            }
        },true);


    // access to Renderer from inside other functions
    var that = this;
    // shader program wuerfel
    var shaderProgram = null;

    var lastFrameTime = 0;

    //-------------------------------------------------------
    // private section, functions
    //-------------------------------------------------------


    // init buffer wuerfels (dynamically attach buffer reference to obj)
    function initBuffers(obj) {
        obj.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);

//        obj.texCoordBuffer = gl.createBuffer();
//        gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
//        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);

        obj.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);

        obj.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);
        console.log("FERTIG: Buffer-Initialisierung");
    }

    //-------------------------------------------------------
    // public section, methods
    //-------------------------------------------------------
    gl = getContext(canvas);

    return {
        initialize: function () {
            if (!gl) {
                return false;
            }

            // Shaderprogramm durch Initialisierung mit extern geladenen Shader-Sources als Parameter
            shaderProgram = initShader(getSourceSynch("shader/vertex.glsl", "text"), getSourceSynch("shader/fragment.glsl", "text"));

            if (!shaderProgram) {
                return false;
            }

            wuerfel.texture = initTexture(wuerfel.imgSrc);
            initBuffers(wuerfel);

            lastFrameTime = Date.now();
            console.log("FERTIG: Initialisierung abgeschlossen");
            return true;
        },

        cleanup: function () {
            var shaders = gl.getAttachedShaders(shaderProgram);

            for (var i = 0; i < shaders.length; ++i) {
                gl.detachShader(shaderProgram, shaders[i]);
                gl.deleteShader(shaders[i]);
            }

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;

            if (wuerfel.texture)
                gl.deleteTexture(wuerfel.texture);

            // delete VBOs, too
            gl.deleteBuffer(wuerfel.indexBuffer);
            gl.deleteBuffer(wuerfel.positionBuffer);
            gl.deleteBuffer(wuerfel.colorBuffer);
            gl.deleteBuffer(wuerfel.texCoordBuffer);
        },

        drawScene: function () {
            gl.clearColor(1, 1, 1, 0);
            gl.clearDepth(1.0);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            // activate shader
            gl.useProgram(shaderProgram);

            // set uniforms
            mat4.multiply(modelViewProjection, wuerfel.transMat, modelViewProjection);

            gl.uniformMatrix4fv(shaderProgram.transMat, false, new Float32Array(modelViewProjection));

            if (wuerfel.texture && wuerfel.texture.ready) {
                gl.uniform1f(shaderProgram.texLoaded, 1);                               // Textur geladen
                gl.uniform1i(shaderProgram.tex, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, wuerfel.texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            else {
                gl.uniform1f(shaderProgram.texLoaded, 0);                               // Textur nicht geladen
            }

            // render wuerfel indexed
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wuerfel.indexBuffer);

            gl.bindBuffer(gl.ARRAY_BUFFER, wuerfel.positionBuffer);
            gl.vertexAttribPointer(shaderProgram.position,  // index of attribute
                3,                                          // three position components (x,y,z)
                gl.FLOAT,                                   // provided data type is float
                false,                                      // do not normalize values
                0,                                          // stride (in bytes)
                0);                                         // offset (in bytes)
            gl.enableVertexAttribArray(shaderProgram.position);

            gl.bindBuffer(gl.ARRAY_BUFFER, wuerfel.colorBuffer);
            gl.vertexAttribPointer(shaderProgram.color,     // index of attribute
                3,                                          // three color components (r,g,b)
                gl.FLOAT,                                   // provided data type
                false,                                      // normalize values
                0,                                          // stride (in bytes)
                0);                                         // offset (in bytes)
            gl.enableVertexAttribArray(shaderProgram.color);


            // draw call
            gl.drawElements(gl.TRIANGLES, wuerfel.indices.length, gl.UNSIGNED_SHORT, 0);

            gl.disableVertexAttribArray(shaderProgram.position);
            gl.disableVertexAttribArray(shaderProgram.color);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, null);
        },


        animate: function (dT) {
            // update animation values
            if (wuerfel.animating) {
                wuerfel.angle += (2 * Math.PI * dT) / wuerfel.numSeconds;       // Drehung
                var identitaetsMat = mat4.create();		                        // Identitaetsmatrix erzeugen
                mat4.rotateZ(wuerfel.transMat, identitaetsMat, wuerfel.angle);  // Identitätsmatrix um Winkel drehen und in transmat speichern

            }
        },

        setDuration: function (s) {
            // one loop per numSeconds
            console.log(wuerfel);
            wuerfel.numSeconds = s;
        },

        toggleAnim: function () {
            console.log(wuerfel.animating);
            wuerfel.animating = !wuerfel.animating;
            return wuerfel.animating;
        },

        tick: function (stats) {
            // first, calc new deltaT
            var currTime = Date.now();
            var dT = currTime - lastFrameTime;
            var fpsStr = (1000 / dT).toFixed(2);
            dT /= 1000;

            // then, update
            this.animate(dT);
            this.updateCamera();
            // and render scene
            this.drawScene();

            // finally, show some statistics
            if (stats) {
                fpsStr = (currTime / 1000).toFixed(3) + "<br>dT: " + dT + "<br>fps: " + fpsStr;
                stats.innerHTML = fpsStr;
            }
            lastFrameTime = currTime;
        },

        updateCamera: function () {

            /**
             * Generates a perspective projection matrix with the given bounds
             *
             * @param {mat4} out mat4 frustum matrix will be written into
             * @param {number} fovy Vertical field of view in radians
             * @param {number} aspect Aspect ratio. typically viewport width/height
             * @param {number} near Near bound of the frustum
             * @param {number} far Far bound of the frustum
             * @returns {mat4} out
             */

            mat4.perspective(projectionMat, 45, canvas.width / canvas.height, 0.1, 1000)
            mat4.multiply(modelViewProjection, projectionMat, viewMat);


        }
    };
};

// ------------------------------------------------------ Refactoring -----------------------------------------------------

// make sure browser knows requestAnimationFrame method
function checkWebGL() {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback, element) {
                    window.setTimeout(callback, 16);
                };
        })();
    }
}

// get GL context
function getContext(canvas) {
    var context = null;
    var validContextNames = ['webgl'];
    var ctxAttribs = {
        alpha: true,
        depth: true,
        antialias: true,
        premultipliedAlpha: false
    };

    for (var i = 0; i < validContextNames.length; i++) {
        try {
            // provide context name and context creation params
            if (context = canvas.getContext(validContextNames[i], ctxAttribs)) {
                console.log("Found '" + validContextNames[i] + "' context");
                break;
            }
        } catch (e) {
            console.warn(e);
        } // shouldn't happen on modern browsers
    }
    return context;
};

function createApp() {
    return Anwendung = {

        renderer: null,

        setDuration: function (event) {
            if (this.renderer && (!event || event.keyCode == 13)) {
                var numSeconds = +document.getElementById("sec").value;
                this.renderer.setDuration(numSeconds);
            }
        },

        toggleAnim: function (btn) {
            if (this.renderer) {
                var anim = this.renderer.toggleAnim();
                btn.innerHTML = anim ? "Stop Animation" : "Start Animation";
            }
        },

        // cleanup
        shutdown: function () {
            if (this.renderer) {
                this.renderer.cleanup();
                this.renderer = null;
            }
        },

        // main entry point
        initialize: function () {
            var that = this;
            var canvas = document.getElementById("glCanvas");

            this.renderer = new Renderer(canvas);

            if (this.renderer.initialize()) {
                var statsDiv = document.getElementById("time");

                (function mainLoop() {
                    that.renderer.tick(statsDiv);
                    // console.log("1");
                    window.requestAnimationFrame(mainLoop);
                })();
            } else {
                console.error("Could not initialize WebGL!");
                this.renderer = null;
            }
        }
    };

};

/* Hier ggf. den req.responseType aendern
 * * Standard ist: "text"
 * Alternativ: "json", "arraybuffer"
 * */
function getSourceSynch(url, type) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
};
