var rippleButton = function(element, callback){
   $(element).on('click',function(e){
      e.preventDefault();
      var parent = $(element);
      if(parent.find('.ripple-effect').length === 0)
         parent.append('<span class="ripple-effect"></span>');
      var ripple = parent.find('.ripple-effect');
      ripple.removeClass('animate');
      if(!ripple.height() && !ripple.width())
      {
         var d = Math.max(parent.outerWidth(), parent.outerHeight());
         ripple.css({height: d, width: d});
      }
      var x = e.pageX - parent.offset().left - ripple.width()/2;
      var y = e.pageY - parent.offset().top - ripple.height()/2;
      if(parent.attr('data-ripple-color')){
         ripple.css({"background-color": parent.attr('data-ripple-color')});
      }
      ripple.css({top: y+'px', left: x+'px'}).addClass('animate');
      setTimeout(function(){
         ripple.remove();
      },1000);
      if(callback) {
         setTimeout(function(){
            callback(e);
         }, 300);
      }
   });
};

var showDialog = function(element, options){
   $('body').find('.dialog:visible').hide().appendTo('body');

   if($('body').find('.overlay').length === 0)
      $('body').append('<div class="overlay"></div>');
   
   var overlay = $('body').find('.overlay');
   overlay.removeClass('animate');
   $(element).appendTo(overlay);
   $(element).show();
   overlay.addClass('animate');
   var startwidth = $(element).width();
   var startheight = $(element).height();
   var starttop = $(element).offset().top;
   var startleft = $(element).offset().left;
   if(options.start){
      if(options.start.from){
         startwidth = $(options.start.from).width();
         startheight = $(options.start.from).height();
         starttop = $(options.start.from).offset().top;
         startleft = $(options.start.from).offset().left;
      }
      if(typeof(options.start.width) != 'undefined') startwidth = options.start.width;
      if(typeof(options.start.height) != 'undefined') startheight = options.start.height;
      if(typeof(options.start.top) != 'undefined') starttop = options.start.top;
      if(typeof(options.start.left) != 'undefined') startleft = options.start.left;
   }
   $(element).css({
      height: startheight, 
      width: startwidth,
      top: starttop,
      left: startleft
   });
   var endtop = ($(window).height() - options.height)/2;
   var endleft = ($(window).width() - options.width)/2;
   if(options.direction){
      var dirs = options.direction.split('-');
      endtop = starttop;
      endleft = startleft;
      if(dirs[0]=='top') endtop = starttop + startheight - options.height;
      if(dirs[0]=='center') endtop = starttop + (startheight - options.height)/2;
      if(dirs[1]=='left') endleft = startleft + startwidth - options.width;
      if(dirs[1]=='center') endleft = startleft + (startwidth - options.width)/2;
   }
   $(element).animate({
      height: options.height - 20, 
      width: options.width - 20,
      top: endtop,
      left: endleft
   });
};

var closeDialog = function(element, callback){
   if($(element).css('display')!='none'){
      var overlay = $('body').find('.overlay');
      overlay.addClass('animatehide');
      setTimeout(function(){
         $(element).hide();
         $(element).appendTo($('body'));
         overlay.remove();
         if(callback)
            callback();
      }, 400);
   }
};
