function loadContacts() {
	document.getElementById("loadButton").className = "hidden";
	var myURI = "js/data.json";
	var div = document.getElementById("table");
	var table;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", myURI, true);
	xhr.send();
	xhr.onreadystatechange = function() {
		if (this.readyState == this.DONE) {
			var contacts = JSON.parse(xhr.responseText || null);
			table = "<table border='5'>";
			table += "<tr>";
			table += "<th>Vorname</th>";
			table += "<th>Nachname</th>";
			table += "<th>E-Mail</th>";
			table += "<th>Gruppe</th>";
			table += "</tr>";
			for (i = 0; i < contacts.length; i++) {
				table += "<tr>";
				table += "<td>" + contacts[i].Vorname + "</td>";
				table += "<td>" + contacts[i].Nachname + "</td>";
				table += "<td>" + contacts[i].EMail + "</td>";
				table += "<td>" + '<input type="button" class ="inlineButton" id="button1' + contacts[i].Vorname + '"name="' + contacts[i].Vorname + '"value="add" onclick="addMember(name)"/>';
				table += "&nbsp;" + '<input type="button" class ="inlineButton" id="button2' + contacts[i].Vorname + '"name="' + contacts[i].Vorname + '"value="remove" onclick="removeMember(name)"/>' + "</td>";
				table += "</tr>";
			}
			table += "</table>";
			div.innerHTML = table;
		}
	};
	document.getElementById("group").innerHTML = "<h3> Aktuelle besteht die Gruppe aus folgenden Teilnehmern: </h3>";
};

function addMember(name) {
	var duplicate = false;
	$('#group li').each(function() {
		if (this.innerHTML == name) {
			duplicate = true;
			confirm(name + " ist schon in der Gruppe!");
		}
	});

	if (!duplicate) {
		var member = document.createElement('li');
		member.setAttribute("id", name);
		member.innerHTML = name;
		group = document.getElementById("group");
		group.appendChild(member);
	}
};

function removeMember(name) {
	$('#group li').each(function() {
		if (this.innerHTML == name) {
			member = document.getElementById(name);
			member.parentNode.removeChild(member);
		}
	});
};