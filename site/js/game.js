function gameBase(gameRoom) {
  this.gameRoom = gameRoom;

  this.gameVariables = {script:'site/js/launchPad2.js'};
  this.handlers = {};
  this.playerID = null;
  this.isHost = false;
  this.playerList = [];
  this.setup = function () {
    // Override this for setup functionality
  }
  this.started = false;

  this.event = function(from, type, info) {
    if (this.handlers.hasOwnProperty(type)) {
      this.handlers[type].call(this, from, info);
    }
  }

  this.setHandler = function(type, method) {
    this.handlers[type] = method;
  }

  this.syncVarChanged = function(name, value) {
    console.log(this);
    console.log("syncing " + name + " to " + value)
    this.gameVariables[name] = value;
  }

  // I call syncvar straight from api.js
  //this.setHandler('sync var', this.syncVar);
  this.toHost = function(data) {
    if('data' == 'script sync')
      thisGame.gameRoom.socket.emit('sync var','script',this.gameVariables['script']);
  }

  //this.setHandler('sync var', this.syncVar);
  this.setHandler('to host', this.toHost);
  //TODO: Auto sync everything in gameVariables


  // Calls directly to the Room api
  this.sendToPlayer = function (to, msgType, data) {
    gameRoom.sendToPlayer(to, msgType, data);
  }
  
  this.sendToHost = function (msgType, data) {
    gameRoom.sendToPlayer(msgType, data);
  }
  
  this.sendToEveryone = function (msgType, data) {
    gameRoom.sendToPlayer(msgType, data);
  }
  
  this.getSyncVar = function (varName) {
    return this.gameVariables[varName];
  }
  // host only
  this.setSyncVar = function (varName, data) {
    if (!this.isHost) {
      console.log("Cannot set sync vars unless you are the host");
      return;
    }
    this.gameVariables[varName] = value;
    // send across the network
    gameRoom.setSyncVar(varName, data);
  }
}
