define(function( require, exports, module ){

	// require('mustache')
	var Mustache = require('mustache');
	require('zepto');

	return function( config ) {
		var fetching = false;
		var $container;
		var totalWidth;
		var columnWidth;
		var itemCount = 0;
		var page = 0;
		var cols_h = [];
		var timeoutId = null;
		var created_at = '';

		// 配置对象
		config = $.extend({
			container: '.waterfall-layout',					// 初始化容器
			htmlTpl: $('#tpl-waterfall-modal').html(),		// mustache模版
			columnNum: 2,									// 列数
			columnGap: 10,									// 列之间的上下左右间距
			requestUrl: $('.waterfall-layout').data('url')	// 请求数据url

		}, config || {});

		$container = $( config.container ).css({ position: 'relative' });

		// 初始化列高
		for ( var i = 0; i < config.columnNum; i++ ) {
			cols_h[i] = 0;
		}

		// 计算列宽
		totalWidth = $container.width();
		columnWidth = ( totalWidth - (config.columnNum + 1) * config.columnGap ) / config.columnNum;
		columnWidth = Math.floor( columnWidth );

		$('.wf-item').css({ position: 'absolute', width: columnWidth + 'px' });

		function handleScroll (e) {
			clearTimeout(timeoutId);
			// 防止浏览器卡死
			timeoutId = setTimeout(function(){
				if ( window.scrollY + 1000 > document.body.offsetHeight ) {
					// get more data
					fetchData();
				}				
			}, 0);
			handleDefer();
		}
		window.addEventListener('scroll', handleScroll, false);

		// 获取数据
		function fetchData() {
			if ( fetching ) {
				return;
			}
			else {
				fetching = true;
			}

			$.ajax({
				url: config.requestUrl,
				dataType: 'json',
				data: {
					// page: ++page,
					created_at: created_at || '',
					action_id: window.action_id && window.action_id || ''
				},
				beforeSend: function(){
					if ( !$('.wf-hint').length ) {
						$container.after('<div class="wf-hint" style="font-size: 14px; text-align: center; padding: 15px 0 10px 0;">数据加载中...</div>');
					}
					else {
						$('.wf-hint').show();
					}
				},
				success: function(res){
					doneFn(res);
				},
				error: function(){
					page--;
					$('.wf-hint').text('网络繁忙，请稍后再试...');
				},
				complete: function(){
					fetching = false;
				}
			});
			
			handleDefer();
		}

		// 获取数组最小项索引
		function getMinIndex( arr ){
			var min = Math.min.apply(null, arr);
			return arr.indexOf(min);
		}

		// 设置图片宽高
		function setImg( img ){
			var $img = $(img),
				w = $img.data('original-width'),
				h = $img.data('original-height'),
				scale = w&&h&&(h/w) || 4/3;

			$img.css({ width: columnWidth + 'px', height: Math.floor( scale * columnWidth ) + 'px' });
		}

		// 设置wf-item容器位置
		function setOffset( node ){
			var $node = $(node),				
				colIndex = $node.data('colIndex');

			$node.css({
				position: 'absolute',
				left: colIndex * columnWidth + config.columnGap * (colIndex + 1),
				top: $node.data('top') + config.columnGap
			});
		}

		function doneFn ( res ) {
			if ( res && res.succ ) {
				var data = res.data;
				var list = data.list;
				created_at = data && data.created_at;
				if ( list.length > 0 ) {
					$('.wf-hint').hide();
					for ( var i = 0, len = list.length; i < len; i++ ) {
						// console.log(Mustache)
						var $renderHtml = $( Mustache.to_html( config.htmlTpl, list[i] ) ).css({ width: columnWidth + 'px' });
						var minColIndex = getMinIndex(cols_h);

						setImg( $renderHtml.find('.img').css({ opacity: 0, transition: 'opacity ease-in .3s' }) );

						itemCount++;
						$renderHtml.data({ index: itemCount-1 });

						$renderHtml.data({ colIndex: minColIndex, top: cols_h[ minColIndex ] });
						setOffset( $renderHtml );

						$renderHtml.appendTo( $container );	// 插入之后才有高度
						cols_h[ minColIndex ] += ($renderHtml.height() + 10);
						$container.css({ height: cols_h[ minColIndex ] + 'px' });
						$renderHtml.find('.img').css({ opacity: 1 });
					}
					handleDefer();					
				}
				else {
					$('.wf-hint').text('没有更多了！');
					window.removeEventListener('scroll', handleScroll, false);
				}
			}
			else {
				$('.wf-hint').text( res.data && res.data.msg || '获取数据失败！');
			}
		}

		// <div class="wf-item">
		// 	<img class="img" data-src="{{pic_url}}">
		// </div>
		// 延迟加载图像
		function isVisible ( node ) {
			var scrollTop = window.scrollY,
				innerHeight = window.innerHeight,
				topViewPort = scrollTop,
				bottomViewPort = scrollTop + innerHeight,

				offTop = $(node).offset().top,
				offsetHeight = node.offsetHeight;

			return offTop + offsetHeight > topViewPort && offTop < bottomViewPort;
		}

		function handleDefer() {
            var list = $('.wf-item:not([deferred=true])');

            for ( var i = 0, len = list.length; i < len; i++ ) {                
                if ( isVisible( list[i] ) ) {
                    var $imgs = $(list[i]).find('.img');
                    for ( var j = 0; j < $imgs.length; j++ ) {
                        var thisImg = $imgs[j];
                        if ( thisImg.src ) {
                            continue;
                        }
                        var src = thisImg.getAttribute('data-src');
                        if ( src ) {
                            thisImg.src = src;
                            thisImg.removeAttribute('data-src');
                            $(list[i]).data('deferred', true);
                        }
                    }
                }
            }
        }

		fetchData();
	}
});