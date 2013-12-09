/**
 * Container class
 */

// container class
var Container = function(x, y, width, height, id) {
    Widget.call(this, x, y, width, height, id);
    this._children = [];
};

// set-up inheritance
Container.prototype = new Widget();
Container.prototype.constructor = Container;

// create own 'super' property for calling base class methods
Container.prototype.parentClass = Widget.prototype;


Container.prototype.draw = function(ctx) {
    // draw frame around container for debugging
    ctx.strokeStyle = 'rgb(150,0,0)';
    ctx.strokeRect(this._x, this._y, this._width, this._height);

    for (var i=0; i<this._children.length; i++) {
        this._children[i].draw(ctx);
    }
};

Container.prototype.inside = function(x, y, press, release) {
    var inside = this.parentClass.inside.call(this, x, y, press, release);

    // only test children, if point inside parent container
    if (inside) {
        for (var i=0; i<this._children.length; i++) {
            // assume that our dialog elements never overlap
            // and that we are only interested in leaf nodes
            if (this._children[i].inside(x, y, press, release)) {
                return true;
            }
        }
    }
    return false;
};


// next three methods belong to composite interface
Container.prototype.addChild = function(c) {
    this._children.push(c);
};

Container.prototype.removeChild = function(c) {
    for (var i=this._children.length-1; i>=0; i--) {
        if (this._children[i] === c) {
            this._children.splice(i, 1);
        }
    }
};

Container.prototype.getChild = function(i) {
    if (i>=0 && i<this._children.length) {
        return this._children[i];
    }
    return null;
};
