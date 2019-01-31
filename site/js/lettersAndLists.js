
function Game(gameRoom) {
  console.log(gameRoom);

  gameBase.call(this,gameRoom);

  this.setHandler('chat',function(from, msg) {
    if(msg == 'new game') {
      $('#messages').empty();
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
    //gameRoom.socket.emit('sync var','lastMessage', gameRoom.name + ": " + $('#m').val())

    $('#m').val('');
    return false;
  });

  this.setup = function() {
    $('#game').empty();
    list = $('<div>');
    for(i=1;i <= 12;i++) {

      list.append($('<label>').text("Item " + i).prop({for:'a'+i}));

      list.append($('<div>').prop({class:"input-group mb-3"}).append(
        $('<input>').prop({id:"a"+i,autocomplete:'off',class:"form-control",type:"text"})));
    }

    $('#game').append(list);

    this.started = true;
  }

}
