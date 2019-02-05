function Room() {
  this.game = {}
  this.game.event = function(e,m) {
  };

  // timer vars
  this.timerActive = false;
  this.timerFunc = null;
  this.timerLeft = 0;

  // which script
  this.scriptURL = ''

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
  });
  this.socket.on('sync var', function(varName, data) {
    console.log('received sync var msg ' + varName + ':' + data + ' current val:' + thisRoom.game.gameVariables['script']);
    data = JSON.parse(data);
    // only change the sync var for non-host
    if (thisRoom.game.isHost) {
      return;
    }
    thisRoom.game.syncVarChanged(varName, data);
  });
  this.socket.on('set script', function(newScriptURL) {
    if(thisRoom.game.started == false || thisRoom.scriptURL != newScriptURL) {
      host = thisRoom.game.isHost;
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
    } else {
      console.log("Could not change script. Game started:" + thisRoom.game.started + " current script:" + thisRoom.scriptURL + " new script:" + thisRoom.newScriptURL)
    }
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
  this.socket.on('to everyone', function(from, msgType, msg){
    console.log('received to everyone msg from ' + from + ': ' + msgType + ': ' + msg);
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });
  this.socket.on('to host', function(from, msgType, msg){
    console.log('received to host msg from ' + from + ': ' + msgType + ': ' + msg);
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });
  this.socket.on('to player', function(from, msgType, msg){
    console.log('received to player msg from ' + from + ': ' + msgType + ': ' + msg);
    thisRoom.game.event(from, msgType, JSON.parse(msg));
  });

  this.socket.on('update player list', function(list) {
    list = JSON.parse(list)
    console.log(list);
    thisRoom.game.playerList = list;
    thisRoom.game.event('', 'update player list', list)
    if (thisRoom.game.isHost) {
      thisRoom.socket.emit('update all sync vars', JSON.stringify(thisRoom.game.gameVariables))
    }
  });

  this.socket.on('start timer', function(secondsStr) {
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
  });
  this.socket.on('sync timer', function(secondsStr) {
    var seconds = parseInt(secondsStr);
    if (Math.abs(this.timerLeft - seconds) > 1) {
      thisRoom.timerLeft = seconds;
    }
  });
  this.socket.on('cancel timer', function() {
    if (thisRoom.timerActive) {
      if (null !== thisRoom.timerFunc) {
        clearInterval(thisRoom.timerFunc);
        thisRoom.timerFunc = null;
      }
      thisRoom.timerActive = false;
      thisRoom.game.event('', 'cancel timer', '');
    }
  });
  this.socket.on('finish timer', function() {
    if (thisRoom.timerActive) {
      if (null !== thisRoom.timerFunc) {
        clearInterval(thisRoom.timerFunc);
        thisRoom.timerFunc = null;
      }
      thisRoom.timerActive = false;
      thisRoom.game.event('', 'finish timer', '');
    }
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
  this.socket.emit('start timer', seconds.toString());
}

// host only
Room.prototype.cancelTimer = function () {
  this.socket.emit('cancel timer');
}

// host only
Room.prototype.setScript = function (newScriptURL) {
  this.socket.emit('set script', newScriptURL);
}
