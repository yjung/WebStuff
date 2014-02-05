var catalog = null;

window.onload=function(evt){
    load();
};

function load()
{
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        catalog = eval('(' + this.responseText + ')');
        initCatalog(catalog);
       addData(catalog);
    };
    xhr.open("GET", "Catalog.json", true);   // async
    xhr.send();
}

function initCatalog(jsonObj){
    for(var i=0; i< jsonObj.length; i++)
    {
        jsonObj[i].parent = jsonObj;
        if(jsonObj[i].Entries && jsonObj[i].Entries.length)
        {
            initCatalog(jsonObj[i].Entries);
        }
    }
}

function addData(jsonObj){

    var table = document.getElementById("tab");
    var ausbl = document.getElementById("ausblender");
    
    for(var i=0; i< jsonObj.length; i++)
    {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var stri = "<img src=\"DEMO01_FurnitureShop/Catalog/" + jsonObj[i].Image +"\"><br>" + jsonObj[i].Description;
        td1.innerHTML = stri;
        td1.myEntries = jsonObj[i].Entries;

        if (td1.myEntries && td1.myEntries.length)
            td1.onclick = (function(pos) {
                return function() {
                    table.innerHTML = "";
                    addParent(jsonObj[pos]);
                    addData(this.myEntries);
                }
            })(i);
            
        tr.appendChild(td1);
		table.appendChild(tr);

        
		if (!td1.myEntries)
            td1.onclick = (function(pos) {
                return function() {
                	var inl = document.getElementById("viewerInline");
                	var newPath = "/Users/Hanna/Documents/GitHub/IntSys2013/3Dcatalogue/3Dcatalogue/DEMO01_FurnitureShop/Data/" + jsonObj[pos].Scope + "." + jsonObj[pos].Product + ".x3d";
                	inl.setAttribute("url", newPath); 
                	ausbl.setAttribute("visibility", 'visible');	                	
                }
            })(i);
            

    }
}

function addParent(node) {
    var table = document.getElementById("tab");
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    console.log(node);
    var stri = "<img src=\"DEMO01_FurnitureShop/Catalog/" + node.Image +"\"><br>" + node.Description;
    td1.innerHTML = stri;
    td1.onclick = (function() {
            table.innerHTML = "";

            addData(node.parent);
        });
    tr.appendChild(td1);
    table.appendChild(tr);
}