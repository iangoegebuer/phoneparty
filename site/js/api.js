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
    thisRoom.playerID = id;
    thisRoom.game.event('set playerID',id);
  });
  this.socket.on('sync var', function(varName, data) {
    console.log(data);
    thisRoom.game.event('sync var',{'name':varName,'value':data});
  });
  this.socket.on('to everyone', function(msg){
    thisRoom.game.event('to everyone',msg);
  });
  this.socket.on('player list', function(list) {
    console.log(list);
    if(list.split(',')[0] == thisRoom.playerID)
      thisRoom.game.isHost = true;
  });
}

Room.prototype.setGame = function(game) {
  this.game = game;
  this.setUp();
}

Room.prototype.setUp = function() {
  this.socket.emit('player list');
}
