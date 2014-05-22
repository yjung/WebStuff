/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


// make sure browser knows requestAnimationFrame method
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


// Application object, used to minimize global variables
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

        canvas.setAttribute("tabindex", "0");
        canvas.focus();

        this.renderer = new Renderer(canvas);

        if (this.renderer.initialize()) {
            var statsDiv = document.getElementById("time");

            this.attachHandlers(canvas);

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

            canvas.mouse_drag_x = evt.layerX;
            canvas.mouse_drag_y = evt.layerY;
            canvas.mouse_dragging = true;

            that.onMousePress(this.mouse_drag_x, this.mouse_drag_y, this.mouse_button);
            that.triggerRedraw();
        }, false);

        canvas.addEventListener('mouseup', function (evt) {
            that.onMouseRelease(this.mouse_drag_x, this.mouse_drag_y, this.mouse_button);
            that.triggerRedraw();

            canvas.mouse_button = 0;
            canvas.mouse_dragging = false;
        }, false);

        canvas.addEventListener('mousemove', function (evt) {
            if (evt.shiftKey) { canvas.mouse_button = 1; }
            if (evt.ctrlKey) { canvas.mouse_button = 4; }
            if (evt.altKey) { canvas.mouse_button = 2; }

            canvas.mouse_drag_x = evt.layerX;
            canvas.mouse_drag_y = evt.layerY;

            if (this.mouse_dragging) {
                that.onMouseDrag(this.mouse_drag_x, this.mouse_drag_y, this.mouse_button);
            }
            else {
                that.onMouseMove(this.mouse_drag_x, this.mouse_drag_y, this.mouse_button);
            }
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        canvas.addEventListener('mouseover', function (evt) {
            // TODO
        }, false);

        canvas.addEventListener('mouseout', function (evt) {
            // TODO
        }, false);

        canvas.addEventListener('dblclick', function (evt) {
            // TODO
        }, false);

        // Firefox
        canvas.addEventListener('DOMMouseScroll', function (evt) {
            this.focus();
            canvas.mouse_drag_y += 2 * evt.detail;

            that.onMouseDrag(this.mouse_drag_x, this.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        // Chrome
        canvas.addEventListener('mousewheel', function (evt) {
            this.focus();
            canvas.mouse_drag_y -= 0.1 * evt.wheelDeltaY;

            that.onMouseDrag(this.mouse_drag_x, this.mouse_drag_y, 2);
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
