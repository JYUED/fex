(function($) {

/************************************* animate require ****************************************/

	var prefix = '',
		eventPrefix;
	(function initPrefix() {
		var vendors = {
			Webkit: 'webkit',
			Moz: 'moz',
			Ms: 'ms',
			O: 'o'
		};
		var testEl = document.createElement('div');
		$.each(vendors, function(vendor, event) {
			if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
				prefix = '-' + vendor.toLowerCase() + '-'
				eventPrefix = event
				return false
			} else {
				prefix = '';
			}
		});
	}());

	var TRANSFORM_CSS = prefix + 'transform';
	var TRANSITION_CSS = prefix + 'transition';
	var TRANSITION_END = prefix ? prefix.replace(/\-/g, '') + 'TransitionEnd' : 'transitionEnd';

	var clientWidth = window.innerWidth;
	var clientHeight = window.innerHeight;

	function setPosition(node, endDist) {
		node.style[TRANSFORM_CSS] = 'translate3d(' + endDist + 'px, 0, 0)';
	}

    function addTransitions(node, duration, fn, callback) {
        if (typeof duration !== 'function') {
            duration = duration || '0.5s';
        } else {
            callback = duration;
            duration = '0.5s';
        }

        fn = fn || 'ease-out';
        node.style[TRANSITION_CSS] = TRANSFORM_CSS + ' ' + duration + ' ' + fn;

        node.addEventListener(TRANSITION_END, function() {
            window.setTimeout(function() {
                cleanTransitions(node);
                callback && callback();
            }, 0);
        });
    }

	function cleanTransitions(node) {
		node.style[TRANSITION_CSS] = 'none';
	}

    function optimizeAnimation(content) {
        content.style[prefix + 'backface-visibility'] = 'hidden';
        content.style[prefix + 'transform-style'] = 'preserve-3d';
        content.style[TRANSFORM_CSS] = 'translate3d(0,0,0)';
    }


/************************************* lazyload functions ****************************************/

    /*
    <img data-src="{{pic_url}}">
    <img data-lazyload-src="{{pic_url}}">
    */
    // 延迟加载图像

    function isVisible(nodeBound) {
        return !leftofbound(nodeBound) && !rightofbound(nodeBound) && !topofbound(nodeBound) && !bottomofbound(nodeBound);
    }

    // 分别判断元素在视口的上侧，下侧，左侧，右侧

    function topofbound(nodeBound, scrollTop) {
        // return nodeBound.bottom <= 0;
        return nodeBound.top + nodeBound.height <= scrollTop;
    }

    function bottomofbound(nodeBound, scrollTop) {
        // return nodeBound.top >= clientHeight;
        return nodeBound.top >= scrollTop + clientHeight;
    }

    function leftofbound(nodeBound) {
        // return nodeBound.right <= 0;
        return nodeBound.left + nodeBound.width <= 0;
    }

    function rightofbound(nodeBound, scrollLeft) {
        // return nodeBound.left >= clientWidth;
        return nodeBound.left >= scrollLeft + clientWidth;
    }

    function centerLayout($elem) {
        $elem.css({
            'position': 'relative',
            'left': '50%',
            'top': '50%',
            "-webkit-transform": "translate(-50%, -50%)",
            "-moz-transform": "translate(-50%, -50%)",
            "-ms-transform": "translate(-50%, -50%)",
            "-o-transform": "translate(-50%, -50%)",
            "transform": "translate(-50%, -50%)"
        });
    }

    function loadImg(lazyloadAttr, $imgsWrap, loadCallback) {
        var $img = $(this);
        var img = this;
        var dataSrc = $img.attr(lazyloadAttr);

        if (!dataSrc) return;

        var newImg = new Image();
        newImg.onload = function() {
            $img
            .hide()
            .attr({ src: dataSrc })
            .css({ 'max-width': '100%' })
            .fadeIn()
            .removeAttr(lazyloadAttr);

            img.loaded = true;
            $imgsWrap.data({
                'lazyload-imgs': $($.grep( $imgsWrap.data('lazyload-imgs'), function(img) { return !img.loaded; } ))
            });

            centerLayout($img);
            loadCallback && loadCallback(img);
        }
        newImg.src = dataSrc;
    }

    function handleDefer($wrap, lazyloadAttr, imgLoadCallback, scrollTop) {
        var $imgs = $wrap.data('lazyload-imgs');
        if (!$imgs) {
            $imgs = $wrap.find('img[' + lazyloadAttr + ']');
            $wrap.data({ 'lazyload-imgs': $imgs });
        }
        if (!$imgs.length) return;

        var scrollTop = scrollTop || $(window).scrollTop();

        for (var i = 0, len = $imgs.length; i < len; i++) {
            var imgBound = $imgs.eq(i).offset();
            if (topofbound(imgBound, scrollTop) || leftofbound(imgBound, scrollTop)) {
                // ...
            } else if (!bottomofbound(imgBound, scrollTop) && !rightofbound(imgBound, 0)) {
                loadImg.apply($imgs[i], [lazyloadAttr, $wrap, imgLoadCallback]);
            } else {
                return false;
            }
        }
    }


/************************************* init public variables ****************************************/

	var isSwipe = true,
		panelGap,
		containsNum,
		winWidth,
		panelWidth,
		panelHeight,

		endDist,
        delta = {},
		start = {},
        
		isInitVariables = false;


/************************************* others functions ****************************************/
    
    // 初始化计算图片宽高
    function initPicsCalc($content, $panels, imgSelector, initCallback) {        
        $content
            .css({
                'margin-left': 0,
                'margin-right': 0,
                'width': $content.data('width') + 'px'
            })
            .data({
                'translate-x': 0,
                'panel-length': $panels.length || 0
            });

        $panels.each(function() {
            var panel = this,
                $this = $(this).css({
                    width: panelWidth + 'px',
                    marginLeft: panelGap + 'px',
                    marginRight: '0'
                }),
                $img = $this.find(imgSelector);

            !$img.length && ($img = $this.find('img').first());

            if ($img.length) {
                $('<div class="img-layout"></div>')
                    .append($img)
                    .css({
                        'display': 'inline-block',
                        'vertical-align': 'top',
                        'width': panelWidth + 'px',
                        'height': panelHeight + 'px'
                    })
                    .prependTo(this);
            }
        });
        initCallback && initCallback.apply(null, [$content, $panels]);
    }



/************************************* swipe start ****************************************/

	$.picSwipe = function(options) {
		options = $.extend({
			container: '.swipe-container',
			content: '.swipe-content',
			panel: '.swipe-panel',
			img: 'img.main',
			screenContainNum: 3.5,
			picScale: 3/4,
			lazyloadAttr: 'data-lazyload-src',
			noGap: false,
			panelGap: 5,
            ignoreTwoGap: false,
			load: function() {},

			initCallback: function() {}
		}, options || {});
		
		var $container = $(options.container);
		var $content = $container.find(options.content);
		var $panels = $content.find(options.panel) || $content.children();

        var container = $container[0];
		var content = $content[0];

        var contentWidth;

		if (!isInitVariables) {
			containsNum = Math.ceil(options.screenContainNum);
			winWidth = $(options.container).width() || document.body.clientWidth;
			panelGap = options.noGap ? 0 : parseInt(options.panelGap, 10);
			panelWidth = Math.floor((winWidth - (options.noGap ? 0 : containsNum * panelGap)) / options.screenContainNum);
			panelHeight = Math.floor(panelWidth / options.picScale);
            
			isInitVariables = true;
		}

        contentWidth = parseInt((panelWidth + panelGap) * $panels.length + panelGap, 10);
        contentWidth = options.ignoreTwoGap ? (contentWidth - 2 * panelGap) : contentWidth;

        $content.data('width', contentWidth);
        optimizeAnimation(content);

		function touchStart(e) {
			var touch = e.touches[0];            

			// 屏幕包含的面板不满足可滑动的条件
			if ( $content.data('panel-length') < containsNum ) {
				isSwipe = false;
				return;
			}

			start.x = touch.pageX;
			start.y = touch.pageY;
            start.time = Date.now();

			cleanTransitions(content);
            $container.on('touchmove', touchMove).on('touchend', touchEnd);
		}

		function touchMove(e) {
			var touch = e.touches[0],
				translateX = $content.data('translate-x');

			delta.x = touch.pageX - start.x;
			delta.y = touch.pageY - start.y;

			if (delta.x === 0) return;

			if (Math.abs(delta.y) > Math.abs(delta.x)) {
				isSwipe = false;
				return;
			} else {
				isSwipe = true;
			}

			delta.x = delta.x / 
					( (delta.x > 0 && translateX >= 0 
					  || delta.x < 0 
					  && translateX <= winWidth - contentWidth 
					) ? 
					( Math.abs(delta.x) / winWidth + 1 ) 
					: 1	);

			endDist = translateX + delta.x;

			setPosition(content, endDist);
			handleDefer($content, options.lazyloadAttr, options.load);

			e.preventDefault();
		}

		function touchEnd(e) {
			if (!isSwipe || delta.x === 0) return;

            var isValideSlide = (Date.now() - start.time < 250) && Math.abs(delta.x) > 20;

			if (endDist > 0) {
				
				endDist = 0;
				setPosition(content, endDist);
				addTransitions(content, '0.2s', 'linear');

			} else if (endDist < winWidth - contentWidth) {
				
				endDist = winWidth - contentWidth;
				setPosition(content, winWidth - contentWidth);
				addTransitions(content, '0.2s', 'linear');

			} else if (isValideSlide) {
				if ( endDist === 0 && endDist ===  winWidth - contentWidth) return;

				endDist = endDist + delta.x * 3;
				endDist = endDist > 0 ? 0 : (endDist < winWidth - contentWidth ? winWidth - contentWidth : endDist);
				setPosition(content, endDist);
				addTransitions(content, function(){
                    handleDefer($content, options.lazyloadAttr, options.load);
                });
			}

			$content.data('translate-x', endDist);
			endDist = 0;
            delta = {};
            $container.off('touchmove', touchMove).off('touchend', touchEnd);
		}

        if (!$container.length || !$content.length) return;

        initPicsCalc($content, $panels, options.img, options.initCallback);
		$container.on('touchstart', touchStart);			

		$container.on('picSwipeDefer', function(e, scrollTop) {
			handleDefer($content, options.lazyloadAttr, options.load, scrollTop);
		});
	};
}($));