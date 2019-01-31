function gameBase(gameRoom) {
  this.gameRoom = gameRoom;

  this.gameVariables = {};
  this.handlers = {};
  this.playerID = null;
  this.isHost = false;

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

}
