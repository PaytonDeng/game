Snowflakes = (function() {
	var snowflakes = [],
		snowflakesDefaultCount = 1000,
		snowflakeSprites = [],
		spritesCount = 9,
		spriteWidth = 20,
		spriteHeight = 20,
		bounds = {
			width: $(window).width(),
			height: $(window).height()
		}, minVerticalVelocity = 1,
		maxVerticalVelocity = 4,
		minHorizontalVelocity = -1,
		maxHorizontalVelocity = 3,
		minScale = 0.2,
		maxScale = 1.25,
		minHorizontalDelta = 2,
		maxHorizontalDelta = 3,
		minOpacity = 0.2,
		maxOpacity = 0.9,
		maxOpacityIncrement = 50,
		speedFactor = 1;

	function generate(number, add) {
		var ii = 0,
			sfShapes = ['\u2745', '\u2744', '\u2745', '\u2745', '\u2745', '\u2745', '\u2745', '\u2746', '\u2745'];
		for (ii = 0; ii < spritesCount; ii++) {
			var sprite = $('<canvas/>', {
				width: spriteWidth,
				height: spriteHeight
			}).get(0),
				context = sprite.getContext('2d');
			context.fillStyle = 'white';
			context.font = 'normal 27px sans-serif';
			context.textBaseline = 'bottom';
			context.fillText(sfShapes[ii], -2, 24);
			snowflakeSprites.push(sprite);
		}
		if (number) {
			snowflakesDefaultCount = number;
		}
		if (!add) {
			snowflakes = [];
		}
		for (ii = 0; ii < snowflakesDefaultCount; ii++) {
			snowflakes.push(generateSnowflake());
		}
	}

	function generateSnowflake() {
		var scale = Math.random() * (maxScale - minScale) + minScale;
		return {
			x: Math.random() * bounds.width,
			y: Math.random() * bounds.height,
			vv: Math.random() * (maxVerticalVelocity - minVerticalVelocity) + minVerticalVelocity,
			hv: Math.random() * (maxHorizontalVelocity - minHorizontalVelocity) + minHorizontalVelocity,
			sw: scale * spriteWidth,
			sh: scale * spriteHeight,
			mhd: Math.random() * (maxHorizontalDelta - minHorizontalDelta) + minHorizontalDelta,
			hd: 0,
			hdi: Math.random() / (maxHorizontalVelocity * minHorizontalDelta),
			o: Math.random() * (maxOpacity - minOpacity) + minOpacity,
			oi: Math.random() / maxOpacityIncrement,
			si: Math.ceil(Math.random() * (spritesCount - 1))
		}
	}

	function advanceSnowFlakes() {
		var ii = 0,
			sfCount = snowflakes.length;
		for (ii = 0; ii < sfCount; ii++) {
			var sf = snowflakes[ii];
			sf.y += sf.vv * speedFactor;
			sf.x += (sf.hd + sf.hv) * speedFactor;
			sf.hd += sf.hdi;
			if (sf.hd < -sf.mhd || sf.hd > sf.mhd) {
				sf.hdi = -sf.hdi;
			};
			sf.o += sf.oi;
			if (sf.o > maxOpacity || sf.o < minOpacity) {
				sf.oi = -sf.oi
			};
			if (sf.o > maxOpacity) sf.o = maxOpacity;
			if (sf.o < minOpacity) sf.o = minOpacity;
			if (sf.y > bounds.height + spriteHeight / 2) {
				sf.y = 0
			};
			if (sf.y < 0) {
				sf.y = bounds.height
			};
			if (sf.x > bounds.width + spriteWidth / 2) {
				sf.x = 0
			};
			if (sf.x < 0) {
				sf.x = bounds.width
			};
		}
	}

	function renderFrame(context) {
		var ii = 0,
			sfCount = snowflakes.length;
		advanceSnowFlakes();
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		for (ii = 0; ii < sfCount; ii++) {
			var sf = snowflakes[ii];
			context.globalAlpha = sf.o;
			context.drawImage(snowflakeSprites[sf.si], 0, 0, spriteWidth, spriteHeight, sf.x, sf.y, sf.sw, sf.sh);
		}
	}

	function updateBounds() {
		bounds.width = $(window).width();
		bounds.height = $(window).height();
	}
	return {
		"generate": generate,
		"render": renderFrame,
		"updateBounds": updateBounds
	}
})(jQuery);

Animation = (function() {
	var frameRenderersCollection = [],
		renderContextesCollection = [],
		isRunning = false,
		animationCallback, minInterval = 16.7,
		avgTime = 0,
		trackFrames = 60,
		frameCounter = 0;

	function addFrameRenderer(frameRender, renderContext) {
		if (frameRender && typeof(frameRender) === "function") {
			frameRenderersCollection.push(frameRender);
			renderContextesCollection.push(renderContext);
		}
	}

	function getRequestAnimationFrame(code) {
		if (window.requestAnimationFrame) {
			return window.requestAnimationFrame(code);
		} else if (window.msRequestAnimationFrame) {
			return window.msRequestAnimationFrame(code);
		} else if (window.webkitRequestAnimationFrame) {
			return window.webkitRequestAnimationFrame(code);
		} else if (window.mozRequestAnimationFrame) {
			return window.mozRequestAnimationFrame(code);
		} else if (window.oRequestAnimationFrame) {
			return window.oRequestAnimationFrame(code);
		} else {
			return setTimeout(code, minInterval);
		}
	}

	function frameRenderCore() {
		var ii = 0,
			startDate = new Date();
		for (ii = 0; ii < frameRenderersCollection.length; ii++) {
			if (frameRenderersCollection[ii]) {
				frameRenderersCollection[ii](renderContextesCollection[ii]);
			}
		}
		if (isRunning) {
			animationCallback = getRequestAnimationFrame(frameRenderCore);
		}
		var endDate = new Date(),
			duration = (endDate - startDate);
		avgTime += duration;
		frameCounter++;
		if (frameCounter >= trackFrames) {
			avgTime = avgTime / trackFrames;
			var avgFps = Math.floor(1000 / avgTime);
			if (avgFps > 60) avgFps = 60;
			avgTime = 0;
			frameCounter = 0;
		}
	}

	function start() {
		if (isRunning) return;
		animationCallback = getRequestAnimationFrame(frameRenderCore);
		isRunning = true;
	}
	return {
		"addFrameRenderer": addFrameRenderer,
		"start": start,
		"getRequestAnimationFrame": getRequestAnimationFrame
	}
})(jQuery);

$(function() {
	var snowflakesCanvas = $('#snowflakesCanvas').get(0);
	snowflakesContext = snowflakesCanvas.getContext('2d');

	function resizeCanvasElements() {
		Snowflakes.updateBounds();
		snowflakesCanvas.width = $(window).width();
		snowflakesCanvas.height = $(window).height();
	}
	Snowflakes.generate(80);
	resizeCanvasElements();
	Animation.addFrameRenderer(Snowflakes.render, snowflakesContext);
	Animation.start();
	$(window).resize(function() {
		resizeCanvasElements();
	});
});

jQuery.easing['jswing'] = jQuery.easing['swing'];
jQuery.extend(jQuery.easing, {
	def: 'easeOutQuad',
	swing: function(x, t, b, c, d) {
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function(x, t, b, c, d) {
		return c * (t /= d) * t + b;
	},
	easeOutQuad: function(x, t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	easeInOutQuad: function(x, t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t + b;
		return -c / 2 * ((--t) * (t - 2) - 1) + b;
	},
	easeInCubic: function(x, t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},
	easeOutCubic: function(x, t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	easeInOutCubic: function(x, t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
		return c / 2 * ((t -= 2) * t * t + 2) + b;
	},
	easeInQuart: function(x, t, b, c, d) {
		return c * (t /= d) * t * t * t + b;
	},
	easeOutQuart: function(x, t, b, c, d) {
		return -c * ((t = t / d - 1) * t * t * t - 1) + b;
	},
	easeInOutQuart: function(x, t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
		return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
	},
	easeInQuint: function(x, t, b, c, d) {
		return c * (t /= d) * t * t * t * t + b;
	},
	easeOutQuint: function(x, t, b, c, d) {
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
	},
	easeInOutQuint: function(x, t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
		return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
	},
	easeInSine: function(x, t, b, c, d) {
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
	},
	easeOutSine: function(x, t, b, c, d) {
		return c * Math.sin(t / d * (Math.PI / 2)) + b;
	},
	easeInOutSine: function(x, t, b, c, d) {
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
	},
	easeInExpo: function(x, t, b, c, d) {
		return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
	},
	easeOutExpo: function(x, t, b, c, d) {
		return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
	},
	easeInOutExpo: function(x, t, b, c, d) {
		if (t == 0) return b;
		if (t == d) return b + c;
		if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
		return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function(x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
	},
	easeOutCirc: function(x, t, b, c, d) {
		return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
	},
	easeInOutCirc: function(x, t, b, c, d) {
		if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
		return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
	},
	easeInElastic: function(x, t, b, c, d) {
		var s = 1.70158;
		var p = 0;
		var a = c;
		if (t == 0) return b;
		if ((t /= d) == 1) return b + c;
		if (!p) p = d * .3;
		if (a < Math.abs(c)) {
			a = c;
			var s = p / 4;
		} else var s = p / (2 * Math.PI) * Math.asin(c / a);
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	easeOutElastic: function(x, t, b, c, d) {
		var s = 1.70158;
		var p = 0;
		var a = c;
		if (t == 0) return b;
		if ((t /= d) == 1) return b + c;
		if (!p) p = d * .3;
		if (a < Math.abs(c)) {
			a = c;
			var s = p / 4;
		} else var s = p / (2 * Math.PI) * Math.asin(c / a);
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
	},
	easeInOutElastic: function(x, t, b, c, d) {
		var s = 1.70158;
		var p = 0;
		var a = c;
		if (t == 0) return b;
		if ((t /= d / 2) == 2) return b + c;
		if (!p) p = d * (.3 * 1.5);
		if (a < Math.abs(c)) {
			a = c;
			var s = p / 4;
		} else var s = p / (2 * Math.PI) * Math.asin(c / a); if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
	},
	easeInBack: function(x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	},
	easeOutBack: function(x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	},
	easeInOutBack: function(x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
		return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
	},
	easeInBounce: function(x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
	},
	easeOutBounce: function(x, t, b, c, d) {
		if ((t /= d) < (1 / 2.75)) {
			return c * (7.5625 * t * t) + b;
		} else if (t < (2 / 2.75)) {
			return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
		} else if (t < (2.5 / 2.75)) {
			return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
		} else {
			return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
		}
	},
	easeInOutBounce: function(x, t, b, c, d) {
		if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
	}
});