var jsonObj = null;


window.onload=function(evt){
    load();
};

function load()
{
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        jsonObj = eval('(' + this.responseText + ')');
       addData(jsonObj);
    };
    xhr.open("GET", "Catalog.json", true);   // async
    xhr.send();
}

function addData(jsonObj){
    var table = document.getElementById("tab");
    for(var i=0; i< jsonObj.length; i++)
    {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var stri = "<img src=\"bilder/" + jsonObj[i].Image +"\"><br>" + jsonObj[i].Description;
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
    }
}

function addParent(node) {
    var table = document.getElementById("tab");
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    console.log(node);
    var stri = "<img src=\"bilder/" + node.Image +"\"><br>" + node.Description;
    td1.innerHTML = stri;
    tr.appendChild(td1);
    table.appendChild(tr);
}