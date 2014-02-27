var catalog = {
    parent: null
};

window.onload = function (evt) {
    load();

    var inl = document.getElementById("viewerInline");
    inl.onload = function(e) {
        var x3d = document.getElementById("x3d");
        x3d.runtime.showAll();
    };
    
    var navclose = document.getElementById("navModeClose");
    navclose.onclick = function(e) {
    	document.getElementById("ausblender").setAttribute("style", 'display:none;');
        document.getElementById("viewer").setAttribute("style", 'display:none;');
    };

};

function load() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        catalog.Entries = eval('(' + this.responseText + ')');
        initCatalog(catalog);
        addData(catalog);
    };
    xhr.open("GET", "Catalog.json", true);   // async
    xhr.send();
}

function initCatalog(jsonObj) {
    //console.log(jsonObj);
    var children = jsonObj.Entries;

    for (var i = 0; children && i < children.length; i++) {
        children[i].parent = jsonObj;
        initCatalog(children[i]);
    }
}

function addData(jsonObj) {

    var table = document.getElementById("tab");
    var children = jsonObj.Entries;

    for (var i = 0; children && i < children.length; i++) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var stri = "<img src=\"DEMO01_FurnitureShop/Catalog/" + children[i].Image + "\"><br>" + children[i].Description;
        td1.innerHTML = stri;

        td1.onclick = (function (pos) {
            return function () {
            
                var obj = children[pos];
                
                if(obj.Entries) {
                	table.innerHTML = "";
                	addParent(obj.parent);
                	addData(obj);
                }

                if (!obj.Entries) {
                
                	document.getElementById("navName").innerHTML = obj.Description;
                
                    var inl = document.getElementById("viewerInline");
                    var newPath = "DEMO01_FurnitureShop/Data/" +
                        obj.Scope + "." + obj.Product + ".x3d";
                    inl.setAttribute("url", newPath);
                    
                    document.getElementById("ausblender").setAttribute("style", 'display:block;');
                    document.getElementById("viewer").setAttribute("style", 'display:block;');
                }
            }
        })(i);

        tr.appendChild(td1);
        table.appendChild(tr);
    }
}

function addParent(node) {
    if (!node)
        return;

    var table = document.getElementById("tab");
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");

    var stri = "<img src=\"DEMO01_FurnitureShop/Catalog/Zurueck.jpg\">";
    td1.innerHTML = stri;
    td1.onclick = (function () {
        table.innerHTML = "";
        addParent(node.parent);
        addData(node);
    });
    tr.appendChild(td1);
    table.appendChild(tr);
}