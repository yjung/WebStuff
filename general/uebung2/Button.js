/**
 * Button class
 */

// simple button class
var Button = function(x, y, width, height, id, caption) {
    Widget.call(this, x, y, width, height, id);
    this._caption = caption;
};

// set-up inheritance
Button.prototype = new Widget();
Button.prototype.constructor = Button;

// create own 'super' property for calling base class methods
Button.prototype.parentClass = Widget.prototype;


Button.prototype.draw = function(ctx) {
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.font = '16pt sans-serif';
    ctx.textAlign = 'center';

    var metrics = ctx.measureText(this._caption);

    // width is measured text length + twice padding with 5px
    var width = metrics.width + 10;
    width = (width > this._width) ? width : this._width;

    // outline button
    ctx.strokeRect(this._x, this._y, width, this._height);

    ctx.fillStyle = 'rgb(50,50,50)';
    ctx.fillText(this._caption, this._x + width/2, this._y + (this._height/2+8));
};

Button.prototype.inside = function(x, y, press, release) {
    var inside = this.parentClass.inside.call(this, x, y, press, release);

    if (inside) {
        console.log("clicked " + this._id);
        // exemplarily pass simple event object as param
        this.notify( {target: this, type: "click"} );
    }

    return inside;
};
