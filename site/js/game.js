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

  // SPECIAL HANDLERS ARE
  // sync, update sync var VARNAME, start timer, tick timer, cancel timer, finish timer
  this.event = function(from, type, info) {
    if (this.handlers.hasOwnProperty(type)) {
      this.handlers[type].call(this, from, info);
    }
  }

  this.setHandler = function(type, method) {
    this.handlers[type] = method;
  }

  // SPECIAL SYNC VARS
  // script
  this.getSyncVar = function (varName) {
    return this.gameVariables[varName];
  }

  // host only
  this.setSyncVar = function (varName, data) {
    if (!this.isHost) {
      console.log("Cannot set sync vars unless you are the host");
      return;
    }
    // TODO make script its own part of the api
    // don't update the game var just yet if its script
    if (varName !== 'script') {
      this.gameVariables[varName] = data;
    }
    // send across the network
    this.gameRoom.setSyncVar(varName, data);
  }
  
  // internal
  this.syncVarChanged = function(name, value) {
    console.log(this);
    console.log("syncing " + name + " to " + value)
    this.gameVariables[name] = value;
    // You can subscribe to a handler if you want
    this.event('', 'update sync var ' + name, value);
  }
}
