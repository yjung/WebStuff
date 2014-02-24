// This file is part of the IG.GFX JavaScript Library.
// Copyright (C) 2013 intelligentgraphics. All rights reserved.

// The file contains the IGX.API Implementation for X3DOM. Please use the same sequence as in igx.api.js

if (!IGX.X3DOM) IGX.X3DOM = {};
if (!IGX.Util) IGX.Util = {};

IGX.X3DOM.DEG2RAD = 0.017453292;
IGX.X3DOM.RAD2DEG = 57.29577951;

IGX.API.LoadProduct = function (productId, description) {
	console.log("IGX.API.LoadProduct() not yet implemented!");
}; 
 
IGX.API.GetParent = function (componentId) {
	var tComponent = document.getElementById(componentId);
	var tParent = tComponent.parentNode;
    if (tParent.localName.toLowerCase() === "transform")
		tParent = tParent.parentNode;
    return tParent.getAttribute("id");
};

IGX.API.GetChildren = function (componentId) {
	var tComponent = document.getElementById(componentId);
	var tChildren = [];
	var tCnt = 0;

    for (var tI = 0; tI < tComponent.childNodes.length; tI++) {
        var tChild = tComponent.childNodes[tI];
        if (tChild instanceof Element &&
            tChild.localName.toLowerCase() === "transform") {
            var tCnt2 = 0;
            while (!(tChild.childNodes[tCnt2] instanceof Element)) tCnt2++;
            if (tChild.childNodes[tCnt2])
                tChildren[tCnt++] = tChild.childNodes[tCnt2].getAttribute("id");
        }
    }
    
    return tChildren;
};
 
IGX.API.GetNeighbor = function (componentId, localId) {
	var tPath = componentId.split(".");
	var tNborId;
	for (var tI = 0; tI < tPath.length - 1; tI++)
		if (tI == 0)
			tNborId = tPath[tI];
		else
			tNborId = tNborId + "." + tPath[tI];
	return tNborId + "." + localId;
};
 
IGX.API.GetProducts = function (componentId, category) {};
 
IGX.API.GetComponents = function (componentId, recurse) {};
 
IGX.API.GetSelectionMode = function (componentId) {
    return document.getElementById(componentId).getAttribute("selectable");
};

IGX.API.GetLayer = function (componentId) {
	var tLayer = document.getElementById(componentId).getAttribute("layer");
	if (tLayer)
		return tLayer;

	var tParentId = IGX.API.GetParent(componentId);
	if (tParentId)
		return IGX.API.GetLayer(tParentId);

	return null;
};

IGX.API.GetMaterialCategory = function (componentId) {
	var tCategory = document.getElementById(componentId).getAttribute("materialCategory");
	if (tCategory)
		return tCategory;

	var tParentId = IGX.API.GetParent(componentId);
	if (tParentId)
		return IGX.API.GetMaterialCategory(tParentId);

	return null;
};

IGX.API.GetCategories = function (componentId) {
	var tCategories = document.getElementById(componentId).getAttribute("categories");
	if (tCategories)
		return tCategories.split(',');
	else
		return null;
};

IGX.API.GetPosition = function(componentId) {
	var tComponent = document.getElementById(componentId);
	var tString = tComponent.parentNode.getAttribute("translation");
	return x3dom.fields.SFVec3f.parse(tString)
};

IGX.API.SetPosition = function(componentId, position) {
	var tComponent = document.getElementById(componentId);
	tComponent.parentNode.setAttribute("translation",
		position.x + ' ' + position.y + ' ' + position.z);
};

IGX.API.SetRotationCenter = function(componentId, center) {
	if (!center)
		return;
		
	var tComponent = document.getElementById(componentId);
	tComponent.parentNode.setAttribute("center", center.x + " " + center.y  + " " + center.z);
};

IGX.API.GetXRotation = function(componentId) {
	var tComponent = document.getElementById(componentId);
	var tString = tComponent.parentNode.getAttribute("rotation");
	var tVector = x3dom.fields.SFVec4f.parse(tString)
	if (tVector.x === 1 && tVector.y === 0 && tVector.z === 0)
		return tVector.w * IGX.X3DOM.RAD2DEG;
	else
		return 0;
};

IGX.API.SetXRotation = function(componentId, rotation) {
	var tComponent = document.getElementById(componentId);
	tComponent.parentNode.setAttribute("rotation", "1 0 0 " + rotation * IGX.X3DOM.DEG2RAD);
};

IGX.API.GetYRotation = function(componentId) {
	var tComponent = document.getElementById(componentId);
	var tString = tComponent.parentNode.getAttribute("rotation");
	var tVector = x3dom.fields.SFVec4f.parse(tString)
	if (tVector.x === 0 && tVector.y === 1 && tVector.z === 0)
		return tVector.w * IGX.X3DOM.RAD2DEG;
	else
		return 0;
};

IGX.API.SetYRotation = function(componentId, rotation) {
	var tComponent = document.getElementById(componentId);
	tComponent.parentNode.setAttribute("rotation", "0 1 0 " + rotation * IGX.X3DOM.DEG2RAD);
};

IGX.API.GetZRotation = function(componentId) {
	var tComponent = document.getElementById(componentId);
	var tString = tComponent.parentNode.getAttribute("rotation");
	var tVector = x3dom.fields.SFVec4f.parse(tString)
	if (tVector.x === 0 && tVector.y === 0 && tVector.z === 1)
		return tVector.w * IGX.X3DOM.RAD2DEG;
	else
		return 0;
};

IGX.API.SetZRotation = function(componentId, rotation) {
	var tComponent = document.getElementById(componentId);
	tComponent.parentNode.setAttribute("rotation", "0 0 1 " + rotation * IGX.X3DOM.DEG2RAD);
};

IGX.API.GetScaling = function(componentId) {};

IGX.API.SetScaling = function(componentId, scaling) {};

IGX.API.ShowBehavior = function (productIds, position) {
	if (position !== "Start" && position !== "End") {
		console.log("Unsupported position: " + position);
		return;
	}
	
	var tProductIds = productIds;
	if (!tProductIds) {
		// TODO get root products
	}
	
	tProductIds.forEach(function(componentId) {
		IGX.X3DOM.ShowBehavior(componentId, position);
	});
};



IGX.API.CreateInteractor = function(classId, parameters) {
    var tInteractor = IGX.Util.CreateFromClassName(classId, parameters);
    var tElement = document.getElementById(parameters.id); 

    tInteractor.element = tElement;
    tInteractor.userParams = {
    	x3d: document.getElementById("x3d"), 
        navigation: document.getElementById("navigation")
    };

    tInteractor.transform  = tElement.parentElement;
    tInteractor.drag = false;
   
    tInteractor.addEventListeners = function() {
        IGX.X3DOM.Highlight(tElement, true);
        IGX.X3DOM.AddUserEventListeners(tInteractor);
        IGX.X3DOM.AddInteractorEventListener(tInteractor.element, 'mousedown', this.elementMouseDown);
        IGX.X3DOM.AddInteractorEventListener(tInteractor.element, 'mousemove', this.elementMouseMove);
        IGX.X3DOM.AddInteractorEventListener(tInteractor.element, 'mouseup', this.elementMouseUp);
        tInteractor.element.interactor = tInteractor;

        tInteractor.drag = true;
        tInteractor.parameters.lock = true;
    };      

    tInteractor.removeEventListeners = function() {
        IGX.X3DOM.RemoveInteractorEventListener(tInteractor.element, 'mousedown', this.elementMouseDown);
        IGX.X3DOM.RemoveInteractorEventListener(tInteractor.element, 'mousemove', this.elementMouseMove);
        IGX.X3DOM.RemoveInteractorEventListener(tInteractor.element, 'mouseup', this.elementMouseUp);
        IGX.X3DOM.RemoveUserEventListeners(tInteractor);
 
        tInteractor.drag = false;
        tInteractor.parameters.lock = false;
    };
   
    tInteractor.elementMouseDown = function(event) {
        this.interactor.lastTouchPos = new IGX.Core.TouchPos(event.layerX, event.layerY);
    };

    tInteractor.elementMouseMove = function(event) {
        if (event.button === 0) {
            this.interactor.singleTouchMotion(new IGX.Core.TouchPos(event.layerX, event.layerY));
        }
    };

    tInteractor.elementMouseUp = function(event) {
        this.interactor.removeEventListeners();
        IGX.X3DOM.Highlight(tElement, false);
    };

    return tInteractor;
}


// The file contains event and interaction stuff for the IGX.API Implementation for X3DOM.

if (!IGX.X3DOM) IGX.X3DOM = {};

IGX.X3DOM.MouseMove = function(event) {
    if (event.button === 0 && this.interactor.drag) {
        this.interactor.singleTouchMotion(event);
    }
};

IGX.X3DOM.MouseUp = function(event) {
    this.interactor.removeEventListeners();
};

IGX.X3DOM.AddUserEventListeners = function(baseInteractor) {
    baseInteractor.userParams.x3d.addEventListener('mousemove', baseInteractor.elementMouseMove, true);
    baseInteractor.userParams.x3d.addEventListener('mouseup', baseInteractor.elementMouseUp, true);
    baseInteractor.userParams.x3d.interactor = baseInteractor;
    baseInteractor.userParams.navigation.setAttribute("type", "none");
};

IGX.X3DOM.RemoveUserEventListeners = function(baseInteractor) {
    baseInteractor.userParams.x3d.removeEventListener('mousemove', baseInteractor.elementMouseMove, true);
    baseInteractor.userParams.x3d.removeEventListener('mouseup', baseInteractor.elementMouseUp, true);
    baseInteractor.userParams.navigation.setAttribute("type", "examine");
};

IGX.X3DOM.AddInteractorEventListener = function(element, event, func) {
    element.addEventListener(event, func, true);
};

IGX.X3DOM.RemoveInteractorEventListener = function(element, event, func) {
    element.removeEventListener(event, func, true);
};

IGX.X3DOM.GetInteractiveObject = function(componentId) {
    var tElement = document.getElementById(componentId);
    var tSelect = tElement.getAttribute("selectable").toLowerCase();
    
    IGX.X3DOM.Dump(componentId);

    if (tSelect === "self") {
        return tElement;
    }
    else if (tSelect === "parent") {
        var tParent = tElement.parentNode;
        // fixme; calling toLowerCase twice on same string is inefficient
        while (tParent.localName.toLowerCase() !== "group"
            && tParent.localName.toLowerCase() !== "inline") {
            tParent = tParent.parentNode;
            for (var tI = 0; tI < tParent.childNodes.length; tI++) {
                if (tParent.childNodes[tI] instanceof Element &&
                    (tParent.childNodes[tI].localName.toLowerCase() === "inline" ||
                     tParent.childNodes[tI].localName.toLowerCase() === "group") &&
                    tParent.childNodes[tI].getAttribute("selectable").toLowerCase() === "self") {
                    tParent = tParent.children[tI];
                    break;
                }
            }
        }
        tElement = IGX.X3DOM.GetInteractiveObject(tParent.getAttribute("id"));
    }
    
    return tElement;
};// The file contains material functions for the IGX.API Implementation for X3DOM.

if (!IGX.X3DOM) IGX.X3DOM = {};

/*
 * Sets the required material parameters to a given appearance object 
 * @param {Appearance} appearance Appearance where Material should be set 
 * @param {object} params Material parameters that should be set
 * @returns {null}
 */
IGX.X3DOM.SetAppearanceMaterial = function(appearance, params) {
    var tDefaultTexture = appearance._cf.texture.node;
    if (tDefaultTexture) {
        appearance.removeChild(tDefaultTexture);
    }

    var tMaterial = appearance._cf.material.node;
   
    if (params.Texture !== undefined) {
        var tTexture = new x3dom.nodeTypes.ImageTexture();
        tTexture._nameSpace = tMaterial._nameSpace;
        tTexture._vf.url[0] = params.Texture;
        appearance.addChild(tTexture);
        tTexture.nodeChanged();
    }

    var tDiffuseColor = new x3dom.fields.SFColor();
    tDiffuseColor.r = params.DiffuseR; 
    tDiffuseColor.g = params.DiffuseG; 
    tDiffuseColor.b = params.DiffuseB;

    var tSpecularColor = new x3dom.fields.SFColor();
    tSpecularColor.r = params.SpecularR; 
    tSpecularColor.g = params.SpecularG; 
    tSpecularColor.b = params.SpecularB;

    var tEmissiveColor = new x3dom.fields.SFColor();
    tEmissiveColor.r = params.EmissiveR; 
    tEmissiveColor.g = params.EmissiveG; 
    tEmissiveColor.b = params.EmissiveB;

    if (tDiffuseColor.r !== undefined) tMaterial._vf.diffuseColor = tDiffuseColor;
    if (tSpecularColor.r !== undefined) tMaterial._vf.specularColor = tSpecularColor;
    if (tEmissiveColor.r !== undefined) tMaterial._vf.emissiveColor = tEmissiveColor;
    if (params.Shininess !== undefined) tMaterial._vf.shininess = params.Shininess;
    if (params.Transparency !== undefined) tMaterial._vf.transparency = params.Transparency;
    if (params.Ambient !== undefined) tMaterial._vf.ambientIntensity = params.Ambient;
    
    appearance.nodeChanged();
};

/*
 * Collects all appearance nodes of the required element with the given id 
 * @param {string} id Identifier of the element that should be iteratively passed 
 * @returns {Array of appearance elements within the element of required id}
 */
IGX.X3DOM.GetAppearanceListOfInlineElements = function(id) {
    var tAppearanceList = [];
    var tInlineElement = document.getElementById(id)._x3domNode;
    var tTempChildren = tInlineElement._cf.children.nodes;
    
    // tests if node is of given type
    function isTypeOf(node, type) {
        if (node._xmlNode.localName.toLowerCase() === type.toLowerCase())
            return true;
        else
	        return false;
    }
    
    // iterate through all elements in the inline's subtree and store all appearance nodes
    function collectAppearances(appList, children) {
        for (var tI = 0; tI < children.length; tI++) {
            if (isTypeOf(children[tI], "shape")) {
                appList.push(children[tI]._cf.appearance);
            }
            else {    
                if (children[tI]._cf.children !== undefined
                    && children[tI]._cf.children.nodes !== undefined) {
                    collectAppearances(appList, children[tI]._cf.children.nodes);
                }
            }
        }
    }
    
    collectAppearances(tAppearanceList, tTempChildren);
    
    return tAppearanceList;
};// The file contains specific X3DOM-specific API functions to be used in the created X3DOM files.

if (!IGX.X3DOM) IGX.X3DOM = {};

IGX.X3DOM.SetMaterial = function (componentId, params)
/*
 PURPOSE: Sets the material of an object. 
 
 ARG string componentId - Component id.
 ARG object { params: {DiffuseR, ..., Texture} } - Parameters of an object.
 
 RESULT void
 */
{
    var tAppearanceList = IGX.X3DOM.GetAppearanceListOfInlineElements(componentId);
    for (var tI = 0; tI < tAppearanceList.length; tI++) {
        IGX.X3DOM.SetAppearanceMaterial(tAppearanceList[tI].node, params);
    }
};

IGX.X3DOM.SelectComponent = function(componentId)
/*
 PURPOSE: Select an object. 
 
 ARG string componentId - Component id.
 
 RESULT void
 */
{
    var tElement = IGX.X3DOM.GetInteractiveObject(componentId);
    
    if (!IGX.Core.InteractorHandler.lock) {
    	var tParams = eval("(" + tElement.getAttribute("interactorParameters") + ")");
    	if (tParams) {
	        tParams.id = tElement.id;
    	    tParams.lock = IGX.Core.InteractorHandler.lock;
        	if (!IGX.Core.InteractorHandler.interactorList.contains(tElement.id))
        		IGX.Core.InteractorHandler.interactorList.push(
        			IGX.API.CreateInteractor(tElement.getAttribute("interactor"), tParams)
				);

        	IGX.Core.InteractorHandler.currentInteractor = IGX.Core.InteractorHandler.interactorList.getCurrentInteractor(tElement.id);
        	
        	IGX.Core.InteractorHandler.currentInteractor.addEventListeners();
    	}
    	else 
    		IGX.Core.InteractorHandler.currentInteractor = null;
    }
};// The file contains specific utilities for the IGX.API Implementation for X3DOM.

if (!IGX.X3DOM) IGX.X3DOM = {};

IGX.X3DOM.ShowBehavior = function(componentId, position) {
	var tElement = document.getElementById(componentId);
	var tInteractorCls = tElement.getAttribute("interactor");
	if (tInteractorCls) {
		var tParameters = eval("(" + tElement.getAttribute("interactorParameters") + ")");
		if (tParameters[position]) {
			tParameters.id = componentId;
			var tObject = IGX.API.CreateInteractor(tInteractorCls, tParameters);
			tObject.setPosition(position);
		}
	}
	
	var tChildren = IGX.API.GetChildren(componentId);
	tChildren.forEach(function(childId) {
		IGX.X3DOM.ShowBehavior(childId, position);
	});
};

IGX.X3DOM.Dump = function(componentId) {
	var tElement = document.getElementById(componentId);
	var tParent = document.getElementById(IGX.API.GetParent(componentId));
	var tChildren = IGX.API.GetChildren(componentId);
	
	var tChildList = "";
	for (var tI = 0; tI < tChildren.length; tI++)
   		tChildList += "\n\t\t" + tChildren[tI];
		
   	console.log("Object " + componentId
   		+ "\n\tSelectable: " + IGX.API.GetSelectionMode(componentId)
		+ "\n\tLayer: " + IGX.API.GetLayer(componentId)
		+ "\n\tMaterial: " + IGX.API.GetMaterialCategory(componentId)
		+ "\n\tCategories: " + IGX.API.GetCategories(componentId)
   		+ "\n\tPosition: " + tElement.parentNode.getAttribute("position")
   		+ "\n\tRotation: " + tElement.parentNode.getAttribute("rotation") 
   		+ "\n\tInteractor: " + tElement.getAttribute("interactor")
   		+ "\n\tParameters: " + tElement.getAttribute("interactorParameters")
  	 	+ "\n\tParent: " + tParent.getAttribute("id")
  	 	+ "\n\tChildren: " + tChildList
   	);
};



IGX.X3DOM.Highlight = function(highlightNode, bool){
        var highlightBox = document.getElementById('bbox_transform');
        var transformNode = highlightNode.parentNode;
        var currentHighlightParent = highlightBox.parentNode;
        var volume;
        var min;
        var max;
        var box;

        if (highlightNode)
        {
            //@todo: still open whether we should move "domNode" to the base class
            volume = highlightNode._x3domNode.getVolume();

            highlightBox.setAttribute("scale", transformNode.getAttribute("scale"));
            highlightBox.setAttribute("rotation", transformNode.getAttribute("rotation"));
            highlightBox.setAttribute("translation", transformNode.getAttribute("translation"));

            if (volume)
            {
                min = x3dom.fields.SFVec3f.copy(volume.min);
                max = x3dom.fields.SFVec3f.copy(volume.max);

                box = document.getElementById('bbox_points');
                box.setAttribute('point', min.x+' '+min.y+' '+min.z+', '+
                                          min.x+' '+min.y+' '+max.z+', '+
                                          max.x+' '+min.y+' '+max.z+', '+
                                          max.x+' '+min.y+' '+min.z+', '+
                                          min.x+' '+max.y+' '+min.z+', '+
                                          min.x+' '+max.y+' '+max.z+', '+
                                          max.x+' '+max.y+' '+max.z+', '+
                                          max.x+' '+max.y+' '+min.z );
            }
        }
        
        currentHighlightParent.removeChild(highlightBox);
        highlightNode.appendChild(highlightBox);
        
        highlightBox.setAttribute("render", "" + bool);
    };
