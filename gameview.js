      var GameView = Backbone.View.extend({
         events: {
            "click #connect": "tryConnect",
            "click #ready": "startGame"
         },
         initialize: function(options) {
            this.game = options.game;
            self = this;
            $('#connect').button();
            $('#ready').button();
            $('#connectDialog').dialog({
               title: "Выбор соперника",
               autoOpen: false,
               closeOnEscape: false,
               height: 220,
               width: 280,
               modal: true,
               dialogClass: "no-close"
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

            events.on('game:peer_name', this.setPeerName, this);
            events.on('game:changestate', this.onChangeState, this);
         },
         setPeerName: function() {
            this.$('#peerName').text('Ваш соперник - ' + this.game.get('peername'));
            this.onChangeState();
         },
         onChangeState: function(){
            var state = this.game.get('state');
            consolelog('state='+state);
            $('#peerNotFound').toggle(state == 'peer_not_found' || state == 'peer_closed');
            if(state == 'peer_closed')
               $('#peerNotFound').text('Соперник отлючился. Можно найти нового');
            else
               $('#peerNotFound').text('Соперника найти не удалось');
            $('#name').toggle(state == 'init' || state == 'peer_not_found');
            $('#namelabel').toggle(state == 'init');
            $('#peerName').toggle(this.game.get('peername') != '');
            $('#connect').toggle(state == 'init' || state == 'peer_not_found' || state == 'look_for_peer' || state == 'peer_closed');
            if(state == 'peer_not_found') $('#connect').button({ label: "Повторный поиск" });
            if(!$('#name').val() || state == 'look_for_peer' ) $('#connect').button('disable');
            else $('#connect').button('enable');
            $('#spinner').toggle(state == 'look_for_peer' || state == 'waiting');
            $('#ready').toggle(state == 'connected');
            $('#waitingforready').toggle(state == 'waiting' || state == 'ready');
            if(state == 'ready')
               $('#waitingforready').text('Начало через ' + this.game.get('counter'));
            else
               $('#waitingforready').text('Ожидаем готовности соперника');
            if(state == 'go')
               $('#connectDialog').dialog('close');
            else if(state == 'peer_closed')
               $('#connectDialog').dialog('open');
         },
         tryConnect: function(){
            this.game.findPeer();
         },
         startGame: function(){
            this.game.startGame();
         }
      });

