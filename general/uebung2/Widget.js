/**
 * Widget class
 * Base class for all GUI classes
 */

// base class for UI elements with position, size and id
var Widget = function(x, y, width, height, id) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._id = id;
    // also add observer list
    this._observers = [];
};


Widget.prototype.draw = function(ctx) {
    // nothing to do here, since sort of abstract
};

Widget.prototype.inside = function(x, y, press, release) {
    // default implementation for leaf elements
    var inside = (x >= this._x && x <= this._x + this._width &&
        y >= this._y && y <= this._y + this._height);

    // fake click, in that we lazily (also and only) test for release
    if (inside && release) {
        console.log("inside " + this._id);
        return true;
    }
    return false;
};


// attach method belongs to subject interface
Widget.prototype.attach = function(observer) {
    this._observers.push(observer);
};

// detach method belongs to subject interface
Widget.prototype.detach = function(observer) {
    for (var i=this._observers.length-1; i>=0; i--) {
        if (this._observers[i] === observer) {
            this._observers.splice(i, 1);
        }
    }
};

// notify method belongs to subject interface
Widget.prototype.notify = function(event) {
    for (var i=0; i<this._observers.length; i++) {
        // check if observer really is callback function
        if (typeof(this._observers[i]) == "function") {
            this._observers[i].call(null, event);
        }
    }
};
