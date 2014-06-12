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

    setEffect: function (value) {
        if (this.renderer) {
            switch(value) {
                case "Grayscale":
                    this.renderer.setEffectsMode(1);
                    break;
                case "Sketch":
                    this.renderer.setEffectsMode(2);
                    break;
                case "Blur":
                    this.renderer.setEffectsMode(3);
                    break;
                case "DepthOfField":
                    this.renderer.setEffectsMode(4);
                    break;
                case "None":
                default:
                    this.renderer.setEffectsMode(0);
                    break;
            }
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

        // load cube in scene
        var translationMatrix = mat4.create();                                      // Unit Matrix
        var offsetVector = vec3.fromValues(-0.55, 0, 0);                            // Offset Vector
        mat4.translate(translationMatrix, translationMatrix, offsetVector);         // Translation
        this.renderer.addObject(cube.geometry, cube.appearance, translationMatrix); // add cube in 3D scene

        // load sphere in scene
        var translationMatrix = mat4.create();                                      // Unit Matrix
        var offsetVector = vec3.fromValues(0.55, 0, 0);                            // Offset Vector
        mat4.translate(translationMatrix, translationMatrix, offsetVector);         // Translation
        this.renderer.addObject(sphere.geometry, sphere.appearance, translationMatrix); // add sphere in 3D scene


        // and load/add file(s)
        trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(0.25, 0.75, 0));
        //this.loadObject('../models/buddha.obj', trafo, 0.4);
        //this.loadObject('../models/bunny.obj' , trafo, 0.25);
        //this.loadObject('../models/cow.obj'   , trafo, 0.075);
        //this.loadObject('../models/cube.obj'  , trafo, 0.2);
        //this.loadObject('../models/dragon.obj', trafo, 0.4);
        //this.loadObject('../models/horse.obj' , trafo, 0.5);
        //this.loadObject('../models/teapot.obj', trafo, 0.1);
        //this.loadObject('../models/terracotta.obj', trafo, 0.5);

        trafo = VecMath.SFMatrix4f.translation(new VecMath.SFVec3f(-0.5, 0.5, 0));
        //this.loadObject('../models/unicorn_body.json', trafo, 0.25);
        //this.loadObject('../models/unicorn_hair.json', trafo, 0.25, {sortKey: 1, solid: false, depthReadOnly: true});
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

            // render loop
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
                that.onMouseDrag(this.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            }
            else {
                that.onMouseMove(this.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
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

            that.onMouseDrag(this.mouse_drag_x, canvas.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        // Chrome
        canvas.addEventListener('mousewheel', function (evt) {
            this.focus();
            canvas.mouse_drag_y -= 0.1 * evt.wheelDeltaY;

            that.onMouseDrag(this.mouse_drag_x, canvas.mouse_drag_y, 2);
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
