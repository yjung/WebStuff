/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


/**
 * make sure browser knows requestAnimationFrame method
 */
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                window.setTimeout(callback, 16);
            };
    })();
}


/**
 * Helper to convert mouse event position
 */
function mousePosition(evt) {
    var pos  = { x: 0, y: 0 };
    var elem = evt.target.offsetParent;     //canvas

    var box       = elem.getBoundingClientRect();
    var compStyle = document.defaultView.getComputedStyle(elem, null);

    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    var scrollTop  = window.pageYOffset || document.documentElement.scrollTop;

    var paddingLeft     = parseFloat(compStyle.getPropertyValue('padding-left'));
    var borderLeftWidth = parseFloat(compStyle.getPropertyValue('border-left-width'));

    var paddingTop     = parseFloat(compStyle.getPropertyValue('padding-top'));
    var borderTopWidth = parseFloat(compStyle.getPropertyValue('border-top-width'));

    pos.x = Math.round(evt.pageX - (box.left + paddingLeft + borderLeftWidth + scrollLeft));
    pos.y = Math.round(evt.pageY - (box.top  + paddingTop  + borderTopWidth  + scrollTop));

    return pos;
}


/**
 * Application object, used to minimize global variables
 */
var MyApp = {
    // ref to renderer
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

    enableOverlay: function (on) {
        if (this.renderer) {
            this.renderer.enableOverlay(on);
            this.renderer.triggerRedraw();
        }
    },

    enableShadows: function (on) {
        if (this.renderer) {
            this.renderer.enableShadows(on);
            this.renderer.triggerRedraw();
        }
    },

    resetView: function () {
        if (this.renderer) {
            this.renderer.resetView();
            this.renderer.triggerRedraw();
        }
    },

    showAll: function () {
        if (this.renderer) {
            this.renderer.showAll();
            this.renderer.triggerRedraw();
        }
    },

    // cleanup
    shutdown: function () {
        if (this.renderer) {
            this.renderer.cleanup();
            this.renderer = null;
        }
    },

    // load mesh from file
    loadObject: function (fileName, transform, scaleFac, flags) {
        var that = this;

        var request = new XMLHttpRequest();
        request.open('GET', fileName, true);
        request.send();

        request.onload = function() {
            var geo, app;

            if (fileName.toLowerCase().indexOf(".obj") > 0) {
                var objDoc = new OBJDoc(fileName);

                // parse parameters: file string, scale, reverse normals
                if (!objDoc.parse(request.responseText, scaleFac, true)) {
                    console.error("OBJ file parsing error: " + fileName);
                    return;
                }

                geo = objDoc.getDrawingInfo();
                app = { imgSrc: [], alpha: 1.0 };
                if (geo.textureName)
                    app.imgSrc.push(geo.textureName);
            }
            else {
                // assume JSON string with geometry and appearance
                //var shape = eval("("+request.responseText+")");
                var shape = JSON.parse(request.responseText);

                if (!shape) {
                    console.error("JSON file parsing error: " + fileName);
                    return;
                }

                geo = shape.geometry;

                // be consistent with obj loader interface and allow rescaling
                var i = 0;
                if (scaleFac > 0.0 && scaleFac != 1.0) {
                    var n = geo.positions ? geo.positions.length : 0;
                    for (i=0; i<n; i++) {
                        geo.positions[i] *= scaleFac;
                    }
                }

                app = {
                    diffuseColor:  x3dom.fields.SFVec3f.parse(shape.appearance.diffuseColor),
                    specularColor: x3dom.fields.SFVec3f.parse(shape.appearance.specularColor),
                    imgSrc:  []
                };

                var textureName = shape.appearance.textureName;
                if (textureName) {
                    i = fileName.lastIndexOf("/");
                    if (i > 0) {
                        var dirPath = fileName.substr(0, i + 1);
                        textureName = dirPath + textureName;
                    }
                    app.imgSrc.push(textureName);
                }
            }

            var drawable = that.renderer.addObject(geo, app, transform);
            // HACK; those flags should be part of file format
            if (flags) {
                drawable.sortKey       = flags.sortKey;
                drawable.solid         = flags.solid;
                drawable.depthReadOnly = flags.depthReadOnly;
            }

            that.renderer.triggerRedraw();
        };
    },

    // little test scene
    setScene: function () {
        var sx = 0.5, sy = 0.5, sz = 0.5;
        var geo = {
            positions: [
                -sx,-sy,-sz,  -sx, sy,-sz,   sx, sy,-sz,   sx,-sy,-sz, //back   0, 0,-1
                -sx,-sy, sz,  -sx, sy, sz,   sx, sy, sz,   sx,-sy, sz, //front  0, 0, 1
                -sx,-sy,-sz,  -sx,-sy, sz,  -sx, sy, sz,  -sx, sy,-sz, //left  -1, 0, 0
                 sx,-sy,-sz,   sx,-sy, sz,   sx, sy, sz,   sx, sy,-sz, //right  1, 0, 0
                -sx, sy,-sz,  -sx, sy, sz,   sx, sy, sz,   sx, sy,-sz, //top    0, 1, 0
                -sx,-sy,-sz,  -sx,-sy, sz,   sx,-sy, sz,   sx,-sy,-sz  //bottom 0,-1, 0
            ],
            normals: [
                0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,
                0,0,1,   0,0,1,   0,0,1,   0,0,1,
                -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0,
                1,0,0,   1,0,0,   1,0,0,   1,0,0,
                0,1,0,   0,1,0,   0,1,0,   0,1,0,
                0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0
            ],
            colors: [
                0,0,0,1,  0,1,0,1,  1,1,0,1,  1,0,0,1,
                0,0,1,1,  0,1,1,1,  1,1,1,1,  1,0,1,1,
                0,0,0,1,  0,0,1,1,  0,1,1,1,  0,1,0,1,
                1,0,0,1,  1,0,1,1,  1,1,1,1,  1,1,0,1,
                0,1,0,1,  0,1,1,1,  1,1,1,1,  1,1,0,1,
                0,0,0,1,  0,0,1,1,  1,0,1,1,  1,0,0,1
            ],
            texCoords: [
                1,0, 1,1, 0,1, 0,0,
                0,0, 0,1, 1,1, 1,0,
                0,0, 1,0, 1,1, 0,1,
                1,0, 0,0, 0,1, 1,1,
                0,1, 0,0, 1,0, 1,1,
                0,0, 0,1, 1,1, 1,0
            ],
            indices: [
                0,1,2, 2,3,0,
                4,7,5, 5,7,6,
                8,9,10, 10,11,8,
                12,14,13, 14,12,15,
                16,17,18, 18,19,16,
                20,22,21, 22,20,23
            ]
        };
        var app = {
            imgSrc: ["../models/todo.jpg"],
            diffuseColor:  new VecMath.SFColor(1, 0, 0),
            specularColor: new VecMath.SFColor(.5, .5, .5)
        };
        var trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(-0.55, 0, 0));

        // Box
        this.renderer.addObject(geo, app, trafo);


        // add second object
        geo.positions = [];
        geo.normals = [];
        geo.colors = [];
        geo.texCoords = [];
        geo.indices = [];

        // create sphere
        var r = 0.5;
        var latitudeBands = 24, longitudeBands = 24;
        var numLongitudeBands = longitudeBands + 1;

        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = (latNumber * Math.PI) / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = (longNumber * 2.0 * Math.PI) / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                var u = 1.0 - longNumber / longitudeBands;
                var v = 1.0 - latNumber / latitudeBands;

                geo.positions.push(r * x, r * y, r * z);
                geo.normals.push(x, y, z);
                geo.texCoords.push(u, v);

                if (latNumber < latitudeBands && longNumber < longitudeBands) {
                    var first = latNumber * numLongitudeBands + longNumber;
                    var second = numLongitudeBands + first;

                    geo.indices.push(second, first, first + 1);
                    geo.indices.push(second + 1, second, first + 1);
                }
            }
        }

        app.imgSrc = ["../models/todo.jpg"];
        app.diffuseColor = new VecMath.SFColor(0, 0, 1);
        app.alpha = 0.8;
        trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(0.55, 0, 0));

        // Sphere
        this.renderer.addObject(geo, app, trafo);

        // and load/add file(s)
        trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(0.25, 0.75, 0));
        //this.loadObject('../models/buddha.obj', trafo, 0.4);
        //this.loadObject('../models/bunny.obj' , trafo, 0.25);
        this.loadObject('../models/cow.obj'   , trafo, 0.075);
        //this.loadObject('../models/cube.obj'  , trafo, 0.2);
        //this.loadObject('../models/dragon.obj', trafo, 0.4);
        //this.loadObject('../models/horse.obj' , trafo, 0.5);
        //this.loadObject('../models/teapot.obj', trafo, 0.1);
        //this.loadObject('../models/terracotta.obj', trafo, 0.5);

        trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(-0.5, 0.5, 0));
        this.loadObject('../models/unicorn_body.json', trafo, 0.25);
        this.loadObject('../models/unicorn_hair.json', trafo, 0.25, {sortKey: 1, solid: false, depthReadOnly: true});
    },

    // main entry point
    initialize: function () {
        var that = this;
        var canvas = document.getElementById("glCanvas");

        canvas.setAttribute("tabindex", "0");   // for key events
        canvas.focus();

        this.renderer = new Renderer(canvas);

        if (this.renderer.initialize()) {
            var statsDiv = document.getElementById("time");

            this.attachHandlers(canvas);
            this.setScene();

            (function mainLoop() {
                that.renderer.tick(statsDiv);
                window.requestAnimationFrame(mainLoop);
            })();
        }
        else {
            console.error("Could not initialize WebGL!");
            this.renderer = null;
        }
    },

    // attach event handlers for canvas element
    attachHandlers: function (canvas) {
        var that = this.renderer;

        canvas.mouse_dragging = false;
        canvas.mouse_button = 0;
        canvas.mouse_drag_x = 0;
        canvas.mouse_drag_y = 0;

        // TODO: handle context lost events properly!
        canvas.addEventListener("webglcontextlost", function (event) {
            console.error("WebGL context lost handler NYI");
            event.preventDefault();
        }, false);

        canvas.addEventListener("webglcontextrestored", function (event) {
            console.warn("Recover WebGL state and resources on context lost NYI");
            event.preventDefault();
        }, false);

        canvas.oncontextmenu = function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        };


        // Mouse event handler for interaction
        canvas.addEventListener('mousedown', function (evt) {
            this.focus();

            switch (evt.button) {
                case 0:  canvas.mouse_button = 1; break;  //left
                case 1:  canvas.mouse_button = 4; break;  //middle
                case 2:  canvas.mouse_button = 2; break;  //right
                default: canvas.mouse_button = 0; break;
            }
            if (evt.shiftKey) { canvas.mouse_button = 1; }
            if (evt.ctrlKey) { canvas.mouse_button = 4; }
            if (evt.altKey) { canvas.mouse_button = 2; }

            var pos = mousePosition(evt);
            canvas.mouse_drag_x = pos.x;
            canvas.mouse_drag_y = pos.y;
            canvas.mouse_dragging = true;

            that.onMousePress(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            that.triggerRedraw();
        }, false);

        canvas.addEventListener('mouseup', function (evt) {
            that.onMouseRelease(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            that.triggerRedraw();

            canvas.mouse_button = 0;
            canvas.mouse_dragging = false;
        }, false);

        canvas.addEventListener('mousemove', function (evt) {
            if (evt.shiftKey) { canvas.mouse_button = 1; }
            if (evt.ctrlKey) { canvas.mouse_button = 4; }
            if (evt.altKey) { canvas.mouse_button = 2; }

            var pos = mousePosition(evt);
            canvas.mouse_drag_x = pos.x;
            canvas.mouse_drag_y = pos.y;

            if (canvas.mouse_dragging) {
                that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            }
            else {
                that.onMouseMove(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            }
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        canvas.addEventListener('mouseover', function (evt) {
            //
        }, false);

        canvas.addEventListener('mouseout', function (evt) {
            that.onMouseOut();
            that.triggerRedraw();

            canvas.mouse_button = 0;
            canvas.mouse_dragging = false;
        }, false);

        canvas.addEventListener('dblclick', function (evt) {
            //
        }, false);

        // Firefox
        canvas.addEventListener('DOMMouseScroll', function (evt) {
            this.focus();
            canvas.mouse_drag_y += 2 * evt.detail;

            that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        // Chrome
        canvas.addEventListener('mousewheel', function (evt) {
            this.focus();
            canvas.mouse_drag_y -= 0.1 * evt.wheelDeltaY;

            that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);


        // Key Events
        canvas.addEventListener('keypress', function (evt) {
            that.onKeyPress(evt.charCode);
            that.triggerRedraw();
        }, true);

        canvas.addEventListener('keyup', function (evt) {
            that.onKeyUp(evt.keyCode);
            that.triggerRedraw();
        }, true);

        canvas.addEventListener('keydown', function (evt) {
            that.onKeyDown(evt.keyCode);
            that.triggerRedraw();
        }, true);
    }
};


// load app
window.addEventListener('load', function () {
    "use strict";
    MyApp.initialize();
}, false);

// unload app
window.addEventListener('unload', function () {
    "use strict";
    MyApp.shutdown();
}, false);
