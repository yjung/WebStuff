/**
 * Created by fdai3507 on 23.01.14.
 */

var figurArray =
[
    {
        id : "kingW",
        datei: "3D-Objekte/kingW.x3d",
		beschreibung: "The king moves one square in any direction. The king has also a special move which is called castling and involves also moving a rook."
    },
	{
        id : "kingB",
        datei: "3D-Objekte/kingB.x3d",
		beschreibung: "The king moves one square in any direction. The king has also a special move which is called castling and involves also moving a rook."
    },
    {
        id : "queenW",
        datei: "3D-Objekte/queenW.x3d",
		beschreibung: "The queen combines the power of the rook and bishop and can move any number of squares along rank, file, or diagonal, but it may not leap over other pieces."
    },
	{
        id : "queenB",
        datei: "3D-Objekte/queenW.x3d",
		beschreibung: "The queen combines the power of the rook and bishop and can move any number of squares along rank, file, or diagonal, but it may not leap over other pieces."
    },
    {
        id : "bishopW",
        datei: "3D-Objekte/bishopW.x3d",
		beschreibung: "The bishop can move any number of squares diagonally, but may not leap over other pieces."
    },
	{
        id : "bishopB",
        datei: "3D-Objekte/bishopB.x3d",
		beschreibung: "The bishop can move any number of squares diagonally, but may not leap over other pieces."
    },
	{
        id : "horseW",
        datei: "3D-Objekte/horseW.x3d",
		beschreibung: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces."
    },
	{
        id : "horseB",
        datei: "3D-Objekte/horseB.x3d",
		beschreibung: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces."
    },
	{
        id : "towerW",
        datei: "3D-Objekte/towerW.x3d",
		beschreibung: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move."
    },
	{
        id : "towerB",
        datei: "3D-Objekte/towerB.x3d",
		beschreibung: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move."
    },
	{
        id : "farmerW1",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW2",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW3",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW4",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW5",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW6",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW7",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerW8",
        datei: "3D-Objekte/farmerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB1",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB2",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB3",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB4",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB5",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB6",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB7",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "farmerB8",
        datei: "3D-Objekte/farmerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "towerB2",
        datei: "3D-Objekte/towerB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "towerW2",
        datei: "3D-Objekte/towerW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "bishopW2",
        datei: "3D-Objekte/bishopW.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "bishopB2",
        datei: "3D-Objekte/bishopB.x3d",
		beschreibung: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion."
    },
	{
        id : "horseW2",
        datei: "3D-Objekte/horseW.x3d",
		beschreibung: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces."
    },
	{
        id : "horseB2",
        datei: "3D-Objekte/horseB.x3d",
		beschreibung: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces."
    }
];

function loadModel()
{
    var string ="";

    for (var i=0; i < figurArray.length; i++)
    {
        string +=
        '<MatrixTransform id="' + figurArray[i].id + '" render="false" onclick="getFigureInfo(\'' + figurArray[i].id + '\')">' +
            '<Transform scale="30,30,30" rotation="1 0 0 -1.57">' +
                '<inline id="' + figurArray[i].id + '_in" url="' + figurArray[i].datei + '"></inline>' +
            '</Transform>' +
        '</MatrixTransform>';
    }
	
    return string;
}