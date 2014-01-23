/**
 * Created by fdai3507 on 23.01.14.
 */

var figurArray =
[
    {
        id : "kingW",
        datei: "3D-Objekte/kingW.x3d"
    },
    {
        id : "queenW",
        datei: "3D-Objekte/queenW.x3d"
    },
    {
        id : "bishopW",
        datei: "3D-Objekte/bishopW.x3d"
    }
];

function loadModel()
{
    var string ="";

    for (var i=0; i < figurArray.length; i++)
    {
        string +=
        '<MatrixTransform id="' + figurArray[i].id + '" render="false">' +
            '<Transform scale="30,30,30" rotation="1 0 0 -1.57">' +
                '<inline id="' + figurArray[i].id + '_in" url="' + figurArray[i].datei + '"></inline>' +
            '</Transform>' +
        '</MatrixTransform>';
    }


    //var oParser = new DOMParser();
    //var oDOM = oParser.parseFromString(string, "text/xml");
    return string;
}