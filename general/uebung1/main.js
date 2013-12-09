/**
 *
 */

// global reference to loaded data
var data = null;

// add functionality when doc is loaded
window.onload = function() {
    document.getElementById("loadBtn").addEventListener("click", loadData, false);
};


// called once, when load button was clicked
function loadData(evt) {
    var loadBtn = this;  //evt.target;
    var parent = loadBtn.parentNode;

    // delete load button
    parent.removeChild(loadBtn);
    // set list description visible
    document.getElementById("grp").style.display = "block";

    // load data
    var myURI = "persons.json";
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
        //data = JSON.parse(this.responseText);
        //data = eval("(" + this.responseText + ")");
        data = this.response;

        // fallback if responseType json not yet supported (e.e. Safari)
        if (typeof data == "string") {
            data = JSON.parse(this.responseText);
        }

        if (data && data.length) {
            //console.log(data);

            addTable(parent);
        }
    };

    xhr.open("GET", myURI, true);   // async
    xhr.responseType = "json";
    xhr.send();
}

// build-up table and add entries from json file
function addTable(root) {
    // build up table sub-tree
    var table = document.createElement("table");
    table.setAttribute("cellpadding", "5");

    var tr = document.createElement("tr");
    table.appendChild(tr);

    var td, txt, btn;
    var i, key, value;

    // get first entry from json file
    var entry = data[0];

    // create table header first (using keys of first entry)
    for (key in entry) {
        td = document.createElement("th");
        tr.appendChild(td);
        txt = document.createTextNode(key);
        td.appendChild(txt);
    }
    // add last column: "Gruppe"
    td = document.createElement("th");
    tr.appendChild(td);
    txt = document.createTextNode("Gruppe");
    td.appendChild(txt);

    // iterate over all entries in json file and add data
    for (i=0; i<data.length; i++) {
        // first, create new row for each new entry
        tr = document.createElement("tr");
        table.appendChild(tr);

        // get entry/object at current array position
        entry = data[i];

        // iterate over all members of current entry
        for (key in entry) {
            value = entry[key];

            td = document.createElement("td");
            tr.appendChild(td);
            txt = document.createTextNode(value);
            td.appendChild(txt);
        }

        // during init, we know that given entry is not yet in group list;
        // therefore, we dynamically attach a new property (addedToList) -
        // after having iterated over all members, of course...
        entry.addedToList = false;

        // finally, add both buttons
        td = document.createElement("td");
        tr.appendChild(td);

        // "add" button
        btn = document.createElement("input");
        btn.setAttribute("type", "button");
        btn.setAttribute("value", "Add");
        td.appendChild(btn);

        btn.addEventListener("click", (function(c) {
            return function(evt) {
                //console.log("add entry " + c);

                // get reference to our list element (if not yet added)
                if (!data[c].addedToList) {
                    data[c].addedToList = true;

                    var ul = document.getElementById("list");
                    var li = document.createElement("li");
                    // we also need an id to be able to delete element later on
                    li.id = "li_" + c;
                    li.innerHTML = data[c]["Vorname"] + " " + data[c]["Name"];
                    ul.appendChild(li);
                }
            };
        })(i), false);

        // "remove" button
        btn = document.createElement("input");
        btn.setAttribute("type", "button");
        btn.setAttribute("value", "Remove");
        td.appendChild(btn);

        btn.addEventListener("click", (function(c) {
            return function(evt) {
                //console.log("remove entry " + c);

                // get reference to our list element (if not yet removed)
                if (data[c].addedToList) {
                    data[c].addedToList = false;

                    var ul = document.getElementById("list");
                    var li = document.getElementById("li_" + c);
                    if (li)
                        ul.removeChild(li);
                }
            };
        })(i), false);
    }

    root.appendChild(table);
}
