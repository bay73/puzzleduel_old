var BayLayout = function(children, size, className){
	this.children = [];
	if(!className) className='';
	this.element = $('<div class="baylayout ' + className + '">');
	this.element.appendTo($('#board'));
	for(var i in children){
		var div = $('<div class="bayhandler">');
		div.appendTo(this.element);
		var child = children[i];
		child.element.appendTo(div);
		this.children.push(
			{
				element:    div, 
				size: 		size[i],
				content:	child
			}
		);
		this.sumSize += size[i];
	}
};

BayLayout.VERTICAL = 0;	
BayLayout.HORIZONTAL = 1;

BayLayout.isMobile = function(){
    var isMobile = (/iphone|ipod|android|ie|blackberry|fennec/).test
         (navigator.userAgent.toLowerCase());
    return isMobile;
};

BayLayout.prototype.onResize = function(parent){
	var width = parent.innerWidth();
	var height = parent.innerHeight();
	var varea = this.vArea(width,height);
	var harea = this.hArea(width,height);
	var orientation = BayLayout.HORIZONTAL;
	if(varea > harea){
		orientation = BayLayout.VERTICAL;
	}

	this.draw(parent, orientation);
};


BayLayout.prototype.draw = function(parent, orientation){
	var width = parent.innerWidth();
	var height = parent.innerHeight();
	this.element.width(width);
	this.element.height(height);
	var offsite = 0;
	for(var i in this.children){
		var childwidth = width*this.children[i].size/100;
		var childheight = height;
		if(orientation == BayLayout.VERTICAL){
			childwidth = width;
			childheight = height*this.children[i].size/100;
			this.children[i].element.css({left: 0, top: offsite});
			offsite += childheight;
		}else{
			this.children[i].element.css({left: offsite, top: 0});
			offsite += childwidth;
		}
		this.children[i].element.width(childwidth);
		this.children[i].element.height(childheight);
		this.children[i].content.onResize(this.children[i].element);
	}
};


BayLayout.prototype.vArea = function(w,h){
	if(this.children.length === 0){
		return w*h;
	}
	var area = 0;
	for(var i in this.children){
		area += this.children[i].content.Area(w, h*this.children[i].size/100.0);
	}
	return area;
};

BayLayout.prototype.hArea = function(w,h){
	if(this.children.length === 0){
		return w*h;
	}
	var area = 0;
	for(var i in this.children){
		area += this.children[i].content.Area(w*this.children[i].size/100.0, h);
	}
	return area;
};

BayLayout.prototype.Area = function(w,h){
	var varea = this.vArea(w,h);
	var harea = this.hArea(w,h);
	if(varea > harea) return varea;
	else return harea;
};


var BayButton = function(src, title, action){
	this.element = $('<img src="'+src+'" class="baybutton">');
	this.span = $('<span class="baybutton">'+title+'</span>');
	this.element.appendTo($('body'));
	this.span.appendTo($('body'));
	this.element.click(action);
	this.span.click(action);
};

BayButton.prototype.Area = function(w,h){
//	if(BayLayout.isMobile()){
		if(w < h/3){return 3*w*w;}
		else {return h*h/3;}
/*	}else{
		if(w < h*10){return w*w/10;}
		else {return h*h*10;}
	}
*/};

BayButton.prototype.onResize = function(parent){
	var w = parent.innerWidth();
	var h = parent.innerHeight();
//	if(BayLayout.isMobile()){
		if(w < h){
			var d = h - w;
			h = w;
			if(d > h/3) d = h/3;
			this.element.css({'left': 0, 'top': d});
		}
		else {
			w = h;
			this.element.css({'left': 0, 'top': 0});
		}
		if(h > 48) {
			h = 48;
			w = 48;
		}
		this.element.width(w);
		this.element.height(h);
		this.span.hide();
/*	} else {
		if(w < h*8) {h = w / 8;}
		if(h > 48) h = 48;
		w = h;
		this.element.width(w);
		this.element.height(h);
		this.span.appendTo(this.element.parent());
//		this.span.show();
		this.span.width(w*9);
		this.span.height(h);
		this.span.css({'left': h/5, 'top': 0});
		this.span.css({'font-size': 0.9*h});
	}
*/
};

var BayTextPanel = function(relation, className){
	this.relation = relation;
	if(!className) className='';
	this.element = $('<div class="baytext '+className+'">');
	this.element.appendTo($('body'));
};

BayTextPanel.prototype.Area = function(w,h){
	if(w < h*this.relation){return w*w/this.relation;}
	else {return h*h*this.relation;}
};

BayTextPanel.prototype.onResize = function(parent){
	var w = parent.innerWidth();
	var h = parent.innerHeight();
	if(w < h*this.relation){
		h = w/this.relation;
		this.element.css({'left': 0, 'top': 0});
	}
	else {
		w=h*this.relation;
		this.element.css({'left': (parent.innerWidth()-w)/2, 'top': 0});
	}
	this.element.width(w);
	this.element.height(h);
	this.element.html(this.text);
	this.element.css({'font-size': 2*h/3});
};

BayTextPanel.prototype.reDraw = function(){
	this.element.html(this.text);
};