function kontakteLaden() {
	document.getElementById("ladeButton").className = "hidden";
	var uebung01;
	var myURI = "daten.json";
	var div = document.getElementById("tabellenDiv");
	var tabCode;
	var xhr = new XMLHttpRequest();
	// Variable ‘myURI’ verweist auf Datei; ‚true‘ für async
	xhr.open("GET", myURI, true);
	xhr.send();
	xhr.onreadystatechange = function() {
		// Request vollstaendig?
		if (this.readyState == this.DONE) {
			var kontakte = JSON.parse(xhr.responseText || null);
			tabCode = "<table border='5'>";
			tabCode += "<tr>";
			tabCode += "<th>Vorname</th>";
			tabCode += "<th>Nachname</th>";
			tabCode += "<th>E-Mail</th>";
			tabCode += "<th>Gruppe</th>";
			tabCode += "</tr>";
			for ( i = 0; i < kontakte.length; i++) 
			{
				tabCode += "<tr>";
				tabCode += "<td>" + kontakte[i].Vorname + "</td>";
				tabCode += "<td>" + kontakte[i].Nachname + "</td>";
				tabCode += "<td>" + kontakte[i].EMail + "</td>";
				tabCode += "<td>" + '<input type="button" class ="Button" id="button1' + kontakte[i].Vorname + '"name="' + kontakte[i].Vorname + '"value="Add" onclick="hinzufuegen(name)"/>';
				tabCode += "&nbsp;" + '<input type="button" class ="Button" id="button2' + kontakte[i].Vorname + '"name="' + kontakte[i].Vorname + '"value="Delete" onclick="entfernen(name)"/>' + "</td>";
				tabCode += "</tr>";
			}
			tabCode += "</table>";
			div.innerHTML = tabCode;
		}
	};

	document.getElementById("gruppenDiv").innerHTML = "<h3> Aktuelle besteht die Gruppe aus folgenden Teilnehmern: </h3>";

};

function hinzufuegen(name) {
	var dopplung = false;
	$('#gruppe li').each(function() {
		if (this.innerHTML == name) {
			dopplung = true;
			confirm(name + " ist schon in der Gruppe!");
		}
	});

	if (!dopplung) {
		var mitglied = document.createElement('li');
		mitglied.setAttribute("id", name);
		mitglied.innerHTML = name;
		gruppe = document.getElementById("gruppe");
		gruppe.appendChild(mitglied);
	}
};

function entfernen(name) {

	$('#gruppe li').each(function() {
		if (this.innerHTML == name) {
			mitglied = document.getElementById(name);
			mitglied.parentNode.removeChild(mitglied);
		}
	});
};