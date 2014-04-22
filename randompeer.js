      function connectRandom(peer, callBack, errorCallback){
         var mainPeerId;
         var signalPeer;
         var signalConnection;
         var signalCreated = false;
         var signalConnected = false;
         var signalReceived = false;
         var mainConnected = false;
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
            signalConnection = signalPeer.connect('initial_peer');
            signalConnection.on('open',
               function() {
                  signalConnected = true;
                  signalConnection.send(mainPeerId);
               }
            );
         }

         listenSignal = function(){
            signalCreated = false;
            signalPeer = new Peer('initial_peer', peer.options);
            signalPeer.on('open', function(id) {
               signalCreated = true;
            });
            setTimeout(
               function(){
                  if(!mainConnected && !signalCreated){
                     closeSignalConnection();
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
                  }, 20000
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
