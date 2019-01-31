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
  this.socket.on('set playerID', function(id) {
    localStorage.setItem("playerID", id);
    thisRoom.game.playerID = id;
  });
  this.socket.on('sync var', function(varName, data) {
    console.log("sync var name " + varName + " data " + data);
    if(varName == 'script') {
      $.getScript(data).done(function(script, status){
        $('#game').empty();
        console.log(status);
        gameRoom.setGame(new Game(gameRoom));
        gameRoom.setUp();
      }).fail(function( jqxhr, settings, exception ) {
        console.log(jqxhr);
        console.log(settings);
        console.log(exception);
      });
    }
    thisRoom.game.syncVar(varName, data);
  });
  // these 3 are identical, since they contain who sent the message
  this.socket.on('to everyone', function(from, msgType, msg){
    thisRoom.game.event(from, msgType, msg);
  });
  this.socket.on('to host', function(from, msgType, msg){
    thisRoom.game.event(from, msgType, msg);
  });
  this.socket.on('to player', function(from, msgType, msg){
    thisRoom.game.event(from, msgType, msg);
  });

  this.socket.on('player list', function(list) {
    list = JSON.parse(list)
    console.log(list);
    if(list.length > 0 && list[0].ID === thisRoom.playerID) {
      console.log("I am the host");
      thisRoom.game.isHost = true;
    }
    thisRoom.game.setup();
  });
}

Room.prototype.setGame = function(game) {
  this.game = game;
  this.setUp();
}

Room.prototype.setUp = function() {
  this.socket.emit('player list');
}
