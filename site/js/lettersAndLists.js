
function Game(gameRoom) {
  console.log(gameRoom);

  gameBase.call(this,gameRoom);

  this.setHandler('chat',function(from, msg) {
    if(msg == 'new game') {
      console.log(this.gameVariables['lastMessage']);
      $('#messages').empty();
      $('#messages').append($('<li>').text(this.gameVariables['lastMessage']));
      $('#game').empty();
      list = $('<div>');
      for(i=1;i <= 12;i++) {
        // <label for="basic-url">Your vanity URL</label>
        // <div class="input-group mb-3">
        //   <div class="input-group-prepend">
        //     <span class="input-group-text" id="basic-addon3">https://example.com/users/</span>
        //   </div>
        //   <input type="text" class="form-control" id="basic-url" aria-describedby="basic-addon3">
        // </div>


        list.append($('<label>').text("Item " + i).prop({for:'a'+i}));

        list.append($('<div>').prop({class:"input-group mb-3"}).append(
          $('<input>').prop({id:"a"+i,autocomplete:'off',class:"form-control",type:"text"})));
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
    gameRoom.socket.emit('to everyone', 'chat', gameRoom.name + ": " + $('#m').val());
    gameRoom.socket.emit('sync var','lastMessage', gameRoom.name + ": " + $('#m').val())

    $('#m').val('');
    return false;
  });

}

// var game = new gameBase(gameRoom);
// gameRoom.setGame(game);
