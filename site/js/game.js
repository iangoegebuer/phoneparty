function gameBase(gameRoom) {
  this.gameRoom = gameRoom;

  this.gameVariables = {script:'site/js/launchPad.js'};
  this.handlers = {};
  this.playerID = null;
  this.isHost = false;
  this.playerList = [];
  this.setup = function () {
    // Override this for setup functionality
  }

  this.event = function(from, type, info) {
    if (this.handlers.hasOwnProperty(type)) {
      this.handlers[type].call(this, from, info);
    }
  }

  this.setHandler = function(type, method) {
    this.handlers[type] = method;
  }

  this.syncVar = function(name, value) {
    console.log(this);
    console.log("syncing " + name + " to " + value)
    this.gameVariables[name] = value;
  }

  // I call syncvar straight from api.js
  //this.setHandler('sync var', this.syncVar);
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
  
  // host only
  this.setSyncVar = function (varName, data) {
    gameRoom.setSyncVar(varName, data)
  }
}
