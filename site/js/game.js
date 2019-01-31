function gameBase(gameRoom) {
  this.gameRoom = gameRoom;

  this.gameVariables = {script:'site/js/launchPad.js'};
  this.handlers = {};
  this.isHost = false;

  this.event = function(type,info) {
    if(this.handlers.hasOwnProperty(type)) {
      this.handlers[type].call(this,info);
    }
  }

  this.setHandler = function(type, method) {
    this.handlers[type] = method;
  }

  this.syncVar = function(data) {
    console.log(this);

    this.gameVariables[data['name']] = data['value'];
  }

  this.setHandler('sync var', this.syncVar);
  //TODO: Auto sync everything in gameVariables

}
