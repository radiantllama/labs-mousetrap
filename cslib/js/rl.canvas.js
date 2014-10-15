var rl = rl || {};
rl.canvas = {}

rl.canvas.EventDispatcher = function() {
	this.addEventListener = function(type, cb) {
		if (rl.canvas.EventDispatcher.prototype.USE_NATIVE_EVENTS) {
			this.__eventProxy__.addEventListener(type, cb);
		} else {
			this.__listeners__[type] = this.__listeners__[type] || [];
			this.__listeners__[type].push(cb);
		}
	};
	
	this.removeEventListener = function(type, cb) {
		if (rl.canvas.EventDispatcher.prototype.USE_NATIVE_EVENTS) {
			this.__eventProxy__.removeEventListener(type, cb);
		} else {
			this.__listeners__[type] = this.__listeners__[type] || [];
			if (this.__listeners__[type].indexOf(cb) > -1) {
				this.__listeners__[type].splice(this.__listeners__[type].indexOf(cb), 1);
			}
		}
	};
	
	this.dispatchEvent = function(evt) {
		if (rl.canvas.EventDispatcher.prototype.USE_NATIVE_EVENTS) {
			this.__eventProxy__.dispatchEvent(evt);
		} else {
			if (evt.target == null) {
				evt.target = this;
			}
			evt.currentTarget = this;
			
			var group = this.__listeners__[evt.type] || [];
			var i = group.length;
			while (i--) {
				var callback = group[i];
				if(typeof(callback) == "function") {
					callback(evt);
				}
			}
		}
	};
	
	this.init = function() {
		if (rl.canvas.EventDispatcher.prototype.USE_NATIVE_EVENTS) {
			this.__eventProxy__ = document.createElement('span');
		} else {
			this.__listeners__ = {};
		}
	}
	
	this.init();
}
rl.canvas.EventDispatcher.prototype.USE_NATIVE_EVENTS = !!document.dispatchEvent;

rl.canvas.DisplayObject = function() {
	this.init = function() {
		rl.canvas.DisplayObject.prototype.init.call(this);
		this.__parent__ = null;
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}
	
	this.globalToLocal = function(pt) {
		if (this.__parent__ == null) {
			return {x: pt.x, y: pt.y};
		} else {
			var ppt = this.__parent__.globalToLocal(pt);
			ppt.x -= this.x;
			ppt.y -= this.y;
			return ppt;
		}
	}
	
	this.localToGlobal = function(pt) {
		if (this.__parent__ == null) {
			return {x: pt.x, y: pt.y};
		} else {
			var ppt = this.__parent__.localToGlobal(pt);
			ppt.x += this.x;
			ppt.y += this.y;
			return ppt;
		}
	}
	
	/**
	 * Returns a bounding box relative to the global space
	 */
	this.getBounds = function() {
		var tl = this.localToGlobal({x:0, y:0});
		var br = this.localToGlobal({x:this.width, y:this.height});
		return {
			top: tl.y,
			bottom: br.y,
			left: tl.x,
			right: br.x,
			width: this.width,
			height: this.height
		}
	}
	
	this.hitTestGlobalPoint = function(pt) {
		//Get bounds of global space
		var bounds = this.getBounds();
		return pt.x >= bounds.left && pt.x <= bounds.right && pt.y >= bounds.top && pt.y <= bounds.bottom;
		/*
		var origin = this.localToGlobal({x:0,y:0});
		return pt.x >= origin.x && pt.x <= origin.x + bounds.width && pt.y >= origin.y && pt.y <= origin.y + bounds.height;
		*/
	}
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		this.draw(ctx);
		ctx.restore();
	}
	
	this.draw = function(ctx) {}
	
	this.init();
}
rl.canvas.DisplayObject.prototype = new rl.canvas.EventDispatcher;
rl.canvas.DisplayObject.prototype.constructor = rl.canvas.DisplayObject;


rl.canvas.DisplayObjectContainer = function() {
	this.init = function() {
		rl.canvas.DisplayObjectContainer.prototype.init.call(this);
		this.__children__ = new Array();
	}
	
	this.addChild = function(child) {
		this.__children__.push(child);
		child.__parent__ = this;
	}
	this.removeChild = function(child) {
		this.__children__.splice(this.__children__.indexOf(child), 1);
	}
	
	this.getObjectsUnderPoint = function(pt, tree) {
		tree = tree == undefined ? false : tree;
		
		var objs = new Array();
		if (tree) {
			for (var i in this.__children__) {
				if (this.__children__[i].hitTestGlobalPoint(pt)) {
					var add = {
						elem: this.__children__[i]
					}
					if ('getObjectsUnderPoint' in this.__children__[i]) {
						var c = this.__children__[i].getObjectsUnderPoint(pt, true);
						if (c.length > 0) {
							add.children = c;
						}
					}
					objs.push(add);
				}
			}
		} else {
			for (var i in this.__children__) {
				if (this.__children__[i].hitTestGlobalPoint(pt)) {
					objs.push(this.__children__[i]);
					if ('getObjectsUnderPoint' in this.__children__[i]) {
						objs = objs.concat(this.__children__[i].getObjectsUnderPoint(pt));
					}
				}
			}
		}
		return objs;
	}
	
	this.getFlatDisplayTree = function() {
		var ret = new Array();
		for (var i in this.__children__) {
			ret.push(this.__children__[i]);
			if ('getFlatDisplayTree' in this.__children__[i]) {
				ret = ret.concat(this.__children__[i].getFlatDisplayTree())
			}
		}
		return ret;
	}
	
	this.getBounds = function() {
		var bounds = rl.canvas.DisplayObjectContainer.prototype.getBounds.call(this);
		var out = rl.canvas.DisplayObjectContainer.prototype.getBounds.call(this);
		
		var maxRight = bounds.right;
		var maxBot = bounds.bottom;
		
		for (var i in this.__children__) {
			var cb = this.__children__[i].getBounds();
			out.top = Math.min(out.top, cb.top);
			out.left = Math.min(out.left, cb.left);
			out.right = Math.max(out.right, cb.right);
			out.bottom = Math.max(out.bottom, cb.bottom);
		}
		out.width = out.right - out.left;
		out.height = out.bottom - out.top;
		return out;
	}
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		
		//draw self
		ctx.save();
		this.draw(ctx);
		ctx.restore();
		
		//render children
		for (var i in this.__children__) {
			this.__children__[i].render(ctx);
		}
		
		ctx.restore();
	}
	
	this.init();
}
rl.canvas.DisplayObjectContainer.prototype = new rl.canvas.DisplayObject;
rl.canvas.DisplayObjectContainer.prototype.constructor = rl.canvas.DisplayObjectContainer;

rl.canvas.Stage = function(htmlCanvas) {
	this.setWidth = function(w) {
		this.canvas.width = w;
		this.width = w;
	}
	this.setHeight = function(h) {
		this.canvas.height = h;
		this.height = h;
	}
	
	this.init = function() {
		rl.canvas.Stage.prototype.init.call(this);
		this.canvas = htmlCanvas;
		this.ctx = this.canvas.getContext('2d');
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		
		this.__lastMouseOrder__ = new Array();
		
		this.canvas.addEventListener('click', this.__mouser__.bind(this));
		this.canvas.addEventListener('mousemove', this.__mouser__.bind(this));
		this.canvas.addEventListener('mousedown', this.__mouser__.bind(this));
		this.canvas.addEventListener('mouseup', this.__mouser__.bind(this));
		this.canvas.addEventListener('mouseout', this.__mouser__.bind(this));
	}
	
	this.__getMouseCoordinates__ = function(evt) {
		//console.log(evt);
		if (evt.offsetX && evt.offsetY) {
			return {x: evt.offsetX, y: evt.offsetY};
		} else {
			//Get the client position, and adjust for scrolling
			var pt = {
				x: evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
				y:evt.clientY + document.body.scrollTop + document.documentElement.scrollTop
			};
			//Adjust for element offset
			//TODO: remove jQuery dependency
			pt.x -= jQuery(this.canvas).offset().left;
			pt.y -= jQuery(this.canvas).offset().top;
			
			return pt;
		}
	}
	
	this.__mouser__ = function(evt) {
		var type = evt.type == 'mouseout' ? 'mouseup' : evt.type;
		var pt = this.__getMouseCoordinates__(evt);
		var targets = this.getObjectsUnderPoint(pt, true);
		var order = new Array();
		order.push(this);
		
		var set = targets.length > 0 ? targets[targets.length - 1] : null;
		while (set != null) {
			order.push(set.elem);
			set = set.children ? set.children[set.children.length - 1] : null;
		}
		
		for (var i in order) {
			var dispEvt = document.createEvent('MouseEvents');
			dispEvt.initMouseEvent(evt.type, true, true, window, evt.type == 'click' || evt.type == 'mouseup' ? 1 : 0, evt.screenX, evt.screenY, evt.clientX, evt.clientY, false, false, false, false, 0, null);
			dispEvt.mouseX = pt.x;
			dispEvt.mouseY = pt.y;
			order[i].dispatchEvent(dispEvt);
			if (this.__lastMouseOrder__.indexOf(order[i]) == -1) {
				dispEvt = document.createEvent('MouseEvents');
				dispEvt.initMouseEvent('mouseover', true, true, window, 0, evt.screenX, evt.screenY, evt.clientX, evt.clientY, false, false, false, false, 0, null);
				dispEvt.mouseX = pt.x;
				dispEvt.mouseY = pt.y;
				order[i].dispatchEvent(dispEvt);
			}
		}
		for (i in this.__lastMouseOrder__) {
			if (order.indexOf(this.__lastMouseOrder__[i]) == -1) {
				dispEvt = document.createEvent('MouseEvents');
				dispEvt.initMouseEvent('mouseout', true, true, window, 0, evt.screenX, evt.screenY, evt.clientX, evt.clientY, false, false, false, false, 0, null)
				dispEvt.mouseX = pt.x;
				dispEvt.mouseY = pt.y;
				this.__lastMouseOrder__[i].dispatchEvent(dispEvt);
			}
		}
		
		this.__lastMouseOrder__ = order;
	}
	
	this.render = function() {
		this.ctx.clearRect(0,0,this.width, this.height);
		rl.canvas.Stage.prototype.render.call(this, this.ctx);
	}
	
	this.init();
}
rl.canvas.Stage.prototype = new rl.canvas.DisplayObjectContainer;
rl.canvas.Stage.prototype.constructor = rl.canvas.Stage;

rl.canvas.Image = function() {
	this.init = function(src) {
		rl.canvas.Image.prototype.init.call(this);
		this._isLoaded = false;
		if (src != null) {
			this.imgFile = new Image();
			this.imgFile.addEventListener('load', this.onFileLoad.bind(this));
			this.imgFile.src = src;
		}
	}
	
	this.onFileLoad = function(evt) {
		this._isLoaded = true;
		this.srcWidth = this.imgFile.width;
		this.srcHeight = this.imgFile.height;
	}
	
	this.draw = function(ctx) {
		if (this._isLoaded) {
			ctx.drawImage(this.imgFile, 0, 0, this.width, this.height);
		}
	}
	
	this.init(null);
}
rl.canvas.Image.prototype = new rl.canvas.DisplayObject;
rl.canvas.Image.prototype.constructor = rl.canvas.Image;
