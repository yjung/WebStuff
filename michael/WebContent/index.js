/**
 * 
 */
function kontakteLaden() {
	document.getElementById("ladeButton").className = "hidden";
	var uebung01;
	var myURI = "daten.json";
	var div = document.getElementById("tabellenDiv");
	var tabellenCode;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", myURI, true);
	xhr.send();
	xhr.onreadystatechange = function() {
		// Request vollstaendig?
		if (this.readyState == this.DONE) {
			var kontakte = JSON.parse(xhr.responseText || null);
			tabellenCode = "<table border='5'><tr><th>Vorname</th><th>Nachname</th><th>E-Mail</th><th>Gruppe</th></tr>";
			for ( i = 0; i < kontakte.length; i++) {
				tabellenCode += "<tr><td>" + kontakte[i].Vorname + "</td><td>" + kontakte[i].Nachname + "</td><td>" + kontakte[i].EMail + "</td>";
				tabellenCode += '<td><input type="button" class ="inlineButton" id="button1' + kontakte[i].Vorname + '"name="' + kontakte[i].Vorname + '"value="Hinzufuegen" onclick="hinzufuegen(name)"/>';
				tabellenCode += '&nbsp;<input type="button" class ="inlineButton" id="button2' + kontakte[i].Vorname + '"name="' + kontakte[i].Vorname + '"value="Entfernen" onclick="entfernen(name)"/></td></tr>';
			}
			tabellenCode += "</table>";
			div.innerHTML = tabellenCode;
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