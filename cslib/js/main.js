window.addEventListener('load', function() {
	test = new rl.canvas.Stage(document.getElementById('stage'))
	test.setWidth(window.innerWidth);
	test.setHeight(window.innerHeight);
	test.onResize = function(evt) {
		test.setWidth(window.innerWidth);
		test.setHeight(window.innerHeight);
	}
	window.addEventListener('resize', test.onResize.bind(test));
	var cont = new rl.canvas.DisplayObjectContainer();
	cont.x = test.width/2;
	cont.y = test.height/2;
	cont.width = 0;
	cont.height = 0;
	cont.draw = function(ctx) {
		var b = this.getBounds();
		ctx.strokeStyle = 'black';
		ctx.strokeRect(b.left - this.x, b.top - this.y, b.width, b.height);
	}
	cont.onResize = function(evt) {
		this.x = test.width / 2;
		this.y = test.height / 2;
	}
	window.addEventListener('resize', cont.onResize.bind(cont));
	test.addChild(cont);
	
	var imgs = [];
	
	files = $.ajax({
		url: "photos.php",
		dataType: 'json',
		success: function(data, status, xhr) {
			var mult = 12;
			for (var i in data) {
				for (var j = 0; j < mult; j++) {
					var img = new classes.CircleImage(data[i], Math.PI * 2 * (i * mult + j) / (data.length * mult));
					imgs.push(img);
					img.addEventListener('click', (function() {
						console.log(this.angle);
						console.log(this.getBounds());
					}).bind(img))
					//test.addChild(img);
					cont.addChild(img);
				}
			}
			console.log(cont.getBounds());
		}
	});
	test.addEventListener('mousedown', function() {
		test._dragging = true;
	});
	test.addEventListener('mouseup', function() {
		test._dragging = false;
	});
	test.addEventListener('mousemove', function(evt) {
		if (test._dragging) {
			for (var i in imgs) {
				imgs[i].updatePosition((evt.mouseX - test.width/2)/(test.width/2), (evt.mouseY - test.height/2)/(test.height/2), Math.sqrt(Math.pow(window.innerWidth/2, 2) + Math.pow(window.innerHeight/2, 2))/2);
			}
		}
	})
	
	setInterval(test.render.bind(test), 1000/30);
	test.render();
});

var classes = {};
classes.CircleImage = function(src, angle) {
	this.init = function() {
		classes.CircleImage.prototype.init.call(this, src);
		this.angle = angle;
		
		this.width = 100;
		this.height = 100;
		this.x = 0;
		this.y = 0;
		
		this.updatePosition(1, 1, 200);
		
		this.hoverState = false;
		
		this.addEventListener('mouseover', this.mouser.bind(this));
		this.addEventListener('mouseout', this.mouser.bind(this));
	}
	
	this.getBounds = function() {
		var tl = this.localToGlobal({x:-this.width/2, y:-this.height/2});
		var br = this.localToGlobal({x:this.width/2, y:this.height/2});
		return {
			top: tl.y,
			bottom: br.y,
			left: tl.x,
			right: br.x,
			width: this.width,
			height: this.height
		}
	}
	
	this.updatePosition = function(sx, sy, radius) {
		this.x = Math.cos(this.angle) * Math.min(radius, Math.max(-radius, radius * sx));
		this.y = Math.sin(this.angle) * Math.min(radius, Math.max(-radius, radius * sy));
	}
	
	this.mouser = function(evt) {
		this.hoverState = evt.type == 'mouseover';
	}
	
	this.draw = function(ctx) {
		ctx.globalAlpha = this.angle / (Math.PI * 2)
		//classes.CircleImage.prototype.draw.call(this, ctx);
		if (this._isLoaded) {
			ctx.drawImage(this.imgFile, -this.width/2, -this.height/2, this.width, this.height);
		}
		if (this.hoverState) {
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 4;
			ctx.strokeRect(-this.width/2,-this.height/2,this.width,this.height);
		}
	}
	
	this.init();
}
classes.CircleImage.prototype = new rl.canvas.Image;
classes.CircleImage.prototype.constructor = classes.CircleImage;

function quickTest() {
	var circle = new rl.canvas.DisplayObjectContainer();
	circle.x = 50
	circle.y = 50
	circle.width = 100;
	circle.height = 100;
	circle.draw = function(ctx) {
		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'black';
		ctx.fillRect(0,0,100, 100);
		ctx.strokeRect(0,0,100,100);
	}
	circle.addEventListener("click", function() {
		console.log('red');
	})
	test.addChild(circle);
	
	var thing = new rl.canvas.DisplayObjectContainer();
	thing.x = 75
	thing.y = 75
	thing.width = 75;
	thing.height = 50;
	thing.draw = function(ctx) {
		ctx.fillStyle = 'blue';
		ctx.fillRect(0,0,this.width, this.height);
	}
	thing.addEventListener("click", function() {
		console.log('blue');
	})
	
	circle.addChild(thing);
	
	var other = new rl.canvas.DisplayObject();
	other.x = 100
	other.y = 100
	other.width = 40;
	other.height = 100;
	other.startDrag = function(evt) {
		this.dragging = true;
		this.dragRef = this.globalToLocal({x:evt.mouseX, y:evt.mouseY});
		test.addEventListener('mousemove', this.drag.bind(this));
	}
	other.drag = function(evt) {
		if (this.dragging) {
			this.x = evt.mouseX - this.dragRef.x;
			this.y = evt.mouseY - this.dragRef.y;
		}
	}
	other.stopDrag = function(evt) {
		this.dragging = false;
		test.removeEventListener('mousemove', this.drag.bind(this));
	}
	other.draw = function(ctx) {
		ctx.fillStyle = 'yellow';
		ctx.strokeStyle = 'black';
		ctx.fillRect(0,0,this.width, this.height);
		ctx.strokeRect(0,0,this.width,this.height);
	}
	other.addEventListener('mousedown', other.startDrag.bind(other));
	//other.addEventListener('mousemove', other.drag.bind(other));
	other.addEventListener('mouseup', other.stopDrag.bind(other));
	other.addEventListener("click", function() {
		console.log('yellow')
	})
	
	test.addChild(other);}
