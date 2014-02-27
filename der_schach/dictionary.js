/**
 * Created by fdai3507 on 23.01.14.
 */

var figurArray =
[
    {
        id : "kingW",
		headline: "The king",
        datei: "3D-Objekte/kingW.x3d",
		description: "The king moves one square in any direction. The king has also a special move which is called castling and involves also moving a rook.",
		moves: "king_moves.gif"
    },
	{
        id : "kingB",
		headline: "The king",
        datei: "3D-Objekte/kingB.x3d",
		description: "The king moves one square in any direction. The king has also a special move which is called castling and involves also moving a rook.",
		moves: "king_moves.gif"
    },
    {
        id : "queenW",
		headline: "The queen",
        datei: "3D-Objekte/queenW.x3d",
		description: "The queen combines the power of the rook and bishop and can move any number of squares along rank, file, or diagonal, but it may not leap over other pieces.",
		moves: "queen_moves.gif"
    },
	{
        id : "queenB",
		headline: "The queen",
        datei: "3D-Objekte/queenB.x3d",
		description: "The queen combines the power of the rook and bishop and can move any number of squares along rank, file, or diagonal, but it may not leap over other pieces.",
		moves: "queen_moves.gif"
    },
    {
        id : "bishopW",
		headline: "The bishop",
        datei: "3D-Objekte/bishopW.x3d",
		description: "The bishop can move any number of squares diagonally, but may not leap over other pieces.",
		moves: "bishop_moves.gif"
    },
	{
        id : "bishopB",
		headline: "The bishop",
        datei: "3D-Objekte/bishopB.x3d",
		description: "The bishop can move any number of squares diagonally, but may not leap over other pieces.",
		moves: "bishop_moves.gif"
    },
	{
        id : "knightW",
		headline: "The knight",
        datei: "3D-Objekte/knightW.x3d",
		description: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces.",
		moves: "knight_moves.gif"
    },
	{
        id : "knightB",
		headline: "The knight",
        datei: "3D-Objekte/knightB.x3d",
		description: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces.",
		moves: "bishop_moves.gif"
    },
	{
        id : "rookW",
		headline: "The rook",
        datei: "3D-Objekte/rookW.x3d",
		description: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move.",
		moves: "rook_moves.gif"
    },
	{
        id : "rookB",
		headline: "The rook",
        datei: "3D-Objekte/rookB.x3d",
		description: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move.",
		moves: "rook_moves.gif"
    },
	{
        id : "pawnW1",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW2",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW3",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW4",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW5",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW6",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW7",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnW8",
		headline: "The pawn",
        datei: "3D-Objekte/pawnW.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB1",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB2",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB3",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB4",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB5",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB6",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB7",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "pawnB8",
		headline: "The pawn",
        datei: "3D-Objekte/pawnB.x3d",
		description: "The pawn may move forward to the unoccupied square immediately in front of it on the same file, or on its first move it may advance two squares along the same file provided both squares are unoccupied; or the pawn may capture an opponent's piece on a square diagonally in front of it on an adjacent file, by moving to that square. The pawn has two special moves: the en passant capture and pawn promotion.",
		moves: "pawn_moves.gif"
    },
	{
        id : "rookB2",
		headline: "The rook",
        datei: "3D-Objekte/rookB.x3d",
		description: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move.",
		moves: "rook_moves.gif"
    },
	{
        id : "rookW2",
		headline: "The rook",
        datei: "3D-Objekte/rookW.x3d",
		description: "The rook can move any number of squares along any rank or file, but may not leap over other pieces. Along with the king, the rook is involved during the king's castling move.",
		moves: "rook_moves.gif"
    },
	{
        id : "bishopW2",
		headline: "The bishop",
        datei: "3D-Objekte/bishopW.x3d",
		description: "The bishop can move any number of squares diagonally, but may not leap over other pieces.",
		moves: "bishop_moves.gif"
    },
	{
        id : "bishopB2",
		headline: "The bishop",
        datei: "3D-Objekte/bishopB.x3d",
		description: "The bishop can move any number of squares diagonally, but may not leap over other pieces.",
		moves: "bishop_moves.gif"
    },
	{
        id : "knightW2",
		headline: "The knight",
        datei: "3D-Objekte/knightW.x3d",
		description: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces.",
		moves: "knight_moves.gif"
    },
	{
        id : "knightB2",
		headline: "The knight",
        datei: "3D-Objekte/knightB.x3d",
		description: "The knight moves to any of the closest squares that are not on the same rank, file, or diagonal, thus the move forms an 'L'-shape: two squares vertically and one square horizontally, or two squares horizontally and one square vertically. The knight is the only piece that can leap over other pieces.",
		moves: "knight_moves.gif"
    }
];

function loadModel()
{
    var string ="";

    for (var i=0; i < figurArray.length; i++)
    {
        string +=
        '<MatrixTransform id="' + figurArray[i].id + '" render="false" onclick="getFigureInfo(\'' + figurArray[i].id + '\')">' +
            '<Transform scale="60,60,60" rotation="1 0 0 -1.57">' +
                '<inline id="' + figurArray[i].id + '_in" url="' + figurArray[i].datei + '"></inline>' +
            '</Transform>' +
        '</MatrixTransform>';
    }
	
    return string;
}