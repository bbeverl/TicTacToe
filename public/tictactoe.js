var socket;

var isBlocked = true;

$(document).ready( function() {
	$('#myCanvas').hide();

	$.mobile.loading( 'show', {
		text: 'Finding match...',
		textVisible: true,
		theme: 'a',
		html: ""
	});
	
	host = document.location.hostname;
	socket = io.connect(host);
	
	socket.on('matchfound', function (data) {
	  console.log(data);	  
	  initGame(data.gameid, data.thisplayer, data.thatplayer);
	  isBlocked = !data.first;
	  updateIndicator();
	  
	  var alertmsg = "Match found!";
	  if(data.first) {
		  altermsg = altermsg + " You are first!";
	  }
	  alert( alertmsg );
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
	
	$('#myCanvas').click(function(e) {
        if(isBlocked != true) {            
        	var quadrant = findQuadrant(e.offsetX, e.offsetY);        	
            isBlocked = true;	
            socket.emit('moveplayed', { 
            	quadrant: quadrant, 
        	});
        }		
    });
	socket.on('moveplayed', function (data) {
		  console.log(data);
		  doMove(data.quadrant, data.move);
		  isBlocked = data.block;
		  updateIndicator();
	});
	socket.on('tie', function(data) {
		drawTie();
		endGame(data.message);
	});
	socket.on('win', function(data) {
		drawWinningLine(true, data.combo);
		endGame(data.message);
	});
	socket.on('lose', function(data) {
		drawWinningLine(false, data.combo);
		endGame(data.message);
	});
	socket.on('disco', function(data) {
		endGame(data.message);
	});
	
}

function doMove(quadrant, player) {	
    if(player == 'X') {
        drawX(quadrant);
    } else {
        drawO(quadrant);
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

    ctx.moveTo(cTwoThirdWidth, 0);
    ctx.lineTo(cTwoThirdWidth, cHeight);
   
    ctx.moveTo(0, cOneThirdHeight);
    ctx.lineTo(cWidth, cOneThirdHeight);

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

function drawWinningLine(won, winningCombo) {

    if(winningCombo == undefined) {
    	return;
    }
    if(won) {
    	ctx.strokeStyle = "#0000FF";
    } else {
    	ctx.strokeStyle = "#FF0000";
    }
    
    var startX;
    var startY;
    var endX;
    var endY;
    if(winningCombo == 0) {
    	startX = 0;
    	endX = cWidth;
    	startY = endY = (cOneThirdHeight / 2);
    } else if(winningCombo == 1) {
    	startX = endX =  (cOneThirdWidth / 2);
    	startY = 0;
    	endY = cHeight;
    } else if(winningCombo == 2) {
    	startX = startY = 0;
    	endX = cWidth;
    	endY = cHeight;
    } else if(winningCombo == 3) {
    	startX = 0;
    	endX = cWidth;
    	startY = endY = (cOneThirdHeight / 2) + cOneThirdHeight;
    } else if(winningCombo == 4) {
    	startX = 0;
    	endX = cWidth;
    	startY = endY = (cOneThirdHeight / 2) + cTwoThirdHeight;
    } else if(winningCombo == 5) {
    	startX = endX =  (cOneThirdWidth / 2) + cOneThirdWidth;
    	startY = 0;
    	endY = cHeight;
    } else if(winningCombo == 6) {
    	startX = endX =  (cOneThirdWidth / 2) + cTwoThirdWidth;
    	startY = 0;
    	endY = cHeight;    	
    } else if(winningCombo == 7) {
    	startX = cWidth;
    	startY = 0;
    	endX = 0;
    	endY = cHeight;
    }
    
    ctx.beginPath();
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX,endY);
    
    ctx.stroke();
    ctx.strokeStyle = "#000000";
}

function drawTie() {
	ctx.strokeStyle = "#00FFFF";
	ctx.beginPath();
	
	var radius;
    if(cWidth < cHeight) {
    	radius = (cWidth / 4);
    } else {
    	radius = (cHeight / 4);
    }
    
	ctx.arc((cWidth / 2), (cHeight / 2), radius, 0.2*Math.PI,1.7*Math.PI);
	ctx.stroke();
	ctx.strokeStyle = "#000000";
}

function resetBoard() {

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

function updateIndicator() {
	if(isBlocked) {
		$('.turnindicator').text('Please wait for opponent');
	} else {
		$('.turnindicator').text('Your move, son');
	}
}
