// This file is part of the IG.GFX JavaScript Library.
// Copyright (C) 2013 intelligentgraphics. All rights reserved.

var IGX = {};
IGX.Log = {};

IGX.Log.NONE = "nolog";
IGX.Log.ALL = "all";
IGX.Log.COMMUNICATION = "ipc";

// to be re-defined in the client if needed:
IGX.Log.Level = IGX.Log.NONE;

IGX.Log.IsLogging = function (level)
{
    return level == IGX.Log.Level || IGX.Log.ALL == IGX.Log.Level;
}
IGX.Util = {};

IGX.Util.SetCookie = function (name, value, exdays)
{
    var tExDate = new Date();
    tExDate.setDate(exdate.getDate() + exdays);
    var tValue = escape(value) + ((exdays == null) ? "" : "; expires=" + tExDate.toUTCString() + ";path=/");
    document.cookie = name + "=" + tValue;
};

IGX.Util.GetCookie = function (name)
{
    var tValue = document.cookie;
    var tStart = tValue.indexOf(" " + name + "=");
    if (tStart == -1) {
        tStart = tValue.indexOf(name + "=");
    }
    if (tStart == -1) {
        tValue = null;
    }
    else {
        tStart = tValue.indexOf("=", tStart) + 1;
        var c_end = tValue.indexOf(";", tStart);
        if (c_end == -1) {
            c_end = tValue.length;
        }
        tValue = unescape(tValue.substring(tStart, c_end));
    }
    return tValue;
};

IGX.Util.Send = function (operation, mode, arg1, arg2, onSuccess)
{
    var tConfigId = $("#main").find("#_xc")[0].value;
    var tArg2 = typeof arg2 !== 'undefined' ? "/" + arg2 : "";

    // TODO path determination:
    var tCall = "../Service/" + operation + "/" + tConfigId + "/" + arg1 + tArg2;
    if (IGX.Log.IsLogging (IGX.Log.COMMUNICATION))
        alert("Call " + tCall);

    $("body").css("cursor", "progress");

    var tGetFunc = $.get;
    if (mode === 'json')
        tGetFunc = $.getJSON;

    tGetFunc(tCall)
    .done(function (response) {
        if (IGX.Log.IsLogging(IGX.Log.COMMUNICATION))
            alert("Successful call of \"" + operation + "\" did return: " +  response);
        if (typeof onSuccess !== 'undefined')
            onSuccess ();
    }).fail(function () {
        alert("Send Error");
    }).always(function () {
        $("body").css("cursor", "default");
    });
};


IGX.Util.CreateFromClassName = function(className, params){
    // Split the String on . to get the hierarchie
    var classHierarchie = className.split('.');

    // Create executable comand line to create new Object of required class
    var executableCode = "new window";
    for (var i = 0; i < classHierarchie.length; i++) {
        executableCode += "['" + classHierarchie[i] + "']";
    }
    executableCode += "(";
    var executableParams = "{";
    for (var param in params) {
        if (typeof params[param] !== "string")
            executableParams += param + ": " + params[param].toString() + ", ";
        else
            executableParams += param + ": '" + params[param].toString() + "', ";
    }
    executableParams = executableParams.substr(0, executableParams.length - 2);
    if (executableParams.length > 0)
        executableParams += "}";
    executableCode += executableParams + ");";

    return eval(executableCode);
};IGX.API = {};

/*
 IGX.API defines an implementation-independent API to be used by the Interactor and Evaluator scripts.
 Any IGX.API implementation must implement the whole set of functions by overloading the predefined
 empty functions.
 */

/* KEY CONCEPTS

 Component
 
 A Component is the key concept of the IG.GFX scene graph. A Component has the following properties:
 
 - a unique, hierarchical name
 - a layer - Layers may be used to control visibility in advanced applications
 - a material category - Material categories are mainly provided for replacing materials at run-time.
 - an optional material. If no material is assigned, it is inherited from the parent (recursively)
 - an optional parent which is either a Product or a Component
 - a select mode ('NONE', 'PARENT', 'SELF')

 Product
 
 A Product is a Component and therefore has all properties of a Component. Moreover, it provides:
 
 - a unique ID, created by the IG.GFX Server
 - a list of Categories
  
 */

/* LOAD FUNCTIONS
 */
 
IGX.API.LoadProduct = function (productId, description) {};
/*
 PURPOSE: Loads a product description under the name productId into the scene graph. If a Product
 with that name already exists, it will be replaced.
 
 ARG string productId - The Id of the Product to be created.
 ARG string description - The URI with a corresponding model description, to be evaluated.
 
 RESULT void
 */

IGX.API.AssignMaterial = function (productIds, category, description)
/*
 PURPOSE: Loads a material description and assigns it to the specified
 Products, i.e. for every Product it will be assigned recursively to all
 components (including the Product itself) that fit the specified Category.
 
 ARG string[] productIds - The Ids of the Products to be manipulated.
 ARG string category - The Category to which the material should apply.
 ARG string description - The inline material description, to be evaluated.
 
 RESULT void
 */
{
	productIds.forEach(function(componentId) {
		IGX.API.SetCategoryMaterial(componentId, category, description);
	});	
};

/* NAVIGATION FUNCTIONS
 */
 
IGX.API.GetParent = function (componentId) {};
/*
 PURPOSE: Returns the immediate parent.
 
 ARG string componentId - Id of a Component, e.g. a Product.
 
 RESULT string - The Id of the parent, or null/undefined.
 */
 
IGX.API.GetChildren = function (componentId) {};
/*
 PURPOSE: Returns the immediate childen.
 
 ARG string componentId - Id of a Component, e.g. a Product.
 
 RESULT string[] - Array of children ids, or null/empty array.
 */
 
IGX.API.GetNeighbor = function (componentId, localId) {};
/*
 PURPOSE: Returns the id of the immediate neighbor with the specified local Id.
 
 ARG string componentId - Id of a Component, e.g. a Product.
 ARG string localId - Local path of the requested object.
 
 RESULT string - The Id of the neighbor, if existing, or null.
 */
 
IGX.API.GetProducts = function (componentId, category) {};
/*
 PURPOSE: Returns an array of the immediate sub products.
 
 ARG string componentId = null - Component id. If null, the function is applied to the scene.
 ARG string[] category = null - Specifies a list of Categories to be used as a filter. If specified, only
  Products will be considered that match at least one of the given Categories.
  
 RESULT string[] - The Ids of the found Products, or empty array.
 */
 
IGX.API.GetComponents = function (componentId, recurse) {};
/*
 PURPOSE: Returns an array of the sub components, either the immediate
 ones or all.
 
 ARG string componentId - Component id. If null, the function is applied to the scene.
 ARG boolean recurse = false - Controls if only immediate or all sub components should be returned.
 
 RESULT string[] - The Ids of the found Components, or empty array.
 */
 
/* OBJECT FUNCTIONS
 */
 
IGX.API.GetSelectionMode = function (componentId) {};
/*
 PURPOSE: Returns the selection mode of the Component. 
 
 ARG string componentId - Component id.
 
 RESULT string - The selection mode as specified above.
 */

IGX.API.GetLayer = function (componentId) {};
/*
 PURPOSE: Returns the (inherited) layer of the Component. 
 
 ARG string componentId - Component id.
 
 RESULT string - The layer or null.
 */
 
IGX.API.SetCategoryMaterial = function (componentId, category, description)
/*
 PURPOSE: Sets the material of an object. 
 
 ARG string componentId - Component id.
 ARG string category - Material category;
 ARG object { params: {DiffuseR, ..., Texture} } - Parameters of an object.
 
 RESULT void
 */
{
	if (IGX.API.GetMaterialCategory(componentId) === category)
		IGX.API.SetMaterial(componentId, description);
	
	var tChildren = IGX.API.GetChildren(componentId);
	if (tChildren)
		tChildren.forEach(function(childId) {
			IGX.API.SetCategoryMaterial(childId, category, description);
		});
}
 
IGX.API.GetMaterialCategory = function (componentId) {};
/*
 PURPOSE: Returns the (inherited) material category of the Component. 
 
 ARG string componentId - Component id.
 
 RESULT string - The category or null.
 */
 
IGX.API.GetCategories = function (componentId) {};
/*
 PURPOSE: Returns the product categories of the Product. 
 
 ARG string componentId - Component id.
 
 RESULT string[] - The categorie or null/empty array.
 */
 
IGX.API.GetPosition = function(componentId) {};
/*
 PURPOSE: Returns the position of an object. 
 
 ARG string componentId - Component id.
 
 RESULT object { x: float, y: float, z: float } - The position.
 */

IGX.API.SetPosition = function(componentId, position) {};
/*
 PURPOSE: Sets the position of an object. 

 ARG string componentId - Component id.
 ARG object { x: float, y: float, z: float } - Position of an object.
 
 RESULT void
 */
 
IGX.API.SetRotationCenter = function(componentId, center) {};
/*
 PURPOSE: Sets the center of rotation. 

 ARG string componentId - Component id.
 ARG object { x: float, y: float, z: float } - The center of rotation.
 
 RESULT void
 */

IGX.API.GetXRotation = function(componentId) {};
/*
 PURPOSE: Returns the rotation angle of an object around the x axis. 
 
 ARG string componentId - Component id.
 
 RESULT float - The rotation angle around the x axis in degrees.
 */
 
IGX.API.SetXRotation = function(componentId, rotation) {};
/*
 PURPOSE: Sets the rotation angle of an object around the x axis. 

 ARG string componentId - Component id.
 ARG float - The rotation angle around the x axis in degrees.
 
 RESULT void
 */

IGX.API.GetYRotation = function(componentId) {};
/*
 PURPOSE: Returns the rotation angle of an object around the y axis. 
 
 ARG string componentId - Component id.
 
 RESULT float - The rotation angle around the y axis in degrees.
 */

IGX.API.SetYRotation = function(componentId, rotation) {};
/*
 PURPOSE: Sets the rotation angle of an object around the y axis. 
 
 ARG string componentId - Component id.
 ARG float - The rotation around on the y axis in degrees.
 
 RESULT void
 */

IGX.API.GetZRotation = function(componentId) {};
/*
 PURPOSE: Returns the rotation angle of an object around the z axis. 
 
 ARG string componentId - Component id.
 
 RESULT float - The rotation angle around the z axis in degrees.
 */

IGX.API.SetZRotation = function(componentId, rotation) {};
/*
 PURPOSE: Sets the rotation of an object. 
 
 ARG string componentId - Component id.
 ARG float - The rotation angle around the z axis in degrees.
 
 RESULT void
 */

IGX.API.GetScaling = function(componentId) {};
/*
 PURPOSE: Returns the scaling of an object. 
 
 ARG string componentId - Component id.
 
 RESULT object - { scaling: {x, y, z} }
 */

IGX.API.SetScaling = function(componentId, scaling) {};
/*
 PURPOSE: Sets the scaling of an object. 
 
 ARG string componentId - Component id.
 ARG object { scaling: {x, y, z} } - Position of an object.
 
 RESULT void
 */
 
/* SPECIAL FUNCTIONS
 */

IGX.API.ShowBehavior = function(productIds, position) {}
/*
 PURPOSE: Shows the component behavior by moving the interactive 
 component in one of two positions.
 
 ARG string[] productIds - The Ids of the Products (or all if null) to be manipulated.
 ARG string position - Either "Start" or "End".
 
 RESULT void
 */
 
/* MISC FUNCTIONS
 */

IGX.API.CreateInteractor = function(classId, parameters) {};
/*
 PURPOSE: Creates an interactor.
 
 ARG string classId - The Interactor's class.
 ARG parameters { id: string, etc. } - The construction parameters.
 
 RESULT object - the created Interactor
 */
IGX.Core = {}

IGX.Core.TouchPos = function(x, y) {
  (x === undefined) ? this.x = 0 : this.x = x;
  (y === undefined) ? this.y = 0 : this.y = y;  
};

/*
 * InteractorHandler handles the selection after a onmousedown event on an
 * element in the x3dscene and does a up traversal till a node is found that's
 * selection attribute is 'self'
 */
IGX.Core.InteractorHandler                   = {};
IGX.Core.InteractorHandler.lock              = false;
IGX.Core.InteractorHandler.currentInteractor = null;
IGX.Core.InteractorHandler.interactorList    = [];

IGX.Core.InteractorHandler.interactorList.contains = function(componentId) {
    for (var tI = 0; tI < IGX.Core.InteractorHandler.interactorList.length; tI++) {
        if (IGX.Core.InteractorHandler.interactorList[tI].componentId() === componentId) {
            return true;
        }
    }

    return false;
};

IGX.Core.InteractorHandler.interactorList.getCurrentInteractor = function(componentId) {
    for (var tI = 0; tI < IGX.Core.InteractorHandler.interactorList.length; tI++) {
        if (IGX.Core.InteractorHandler.interactorList[tI].componentId() === componentId) {
            return IGX.Core.InteractorHandler.interactorList[tI];
        }
    }

    return null;
};

/*
 * Super Class of all interactors.
 */
 
IGX.Core.Interactor = function() { 
    
};

// The constructor.
IGX.Core.Interactor.prototype.super = function(parameters) {
    this.parameters = parameters;
    this.lastTouchPos = IGX.Core.TouchPos();
};

// Access to associated component.
IGX.Core.Interactor.prototype.componentId = function() {
    return this.parameters.id;
};

// Set to position "Start" or "End".
IGX.Core.Interactor.prototype.setPosition = function(position) {
    console.log("Calling pure virtual Interactor.setPosition() for " + this.componentId());
};

// Handle single touch motion.
IGX.Core.Interactor.prototype.singleTouchMotion = function(touchPos) {
    console.log("Calling pure virtual Interactor.singleTouchMotion() for " + this.componentId());
};

IGX.Core.Interactor.prototype.addEventListeners = function(){};

IGX.Core.Interactor.prototype.removeEventListeners = function(){};

IGX.Core.Interactor.prototype.elementMouseDown = function(){ };

IGX.Core.Interactor.prototype.elementMouseMove = function(){};

IGX.Core.Interactor.prototype.elementMouseUp = function(){};/*
 * Restricted rotation around local x-axis 
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's X rotation (deg)
 *      float Maximum:     The maximum value of the object's X rotation (deg)
 *      float Snap:        If angle is <= Minimum + Snap, set rotation to Minimum
 *                         If angle is >= Maximum - Snap, set rotation to Maximum
 *      float Center:      The center of the rotation (optional).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XRangeRotator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.XRangeRotator.prototype = new IGX.Core.Interactor();
IGX.Std.XRangeRotator.prototype.constructor = IGX.Std.XRangeRotator;

IGX.Std.XRangeRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetXRotation(this.componentId(), tValue);
};

IGX.Std.XRangeRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetXRotation(this.componentId());

    tRotation += tOffset;

    if (tRotation <= this.parameters.Minimum + this.parameters.Snap)
        tRotation = this.parameters.Minimum;
    else if (tRotation >= this.parameters.Maximum - this.parameters.Snap)
        tRotation = this.parameters.Maximum;

    IGX.API.SetXRotation(this.componentId(), tRotation);
    IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);

    this.lastTouchPos.y = touchPos.y;
};/*
 * Restricted translation along local x-axis
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's X position
 *      float Maximum:     The maximum value of the object's X position
 *      float Snap:        If pos is <= Minimum + Snap, set pos to Minimum
 *                         If pos is >= Maximum - Snap, set pos to Maximum
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XRangeTranslator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 1.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.XRangeTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.XRangeTranslator.prototype.constructor = IGX.Std.XRangeTranslator;

IGX.Std.XRangeTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.x = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.XRangeTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = touchPos.x - this.lastTouchPos.x;

    var tPosition = IGX.API.GetPosition(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tPosition.x < this.parameters.Maximum) ||
            (tOffset < 0 && tPosition.x > this.parameters.Minimum)) {
        tPosition.x += tOffset / 50;
        if (tPosition.x < this.parameters.Minimum + this.parameters.Snap) {
            tPosition.x = this.parameters.Minimum;
            tSnapped = true;
        }
        else if (tPosition.x > this.parameters.Maximum - this.parameters.Snap) {
            tPosition.x = this.parameters.Maximum;
            tSnapped = true;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Rasterized rotation around local x-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's X rotation (deg)
 *      float Maximum:     The maximum value of the object's X rotation (deg)
 *      float Raster:      The raster value (deg)
 *      float Center:      The center of the rotation (optinal).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XRasterRotator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Raster === undefined)
        parameters.Raster = 15.0;

    this.super(parameters);
};


IGX.Std.XRasterRotator.prototype = new IGX.Core.Interactor();
IGX.Std.XRasterRotator.prototype.constructor = IGX.Std.XRasterRotator;

IGX.Std.XRasterRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetXRotation(this.componentId(), tValue);
};

IGX.Std.XRasterRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetXRotation(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < this.parameters.Maximum) ||
            (tOffset <= 0 && tRotation > this.parameters.Minimum)) {
        tRotation += tOffset;

        var tMinimum = this.parameters.Minimum;
        while (tMinimum < tRotation) {
            tMinimum += this.parameters.Raster / 180 * Math.PI;
        }

        var tMaximum = tMinimum - this.parameters.Raster / 180 * Math.PI;
        var tCenter = (tMaximum + tMinimum) * 0.5;

        if (tRotation < tCenter) {
            tRotation = tMaximum;
        }
        else {
            tRotation = tMinimum;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation < this.parameters.Minimum) {
            tRotation = this.parameters.Minimum;
        }
        else if (tRotation >= this.parameters.Maximum) {
            tRotation = this.parameters.Maximum;
        }

        IGX.API.SetXRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Rasterized translation along local x-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's X position
 *      float Maximum:     The maximum value of the object's X position
 *      float Raster:      The raster value
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XRasterTranslator = function(parameters) {


    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 1.0;
    if (parameters.Raster === undefined)
        parameters.Raster = 0.1;

    this.super(parameters);

};


IGX.Std.XRasterTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.XRasterTranslator.prototype.constructor = IGX.Std.XRasterTranslator;
IGX.Std.XRasterTranslator.prototype.oldRaster = 0;

IGX.Std.XRasterTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.x = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.XRasterTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = this.lastTouchPos.x - touchPos.x;

    var tOldPosition = IGX.API.GetPosition(this.componentId());
    var tNewPosition = IGX.API.GetPosition(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tOldPosition.x < this.parameters.Maximum) ||
            (tOffset <= 0 && tOldPosition.x > this.parameters.Minimum)) {
        tOldPosition.x += tOffset / 100;

        var tMinimum = this.parameters.Minimum;
        while (tMinimum < tOldPosition.x) {
            tMinimum += this.parameters.Raster;
        }

        var tMaximum = tMinimum - this.parameters.Raster;
        var tCenter = (tMaximum + tMinimum) * 0.5;

        if (tOldPosition.x < tCenter) {
            tNewPosition.x = tMaximum;
        }
        else {
            tNewPosition.x = tMinimum;
        }

        if (this.oldRaster === tNewPosition.x) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tNewPosition.x;
        }

        if (tOldPosition.x < this.parameters.Minimum) {
            tNewPosition.x = this.parameters.Minimum;
        }
        else if (tOldPosition.x >= this.parameters.Maximum) {
            tNewPosition.x = this.parameters.Maximum;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Rotation to fix values around local x-axis.
 * Note, usually the other rotation axis should be 0.0
 * 
 * parameters
 *      string id:         Identifier of the group or inline that
 *                         should be translated
 *      float[] Values:    Array of available rotation values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XValueRotator = function(parameters) {


    if (parameters.Values === undefined)
        parameters.Values = [0.0, 90.0];
    this.super(parameters);
};


IGX.Std.XValueRotator.prototype = new IGX.Core.Interactor();
IGX.Std.XValueRotator.prototype.constructor = IGX.Std.XValueRotator;
IGX.Std.XValueRotator.prototype.oldRaster = 0;

IGX.Std.XValueRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetXRotation(this.componentId(), tValue);
};

IGX.Std.XValueRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetXRotation(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1];

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < tMaximum) ||
            (tOffset <= 0 && tRotation > tMinimum)) {
        tRotation += tOffset;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMinimum;
        var tCounter = 0;

        while (tRightBoundary < tRotation && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tRotation < tCenter) {
            tRotation = tLeftBoundary;
        }
        else {
            tRotation = tRightBoundary;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation <= tMinimum) {
            tRotation = tMinimum;
        }
        else if (tRotation >= tMaximum) {
            tRotation = tMaximum;
        }

        IGX.API.SetXRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Translation to fix values along local x-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float[] Values:    Array of available position values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XValueTranslator = function(parameters) {
    if (parameters.Values === undefined)
        parameters.Values = [0.0, 1.0];

    this.super(parameters);
};

IGX.Std.XValueTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.XValueTranslator.prototype.constructor = IGX.Std.XValueTranslator;
IGX.Std.XValueTranslator.prototype.oldRaster = 0;

IGX.Std.XValueTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.x = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.XValueTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = this.lastTouchPos.x - touchPos.x;

    var tOldPosition = IGX.API.GetPosition(this.componentId());
    var tNewPosition = IGX.API.GetPosition(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1]

    var tSnapped = false;

    if ((tOffset > 0 && tOldPosition.x < tMaximum) ||
            (tOffset <= 0 && tOldPosition.x > tMinimum)) {
        tOldPosition.x += tOffset / 100;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMaximum;
        var tCounter = 0;

        while (tRightBoundary < tOldPosition.x && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tOldPosition.x < tCenter) {
            tNewPosition.x = tLeftBoundary;
        }
        else {
            tNewPosition.x = tRightBoundary;
        }

        if (this.oldRaster === tNewPosition.x) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tNewPosition.x;
        }

        if (tOldPosition.x <= tMinimum) {
            tNewPosition.x = tMinimum;
        }
        else if (tOldPosition.x >= tMaximum) {
            tNewPosition.x = tMaximum;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Restricted rotation around local y-axis 
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's y rotation (deg)
 *      float Maximum:     The maximum value of the object's y rotation (deg)
 *      float Snap:        If angle is <= minimum + snap, set rotation to Minimum
 *                         If angle is >= maximum - snap, set rotation to Maximum
 *      float Center:      The center of the rotation (optinal).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.YRangeRotator = function(parameters) {
    
    this.lock = false;
    
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.YRangeRotator.prototype = new IGX.Core.Interactor();
IGX.Std.YRangeRotator.prototype.constructor = IGX.Std.YRangeRotator;



IGX.Std.YRangeRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetYRotation(this.componentId(), tValue);
};



IGX.Std.YRangeRotator.prototype.singleTouchMotion = function(touchPos) {
    
    this.lock = false;
    
    if (touchPos.x === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.x - touchPos.x);

    var tRotation = IGX.API.GetYRotation(this.componentId());

    tRotation += tOffset;

    if (tRotation <= this.parameters.Minimum + this.parameters.Snap) {
        tRotation = this.parameters.Minimum;
        this.lock = true;
    }
    else if (tRotation >= this.parameters.Maximum - this.parameters.Snap){
        tRotation = this.parameters.Maximum;
        this.lock = true;
    }

    IGX.API.SetYRotation(this.componentId(), tRotation);
    IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);

    if (!this.lock)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Restricted translation along local y-axis
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Y position
 *      float Maximum:     The maximum value of the object's Y position
 *      float Snap:        If pos is <= Minimum + Snap, set pos to Minimum
 *                         If pos is >= Maximum - Snap, set pos to Maximum
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.YRangeTranslator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 1.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.YRangeTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.YRangeTranslator.prototype.constructor = IGX.Std.YRangeTranslator;

IGX.Std.YRangeTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.y = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.YRangeTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = this.lastTouchPos.y - touchPos.y;

    var tPosition = IGX.API.GetPosition(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tPosition.y < this.parameters.Maximum) ||
            (tOffset < 0 && tPosition.y > this.parameters.Minimum)) {
        tPosition.y += tOffset / 50;
        if (tPosition.y < this.parameters.Minimum + this.parameters.Snap) {
            tPosition.y = this.parameters.Minimum;
            tSnapped = true;
        }
        else if (tPosition.y > this.parameters.Maximum - this.parameters.Snap) {
            tPosition.y = this.parameters.Maximum;
            tSnapped = true;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Rasterized rotation around local y-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Y rotation (deg)
 *      float Maximum:     The maximum value of the object's Y rotation (deg)
 *      float Raster:      The raster value (deg)
 *      float Center:      The center of the rotation (optinal).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.YRasterRotator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Raster === undefined)
        parameters.Raster = 15.0;

    this.super(parameters);
};

IGX.Std.YRasterRotator.prototype = new IGX.Core.Interactor();
IGX.Std.YRasterRotator.prototype.constructor = IGX.Std.YRasterRotator;

IGX.Std.YRasterRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetYRotation(this.componentId(), tValue);
};

IGX.Std.YRasterRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.x - touchPos.x);

    var tRotation = IGX.API.GetYRotation(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < this.parameters.Maximum) ||
            (tOffset <= 0 && tRotation > this.parameters.Minimum)) {
        tRotation += tOffset;

        var tMinimum = this.parameters.Minimum;
        while (tMinimum < tRotation) {
            tMinimum += this.parameters.Raster / 180 * Math.PI;
        }

        var tMaximum = tMinimum - this.parameters.Raster / 180 * Math.PI;
        var tCenter = (tMaximum + tMinimum) * 0.5;

        if (tRotation < tCenter) {
            tRotation = tMaximum;
        }
        else {
            tRotation = tMinimum;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation < this.parameters.Minimum) {
            tRotation = this.parameters.Minimum;
        }
        else if (tRotation >= this.parameters.Maximum) {
            tRotation = this.parameters.Maximum;
        }

        IGX.API.SetYRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Rasterized translation along local y-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Y position
 *      float Maximum:     The maximum value of the object's Y position
 *      float Raster:      The raster value
 */

if (!IGX.Std) IGX.Std = {};

IGX.Std.YRasterTranslator = function(parameters) {   
    if (parameters.Minimum === undefined) parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined) parameters.Maximum = 1.0;
    if (parameters.Raster === undefined) parameters.Raster = 0.1;

    this.super(parameters);
};

IGX.Std.YRasterTranslator.prototype = new IGX.Core.Interactor();
    IGX.Std.YRasterTranslator.prototype.constructor = IGX.Std.YRasterTranslator;
    IGX.Std.YRasterTranslator.prototype.oldRaster = 0;
    
    IGX.Std.YRasterTranslator.prototype.setPosition = function(position) {
    	var tValue = this.parameters[position];
    	if (tValue) {
    		var tPosition = IGX.API.GetPosition(this.componentId());
    		tPosition.y = tValue;
    		IGX.API.SetPosition(this.componentId(), tPosition);
    	}
    };
   
    IGX.Std.YRasterTranslator.prototype.singleTouchMotion = function(touchPos) {
    	if (touchPos.y === undefined)
    	    return;
    	
    	var tOffset = this.mousePos.y - mousePos.y;
    	            
        var tOldPosition = IGX.API.GetPosition(this.componentId());
        var tNewPosition = IGX.API.GetPosition(this.componentId());
        
        var tSnapped = false;
        
        if ((tOffset > 0 && tOldPosition.y < this.parameters.Maximum) || 
            (tOffset <= 0 && tOldPosition.y > this.parameters.Minimum)) {
            tOldPosition.y += tOffset / 100;
            
            var tMinimum = this.parameters.Minimum;
            while (tMinimum < tOldPosition.x) {
                tMinimum += this.parameters.Raster;
            }
            
            var tMaximum = tMinimum - this.parameters.Raster;
            var tCenter = (tMaximum + tMinimum) * 0.5;

            if (tOldPosition.y < tCenter){
                tNewPosition.y = tMaximum;
            }
            else {
                tNewPosition.y = tMinimum;
            }
            
            if (this.oldRaster === tNewPosition.y) {
                tSnapped = true;
            }
            else {
                this.oldRaster = tNewPosition.y;
            }

            if (tOldPosition.y < this.parameters.Minimum) { 
                tNewPosition.y = this.parameters.Minimum;
            }
            else if (tOldPosition.y >= this.parameters.Maximum) { 
                tNewPosition.y = this.parameters.Maximum;
            }
            
            IGX.API.SetPosition(this.componentId(), tPosition);
        }
        
        if (!tSnapped)
            this.lastTouchPos.y = touchPos.y; 
    };/*
 * Rotation to fix values around local y-axis.
 * Note, usually the other rotation axis should be 0.0
 * 
 * parameters
 *      string id:         Identifier of the group or inline that
 *                         should be translated
 *      float[] Values:    Array of available rotation values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.YValueRotator = function(parameters) {
    if (parameters.Values === undefined)
        parameters.Values = [0.0, 90.0];

    this.super(parameters);
};

IGX.Std.YValueRotator.prototype = new IGX.Core.Interactor();
IGX.Std.YValueRotator.prototype.constructor = IGX.Std.YValueRotator;
IGX.Std.YValueRotator.prototype.oldRaster = 0;

IGX.Std.YValueRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetYRotation(this.componentId(), tValue);
};

IGX.Std.YValueRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.x - touchPos.x);

    var tRotation = IGX.API.GetYRotation(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1];

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < tMaximum) ||
            (tOffset <= 0 && tRotation > tMinimum)) {
        tRotation += tOffset;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMinimum;
        var tCounter = 0;

        while (tRightBoundary < tRotation && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tRotation < tCenter) {
            tRotation = tLeftBoundary;
        }
        else {
            tRotation = tRightBoundary;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation <= tMinimum) {
            tRotation = tMinimum;
        }
        else if (tRotation >= tMaximum) {
            tRotation = tMaximum;
        }

        IGX.API.SetYRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Translation to fix values along local y-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float[] Values:    Array of available position values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.YValueTranslator = function(parameters) {
    if (parameters.Values === undefined)
        parameters.Values = [0.0, 1.0];

    this.super(parameters);
};

IGX.Std.YValueTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.YValueTranslator.prototype.constructor = IGX.Std.YValueTranslator;
IGX.Std.YValueTranslator.prototype.oldRaster = 0;

IGX.Std.YValueTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.y = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.YValueTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = this.lastTouchPos.y - touchPos.y;

    var tOldPosition = IGX.API.GetPosition(this.componentId());
    var tNewPosition = IGX.API.GetPosition(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1]

    var tSnapped = false;

    if ((tOffset > 0 && tOldPosition.y < tMaximum) ||
            (tOffset <= 0 && tOldPosition.y > tMinimum)) {
        tOldPosition.y += tOffset / 100;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMaximum;
        var tCounter = 0;

        while (tRightBoundary < tOldPosition.y && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tOldPosition.y < tCenter) {
            tNewPosition.y = tLeftBoundary;
        }
        else {
            tNewPosition.y = tRightBoundary;
        }

        if (this.oldRaster === tNewPosition.y) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tNewPosition.y;
        }

        if (tOldPosition.y <= tMinimum) {
            tNewPosition.y = tMinimum;
        }
        else if (tOldPosition.y >= tMaximum) {
            tNewPosition.y = tMaximum;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Restricted rotation around local z-axis 
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's z rotation (deg)
 *      float Maximum:     The maximum value of the object's z rotation (deg)
 *      float Snap:        If pos is <= Minimum + snap, set rotation to Minimum
 *                         If pos is >= Maximum - snap, set rotation to Maximum
 *      float Center:      The center of the rotation (optional).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.ZRangeRotator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.ZRangeRotator.prototype = new IGX.Core.Interactor();
IGX.Std.ZRangeRotator.prototype.constructor = IGX.Std.ZRangeRotator;

IGX.Std.ZRangeRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetZRotation(this.componentId(), tValue);
};

IGX.Std.ZRangeRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetZRotation(this.componentId());

    tRotation += tOffset;

    if (tRotation <= this.parameters.Minimum + this.parameters.Snap)
        tRotation = this.parameters.Minimum;
    else if (tRotation >= this.parameters.Maximum - this.parameters.Snap)
        tRotation = parameters.Maximum;

    IGX.API.SetZRotation(this.componentId(), tRotation);
    IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);

    this.lastTouchPos.y = touchPos.y;
};/*
 * Restricted translation along local z-axis
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Z position
 *      float Maximum:     The maximum value of the object's Z position
 *      float Snap:        If pos is <= Minimum + Snap, set pos to Minimum
 *                         If pos is >= Maximum - Snap, set pos to Maximum
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.ZRangeTranslator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 1.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Std.ZRangeTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.ZRangeTranslator.prototype.constructor = IGX.Std.ZRangeTranslator;

IGX.Std.ZRangeTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.z = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.ZRangeTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = this.lastTouchPos.x - touchPos.x;

    var tPosition = IGX.API.GetPosition(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tPosition.z < this.parameters.Maximum) ||
            (tOffset < 0 && tPosition.z > this.parameters.Minimum)) {
        tPosition.z += tOffset / 50;
        if (tPosition.z < this.parameters.Minimum + this.parameters.Snap) {
            tPosition.z = this.parameters.Minimum;
            tSnapped = true;
        }
        else if (tPosition.z > this.parameters.Maximum - this.parameters.Snap) {
            tPosition.z = this.parameters.Maximum;
            tSnapped = true;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Rasterized rotation around local z-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Z rotation (deg)
 *      float Maximum:     The maximum value of the object's Z rotation (deg)
 *      float Raster:      The raster value (deg)
 *      float Center:      The center of the rotation (optinal).
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.ZRasterRotator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 90.0;
    if (parameters.Raster === undefined)
        parameters.Raster = 15.0;

    this.super(parameters);
};

IGX.Std.ZRasterRotator.prototype = new IGX.Core.Interactor();
IGX.Std.ZRasterRotator.prototype.constructor = IGX.Std.ZRasterRotator;

IGX.Std.ZRasterRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetZRotation(this.componentId(), tValue);
};

IGX.Std.ZRasterRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetZRotation(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < this.parameters.Maximum) ||
            (tOffset <= 0 && tRotation > this.parameters.Minimum)) {
        tRotation += tOffset;

        var tMinimum = this.parameters.Minimum;
        while (tMinimum < tRotation) {
            tMinimum += this.parameters.Raster / 180 * Math.PI;
        }

        var tMaximum = tMinimum - this.parameters.Raster / 180 * Math.PI;
        var tCenter = (tMaximum + tMinimum) * 0.5;

        if (tRotation < tCenter) {
            tRotation = tMaximum;
        }
        else {
            tRotation = tMinimum;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation < this.parameters.Minimum) {
            tRotation = this.parameters.Minimum;
        }
        else if (tRotation >= this.parameters.Maximum) {
            tRotation = this.parameters.Maximum;
        }

        IGX.API.SetZRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Rasterized translation along local z-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float Minimum:     The minimum value of the object's Z position
 *      float Maximum:     The maximum value of the object's Z position
 *      float Raster:      The raster value
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.XRasterTranslator = function(parameters) {
    if (parameters.Minimum === undefined)
        parameters.Minimum = 0.0;
    if (parameters.Maximum === undefined)
        parameters.Maximum = 1.0;
    if (parameters.Raster === undefined)
        parameters.Raster = 0.1;

    this.super(parameters);

};

IGX.Std.XRasterTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.XRasterTranslator.prototype.constructor = IGX.Std.XRasterTranslator;
IGX.Std.XRasterTranslator.prototype.oldRaster = 0;

IGX.Std.XRasterTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.z = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.XRasterTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = this.mousePos.x - mousePos.x;

    var tOldPosition = IGX.API.GetPosition(this.componentId());
    var tNewPosition = IGX.API.GetPosition(this.componentId());

    var tSnapped = false;

    if ((tOffset > 0 && tOldPosition.z < this.parameters.Maximum) ||
            (tOffset <= 0 && tOldPosition.z > this.parameters.Minimum)) {
        tOldPosition.z += tOffset / 100;

        var tMinimum = this.parameters.Minimum;
        while (tMinimum < tOldPosition.z) {
            tMinimum += this.parameters.Raster;
        }

        var tMaximum = tMinimum - this.parameters.Raster;
        var tCenter = (tMaximum + tMinimum) * 0.5;

        if (tOldPosition.z < tCenter) {
            tNewPosition.z = tMaximum;
        }
        else {
            tNewPosition.z = tMinimum;
        }

        if (this.oldRaster === tNewPosition.z) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tNewPosition.z;
        }

        if (tOldPosition.z < this.parameters.Minimum) {
            tNewPosition.z = this.parameters.Minimum;
        }
        else if (tOldPosition.z >= this.parameters.Maximum) {
            tNewPosition.z = this.parameters.Maximum;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Rotation to fix values around local z-axis.
 * Note, usually the other rotation axis should be 0.0
 * 
 * parameters
 *      string id:         Identifier of the group or inline that
 *                         should be translated
 *      float[] Values:    Array of available rotation values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.ZValueRotator = function(parameters) {
    if (parameters.Values === undefined)
        parameters.Values = [0.0, 90.0];

    this.super(parameters);
};

IGX.Std.ZValueRotator.prototype = new IGX.Core.Interactor();
IGX.Std.ZValueRotator.prototype.constructor = IGX.Std.ZValueRotator;
IGX.Std.ZValueRotator.prototype.oldRaster = 0;

IGX.Std.ZValueRotator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue)
        IGX.API.SetZRotation(this.componentId(), tValue);
};

IGX.Std.ZValueRotator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.y === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.y - touchPos.y);

    var tRotation = IGX.API.GetZRotation(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1];

    var tSnapped = false;

    if ((tOffset > 0 && tRotation < tMaximum) ||
            (tOffset <= 0 && tRotation > tMinimum)) {
        tRotation += tOffset;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMinimum;
        var tCounter = 0;

        while (tRightBoundary < tRotation && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tRotation < tCenter) {
            tRotation = tLeftBoundary;
        }
        else {
            tRotation = tRightBoundary;
        }

        if (this.oldRaster === tRotation) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tRotation;
        }

        if (tRotation <= tMinimum) {
            tRotation = tMinimum;
        }
        else if (tRotation >= tMaximum) {
            tRotation = tMaximum;
        }

        IGX.API.SetZRotation(this.componentId(), tRotation);
        IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);
    }

    if (!tSnapped)
        this.lastTouchPos.y = touchPos.y;
};/*
 * Translation to fix values along local z-axis.
 * 
 * parameters      
 *      string id:         Identifier of the group or inline that 
 *                         should be translated
 *      float[] Values:    Array of available position values.
 */

if (!IGX.Std)
    IGX.Std = {};

IGX.Std.ZValueTranslator = function(parameters) {
    if (parameters.Values === undefined)
        parameters.Values = [0.0, 1.0];

    this.super(parameters);
};

IGX.Std.ZValueTranslator.prototype = new IGX.Core.Interactor();
IGX.Std.ZValueTranslator.prototype.constructor = IGX.Std.ZValueTranslator;
IGX.Std.ZValueTranslator.prototype.oldRaster = 0;

IGX.Std.ZValueTranslator.prototype.setPosition = function(position) {
    var tValue = this.parameters[position];
    if (tValue) {
        var tPosition = IGX.API.GetPosition(this.componentId());
        tPosition.z = tValue;
        IGX.API.SetPosition(this.componentId(), tPosition);
    }
};

IGX.Std.ZValueTranslator.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = this.lastTouchPos.z - touchPos.z;

    var tOldPosition = IGX.API.GetPosition(this.componentId());
    var tNewPosition = IGX.API.GetPosition(this.componentId());

    var tMinimum = this.parameters.Values[0];
    var tMaximum = this.parameters.Values[this.parameters.Values.length - 1]

    var tSnapped = false;

    if ((tOffset > 0 && tOldPosition.z < tMaximum) ||
            (tOffset <= 0 && tOldPosition.z > tMinimum)) {
        tOldPosition.z += tOffset / 100;

        var tRightBoundary = tMinimum;
        var tLeftBoundary = tMaximum;
        var tCounter = 0;

        while (tRightBoundary < tOldPosition.z && tCounter < this.parameters.Values.length) {
            tLeftBoundary = tRightBoundary;
            tRightBoundary = this.parameters.Values[tCounter];
            tCounter++;
        }

        var tCenter = (tLeftBoundary + tRightBoundary) * 0.5;
        if (tOldPosition.z < tCenter) {
            tNewPosition.z = tLeftBoundary;
        }
        else {
            tNewPosition.z = tRightBoundary;
        }

        if (this.oldRaster === tNewPosition.z) {
            tSnapped = true;
        }
        else {
            this.oldRaster = tNewPosition.z;
        }

        if (tOldPosition.z <= tMinimum) {
            tNewPosition.z = tMinimum;
        }
        else if (tOldPosition.z >= tMaximum) {
            tNewPosition.z = tMaximum;
        }

        IGX.API.SetPosition(this.componentId(), tPosition);
    }

    if (!tSnapped)
        this.lastTouchPos.x = touchPos.x;
};/*
 * Horizontal, Left-Mounted Flap Door, Left Part
 * 
 * parameters      
 *      string id:         Associated object 
 * 
 *      string Right:  Local id or the right part.
 *      float Width:   Overall width.
 *      float Snap:    Snap angle.
 */

if (!IGX.Furniture)
    IGX.Furniture = {};

IGX.Furniture.HorizontalLeftSideFlapDoorL = function(parameters) {
    if (parameters.Right === undefined)
        parameters.Right = "o2";
    if (parameters.Width === undefined)
        parameters.Width = 1.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Furniture.HorizontalLeftSideFlapDoorL.prototype = new IGX.Core.Interactor();
IGX.Furniture.HorizontalLeftSideFlapDoorL.prototype.constructor = IGX.Furniture.HorizontalLeftSideFlapDoorL;

IGX.Furniture.HorizontalLeftSideFlapDoorL.prototype.setPosition = function(position) {
    if (this.parameters[position]) {
        if (position == "Start")
            IGX.API.SetYRotation(this.componentId(), 0);
        else if (position == "End")
            IGX.API.SetYRotation(this.componentId(), -90);
    }
};

IGX.Furniture.HorizontalLeftSideFlapDoorL.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.x - touchPos.x);

    var tRotation = IGX.API.GetYRotation(this.componentId());

    tRotation += tOffset;

    if (tRotation <= -90 + this.parameters.Snap)
        tRotation = -90;
    else if (tRotation >= -this.parameters.Snap)
        tRotation = 0;

    IGX.API.SetYRotation(this.componentId(), tRotation);
    IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);

    var tNBor = IGX.API.GetNeighbor(this.componentId(), this.parameters.Right);

    var tPos = IGX.API.GetPosition(tNBor);
    IGX.API.SetPosition(tNBor, {
        x: this.parameters.Width - (1 - Math.cos(tRotation * Math.PI / 180.0)),
        y: tPos.y,
        z: tPos.z
    });

    IGX.API.SetYRotation(tNBor, -tRotation);

    this.lastTouchPos.x = touchPos.x;
};/*
 * Horizontal, Left-Mounted Flap Door, Right Part
 * 
 * parameters      
 *      string id:         Associated object 
 * 
 *      string Left:  Local id or the left part.
 *      float Width:  Overall width.
 *      float Snap:    Snap angle.
 */

if (!IGX.Furniture)
    IGX.Furniture = {};

IGX.Furniture.HorizontalLeftSideFlapDoorR = function(parameters) {
    if (parameters.Left === undefined)
        parameters.Left = "o1";
    if (parameters.Width === undefined)
        parameters.Width = 1.0;
    if (parameters.Snap === undefined)
        parameters.Snap = 0.0;

    this.super(parameters);
};

IGX.Furniture.HorizontalLeftSideFlapDoorR.prototype = new IGX.Core.Interactor();
IGX.Furniture.HorizontalLeftSideFlapDoorR.prototype.constructor = IGX.Furniture.HorizontalLeftSideFlapDoorR;

IGX.Furniture.HorizontalLeftSideFlapDoorR.prototype.setPosition = function(position) {
    if (this.parameters[position]) {
        var tPos = IGX.API.GetPosition(this.componentId());
        if (position === "Start") {
            IGX.API.SetYRotation(this.componentId(), 0);
            IGX.API.SetPosition(this.componentId(), {
                x: this.parameters.Width,
                y: tPos.y,
                z: tPos.z
            });
        }
        else if (position === "End") {
            IGX.API.SetYRotation(this.componentId(), -90);
            IGX.API.SetPosition(this.componentId(), {
                x: 0,
                y: tPos.y,
                z: tPos.z
            });
        }
    }
};

IGX.Furniture.HorizontalLeftSideFlapDoorR.prototype.singleTouchMotion = function(touchPos) {
    if (touchPos.x === undefined)
        return;

    if (touchPos.x === undefined)
        return;

    var tOffset = -Math.floor(this.lastTouchPos.x - touchPos.x);

    var tRotation = IGX.API.GetYRotation(this.componentId());

    tRotation += tOffset;

    if (tRotation <= this.parameters.Snap)
        tRotation = 0;
    else if (tRotation >= 90 - this.parameters.Snap)
        tRotation = 90;

    IGX.API.SetYRotation(this.componentId(), tRotation);
    IGX.API.SetRotationCenter(this.componentId(), this.parameters.Center);

    var tPos = IGX.API.GetPosition(this.componentId());
    IGX.API.SetPosition(this.componentId(), {
        x: this.parameters.Width - (1 - Math.cos(tRotation * Math.PI / 180.0)),
        y: tPos.y,
        z: tPos.z
    });

    var tNBor = IGX.API.GetNeighbor(this.componentId(), this.parameters.Left);
    IGX.API.SetYRotation(tNBor, -tRotation);
    
    this.lastTouchPos.x = touchPos.x;
};//alert("Using non-optimized, non-obfuscated version of IG.GFX.JS. DO NOT DISTRIBUTE!");
