      function connectRandom(peer, callBack, errorCallback){
         var mainPeerId;
         var signalPeer;
         var signalConnection;
         var signalCreated = false;
         var signalConnected = false;
         var signalReceived = false;
         var mainConnected = false;
         var counter = 0;
         peer.on('open', function(id) {
            mainPeerId = id;
            lookForSignalListener();
         });
         peer.on('connection', function(conn) {
            if(!mainConnected){
               mainConnected = true;
               closeSignalConnection();
               callBack(conn);
            }
         });
         var closeSignalConnection = function(){
            signalCreated = false;
            signalConnected = false;
            signalReceived = false;
            signalPeer.disconnect();
            signalPeer.destroy();
         }
         var lookForSignalListener = function(){
            signalCreated = false;
            signalPeer = new Peer(peer.options);
            signalPeer.on('open', function(id) {
               signalCreated = true;
            });
            setTimeout(
               function(){
                  if(!mainConnected && !signalConnected){
                     closeSignalConnection();
                     listenSignal();
                  }
               }, 3000
            );
            signalConnected = false;
            consolelog('try for next id', 'initial_peer'+counter);
            signalConnection = signalPeer.connect('initial_peer'+counter);
            signalConnection.on('open',
               function() {
                  signalConnected = true;
                  signalConnection.send(mainPeerId);
               }
            );
            signalConnection.on('eroor',
               function(err) {
                  consolelog('connection error', err);
               }
            );
         }

         listenSignal = function(){
            signalCreated = false;
            signalPeer = new Peer('initial_peer'+counter, peer.options);
            signalPeer.on('open', function(id) {
               signalCreated = true;
            });
            signalPeer.on('error', function(err) {
               consolelog('peer 2 error', err);
            });
            setTimeout(
               function(){
                  if(!mainConnected && !signalCreated){
                     closeSignalConnection();
                     if(counter < 20){
                        counter++;
                     }else{
                        counter = 0;
                     }
                     lookForSignalListener();
                  }
               }, 3000
            );
            signalConnected = false;
            signalPeer.on('connection', function(conn) {
               signalConnected = true;
               signalConnection = conn;
               setTimeout(
                  function(){
                     if(!mainConnected && !signalReceived){
                        closeSignalConnection();
                        console.log('Can not receive signal');
                        if (errorCallback)
                           errorCallback();
                     }
                  }, 60000
               );
               signalConnection.on('data',function(data){
                  if(!signalReceived){
                     signalReceived = true;
                     closeSignalConnection();
                     connectMain(data);
                  }
               });
            });
         }
         function connectMain(otherPeerId){
            if(!mainConnected){
               conn = peer.connect(otherPeerId);
               conn.on('open', function() {
                  mainConnected = true;
                  callBack(conn, true);
               });
            }
         }
      }
