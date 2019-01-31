
QUESTION_SETS = [
  [
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
  ],
  [
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
    "A",
    "B",
    "C",
  ]
]

function PlayerObject(name,id,playerIndex) {
  this.name = name;
  this.id = id;
  this.playerIndex = playerIndex;
}

function Game(gameRoom) {
  console.log(gameRoom);

  gameBase.call(this,gameRoom);

  this.players = {};

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
    this.sendToEveryone('chat', gameRoom.name + ": " + $('#m').val());

    $('#m').val('');
    return false;
  });

  this.setHandler('set color', function(from, color){
    // colorNum = parseInt(color);
    console.log(color)
    $('#header').removeClass("bg-secondary playerbg-1  playerbg-2  playerbg-3 playerbg-4 playerbg-5 playerbg-6 playerbg-7 playerbg-8 playerbg-9 playerbg-10")
    $('#header').addClass("playerbg-" + color);
  })

  this.setHandler('player join',function(from, data){
    playerInfo = JSON.parse(data);
    console.log(playerInfo);
    console.log(from);
    if(!this.players.hasOwnProperty(playerInfo.id)){
      this.players[playerInfo.id] = new PlayerObject(playerInfo.name, playerInfo.id,Object.keys(this.players).length+1);
    }

    // TODO: This will give players unique colors
    // Fix send to player
    // this.sendToPlayer(from,'set color',this.players[playerInfo.id].playerIndex);
  });

  this.setHandler('start round', function(from,index) {
    if(!this.isHost) {
    idx = parseInt(index);

    $('#game').empty();
    list = $('<div>');
    for(i=1;i <= 12;i++) {

      list.append($('<label>').text("" + i + ". " + QUESTION_SETS[idx][i]).prop({for:'a'+i}));

      list.append($('<div>').prop({class:"input-group mb-3"}).append(
        $('<input>').prop({id:"a"+i,autocomplete:'off',class:"form-control",type:"text"})));
    }

    $('#game').append(list);
  } else {
    $('#game').empty();
    i = 60*2;
    $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
    countHolder = $('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(i);
    $('#game').append(countHolder);
    countdown = setInterval(function() {
      if(--i == -1) {
        clearInterval(countdown);
        // TODO: Start scoring I have a whole voting system in mind
        // Step 1 is tell each player to send over answers
        // Step 2 display all ansers for question 1
        // Step 3 people vote and decide if valid answer
        // Step 4 record score and repeat 1-4 for all answer sets
        // Step 5 display scores
        thisGame.sendToEveryone('start round', "" + (Math.floor(Math.random() * QUESTION_SETS.length)))
      } else {
        countHolder.text(i);
      }
    },1000);
  }
  });

  this.setHandler('display letter', function(from, letter) {
    if(!this.isHost) {
    $('#game').empty();
    $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
  }
  });


  this.setup = function() {


    // $('#footer').empty();
    $('#header').empty();
    $('#header').text(this.gameRoom.name);

    if(this.isHost == false) {
      console.log("Sending to host")
      this.sendToHost("player join",JSON.stringify({id:this.gameRoom.playerID,name:this.gameRoom.name}));
      $('#game').empty();
      $('#game').append($('<div>').prop({class:'display-2 text-center align-middle  align-self-center'}).text('Waiting on host...'))
    } else {
      $('#game').empty();
      $('#game').addClass('align-items-middle');
      $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text('Waiting for players'));
      startButton = $('<button>').prop({class:'btn btn-primary btn-lg btn-block flex-row align-self-center mt-3'}).text('Start');
      $('#game').append(startButton);

      thisGame = this

      startButton.click(function() {
        letter = String.fromCharCode(Math.floor(Math.random() * 26)+65);
        console.log(letter);
        thisGame.setSyncVar('currentLetter', letter);
        thisGame.sendToEveryone('display letter',letter);
        $('#game').empty();
        $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
        countHolder = $('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(5);
        $('#game').append(countHolder);
        i = 5;
        countdown = setInterval(function() {
          if(--i == -1) {
            clearInterval(countdown);
            thisGame.sendToEveryone('start round', "" + (Math.floor(Math.random() * QUESTION_SETS.length)))
          } else {
            countHolder.text(i);
          }
        },1000);
      });


    }

    this.started = true;
  }

}
