function Room() {
  this.game = {}
  this.game.event = function(e,m) {
  };

  this.room = location.pathname.replace('/','');
  this.name = localStorage.getItem("name");
  console.log(this.name);
  if (!this.name || this.name === "null" || this.name.length === 0) {
    console.log("no name");
    window.location.href = "/?error=name&room=" + this.room;
  }
  this.playerID = localStorage.getItem("playerID");
  if (!this.playerID || this.playerID === "null" || this.playerID.length === 0) {
    this.playerID = "";
  }

  localStorage.setItem("room", this.room);
  this.socket = io( { query: "name="+this.name+"&room="+this.room+"&playerID="+this.playerID });

  // need context because socket takes over "this"
  var thisRoom = this;
  this.socket.on('set player info', function(info) {
    info = JSON.parse(info)
    console.log('received set player info:');
    console.log(info);
    localStorage.setItem("playerID", info.ID);
    thisRoom.game.playerID = info.ID;
    thisRoom.game.isHost = info.Host;
    if(thisRoom.game.isHost) {
      thisRoom.game.setup();
    } else {
      console.log('Force sync');
      thisRoom.socket.emit('to host','sync','script');
    }
  });
  this.socket.on('sync var', function(varName, data) {
    console.log('received sync var msg ' + varName + ':' + data + ' current val:' + thisRoom.game.gameVariables['script']);
    if(varName == 'script' && (thisRoom.game.started == false || thisRoom.game.gameVariables['script'] != data)) {
      host = thisRoom.game.isHost;
      $.getScript(data).done(function(script, status){
        $('#game').empty();
        console.log(status);
        thisRoom.setGame(new Game(gameRoom));
        thisRoom.game.gameVariables['script'] = data;
        thisRoom.game.isHost = host;
        thisRoom.game.setup();
      }).fail(function( jqxhr, settings, exception ) {
        console.log(jqxhr);
        console.log(settings);
        console.log(exception);
      });
    }
    // only change the sync var for non-host
    if (!thisRoom.game.isHost) {

    }
    thisRoom.game.syncVarChanged(varName, data);
  });
  // these 3 are identical, since they contain who sent the message
  this.socket.on('to everyone', function(from, msgType, msg){
    console.log('received to everyone msg from ' + from + ': ' + msgType + ': ' + msg);
    thisRoom.game.event(from, msgType, msg);
  });
  this.socket.on('to host', function(from, msgType, msg){
    console.log('received to host msg from ' + from + ': ' + msgType + ': ' + msg);
    if(msgType == 'sync') {
      //thisRoom.game.syncVar(msg,thisRoom.game.gameVariables[msg]);
      thisRoom.socket.emit('sync var', msg, thisRoom.game.gameVariables[msg]);
    } else {
      thisRoom.game.event(from, msgType, msg);
    }
  });
  this.socket.on('to player', function(from, msgType, msg){
    console.log('received to player msg from ' + from + ': ' + msgType + ': ' + msg);
    thisRoom.game.event(from, msgType, msg);
  });

  this.socket.on('player list', function(list) {
    list = JSON.parse(list)
    console.log(list);
    thisRoom.game.playerList = list;
  });

  this.socket.on('error', function(code) {
    window.location.href = '/?error=' + code;
  })
}

Room.prototype.setGame = function (game) {
  this.game = game;
}

Room.prototype.sendToPlayer = function (to, msgType, data) {
  this.socket.emit("to player", to, msgType, data);
}

Room.prototype.sendToHost = function (msgType, data) {
  this.socket.emit("to host", msgType, data);
}

Room.prototype.sendToEveryone = function (msgType, data) {
  this.socket.emit("to everyone", msgType, data);
}

// host only
Room.prototype.setSyncVar = function (varName, data) {
  this.socket.emit('sync var', varName, data);
}
