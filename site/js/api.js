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
  this.socket = io( { query: "username="+this.name+"&room="+this.room+"&playerID="+this.playerID });

  this.socket.on('set playerID', function(id) {
    localStorage.setItem("playerID", id);
    window.gameRoom.playerID = id;
    window.gameRoom.game.event('set playerID',id);
  });
  this.socket.on('sync var', function(varName, data) {
    console.log(data);
    window.gameRoom.game.event('sync var',{'name':varName,'value':data});
  });
  this.socket.on('to everyone', function(msg){
    console.log(window.gameRoom.game);
      console.log(window.gameRoom);
    window.gameRoom.game.event('to everyone',msg);
  });
  this.socket.on('player list', function(list) {
    console.log(list);
  });

  this.setGame = function(game) {
    this.game = game;
  }


  this.setUp = function() {
    this.socket.emit('player list');
  }
}
