function test() {
    alert("Nerviger Alert");
    document.write("<br>Hello JavaScript World!");
}

function setLikeState(like) {
    var p = document.getElementById("likeIt");
    var txt = like ? " " : " nicht ";
    p.innerHTML = "Das ist" + txt + "lustig.";
}

function testDataTypes() {
    var person = {
        name: "Mustermann",
        vorname: "Max",
        alter: 42,
        hobbys: ["Joggen", "Lesen"]
        //,greet: function() { alert("Hi, ich bin " + this.vorname); }
    };
    var animals = ["Hund", "Katze", "Pferd", "Ziege", "Huhn"];
    var i = 0, x, ok = false;
    var add = function(a, b) {
        return a + b;
    };

    console.log("person: " + typeof(person));
    console.log("animals: " + typeof(animals));
    console.log("animals[0]: " + typeof(animals[0]));
    console.log("person.name: " + typeof(person.name));
    console.log("i: " + typeof(i) + ", x: " + typeof(x) + ", ok: " + typeof(ok));
    console.log("add: " + typeof(add));

    x = add(17, 4);
    console.log("x' = " + x + " (" + typeof(x) + ")\n");

    //person.greet();
    //person["greet"]();

    /* for (var key in person) {
        console.log(person[key]);
    } */
}

// some globals
gKurs = "Entwicklung Interaktiver Systeme";
var gTyp = "Wahlpflicht";

function testScope(feld, num, flag, str) {
    console.log(window.gKurs + " (" + window.gTyp + ")");

    if (feld.length >= 3)
        feld[2] = "xxx";
    num = 23;
    flag = true;
    str = "blub";

    var k = 0;
    for (var i=0; i<10; i++) {
        var j = 2 * i;
        k += i;
    }

    console.log("i = " + i + ", j = " + j + ", k = " + k);

    function inner() {
        var x = 3, y = 2;
        return x * y;
    }

    console.log("x + y = " + inner());
    console.log(typeof(x));
}

function testFunctions() {
    var funcStr = "return n * (n + 1) / 2;";
    var argument = "n";
    var func, ret;

    func = new Function(argument, funcStr);
    ret = func.call(null, 9);
    console.log("\nErgebnis 1: " + ret);

    func = function(n) {
        return n * (n + 1) / 2;
    };
    ret = func(9);
    console.log("Ergebnis 2: " + ret);

    // anonymous function, executed immediately
    ret = (function(n){
        return n * (n + 1) / 2;
    })(9);
    console.log("Ergebnis 3: " + ret + "\n");
}

//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function initialize() {
    function traverse(node) {
        if (node.nodeType != 9) {   // 9: Dokument-Knoten
            alert(node.nodeName + "\n" + node.innerHTML);
        }

        var parent = node.parentNode;
        if (parent) {
            traverse(parent);
        }
    }

    var elem = document.getElementById("w3s");
    if (elem) {
        traverse(elem);
    }

    //loadFile();
}

function loadFile() {
    var myURI = "data.json";
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        //var o = this.response;
        var o = eval("("+xhr.responseText+")");
        console.log(o);
    };
    xhr.open("GET", myURI, true);   //async
    //xhr.responseType = "json";
    xhr.send();
    console.log("Loading " + myURI + "...");
}
