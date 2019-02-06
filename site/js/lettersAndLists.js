
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
  this.score = 0;
  this.recentAnswers = [];
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
  var thisGame = this;
  $('form').submit(function(){
    thisGame.gameRoom.sendToEveryone('chat', gameRoom.name + ": " + $('#m').val());

    $('#m').val('');
    return false;
  });

  this.setHandler('set color', function(from, color){
    // colorNum = parseInt(color);
    console.log(color)
    $('#header').removeClass("bg-secondary playerbg-1  playerbg-2  playerbg-3 playerbg-4 playerbg-5 playerbg-6 playerbg-7 playerbg-8 playerbg-9 playerbg-10")
    $('#header').addClass("playerbg-light-" + color);
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
    this.gameRoom.sendToPlayer(from,'set color',"" + this.players[playerInfo.id].playerIndex);
  });

  this.setHandler('start round', function(from,index) {
    if(!this.isHost) {
    idx = parseInt(index);

    $('#game').empty();
    list = $('<div>').prop({id:'list'});
    for(i=1;i <= 12;i++) {

      list.append($('<label>').text("" + i + ". " + QUESTION_SETS[idx][i-1]).prop({for:'a'+i}));

      list.append($('<div>').prop({class:"input-group mb-3"}).append(
        $('<input>').prop({id:"a"+(i-1),autocomplete:'off',class:"form-control answers",prompt:""+(i-1),type:"text"})));
    }

    $('#game').append(list);
  } else {
    $('#game').empty();
    var seconds = 60*2;
    seconds = 15;
    $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
    countHolder = $('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(seconds);
    $('#game').append(countHolder);

    this.gameRoom.startTimer(seconds);
    this.setHandler('tick timer', function(_, time) {
      countHolder.text(time);
    });
    this.setHandler('finish timer', function(_, __) {
      // TODO: Start scoring I have a whole voting system in mind
      // Step 1 is tell each player to send over answers
      // Step 2 display all ansers for question 1
      // Step 3 people vote and decide if valid answer
      // Step 4 record score and repeat 1-4 for all answer sets
      // Step 5 display scores
      countHolder.text(0);
      this.gameRoom.sendToEveryone('send answers', '')
    });

  }
  });

  this.setHandler('display letter', function(from, letter) {
    if(!this.isHost) {
    $('#game').empty();
    $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
  }
  });

  this.setHandler('player answers', function(from, answers) {
    console.log(answers);
    console.log(this.players)
    console.log(from)
    this.players[from].recentAnswers = JSON.parse(answers);
  })

  this.setHandler('display voting', function(from, answerIndex) {
    // TODO: After each voting ends, call again with the next index until we're done
    // Display for players is https://getbootstrap.com/docs/4.0/components/buttons/#checkbox-and-radio-buttons
    // with the text next to it and only 2 buttons thumbs up and down (already included material ui icons)
    // for each ite,
    // submit button in footer
    // Display for host is each answer for the round with an up/down icon colored for the player that voted that way
    console.log(this.players);
    answers = {};
    players = this.getPlayerList();
    $('#game').empty();
    for (player in this.players) {
      // console.log(player);
      // console.log(this.players);
//       <div class="input-group mb-3">
//   <div class="input-group-prepend">
//     <button class="btn btn-outline-secondary" type="button">Button</button>
//     <button class="btn btn-outline-secondary" type="button">Button</button>
//   </div>
//   <input type="text" class="form-control" placeholder="" aria-label="" aria-describedby="basic-addon1">
// </div>
      console.log(this.players[player].recentAnswers['a'+answerIndex]);
      answers[player] = this.players[player].recentAnswers['a'+answerIndex];
      likesCol = $('<div>').prop({class:'col pt-1'});
      $('#game').append($('<div>').prop({class:'rounded border container'}).append($('<div>').prop({class:'row'}).append(likesCol).append($('<div>').prop({class:'col-6 pt-1'}).append(answers[player]))));
      for (p in this.players) {
        likesCol.append($('<i>').prop({class:'material-icons playercolor-'+this.players[p].playerIndex,id:p}).text('thumbs_up_down'));
      }

    }
    console.log(answers);

  });

  this.getPlayerList = function() {
    players = [];
    for (player in this.players) {
      players.push(player);
    }
  }

  this.clearTimers = function() {
    thisGame.setHandler('tick timer', function(_, time) {
    });
    thisGame.setHandler('finish timer', function(_, __) {
    });
  }


  this.setHandler('send answers', function(from, letter) {
    if(!this.isHost) {
    $('#list').hide();
    $('#game').append($('<div>').prop({class:'display-3 text-center align-middle flex-row align-self-center'}).text("Round over.\nGet ready to score"));
    thisGame = this;
    answers = {};
    $('.answers').each(
      function (){
        // console.log($(this));
        answers[$(this).attr('id')] = $(this).val();
      }
    );
    console.log(answers);
    this.gameRoom.sendToHost("player answers",JSON.stringify(answers));
  } else {
    $('#game').empty();
    $('#game').append($('<div>').prop({class:'display-3 text-center align-middle flex-row align-self-center'}).text("Collecting answers"));
    thisGame = this;
    setTimeout(function() {
      thisGame.gameRoom.sendToHost('display voting', '0');
    },5000);
  }
  });

  this.setup = function() {


    $('#footer').empty();
    $('#header').empty();
    $('#header').text(this.gameRoom.name);

    if(this.isHost == false) {
      console.log("Sending to host")
      this.gameRoom.sendToHost("player join",JSON.stringify({id:this.gameRoom.playerID,name:this.gameRoom.name}));
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
        thisGame.gameRoom.setRoomClosed();
        letter = String.fromCharCode(Math.floor(Math.random() * 26)+65);
        console.log(letter);
        thisGame.setSyncVar('currentLetter', letter);
        thisGame.gameRoom.sendToEveryone('display letter',letter);
        $('#game').empty();
        $('#game').append($('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(letter));
        countHolder = $('<div>').prop({class:'display-2 text-center align-middle flex-row align-self-center'}).text(5);
        $('#game').append(countHolder);

        thisGame.gameRoom.startTimer(5);
        thisGame.setHandler('tick timer', function(_, time) {
          countHolder.text(time);
        });
        thisGame.setHandler('finish timer', function(_, __) {
          countHolder.text(0);
          thisGame.setSyncVar('currentList', "" + (Math.floor(Math.random() * QUESTION_SETS.length)));
          thisGame.gameRoom.sendToEveryone('start round', thisGame.getSyncVar('currentList'));
        });
      });


    }

    this.started = true;
  }

}
