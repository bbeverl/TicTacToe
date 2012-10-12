var socket;

var myGame;
var isBlocked = true;

$(document).ready( function() {
	$('#myCanvas').hide();

	$.mobile.loading( 'show', {
		text: 'Finding match...',
		textVisible: true,
		theme: 'a',
		html: ""
	});
	
	//socket = io.connect('http://bbeverly.tictactoe.nodejitsu.com/');
	socket = io.connect('http://localhost:8080/');
	
	socket.on('matchfound', function (data) {
	  console.log(data);
	  initGame(data.gameid, data.thisplayer, data.thatplayer);
	  isBlocked = !data.first;
	});
	socket.on('peopleconnected', function(data) {
		$('.peopleconnected').text(data.message);
	});
});
function determineGridSize() {
	ctx = $('#myCanvas')[0].getContext('2d');
	cWidth = $('#myCanvas').width();
    cHeight = $('#myCanvas').height();
    
    cOneThirdWidth = cWidth / 3;
    cTwoThirdWidth = cOneThirdWidth * 2;
    
    cOneThirdHeight = cHeight / 3;
    cTwoThirdHeight = cOneThirdHeight * 2;
}
function initGame(gameId, thisPlayer, thatPlayer) {
	$('#myCanvas').show();
	$.mobile.loading('hide');
	determineGridSize();
	
	drawGrid();
	
	myGame = new TicTacBoard(gameId, thisPlayer, thatPlayer);

	$('#myCanvas').click(function(e) {
        if(isBlocked != true) {            
        	var quadrant = findQuadrant(e.offsetX, e.offsetY);
        	doMove(quadrant, thisPlayer);
            isBlocked = true;	
            socket.emit('moveplayed', { 
            	quadrant: quadrant, 
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

function findQuadrant(xPos, yPos) {	
    var quad = 9;
    if(yPos < cTwoThirdHeight) {
        quad -= 3;
    }
    if (yPos < cOneThirdHeight) {
        quad -= 3;
    }
    if(xPos < cTwoThirdWidth) {
        quad -= 1;
    }
    if(xPos < cOneThirdWidth) {
        quad -= 1;
    }
    return quad;
}

function drawGrid() {
    ctx.beginPath();
    ctx.moveTo(cOneThirdWidth,0);
    ctx.lineTo(cOneThirdWidth, cHeight);
    //ctx.stroke();

    ctx.moveTo(cTwoThirdWidth, 0);
    ctx.lineTo(cTwoThirdWidth, cHeight);
    //ctx.stroke();
   
    ctx.moveTo(0, cOneThirdHeight);
    ctx.lineTo(cWidth, cOneThirdHeight);
    //ctx.stroke();

    ctx.moveTo(0, cTwoThirdHeight);
    ctx.lineTo(cWidth,cTwoThirdHeight);
    
    ctx.stroke();
}

function drawX(quadrant) {
    var startX;
    var startY;
    if(quadrant < 4) {
        startX = (quadrant - 1) * cOneThirdWidth;
        startY = 0;
    }
    else if(quadrant >= 4 && quadrant < 7) {
        startX = (quadrant - 4) * cOneThirdWidth;
        startY = cOneThirdHeight;
    }
    else if(quadrant >= 7) {
        startX = (quadrant - 7) * cOneThirdWidth;
        startY = cTwoThirdHeight;
    }
    ctx.moveTo(startX,startY);
    ctx.lineTo(startX + cOneThirdWidth, startY + cOneThirdHeight);
    ctx.stroke();

    ctx.moveTo(startX + cOneThirdWidth, startY);
    ctx.lineTo(startX, startY + cOneThirdHeight);
    ctx.stroke();
}

function drawO(quadrant) {
    var startX;
    var startY;
    if(quadrant < 4) {
        startX = (quadrant - 1) * cOneThirdWidth;
        startY = 0;
    }
    else if(quadrant >= 4 && quadrant < 7) {
        startX = (quadrant - 4) * cOneThirdWidth;
        startY = cOneThirdHeight;
    }
    else if(quadrant >= 7) {
        startX = (quadrant - 7) * cOneThirdWidth;
        startY = cTwoThirdHeight;
    }
    ctx.beginPath();
    var radius;
    if(cOneThirdWidth < cOneThirdHeight) {
    	radius = (cOneThirdWidth / 2);
    } else {
    	radius = (cOneThirdHeight / 2);
    }
    ctx.arc(startX + (cOneThirdWidth / 2), startY+(cOneThirdHeight / 2), radius, 0, 2*Math.PI);
    ctx.stroke();
}

function resetBoard() {
	myGame.resetBoard();

    ctx.clearRect(0, 0, cWidth, cHeight);
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
