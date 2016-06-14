/**
 *	author :junhua
 *	date   :2015/05/28 
 */

(function($) {

	$.fullscreenSwipe = function(config) {
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

		var TRANSFORM_CSS 	= prefix + 'transform';
		var TRANSITION_CSS 	= prefix + 'transition';
		var TRANSITION_END 	= prefix ? prefix.replace(/\-/g, '') + 'TransitionEnd' : 'transitionEnd';

		function setPosition(node, x, y, z) {
			node.style[TRANSFORM_CSS] = 'translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)';
		}

		function addTransitions(node) {
			node.style[TRANSITION_CSS] = TRANSFORM_CSS + ' ' + config.duration + ' ease-out';

			node.addEventListener(TRANSITION_END, function() {
				window.setTimeout(function() {
					cleanTransitions(node);
					config.scaleEnable && cleanTransform();
				}, 0);
			});
		}

		function cleanTransitions(node) {
			node.style[TRANSITION_CSS] = 'none';
		}

		function cleanTransform() {
			$panels.each(function(_, panel) {
				panel.style[prefix + 'transform'] = 'scale(1) translate3d(0,0,0)';
				panel.style[prefix + 'transition-duration'] = '0s';
				panel.style['z-index'] = '0';
			});
		}

		function getClientWidth() {
            return config.isfullscreen ? Math.min(document.documentElement.clientWidth, 720) : $container.width();
		}

		function getClientHeight() {
			return config.isfullscreen ? document.documentElement.clientHeight : $container.height();
		}

		function setLayout() {
			$container.css({
				'width': winWidth + 'px',
				'height': winHeight + 'px',
				'overflow': 'hidden'
			});

            var styleObj = {
                'width': winWidth + 'px',
                'height': totalHeight + 'px',                
                'overflow': 'visible'
            };

            (config.direction === 'x') && (styleObj = $.extend(styleObj, {
                'width': totalWidth + 'px',
                'height': winHeight + 'px',
                'white-space': 'nowrap',
                'font-size': '0',
            }));

            $content.css(styleObj);
		}

		function setPanels() {
			$panels.each(function(index){
				var styleObj = {
                    'display': 'inline-block',
                    'vertical-align': 'top',
                    'font-size': '12px',
					'width': winWidth + 'px',
					'height': winHeight + 'px',
					'overflow': 'hidden'
				};
				if (config.scaleEnable) {
					styleObj[prefix + 'backface-visibility'] = 'hidden';
					styleObj[prefix + 'transform-style'] = 'preserve-3d';
					styleObj['position'] = 'relative';
				}
				$(this).css(styleObj);
				slideData.push({
					node: this,
					position: {
                        x: -winWidth*index,
                        y: -winHeight*index
                    }
				});
			});
            
            // 重新设置config.lastPanelIfOverflow，如果最后一屏高度小于等于winHeight，重设false
			if (config.lastPanelIfOverflow) {
				$lastPanel.css({ 'overflow': 'auto', '-webkit-overflow-scrolling': 'touch', 'white-space': 'normal' });
				// 必须要有延时，lastPanel.scrollHeight才会重新获取到
				setTimeout(function(){
					lastPanel.scrollHeight <= winHeight && (config.lastPanelIfOverflow = false);
				}, 0);
			}
		}
        
		function touchstart(e) {
			var touch = e.touches && e.touches[0] || e.originalEvent.touches[0];
			touchOffsetX = touch.clientX;
			touchOffsetY = touch.clientY;

			cleanTransitions(content);
			config.scaleEnable && cleanTransform();

			config.touchstart.call(slideNode, e);
		}

		function touchmove(e) {
			var slide = slideNode,
				$slide = $(slideNode),
				touch = e.touches && e.touches[0] || e.originalEvent.touches[0],
				localX = touch.clientX - touchOffsetX,
				localY = touch.clientY - touchOffsetY,
                isLastScroll = false;

			beforeMoveResult = config.beforeMove.call(slide, e, localX, localY);
			if (beforeMoveResult === false) return;

			if (config.lastPanelIfOverflow && lastPanel === slide) {
				if (lastPanel.scrollTop === 0 && localY > 0) {
					isLastScroll = true;
				} else {
					return;
				}
			}

            // 阻止默认行为
            if ((config.direction === 'x' && Math.abs(localX) <= Math.abs(localY)) || 
                (config.direction !== 'x' && Math.abs(localX) >= Math.abs(localY))) {
                !isLastScroll && e.preventDefault();
                return;
            }

			diffX = localX;
			diffY = localY;

			if (config.scaleEnable) {
                if (config.direction !== 'x') {
                    if ( (diffY > 0 && slide === $panels[0]) || (diffY < 0 && slide === lastPanel) ) {
                        cleanTransform();
                    } else {
                        slide.style[TRANSFORM_CSS] = 'scale(' + (1 - 0.2*Math.abs(diffY)/winHeight) + ') translate3d(0, '+ -diffY/2 +'px,0)';
                        if (diffY > 0) {
                            slideData[slideIndex-1].node.style.zIndex = 1;
                        }
                    }
                } else {
                    if ( (diffX > 0 && slide === $panels[0]) || (diffY < 0 && slide === lastPanel) ) {
                        cleanTransform();
                    } else {
                        slide.style[TRANSFORM_CSS] = 'scale(' + (1 - 0.2*Math.abs(diffX)/winWidth) + ') translate3d( ' + -diffX/2 + 'px,0,0)';
                        if (diffX > 0) {
                            slideData[slideIndex-1].node.style.zIndex = 1;
                        }
                    }
                }
			}

            if (config.realtime) {
                var coord = {
                    x: config.direction === 'x' ? translateX + diffX : 0,
                    y: config.direction !== 'x' ? translateY + diffY : 0,
                    z: 0
                }
                setPosition(content, coord.x, coord.y, coord.z);
                config.touchmove.call(slide, e, diffX, diffY);
            }

			e.preventDefault();
		}

		function touchend(e) {
			if ((config.direction === 'x' && diffX === 0) || 
                (config.direction !== 'x' && diffY === 0) || 
                beforeMoveResult === false || 
                config.beforeEnd.call(slide, e) === false) return;

            var slide = slideNode,
                $slide = $(slideNode),
                nextPanel,
                lastSlideIndex = slideIndex,
                slidePercent = (config.direction === 'x') ? (Math.abs(diffX) / winWidth) : (Math.abs(diffY) / winHeight),
                isSlide = slidePercent >= (config.slidePercent ? config.slidePercent : 0.2);

			slideIndex = (( (config.direction === 'x' && diffX > 0) || (config.direction !== 'x' && diffY > 0) ) && isSlide) 
                        ? slideIndex-1 
                        : (isSlide ? slideIndex+1 : slideIndex);

			slideIndex = slideIndex < 0 ? 0 : ( (slideIndex > length-1) ? length-1 : slideIndex );
            translateX = slideData[slideIndex].position.x;
			translateY = slideData[slideIndex].position.y;
			slideNode  = slideData[slideIndex].node;
            
            if (config.scaleEnable) {
                slideNode.style[prefix + 'transition-duration'] = '0.3s'
                slide.style[TRANSFORM_CSS] = 'translate3d(0,0,0)';
            }
            
			var coord = {
                x: config.direction === 'x' ? translateX : 0,
                y: config.direction !== 'x' ? translateY : 0,
                z: 0
            }
            addTransitions(content);
            setPosition(content, coord.x, coord.y, coord.z);

			(lastSlideIndex !== slideIndex) && config.swipeChange.call(slide, e, slideNode);
			config.touchend.call(slide, e);

			diffX = diffY = 0;
		}

		function slideTo(index) {
			if (slideIndex === index || !slideData[index]) return;

			var slide = slideNode;
			cleanTransitions(content);
			config.scaleEnable && cleanTransform();

			slideIndex = index;
			translateX = slideData[slideIndex].position.x;
            translateY = slideData[slideIndex].position.y;
			slideNode  = slideData[slideIndex].node;

            var coord = {
                x: config.direction === 'x' ? translateX : 0,
                y: config.direction !== 'x' ? translateY : 0,
                z: 0
            }
			addTransitions(content);
            setPosition(content, coord.x, coord.y, coord.z);

			config.swipeChange.call(slide, undefined, slideNode);
		}

		function initStyle() {
			content.style[prefix + 'backface-visibility'] = 'hidden';
            // content.style[prefix + 'transform-style'] = 'preserve-3d';
            content.style[TRANSFORM_CSS] = 'translate3d(0,0,0)';
			content.style[prefix + 'transition-timing-function'] = 'ease-out';
		}

		function initComponentProperty() {
			$.extend($.fullscreenSwipe, {
				container   :$container[0],
				content  	:content,
				panels   	:$panels,
				lastPanel   :lastPanel
			});
		}

		function initCode() {
			var panelSelector = config.panel ? config.panel : '.swipe-item';            

			initStyle();
			setLayout();
			setPanels();
			initComponentProperty();
			$container
				.on('touchstart', panelSelector, touchstart)
				.on('touchmove', panelSelector, touchmove)
				.on('touchend', panelSelector, touchend);
		}

		var touchOffsetX,
			touchOffsetY,

			translateX = translateY = diffX = diffY = 0,

			noop = function() {},
			beforeMoveResult = true;

		var config = $.extend({

			container 				:'.fullscreen-swipe-container',
			content 				:'.fullscreen-swipe-content',
			panel                   :'.swipe-item',
            isfullscreen            :true,
            realtime                :true,
			lastPanelIfOverflow 	:true, // 最后一个面板是否溢出
			scaleEnable				:true, // 是否开启缩放

            duration                :'0.3s',
			slidePercent			:0.2,  // 移动屏幕高度的百分比

			touchstart 				:noop, // 在touchstart中执行
			touchmove 				:noop, // 在touchmove中执行
			touchend 				:noop, // 在touchend中执行
			swipeChange				:noop, // 当前面板改变时触发

			beforeMove 				:noop,
			beforeEnd 				:noop

		}, config || {});

		var $container 	= $(config.container),
			$content 	= $container.find(config.content),
			$panels 	= config.panel ? $content.find(config.panel) : $content.children().addClass('swipe-item'),
			$lastPanel 	= $panels.last(),
			length 		= $panels.length,

			content 	= $content[0],
			lastPanel 	= $lastPanel[0],

            winWidth = getClientWidth(),
            winHeight = getClientHeight(),

			totalWidth = winWidth * $panels.length,
            totalHeight = winHeight * $panels.length,

			slideData = [],
			slideIndex = 0,
			slideNode = $panels[0];

		initCode();

		return {
			prev: function() {
				slideTo(slideIndex-1);
			},
			next: function() {
				slideTo(slideIndex+1);
			},
			slide: function(to) {
				slideTo(to);
			}
		};
	};
}($));