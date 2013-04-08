var app = require("http").createServer(appHandler),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    io = require("socket.io").listen(app, { log: false }),
    ttboard = require("./TicTacBoard");

app.listen(8080);

var pendingGames = new Array();
var inProgressGames = new Object;
var peopleConnected = 0;
Array.prototype.doesGameExist = function(gameId) {
	for(var i in this) {
		game = this[i];
		if(game.id != 'undefined' && game.id == gameId) {
			return i;
		}
	}
	return false;
}

function appHandler(request, response) {
    var uri = url.parse(request.url).pathname;
    if (uri == 'undefined' || uri == null || uri == '/') {
    	uri = 'index.html';
    }
    var filename = path.join(process.cwd(), 'public/' + uri);
    
    fs.exists(filename, function(exists) {
        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.end("404 Not Found");
            return;
        }
        
        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.end(err + "n");
                return;
            }
        	
            var contentType;
        	extension = path.extname(filename);        	
        	if(extension == '.html' || extension == '.htm') {
        		contentType = { 'Content-Type' : 'text/html' };
        	} else if(extension == '.js') {
        		contentType = { 'Content-Type' : 'text/javascript' };
        	} else if(extension == '.css') {
        		contentType = { 'Content-Type' : 'text/css' };
        	}
            response.writeHead(200, contentType );
            response.end(file, "binary");
        });
	});
}

io.sockets.on('connection', function(socket) {
	peopleConnected++;
	broadcastPeopleConnected();
	//console.log('Before Connect: pendingGames = ' + JSON.stringify(pendingGames) + 'inProgress = ' + JSON.stringify(inProgressGames));
	console.log(socket.id + ' player Connected ' + peopleConnected);
	if(pendingGames.length == 0) {
		newGame = ttboard.create(new Date().getTime(), socket.id);
		socket.gameid = newGame.id;
		pendingGames.push(newGame);
		console.log('New Game Created ' + newGame.id);
	} else {
		matchedGame = pendingGames.pop();
		socket.gameid = matchedGame.id;
		
		matchedGame.setPlayer2(socket.id);
		inProgressGames[matchedGame.id] = matchedGame;
		
		socket.emit('matchfound', { 
			gameid: matchedGame.id,  
			thisplayer: 'X',
			thatplayer: 'O',
			first: false,	
		});
		
		io.sockets.socket(matchedGame.player1).emit('matchfound', {
			gameid: matchedGame.id, 
			thisplayer: 'O',
			thatplayer: 'X',
			first: true,
		});
		console.log('Game Matched ' + matchedGame.id);
	}
	//console.log('After Connect: pendingGames = ' + JSON.stringify(pendingGames) + 'inProgress = ' + JSON.stringify(inProgressGames));

	socket.on('moveplayed', function (data) {					
		var thisGame = inProgressGames[socket.gameid];		
		var thisPlayer = socket.id;
		var quadrant = data.quadrant;
		
		if(thisGame.performMove(thisPlayer, quadrant)) {
			sendMovePlayedMessage(thisGame, thisPlayer, quadrant);
			
			winningCombo = thisGame.isWinner(thisPlayer);
			if(winningCombo !== false) {
				endGame(thisGame, thisPlayer, winningCombo);
			} else if(thisGame.isTie()) {
				endGame(thisGame);
			}	
		}		
	});
	
	socket.on('disconnect', function() {	
		peopleConnected--;
		broadcastPeopleConnected();
		//console.log('Before Disco: pendingGames = ' + JSON.stringify(pendingGames) + 'inProgress = ' + JSON.stringify(inProgressGames));
		if(!socket.hasOwnProperty('gameid')) {
			console.log('Unknown Game Disconnected ' + peopleConnected);
			return;
		}
		
		if(inProgressGames.hasOwnProperty(socket.gameid)) {	
			console.log(socket.id + ' has quit game ' + socket.gameid + " : connected " + peopleConnected);
			var thisGame = inProgressGames[socket.gameid];
			var thatPlayer = determineThatPlayer(thisGame, socket.id);
			delete inProgressGames[socket.gameid];
			delete io.sockets.socket(thatPlayer).gameid;
			io.sockets.socket(thatPlayer).emit('disco', { message: 'You Win! Opponent resigned.' });
		} else {	
			console.log(socket.id + ' the unmatched player has left ' + peopleConnected);
			pendingGameIndex = pendingGames.indexOf(socket.gameid);
			//if(pendingGameIndex != false || pendingGameIndex != 'undefined') {
			if(pendingGameIndex != -1) {
				console.log('Removing Pending Game ' + socket.gameid);
				pendingGames.splice(pendingGameIndex, 1);
			}
		}
		//console.log('After Disco: pendingGames = ' + JSON.stringify(pendingGames) + 'inProgress = ' + JSON.stringify(inProgressGames));
	});
});

function endGame(thisGame, winner, winningCombo) {
	if(winner == undefined) {
		sendTieMessage(thisGame);
	} else {
		var loser = determineThatPlayer(thisGame, winner);
		sendWinLoseMessage(winner, loser, winningCombo);
	}

	delete io.sockets.socket(thisGame.player1).gameid;
	delete io.sockets.socket(thisGame.player2).gameid;
	delete inProgressGames[thisGame.gameid];
}

function broadcastPeopleConnected() {
	io.sockets.emit('peopleconnected', { message: 'There are ' + peopleConnected + ' people connected.' });
}

function sendMovePlayedMessage(thisGame, thisPlayer, quadrant) {
	var thatPlayer = determineThatPlayer(thisGame, thisPlayer);
	var moveSymbol = determineMoveSymbol(thisGame, thisPlayer);
	io.sockets.socket(thisPlayer).emit('moveplayed', { quadrant: quadrant, move: moveSymbol, block: true });
	io.sockets.socket(thatPlayer).emit('moveplayed', { quadrant: quadrant, move: moveSymbol, block: false });
}

function sendWinLoseMessage(winner, loser, winningCombo) {
	io.sockets.socket(winner).emit('win', { message: 'Congratulations! You Win!', combo: winningCombo });
	io.sockets.socket(loser).emit('lose', { message: 'You Lose!', combo: winningCombo });
}

function sendTieMessage(thisGame) {
	io.sockets.socket(thisGame.player1).emit('tie', { message: "It's a tie!" });
	io.sockets.socket(thisGame.player2).emit('tie', { message: "It's a tie!" });
}

function determineThatPlayer(thisGame, thisPlayer) {
	if(thisPlayer == thisGame.player1) {
		return thisGame.player2;
	} else {
		return thisGame.player1;
	}
}

function determineMoveSymbol(thisGame, thisPlayer) {
	if(thisPlayer == thisGame.player1) {
		return 'X';
	} else {
		return 'O';
	}
}