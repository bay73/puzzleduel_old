var start = new Date().getTime();
io = function(){
	return new ioObject();
}
ioObject = function(){
   	this.callbacks = {};
}

ioObject.prototype.on = function(event, callback){
   	this.callbacks[event] = callback;
}

ioObject.prototype.emit = function(event, data){
	console.log(event + ' at ' + (new Date().getTime() - start));
	console.log(data);
	if(this.connection.callbacks[event]){
		var func = this.connection.callbacks[event];
		setTimeout(function(){ func(data);},1);
	}
}

ioObject.prototype.connect = function(to){
    this.connection = to;
    to.connection = this;
    this.emit('connection', to);
}