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
        id : "kingB",
        datei: "3D-Objekte/kingB.x3d"
    },
    {
        id : "queenW",
        datei: "3D-Objekte/queenW.x3d"
    },
	{
        id : "queenB",
        datei: "3D-Objekte/queenW.x3d"
    },
    {
        id : "bishopW",
        datei: "3D-Objekte/bishopW.x3d"
    },
	{
        id : "bishopB",
        datei: "3D-Objekte/bishopB.x3d"
    },
	{
        id : "horseW",
        datei: "3D-Objekte/horseW.x3d"
    },
	{
        id : "horseB",
        datei: "3D-Objekte/horseB.x3d"
    },
	{
        id : "towerW",
        datei: "3D-Objekte/towerW.x3d"
    },
	{
        id : "towerB",
        datei: "3D-Objekte/towerB.x3d"
    },
	{
        id : "farmerW1",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW2",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW3",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW4",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW5",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW6",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW7",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerW8",
        datei: "3D-Objekte/farmerW.x3d"
    },
	{
        id : "farmerB1",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB2",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB3",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB4",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB5",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB6",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB7",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "farmerB8",
        datei: "3D-Objekte/farmerB.x3d"
    },
	{
        id : "towerB2",
        datei: "3D-Objekte/towerB.x3d"
    },
	{
        id : "towerW2",
        datei: "3D-Objekte/towerW.x3d"
    },
	{
        id : "bishopW2",
        datei: "3D-Objekte/bishopW.x3d"
    },
	{
        id : "bishopB2",
        datei: "3D-Objekte/bishopB.x3d"
    },
	{
        id : "horseW2",
        datei: "3D-Objekte/horseW.x3d"
    },
	{
        id : "horseB2",
        datei: "3D-Objekte/horseB.x3d"
    }
];

function loadModel()
{
    var string ="";

    for (var i=0; i < figurArray.length; i++)
    {
        string +=
        '<MatrixTransform id="' + figurArray[i].id + '" render="false" onclick="getFigureInfo(figurArray[i].id)">' +
            '<Transform scale="30,30,30" rotation="1 0 0 -1.57">' +
                '<inline id="' + figurArray[i].id + '_in" url="' + figurArray[i].datei + '"></inline>' +
            '</Transform>' +
        '</MatrixTransform>';
    }
	
    return string;
}