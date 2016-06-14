(function($) {
    // var $kzt = $('<div style="position:fixed;bottom:0;left:0;height:100px;width:100%;background-color:rgba(255,255,255,0.8);overflow-y: auto;"><div>');
    // $('body').append( $kzt );
    // function log(text){
    //     $kzt.append( $('<div>'+text+'</div>') );
    // }
    $.waterfall = function(config) {
        var fetching = false,
            $container,
            $elements = $(),
            totalWidth,
            columnWidth,
            itemCount = 0,
            page = 0,
            cols_h = [],
            timeoutId = null,
            created_at = '',
            is_loading_all = false,
            $newPanels = $(),
            noop = function() {},

            // 配置对象
            config = $.extend({
                container: '.waterfall-layout', // 初始化容器
                htmlTpl: $('#tpl-waterfall-modal').html(), // mustache模版
                columnNum: 2, // 列数
                columnGap: 10, // 列之间的上下左右间距
                requestUrl: '', // 请求数据url
                requestType: 'get',
                rotateY: true,
                data_overwrite: false,
                dataParams: {},
                isHasLayout: true,
                isScrollType: true,
                triggerBtn: '',
                renderSuccess: noop,
                renderComplete: noop

            }, config || {});

        $container = $(config.container);
        config.requestUrl = config.requestUrl || $container.data('url') || '';

        if (!config.requestUrl || config.requestUrl === 'undefined') {
            window.console && console.log('请求数据url不存在');
            return;
        }

        if (!$container.length) {
            window.console && console.log('瀑布流缺少初始化容器！');
            return;
        }

        if (config.isHasLayout) {
            $container.html('').css({
                position: 'relative'
            });

            // 初始化列高
            for (var i = 0; i < config.columnNum; i++) {
                cols_h[i] = 0;
            }

            // 计算列宽
            totalWidth = $container.width();
            columnWidth = (totalWidth - (config.columnNum + 1) * config.columnGap) / config.columnNum;
            columnWidth = Math.floor(columnWidth);

            $('.wf-item').css({
                position: 'absolute',
                width: columnWidth + 'px'
            });
        }

        // 获取数据
        var ajaxData = {
            page: 0,
            created_at: created_at || '',
            action_id: window.action_id && window.action_id || ''
        };
        ajaxData = config.data_overwrite ? config.dataParams : $.extend(ajaxData, config.dataParams);

        var lastFetchingTime;

        function fetchData() {
            if (fetching) {
                if( Date.now() - lastFetchingTime > 5000){
                    lastFetchingTime = Date.now();
                    ajaxData.page--;
                    // log('请求超时，重新发送！');
                }else{
                    return;
                }
            } else {
                fetching = true;
                lastFetchingTime = Date.now();
            }

            ajaxData.page++;
            $.ajax({
                type: config.requestType,
                url: config.requestUrl,
                dataType: 'json',
                data: ajaxData,
                beforeSend: function() {
                    if (!$('.wf-hint').length) {
                        $container.after('<div class="wf-hint" style="font-size: 14px; text-align: center; padding: 15px 0 10px 0;">数据加载中...</div>');
                    } else {
                        $('.wf-hint').show();
                    }
                },
                success: function(res) {
                    doneFn(res);
                },
                error: function() {
                    ajaxData.page--;
                    $('.wf-hint').text('网络繁忙，请稍后再试...');
                },
                complete: function() {
                    fetching = false;
                }
            });
        }

        // 获取数组最小项索引
        function getMinIndex(arr) {
            var min = Math.min.apply(null, arr);
            return arr.indexOf(min);
        }

        // 获取数组最大项索引
        function getMaxIndex(arr) {
            var max = Math.max.apply(null, arr);
            return arr.indexOf(max);
        }

        // 设置图片宽高
        function setImg(img) {
            var $img = $(img),
                w = $img.data('original-width'),
                h = $img.data('original-height'),
                scale = w && h && (h / w) || 4 / 3;

            $img.length && $img.css({
                display: 'inline-block',
                width: columnWidth + 'px',
                height: Math.floor(scale * columnWidth) + 'px'
            });
        }

        // 设置wf-item容器位置
        function setPanel(node) {
            var $node = $(node),
                colIndex = $node.data('colIndex');

            $node.css({
                width: columnWidth + 'px',
                position: 'absolute',
                left: colIndex * columnWidth + config.columnGap * (colIndex + 1),
                top: $node.data('top') + config.columnGap
            });
        }

        function doneFn(res) {
            // log('收到第'+(ajaxData.page)+'页数据');
            var data, list, $renderHtml, minColIndex, maxColIndex, bl, $img,
                res = $.isPlainObject(res) ? res : $.parseJSON(res);

            // log('开始解析第'+(ajaxData.page)+'页数据');
            if (res && res.succ) {
                data = res.data;
                list = data && data.list;

                ajaxData.created_at = data && data.created_at || '';

                if (list && list.length > 0) {
                    $('.wf-hint').hide();
                    for (var i = 0, len = list.length; i < len; i++) {
                        if (list[i].type === 'push') {
                            continue;
                        } // h5 移除广告项
                        $renderHtml = $(Mustache.to_html(config.htmlTpl, list[i]));
                        bl = config.isHasLayout && $renderHtml.hasClass('wf-item');

                        if (bl) {
                            $img = $renderHtml.find('.img');
                            $newPanels = $newPanels.add($renderHtml);
                            minColIndex = getMinIndex(cols_h);
                            itemCount++;
                            $renderHtml.data({
                                index: itemCount - 1,
                                colIndex: minColIndex,
                                top: cols_h[minColIndex]
                            });
                            setPanel($renderHtml);
                            setImg($img);
                        }
                        $elements = $elements.add($renderHtml.find('img[data-lazyload-src], img[data-src]'));
                        $renderHtml.appendTo($container); // 插入之后才有高度                 
                        if (bl) {
                            cols_h[minColIndex] += ($renderHtml.height() + config.columnGap);
                            maxColIndex = getMaxIndex(cols_h);
                            $container.css({
                                height: cols_h[maxColIndex] + 'px'
                            });
                        }
                    }
                    // log('插入第'+(ajaxData.page)+'页信息');
                    $newPanels.length ? config.renderSuccess.call($newPanels) : config.renderSuccess();
                    $(window).trigger('scroll');
                } else {
                    $('.wf-hint').text('没有更多了！');
                    // log('完了');
                    is_loading_all = true;
                    ajaxData.page === 1 && config.dataNullCallback && config.dataNullCallback();
                }
            } else {
                $('.wf-hint').text(res.data && res.data.msg || '获取数据失败！');
            }
            config.renderComplete && config.renderComplete();
        }

        function getScreenWidth() {
            var w1 = window.screen.width;
            var w2 = window.innerWidth;
            var w3 = document.documentElement.clientWidth;
            return Math.min(w1, w2, w3);
        }

        function getScreenHeight() {
            var h1 = window.screen.height;
            var h2 = window.innerHeight;
            var h3 = document.documentElement.clientHeight;
            return Math.min(h1, h2, h3);
        }

        /*
        <img data-src="{{pic_url}}">
        <img data-lazyload-src="{{pic_url}}">
        */
        // 延迟加载图像
        function isVisible(node) {
            var scrollTop = window.scrollY,
                innerHeight = getScreenHeight(),

                topViewPort = scrollTop,
                bottomViewPort = scrollTop + innerHeight,
                leftViewPort = 0,
                rightViewPort = getScreenWidth(),

                offset = $(node).offset(),
                offTop = offset.top,
                offLeft = offset.left,

                offsetWidth = node.offsetWidth,
                offsetHeight = node.offsetHeight;

            return (offTop + offsetHeight >= topViewPort && offTop <= bottomViewPort) && (offLeft + offsetWidth >= leftViewPort && offLeft <= rightViewPort);
        }

        function loadImg() {
            var $img = $(this).css({ display: 'inline-block' }),
                dataSrc = $img.data('src') || $img.data('lazyload-src');

            if (!dataSrc) {
                return;
            }
            config.rotateY && $img.css({
                'opacity': 0,
                '-webkit-transform': 'rotateY(45deg)',
                'transform': 'rotateY(45deg)'
            });

            var img = new Image();
            img.onload = function() {
                config.rotateY && $img.attr({
                    src: dataSrc
                }).css({
                    '-webkit-transform': 'rotateY(0)',
                    'transform': 'rotateY(0)',
                    'opacity': 1,
                    'transition': 'all ease-in .25s'
                });
                !config.rotateY && $img.hide().attr({
                    src: dataSrc
                }).fadeIn();

                $img.removeAttr('data-src').removeAttr('data-lazyload-src');
                this.loaded = true;
                $elements = $($.grep($elements, function(img) {
                    return !img.loaded;
                }));
            }
            img.src = dataSrc;
        }

        function handleDefer() {
            for (var i = 0, len = $elements.length; i < len; i++) {
                var thisImg = $elements[i];
                if (isVisible(thisImg)) {
                    loadImg.apply(thisImg);
                }
            }
        }

        function handleScroll(e) {
            handleDefer();
            if (!is_loading_all && config.isScrollType) {
                clearTimeout(timeoutId);
                // 防止浏览器卡死
                timeoutId = setTimeout(function() {
                    if (window.scrollY + 1200 > document.body.offsetHeight) {
                        // get more data
                        fetchData();
                    }
                }, 16);
            }
        }

        fetchData();
        $(window).on('scroll', handleScroll);
        !config.isScrollType && $(config.triggerBtn).on('tap', fetchData);
        return {
            handleScroll: handleScroll
        }
    };        
}($));
