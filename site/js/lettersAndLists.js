
function Game(gameRoom) {
  console.log(gameRoom);

  gameBase.call(this,gameRoom);

  this.setHandler('to everyone',function(msg) {
    if(msg == 'new game') {
      console.log(this.gameVariables['lastMessage']);
      $('#messages').empty();
      $('#messages').append($('<li>').text(this.gameVariables['lastMessage']));
      $('#game').empty();
      list = $('<ul>');
      for(i=1;i <= 12;i++) {
        list.append($('<li>').text("Item " + i));
        list.append($('<li>').append($('<input>').prop({id:"a"+i,autocomplete:'off'})));
      }
      // list.append($('<li>').$('<input>').prop({'id':"a2",'autocomplete':'off'}));
      $('#game').append(list);
    }
    else
       $('#messages').append($('<li>').text(msg));
  });
  this.setHandler('set playerID',function(id) {
    console.log(id);
    $('#nameheader').text('Name: ' + this.gameRoom.name + ' (playerID: ' + this.gameRoom.playerID + ')');
  });

  console.log($('form'));

  $('form').submit(function(){
    //socket.emit('chat message with ack', $('#m').val(), function(data){
    //  $('#messages').append($('<li>').text('ACK CALLBACK: ' + data));
    //});
    gameRoom.socket.emit('to everyone', gameRoom.name + ": " + $('#m').val());
    gameRoom.socket.emit('sync var','lastMessage', gameRoom.name + ": " + $('#m').val())

    $('#m').val('');
    return false;
  });

}

// var game = new gameBase(gameRoom);
// gameRoom.setGame(game);
