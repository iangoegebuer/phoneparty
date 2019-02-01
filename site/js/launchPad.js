
GAMES_LIST = [
  {path:'site/js/launchPad.js',name:'Launch Pad'},
  {path:'site/js/lettersAndLists.js',name:'Letters and Lists'}
]


function Game(gameRoom) {
  console.log(gameRoom);

  gameBase.call(this,gameRoom);

  this.gameVariables['script'] = 'site/js/launchPad.js';

  this.setHandler('chat',function(from, msg) {
    this.messages.append($('<li>').text(msg));
  });
  /*
  this.setHandler('set playerID',function(id) {
  console.log(id);
  $('#nameheader').text('Name: ' + this.gameRoom.name + ' (playerID: ' + this.gameRoom.playerID + ')');
});
*/

console.log($('form'));



$('form').submit(function(){

  this.gameRoom.sendToEveryone("chat", gameRoom.name + ": " + $('#m').val());

  $('#m').val('');
  return false;
});

this.setup = function() {

  this.form = $('<form>').prop({action:"javascript:void(0);"});
  this.messageBox = $('<input>').prop({id:'m',autocomplete:"off",class:"form-control"});
  this.messages = $('<ul>').prop({id:"messages"});
  $('#game').append(this.messages);
  //this.form.append(this.messages);
  this.form.append($('<div>').prop({class:"form-group"}).append(
    $('<div>').prop({class:"input-group mb-3"}).append(this.messageBox).append(
      $('<div>').prop({class:"input-group-append"}).append(
        $('<button>').prop({class:"btn btn-primary",type:"button"}).text('Send'))
      )));

      $('#footer').empty();
      $('#footer').append($('<div>').prop({class:"flex-row w-100"}).append(this.form));


      thisGame = this;


      if(this.isHost) {

        startButton = $('<button>').prop({type:"button",class:"btn btn-secondary"}).text("Start");
        selectGroup = $('<select>').prop({class:"custom-select",id:"gameSelect"});
        selectGroup.append($('<option>').prop({selected:''}).text("Choose game..."));
        GAMES_LIST.forEach(function(element) {
          selectGroup.append($('<option>').prop({value:element.path}).text(element.name));
        });

        this.selectGroup = selectGroup;

        $('#footer').append(
          $('<div>').prop({class:"flex-row"}).append(
            $('<div>').prop({class:"input-group"}).append(this.selectGroup).append(
              $('<div>').prop({class:'input-group-append'}).append(startButton)
            ))
          );

          startButton.click(function() {
            console.log(thisGame.selectGroup.val());
            thisGame.setSyncVar('script', thisGame.selectGroup.val());
          });

        }

        this.form.submit(function(){

          thisGame.gameRoom.sendToEveryone('chat', thisGame.gameRoom.name +
          ": " + thisGame.messageBox.val());

          thisGame.messageBox.val('');
          return false;
        });

        $('#header').empty();
        $('#header').text(this.gameRoom.name);

        this.started = true;
      }

    }
