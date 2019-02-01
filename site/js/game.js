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

  // I call syncvar straight from api.js
  //this.setHandler('sync var', this.syncVar);
  this.toHost = function(data) {
    console.log(data);
    if('data' == 'script sync')
      thisGame.gameRoom.socket.emit('sync var','script',this.gameVariables['script']);
  }

  this.toPlayer = function(data) {
    console.log(data);
    if('data' == 'script sync')
      thisGame.gameRoom.socket.emit('sync var','script',this.gameVariables['script']);
  }

  //this.setHandler('sync var', this.syncVar);
  this.setHandler('to host', this.toHost);
  this.setHandler('to player', this.toPlayer);
  //TODO: Auto sync everything in gameVariables

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
    this.gameVariables[varName] = data;
    // send across the network
    gameRoom.setSyncVar(varName, data);
  }
  
  // internal
  this.syncVarChanged = function(name, value) {
    console.log(this);
    console.log("syncing " + name + " to " + value)
    this.gameVariables[name] = value;
  }
}
