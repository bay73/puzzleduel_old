      var GameView = Backbone.View.extend({
         events: {
            "click #connect": "tryConnect",
            "click #ready": "startGame",
            "click #switchlang": "switchLanguage"
         },
         initialize: function(options) {
            translate = translate_ru;
            this.game = options.game;
            self = this;
            $('#connect').button();
            $('#ready').button();
            $('#rules').click(self.showRules);
            sudoku.showFooter('<label id="ruleslink"></label>')
            $('#ruleslink').click(self.showRules);
            $('#connectDialog').dialog({
               title: '',
               autoOpen: false,
               closeOnEscape: false,
               height: 250,
               width: 300,
               modal: true,
               dialogClass: "no-close"
            });
            $('#rulesDialog').dialog({
               title: translate["GameRules"],
               autoOpen: false,
               width: 600,
               modal: true
            });
            $('#name').keyup(function(){
               if($('#name').val()){
                  $('#connect').button('enable');
               }else{
                  $('#connect').button('disable');
               }
            });
            $('#name').blur(function(){
               self.game.set('name', $('#name').val());
            })
            $('#connectDialog').dialog('open');
            this.onChangeState();

            events.on('game:peer_name', this.onChangeState, this);
            events.on('game:changestate', this.onChangeState, this);
         },
         showRules: function() {
            $('#rulesDialog').dialog({title: translate["GameRules"]});
            $('#rulesDialog').dialog('open');
         },
         switchLanguage: function() {
            if(this.lang == 'en'){
               this.lang = 'ru';
               translate = translate_ru;
            }else{
               this.lang = 'en';
               translate = translate_en;
            }
            this.onChangeState();
         },
         onChangeState: function(){
            var state = this.game.get('state');
            $('#info').toggle(state == 'peer_not_found' || state == 'peer_closed' || state == 'win' || state == 'loose' || state == 'draw');
            if(state == 'peer_closed')
               $('#info').text(translate["PeerDisconnected"]);
            else if(state == 'peer_not_found')
               $('#info').text(translate["PeerNotFound"]);
            else if(state == 'win')
               $('#info').text(translate["Win"]);
            else if(state == 'loose')
               $('#info').text(translate["Loose"]);
            else if(state == 'draw')
               $('#info').text(translate["Draw"]);
            $('#name').toggle(state == 'init' || state == 'peer_not_found');
            $('#namelabel').text(translate["AskName"]);
            $('#namelabel').toggle(state == 'init');
            var peerName = this.game.get('peername');
            if(peerName){
               $('#peerName').html(translate["Versus"] + ' : <span id="rivalname">' + this.game.get('peername') + '</span>');
               $('#peerName').show();
            }else{
               $('#peerName').hide();
            }
            $('#connect').button({label: translate["SearchRivals"]});
            $('#connect').toggle(state == 'init' || state == 'peer_not_found' || state == 'look_for_peer' || state == 'peer_closed');
            if(state == 'peer_not_found') $('#connect').button({ label: translate["RepeatSearch"] });
            if(!$('#name').val() || state == 'look_for_peer' ) $('#connect').button('disable');
            else $('#connect').button('enable');
            $('#spinner').toggle(state == 'look_for_peer' || state == 'waiting');
            $('#ready').button({label: translate["Start"]});
            $('#ready').toggle(state == 'connected' || state == 'win' || state == 'loose' || state == 'draw');
            $('#waitingforready').toggle(state == 'waiting' || state == 'ready');
            if(state == 'ready')
               $('#waitingforready').text(translate["StartAt"] + ' ' + this.game.get('counter'));
            else
               $('#waitingforready').text(translate["Waiting"]);
            if(state == 'go')
               $('#connectDialog').dialog('close');
            else if(state == 'peer_closed' || state == 'win' || state == 'loose' || state == 'draw')
               $('#connectDialog').dialog('open');
            $('#rules').text(translate["Rules"]);
            $('#ruleslink').text(translate["Rules"]);
            $('#switchlang').text(translate["SwitchLanguage"]);
            $('#rulesDialog').html(translate["RulesText"])
         },
         tryConnect: function(){
            this.game.findPeer();
         },
         startGame: function(){
            this.game.startGame();
         }
      });

