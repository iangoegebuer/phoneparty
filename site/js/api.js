function Room() {
  // create an empty game temporarily
  this.game = new gameBase(this);

  // timer vars
  this.timerActive = false;
  this.timerFunc = null;
  this.timerLeft = 0;

  // which script
  this.scriptURL = '';

  // room vars
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
    thisRoom.game.isAudience = info.isAudience;
  });
  this.socket.on('sync var', function(varName, data) {
    data = JSON.parse(data);
    // only change the sync var for non-host
    if (thisRoom.game.isHost) {
      return;
    }
    thisRoom.game.syncVarChanged(varName, data);
  });
  this.socket.on('set script', function(newScriptURL) {
    host = thisRoom.game.isHost;
    /*
    $.getScript(newScriptURL).done(function(script, status){
      $('#game').empty();
      console.log("Get script status: ", status);
      var oldGame = thisRoom.game;
      thisRoom.setGame(new Game(thisRoom));
      thisRoom.game.copyFrom(oldGame);
      thisRoom.scriptURL = newScriptURL;
      thisRoom.game.setup();
    }).fail(function( jqxhr, settings, exception ) {
      console.log(jqxhr);
      console.log(settings);
      console.log(exception);
    });
    */
    $('#game').empty();
    $('#game').load(newScriptURL, function (arg1, arg2) {
      console.log("Loaded the game " + newScriptURL);
      var oldGame = thisRoom.game;
      thisRoom.setGame(new Game(thisRoom));
      thisRoom.game.copyFrom(oldGame);
      thisRoom.scriptURL = newScriptURL;
      thisRoom.game.setup();
      thisRoom.socket.emit('player ready')
    });
  });
  this.socket.on('update all sync vars', function(data) {
    // only update for non-host
    if (thisRoom.game.isHost) {
      return;
    }
    console.log('received sync all vars msg ' + data);
    data = JSON.parse(data);
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        thisRoom.game.syncVarChanged(key, data[key])
      }
    }
  });
  // these 3 are identical, since they contain who sent the message
  this.socket.on('to everyone', function(from, msgType, msg) {
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });
  this.socket.on('to host', function(from, msgType, msg) {
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });
  this.socket.on('to player', function(from, msgType, msg) {
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });

  this.socket.on('update player list', function(list) {
    list = JSON.parse(list);
    thisRoom.game.playerList = list;
    thisRoom.game.event('', 'update player list', list)
    if (thisRoom.game.isHost) {
      thisRoom.socket.emit('update all sync vars', JSON.stringify(thisRoom.game.gameVariables))
    }
  });

  this.socket.on('start timer', function(secondsStr) {
    // TODO call the func
  });
  this.socket.on('sync timer', function(secondsStr) {
    // TODO is this good to go?
    var seconds = parseInt(secondsStr);
    if (Math.abs(this.timerLeft - seconds) > 1) {
      thisRoom.timerLeft = seconds;
    }
  });
  this.socket.on('cancel timer', function() {
    // TODO call the func
  });
  this.socket.on('finish timer', function() {
    // TODO call the func
  });

  this.socket.on('error', function(code) {
    window.location.href = '/?error=' + code;
  })
}

Room.prototype.setGame = function (game) {
  this.game = game;
}

Room.prototype.sendToPlayer = function (to, msgType, data) {
  this.socket.emit("to player", to, msgType, JSON.stringify(data));
}

Room.prototype.sendToHost = function (msgType, data) {
  this.socket.emit("to host", msgType, JSON.stringify(data));
}

Room.prototype.sendToEveryone = function (msgType, data) {
  this.socket.emit("to everyone", msgType, JSON.stringify(data));
}

// host only
Room.prototype.setSyncVar = function (varName, data) {
  this.socket.emit('sync var', varName, JSON.stringify(data));
}

// host only
Room.prototype.startTimer = function (seconds) {
  if (!this.game.isHost) {
    return;
  }
  console.log('start timer message');
  var seconds = parseInt(secondsStr);
  if (thisRoom.timerActive) {
    if (null !== thisRoom.timerFunc) {
      clearInterval(thisRoom.timerFunc);
    }
  }
  thisRoom.timerActive = true;
  thisRoom.timerLeft = seconds;
  thisRoom.timerFunc = setInterval(function () {
    if (thisRoom.timerLeft > 0) {
      thisRoom.timerLeft--;
      thisRoom.game.event('', 'tick timer', thisRoom.timerLeft);
    }
  }, 1000);
  // TODO IMPLEMENT
  this.socket.emit('start timer', seconds.toString());
}

// host only
Room.prototype.cancelTimer = function () {
  if (!this.game.isHost) {
    return;
  }
  console.log('cancel timer message');
  if (thisRoom.timerActive) {
    if (null !== thisRoom.timerFunc) {
      clearInterval(thisRoom.timerFunc);
      thisRoom.timerFunc = null;
    }
    thisRoom.timerActive = false;
    thisRoom.game.event('', 'cancel timer', '');
  }
  // TODO IMPLEMENT
  this.socket.emit('cancel timer');
}

// DO NOT CALL THIS EXPLICITLY. Should only be called from API.js
Room.prototype.finishTimer = function () {
  console.log('finish timer message');
  if (thisRoom.timerActive) {
    if (null !== thisRoom.timerFunc) {
      clearInterval(thisRoom.timerFunc);
      thisRoom.timerFunc = null;
    }
    thisRoom.timerActive = false;
    thisRoom.game.event('', 'finish timer', '');
  }
}

// static timer func
Room.TickTimerFunc = function () {

}

// host only
Room.prototype.setScript = function (newScriptURL) {
  this.socket.emit('set script', newScriptURL);
}

// host only
Room.prototype.setRoomOpen = function () {
  this.socket.emit('set room mode', "OPEN");
}

// host only
Room.prototype.setRoomAudience = function () {
  this.socket.emit('set room mode', "AUDIENCE");
}

// host only
Room.prototype.setRoomClosed = function () {
  this.socket.emit('set room mode', "CLOSED");
}
