var socket;

var canvasSize, canvasWidth, canvasHeight;
var oneThird, twoThird, leftOffset, topOffset;
var canvasTop = 0, canvasLeft = 0

var myGame;
var playerId;
var isBlocked = true;

function initMatchmaking() {
	$('#myCanvas').hide();
	
	$.mobile.loading( 'show', {
		text: 'Finding match...',
		textVisible: true,
		theme: 'a',
		html: ""
	});
	
	socket = io.connect('http://bbeverly.tictactoe.nodejitsu.com/');
	//socket = io.connect('http://localhost:8080/');
	
	socket.on('matchfound', function (data) {
	  console.log(data);
	  playerId = data.playerid;
	  initGame(data.gameid, data.thisplayer, data.thatplayer);
	  isBlocked = !data.first;
	});
	socket.on('peopleconnected', function(data) {
		$('peopleconnected').div(data.message);
	});
}

function initGame(gameId, thisPlayer, thatPlayer) {
	$('#myCanvas').show();
	$.mobile.loading('hide');
	canvasSize = $('#myCanvas').width(); 
	canvasWidth = $('#myCanvas').width();
	canvasHeight = $('#myCanvas').height();
	
	oneThird = canvasSize / 3;
	twoThird = (canvasSize / 3) * 2;
	
	drawGrid();
	myGame = new TicTacBoard(gameId, thisPlayer, thatPlayer);

	$('#myCanvas').click(function(e) {
        if(isBlocked != true) {            
        	var quadrant = findQuadrant(e.pageX, e.pageY);
        	doMove(quadrant, thisPlayer);
            isBlocked = true;	
            socket.emit('moveplayed', { 
            	quadrant: quadrant, 
            	gameid: myGame.id,
            	playerid: playerId
        	});
        }		
    });
	socket.on('moveplayed', function (data) {
		  console.log(data);
		  doMove(data.quadrant, thatPlayer);
		  isBlocked = false;
	});
	socket.on('tie', function(data) {
		endGame(data.message);
	});
	socket.on('win', function(data ) {
		endGame(data.message);
	});
	socket.on('lose', function(data) {		
		endGame(data.message);
	});
	socket.on('disco', function(data) {		
		endGame(data.message);
	});
	
}

function doMove(quadrant, player, context) {	
	if(myGame.performMove(player, quadrant)) {
	    if(player == 'X') {
	        drawX(quadrant);
	    } else {
	        drawO(quadrant);
	    }   	
	}      
}

function drawGrid() {
    var ctx = $('#myCanvas')[0].getContext('2d');

    ctx.moveTo(oneThird,canvasTop);
    ctx.lineTo(oneThird, canvasHeight);
    ctx.stroke();

    ctx.moveTo(twoThird,canvasTop);
    ctx.lineTo(twoThird, canvasHeight);
    ctx.stroke();

    ctx.moveTo(canvasLeft, oneThird);
    ctx.lineTo(canvasWidth, oneThird);
    ctx.stroke();

    ctx.moveTo(canvasLeft, twoThird);
    ctx.lineTo(canvasWidth,twoThird);
    ctx.stroke();
}
function findQuadrant(xPos, yPos) {
    var quad = 9;
    if(yPos < twoThird) {
        quad -= 3;
    }
    if (yPos < oneThird) {
        quad -= 3;
    }
    if(xPos < twoThird) {
        quad -= 1;
    }
    if(xPos < oneThird) {
        quad -= 1;
    }
    return quad;
}


function drawX(quadrant) {
	var ctx = $('#myCanvas')[0].getContext('2d');
    var startX;
    var startY;
    if(quadrant < 4) {
        startX = (quadrant - 1) * oneThird;
        startY = 0;
    }
    else if(quadrant >= 4 && quadrant < 7) {
        startX = (quadrant - 4) * oneThird;
        startY = oneThird;
    }
    else if(quadrant >= 7) {
        startX = (quadrant - 7) * oneThird;
        startY = twoThird;
    }
    ctx.moveTo(startX,startY);
    ctx.lineTo(startX + oneThird, startY + oneThird);
    ctx.stroke();

    ctx.moveTo(startX + oneThird, startY);
    ctx.lineTo(startX, startY + oneThird);
    ctx.stroke();
}

function drawO(quadrant) {
	var ctx = $('#myCanvas')[0].getContext('2d');
    var startX;
    var startY;
    if(quadrant < 4) {
        startX = (quadrant - 1) * oneThird;
        startY = 0;
    }
    else if(quadrant >= 4 && quadrant < 7) {
        startX = (quadrant - 4) * oneThird;
        startY = oneThird;
    }
    else if(quadrant >= 7) {
        startX = (quadrant - 7) * oneThird;
        startY = twoThird;
    }
    ctx.beginPath();
    ctx.arc(startX + (oneThird / 2),startY+(oneThird / 2),(oneThird / 2),0,2*Math.PI);
    ctx.stroke();
}

function resetBoard() {
	myGame.resetBoard();
	
    var ctx = $('#myCanvas')[0].getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.beginPath();
	
    drawGrid();
}

function endGame(message) {
	alertUser(message);
	location.reload();
	//resetBoard();
}
function alertUser(message) {
	alert(message);
}
