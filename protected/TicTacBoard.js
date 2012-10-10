var TicTacBoard = function (id, player1, player2) {
	this.player1 = player1;	
	this.player2 = player2;
	
	this.id = id;	
	this.board = new Array();
}

TicTacBoard.prototype.performMove = function(player, quadrant) {
	if(quadrant == undefined) {
		return false;
	}
	if (this.board[quadrant] == null) {
	    this.board[quadrant] = player;
	    return true;
    } else {
    	return false;
    }
}
	    	   	
TicTacBoard.prototype.isWinner = function (player) {
   winCombos = [[1,2,3],[1,4,7],[1,5,9],[4,5,6],[7,8,9],[2,5,8],[3,6,9],[3,5,7]];
   for(var i = 0; i < winCombos.length; i++) {
       if(player == this.board[winCombos[i][0]] && 
		  player == this.board[winCombos[i][1]] &&
		  player == this.board[winCombos[i][2]]) {
            return true;
       }
   }
   
   return false;
}

TicTacBoard.prototype.isTie = function() {
	for(var i = 1; i < 10; i++) {
		if(this.board[i] == null) {
			return false;
		}
	}
	
	return true
}

TicTacBoard.prototype.resetBoard = function() {
    for(var i = 1; i < 10; i++) {
		this.board[i] = null;
	}
}

TicTacBoard.prototype.setPlayer1 = function(player) {
	this.player1 = player;
}

TicTacBoard.prototype.setPlayer2 = function(player) {
	this.player2 = player;
}

module.exports._class = TicTacBoard;

module.exports.create = function(id, player1, player2) {
	return new TicTacBoard(id, player1, player2);
}
