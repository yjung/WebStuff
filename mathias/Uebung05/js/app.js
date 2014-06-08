/**
 * Created with JetBrains WebStorm.
 * User: yjung
 */


// make sure browser knows requestAnimationFrame method
if (!window.requestAnimationFrame)
{
    window.requestAnimationFrame = (function ()
    {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element)
            {
                window.setTimeout(callback, 16);
            };
    })();
}


/** Helper to convert a point from node coordinates to page coordinates */
function mousePosition(evt)
{
    var pos = { x: 0, y: 0 };

    if ("getBoundingClientRect" in document.documentElement)
    {
        var elem = evt.target.offsetParent;     //canvas
        var box = elem.getBoundingClientRect();

        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        var compStyle = document.defaultView.getComputedStyle(elem, null);

        var paddingLeft = parseFloat(compStyle.getPropertyValue('padding-left'));
        var borderLeftWidth = parseFloat(compStyle.getPropertyValue('border-left-width'));

        var paddingTop = parseFloat(compStyle.getPropertyValue('padding-top'));
        var borderTopWidth = parseFloat(compStyle.getPropertyValue('border-top-width'));

        pos.x = Math.round(evt.pageX - (box.left + paddingLeft + borderLeftWidth + scrollLeft));
        pos.y = Math.round(evt.pageY - (box.top + paddingTop + borderTopWidth + scrollTop));
    }
    else
    {
        console.error('NO getBoundingClientRect method found!');
    }

    return pos;
}


// Application object, used to minimize global variables
var MyApp = {
    // ref to renderer
    renderer: null,

    setDuration: function (event)
    {
        if (this.renderer && (!event || event.keyCode == 13))
        {
            var numSeconds = +document.getElementById("sec").value;
            this.renderer.setDuration(numSeconds);
        }
    },

    toggleAnim: function (btn)
    {
        if (this.renderer)
        {
            var anim = this.renderer.toggleAnim();
            btn.innerHTML = anim ? "Stop Animation" : "Start Animation";
        }
    },

    // cleanup
    shutdown: function ()
    {
        if (this.renderer)
        {
            this.renderer.cleanup();
            this.renderer = null;
        }
    },

    loadObject: function (fileName, transform, scaleFac)
    {
        var that = this;

        var request = new XMLHttpRequest();
        request.open('GET', fileName, true);
        request.send();

        request.onload = function ()
        {
            var objDoc = new OBJDoc(fileName);
            // parse parameters: fileString, scale, reverse
            if (!objDoc.parse(request.responseText, scaleFac, true))
            {
                console.error("OBJ file parsing error: " + fileName);
                return;
            }

            var geo = objDoc.getDrawingInfo();
            var app = { imgSrc: [] };
            if (geo.textureName)
                app.imgSrc.push(geo.textureName);

            that.renderer.addObject(geo, app, transform);
            that.renderer.triggerRedraw();
        };
    },

    // little test scene
    setScene: function ()
    {
        // Wuerfel in Szene laden
        var translationsmatrix = mat4.create();                                             // Einheitsmatrix
        var verschiebungsVektor = vec3.fromValues(-0.55, 0, 0);                             // Verschiebungsvektor
        mat4.translate(translationsmatrix, translationsmatrix, verschiebungsVektor);        // Translation
        this.renderer.addObject(wuerfel.geometrie, wuerfel.aussehen, translationsmatrix);   // In 3D-Szene

        // Kugel in Szene laden
        var translationsMatrix = mat4.create();                                             // Einheitsmatrix
        var verschiebungsVektor = vec3.fromValues(0.55, 0, 0);                              // Verschiebungsvektor
        mat4.translate(translationsMatrix, translationsMatrix, verschiebungsVektor);        // Translation
        this.renderer.addObject(kugel.geometrie, kugel.aussehen, translationsMatrix);       // In 3D-Szene
    },

    // main entry point
    initialize: function ()
    {
        var that = this;
        var canvas = document.getElementById("glCanvas");

        canvas.setAttribute("tabindex", "0");
        canvas.focus();

        this.renderer = new Renderer(canvas);

        if (this.renderer.initialize())
        {
            var statsDiv = document.getElementById("time");

            this.attachHandlers(canvas);
            this.setScene();

            (function mainLoop()
            {
                that.renderer.tick(statsDiv);
                window.requestAnimationFrame(mainLoop);
            })();
        }
        else
        {
            console.error("Could not initialize WebGL!");
            this.renderer = null;
        }
    },

    // attach event handlers for canvas element
    attachHandlers: function (canvas)
    {
        var that = this.renderer;

        canvas.mouse_dragging = false;
        canvas.mouse_button = 0;
        canvas.mouse_drag_x = 0;
        canvas.mouse_drag_y = 0;

        // TODO: handle context lost events properly!
        canvas.addEventListener("webglcontextlost", function (event)
        {
            console.error("WebGL context lost handler NYI");
            event.preventDefault();
        }, false);

        canvas.addEventListener("webglcontextrestored", function (event)
        {
            console.warn("Recover WebGL state and resources on context lost NYI");
            event.preventDefault();
        }, false);

        canvas.oncontextmenu = function (evt)
        {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        };


        // Mouse event handler for interaction
        canvas.addEventListener('mousedown', function (evt)
        {
            this.focus();

            switch (evt.button)
            {
                case 0:
                    canvas.mouse_button = 1;
                    break;  //left
                case 1:
                    canvas.mouse_button = 4;
                    break;  //middle
                case 2:
                    canvas.mouse_button = 2;
                    break;  //right
                default:
                    canvas.mouse_button = 0;
                    break;
            }
            if (evt.shiftKey)
            {
                canvas.mouse_button = 1;
            }
            if (evt.ctrlKey)
            {
                canvas.mouse_button = 4;
            }
            if (evt.altKey)
            {
                canvas.mouse_button = 2;
            }

            var pos = mousePosition(evt);
            canvas.mouse_drag_x = pos.x;
            canvas.mouse_drag_y = pos.y;
            canvas.mouse_dragging = true;

            that.onMousePress(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            that.triggerRedraw();
        }, false);

        canvas.addEventListener('mouseup', function (evt)
        {
            that.onMouseRelease(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            that.triggerRedraw();

            canvas.mouse_button = 0;
            canvas.mouse_dragging = false;
        }, false);

        canvas.addEventListener('mousemove', function (evt)
        {
            if (evt.shiftKey)
            {
                canvas.mouse_button = 1;
            }
            if (evt.ctrlKey)
            {
                canvas.mouse_button = 4;
            }
            if (evt.altKey)
            {
                canvas.mouse_button = 2;
            }

            var pos = mousePosition(evt);
            canvas.mouse_drag_x = pos.x;
            canvas.mouse_drag_y = pos.y;

            if (canvas.mouse_dragging)
            {
                that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            }
            else
            {
                that.onMouseMove(canvas.mouse_drag_x, canvas.mouse_drag_y, canvas.mouse_button);
            }
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        canvas.addEventListener('mouseover', function (evt)
        {
            //
        }, false);

        canvas.addEventListener('mouseout', function (evt)
        {
            that.onMouseOut();
            that.triggerRedraw();

            canvas.mouse_button = 0;
            canvas.mouse_dragging = false;
        }, false);

        canvas.addEventListener('dblclick', function (evt)
        {
            //
        }, false);

        // Firefox
        canvas.addEventListener('DOMMouseScroll', function (evt)
        {
            this.focus();
            canvas.mouse_drag_y += 2 * evt.detail;

            that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);

        // Chrome
        canvas.addEventListener('mousewheel', function (evt)
        {
            this.focus();
            canvas.mouse_drag_y -= 0.1 * evt.wheelDeltaY;

            that.onMouseDrag(canvas.mouse_drag_x, canvas.mouse_drag_y, 2);
            that.triggerRedraw();

            evt.preventDefault();
            evt.stopPropagation();
        }, false);


        // Key Events
        canvas.addEventListener('keypress', function (evt)
        {
            that.onKeyPress(evt.charCode);
            that.triggerRedraw();
        }, true);

        canvas.addEventListener('keyup', function (evt)
        {
            that.onKeyUp(evt.keyCode);
            that.triggerRedraw();
        }, true);

        canvas.addEventListener('keydown', function (evt)
        {
            that.onKeyDown(evt.keyCode);
            that.triggerRedraw();
        }, true);
    }
};


// load app
window.addEventListener('load', function ()
{
    "use strict";
    MyApp.initialize();
}, false);

// unload app
window.addEventListener('unload', function ()
{
    "use strict";
    MyApp.shutdown();
}, false);
