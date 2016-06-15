/** 
 * 依赖jQuery
 * debug 模式：
 * 埋在 App.debug        X
 * 埋在 DEFAULT.debug    可行
 * 埋在 window.debug     可行
 
 * 存在问题
 * js埋统计  异步HTML统计  HTML埋点统计  回调统计
 * jy统计少了页面来源，导致jy统计还是费不少人力
 */
(function () {
    // google analytic
    // http://gold.xitu.io/entry/56c9122599a6ce005afae299
    window.GoogleAnalyticsObject = 'ga';
    window.ga = window.ga || function () { (ga.q = ga.q || []).push(arguments) };
    ga.l = +new Date;
    ga('create', 'UA-31710355-3', 'auto');
    ga('send', 'pageview');
    $.getScript('//res.jiuyan.info/lib/google-analytics/analytics.js');

    // http://www.webdevs.cn/article/83.html
    ['log', 'info', 'warn', 'error'].forEach(function(key) {
        var rub = console[key].bind(console);
        console[key] = function() {
            if (window.isDev) {
                alert(arguments[0])
            }
            rub.apply(console, arguments);
        }
    });

    var inRegex = /^in:\/\//,
        domainRegex = /www\.(in66)\.com/,
        defaultSchemes = 'in://main',
        analyticUrl = 'http://stats1.jiuyan.info/onepiece/',
        wxSdkSign = 'http://www.in66.com/promo/music/getweixinsignature',
        context = {},
        os = browser();

    /*********************************
     *                               *
     *                               *
     *       Tool Handle Unit        *
     *                               *
     *                               *
     *********************************/
    /**
     * js埋统计  异步HTML统计  HTML埋点统计  回调统计
     * jy统计少了页面来源，导致jy统计还是费不少人力
     *
     * 简易统计
     * 
     * @args {a:1, b:2, c:3}
     */
    function tracker (args) {
        if (!$.isPlainObject(args)) return;
        new Image().src = analyticUrl + context.appName + '?' + getUrlString(args);
    }

    function sendTracker(spm) {
        var spms;

        spms = spm.split('*');
        spms[0] = spms[0] || '';
        spms[1] = spms[1] || '';
        spms[2] = spms[2] || '';

        ga && ga('send', 'event', spms[0], spms[1], spms[2]);
        tracker({'action': spm});
    }
    /**
     * 游览器识别
     *
     * @return {Object}
     */
    function browser () {
        var UA = window.navigator.userAgent.toLowerCase();
        
        return {
            isWeixin : UA.match(/MicroMessenger/gi) == 'micromessenger' ? true : false,
            // 定制微博的分享文案
            isWeibo  : UA.match(/Weibo/gi) == 'weibo' ? true : false,
            isIOS    : /(iPhone|iPad|iPod|iOS)/gi.test(UA),
            isAndroid: /android|adr/gi.test(UA),
            isMobile : /(iPhone|iPad|iPod|iOS|Android|adr|Windows Phone|SymbianOS)/gi.test(UA),
        };
    }
    /**
     * @define 读取cookie值
     * @parame name String
     * @return String
     *
     * #for example:
     *  getCookie('name')
     *  "灰灰"
     */
    function getCookie (name) {
        var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
        if (arr != null) return decodeURIComponent(arr[2]);
        return null;
    }
    /**
     * @define 设置cookie值
     * @parame name String
     * @parame value String
     * @parame timer Number
     *
     * #for example:
     *  setCookie('name', '灰灰', omit)
     */
    function setCookie (name, value, timer) {
        var days = timer || 30; //默认30天
        var exp = new Date();
        exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000); 
        document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + exp.toUTCString();
    }
    /**
     * @define 读取cookie值
     * @parame name String
     * @return null
     *
     * #for example:
     *  getCookie('name')
     *  "灰灰"
     */
    function clearCookie (name) {
        setCookie(name, null, -30);
    }

    /**
     * @define 字符串转为对象
     * @parame String
     * @return Object
     *
     * #for example:
     *  getUrlParams('a=1&b=2&c=3')
     *  {a: "1", b: "2", c: "3"}
     */
    function getUrlParams (urlStr) {
        var result = {},
            re = /([^&=]+)=([^&]*)/g, m;
        while (m = re.exec(urlStr)) {
            result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        return result;
    }
    /**
     * @define 字符串转为对象
     * @parame String
     * @return Object
     *
     * #for example:
     *  getUrlString({a:'1',b:'2',c:'3'})
     *  "a=1&b=2&c=3"
     */
    function getUrlString () {
        return $.param.apply(null, arguments);
    }


    /**
     * @define 读取webview传入的值: urlString|cookie
     * @parame String
     * @return String
     *
     * #for example:
     *  getMixinValue('_v')
     *  "3.0.0"
     */
    function getMixinValue (arg) {
        var search = location.search.substr(1);
        var urlParams = getUrlParams(search);

        return urlParams[arg] || getCookie(arg);
    }



    /*********************************
     *                               *
     *                               *
     *     INApp WebView handle      *
     *                               *
     *                               *
     *********************************/
    /**
     * @define 协议格式化(内置方法)
     * @parame String|Object
     * @return Object
     *
     * #for example:
     *  format('in://camera')
     *  {'iosMessage':'in://camera','androidMessage':'in://camera'}
     *  format({'iosMessage':'in://camera','androidMessage':'in://camera'})
     *  {'iosMessage':'in://camera','androidMessage':'in://camera'}
     *  format("{'iosMessage':'in://camera','androidMessage':'in://camera'}")
     *  format({'iosMessage':'in://camera','androidMessage':'in://camera'})
     */
    function format (schemes) {
        var isString = typeof schemes == 'string';
        var isObject = $.isPlainObject(schemes);

        if (isObject) {
            if (schemes.hasOwnProperty('iosMessage') && 
                schemes.hasOwnProperty('androidMessage')) {
                return schemes;
            }

            console.error('schemes format error');
        } else if (isString) {
            if (inRegex.test(schemes)) {
                return { 
                    "iosMessage": schemes, 
                    "androidMessage": schemes
                };
            } 

            try {
                schemes = JSON.parse(schemes.replace(/'/g, '"'));

                if (schemes.hasOwnProperty('iosMessage') && 
                    schemes.hasOwnProperty('androidMessage')) {
                    return schemes;
                }
                
                console.error('schemes format error');
            } catch(e) {
                console.error('schemes format error');
            }
        }

        return { 
            "iosMessage": defaultSchemes, 
            "androidMessage": defaultSchemes
        };
    }
    /**
     * @define inWebview独特传值方式
     * @parame name String
     * @parame value String
     *
     * INApp 隐藏坑！
     * 设置分享的文案方式是: 在页面埋点，而不是通过JS去获取！
     * 埋点方式: <input type="hidden" id="name" value="value" />
     *
     * #for example:
     *  attached('shareTitle')
     *  attached('shareTitle', '让in变的更好')
     */
    function attached (name, value) {
        value = value || '';

        var $hidden = $('input:hidden#' + name);

        $hidden.length == 0 && ($hidden = $('<input type="hidden" id="'+ name +'">').prependTo('body'));
        $hidden.val(value);
    }

    /**
     * @define 隐射列表
     * @parame group Array
     * @parame deploy Object
     *
     * #for example:
     *  mapping(['shareTitle'], context)
     */
    function mapping (group, deploy) {
        group.forEach(function(key) {
            var temp;
            
            temp = deploy[key];
            key == 'shareCallBack' && (temp = analyticUrl + context.appName + '?_ig=inAppShare');
            temp && attached(key, temp);
        });
    }

    /*********************************
     *                               *
     *                               *
     *     WeChat WebView handle     *
     *                               *
     *                               *
     *********************************/
    function checkWxApi () {
        // Webview is not WeChat
        if (!os.isWeixin) {
            return false;
        }
        
        if (!domainRegex.test(location.host)) {
            console.error('跨域请求WeChat token，微信分享将失效！');
            return false;
        }

        // Refer WeChat script
        // if (!$.isPlainObject(window.wx)) {
        //     console.error('第三方库 jweixin.js 没被引用！');
        //     return false;
        // }

        return true;
    }


    /*********************************
     *                               *
     *                               *
     *     common configuration      *
     *                               *
     *                               *
     *********************************/
    context = {
        /**
         * 开发环境弹窗提示
         */
        debug: false,
        /**
         * 设置此参数，主要用于统计！
         */
        appName: 'in66',
        /**
         * 本章活动分享配置
         * 微信内：
         *  shareTitle  --> title
         *  shareDesc   --> desc
         *  shareLink   --> link
         *  shareImgSrc --> imgUrl
         * in App:
         *  shareTitle  --> shareTitle
         *  shareDesc   --> shareDesc
         *  shareLink   --> shareLink
         *  shareImgSrc --> shareImgSrc
         */
        shareTitle : '分享文案',
        shareDesc  : '分享详情',
        shareLink  : location.href,
        shareImgSrc: 'http://res.jiuyan.info/in_promo/core/images/share.jpg',
        /**
         * 隐藏设置
         * redirectUrl:        调用客户端相机、贴纸、生成图、生成自定义贴纸使用
         * downloadPictureUrl: 下载图片
         * shareImageUrl:      分享单图使用
         */
        


        /**
         * 此设置参数都是首屏开启时，是否唤醒in app。
         * launchScheme 可选 scheme协议 (相当于appObjUrl)
         *  三种可选值，增加容错率
         *  "in://camera"
         *  "{'iosMessage':'in://camera','androidMessage':'in://camera'}"
         *   {'iosMessage':'in://camera','androidMessage':'in://camera'}
         * launchWeixin 可选 微信内无用户操作时，是否唤醒in app
         * launch3rdApp 可选 其他渠道(weibo、safari), 是否唤醒in app
         */
        launchScheme: '',
        launchWeixin: false,
        launch3rdApp: true,

        /**
         * 允许开通的微信权限
         * 此设置可不变
         */
        jsApiList: ['launch3rdApp', 'onMenuShareAppMessage', 'onMenuShareTimeline', 'onMenuShareQQ', 'onMenuShareQZone'],

        /**
         * 页面逻辑初始化入口
         */
        pageInit: $.noop
    };

    function App(options) {
        /**
         * 外部灵活设置变量
         */
        $.extend(context, options);

        var os = browser();
        /**
         * 参数含义：
         *  _s     来源: ios/android 
         *  _v     in的版本，不是webview版本
         *  _token in的登录识别参数
         * 
         * in2.0启用新的参数方式
         *  _s._v._token
         * 为了兼容低版本1.*版本，还保留参数
         *  _source._version.tg_auth
         */
        var token = getMixinValue('_token') || getMixinValue('tg_auth'),
            source = getMixinValue('_s') || getMixinValue('_source'),
            version = getMixinValue('_v') || getMixinValue('_version');

        // 验证参数合法性
        var legalToken = token && token.trim().length,
            legalSource = source && /^(ios|android)$/i.test(source),
            legalVersion = version && /^[\d\.]+$/.test(version);

        /**
         * inwebview 判断有些恶心
         * 目前还没有ua标识符
         */
        os.isInApp = 
            !os.isWechat && 
            !os.isWeibo && 
            !!(legalToken && legalSource && legalVersion);

        /**
         * 问题1：
         * 域名少了顶级域名www
         * 活动域名在itugo上，跳转页面的时候，cookie读取不到
         */
        if (!domainRegex.test(location.host)) {
            console.warn('该域名cookie有可能种不上！');
        }

        /**
         * 问题2:
         * cookie 记录着用户的登录信息
         * 产生根本原因：in webview 没有UA标识符
         * 屏蔽其他其他渠道种cookie 渠道太多：qq、qzone、weixin、weibo
         */
        if (os.isInApp) {
            token   && setCookie('_token', token);
            source  && setCookie('_s', source);
            version && setCookie('_v', version);
        }

        /**
         * 附着在this指针上，方面外部调用
         */
        this.browser = os;
        this.inWebview = { 'token': token, 'source': source, 'version': version };
        this.init();
    }

    App.prototype = {
        /* Base Unit */
        getCookie: getCookie,
        setCookie: setCookie,
        clearCookie: clearCookie,
        getUrlParams: getUrlParams,
        getUrlString: getUrlString,

        /* Rely function */
        tracker: tracker,
        attached: attached,
        sendTracker: sendTracker,

        /* Page Hander Unit */
        init: function () {
            this.openInApp();
            // if(this.browser.isInApp && this.browser.isWeixin) {
            //     // 努力尝试唤醒app
            //     this.openInApp();
            // }
            this.browser.isInApp && this.inWebViewInit();
            this.browser.isWeixin && this.wxWebViewInit();

            // 创建钩子 [data-allseed]
            $('head').append('<style>[data-allseed]{cursor:pointer}</style>');
            $(document).on('click', '[data-allseed]', function() {
                sendTracker($(this).data('allseed'));
            });

            // Toast
        },
        inWebViewInit: function () {
            var that = this;

            // 创建钩子 [data-call-app]
            $(document).on('click', '[data-call-app]', function(e) {
                e.preventDefault();
                that.callApp($(this).data('call-app'));
            });

            // 创建钩子 [input*share]
            this.inWebviewShare(context);
            mapping(['shareImageUrl', 'redirectUrl', 'downloadPictureUrl'], context);
        },
        inWebviewShare: function (share) {
            mapping(['shareCallBack', 'shareImgSrc',  'shareLink',  'shareDesc',  'shareTitle'], share);
        },
        /**
         * 微信环境初始化
         * 
         * 文档：http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html
         */
        wxWebViewInit: function () {
            if (!checkWxApi()) return;
            var that = this,
                config;

            config = {
                beta: true,
                debug: context.debug,
                jsApiList: context.jsApiList
            };

            // 获取授权，望今后改为HTTPS
            $.ajax({
                url: wxSdkSign,
                data: { abs_url: location.href.split('#')[0], t: Data.now() },
                dataType: 'json'
            }).done(function(res) {
                res && 
                res.succ &&
                $.getScript('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {
                    config = $.extend(res.data, config);
                    /**
                     * 坑，注意大小写
                     */
                    config['nonceStr'] = res.data['noncestr'];
                    window.wx.config(config);
                    window.wx.ready(function() {
                        that.wxWebViewShare(context)
                    });
                });
            });
        },
        wxWebViewShare: function (share) {
            if (!this.checkWxApi()) return;
            var config = {};

            // 映射表
            config['title']  = share['shareTitle']  || context['shareTitle'];
            config['desc']   = share['shareDesc']   || context['shareDesc'];
            config['link']   = share['shareLink']   || context['shareLink'];
            config['imgUrl'] = share['shareImgSrc'] || context['shareImgSrc'];
            
            window.wx.onMenuShareTimeline(getShareOption('weixinCircle'));
            window.wx.onMenuShareAppMessage(getShareOption('weixin'));
            window.wx.onMenuShareQQ(getShareOption('qq'));
            window.wx.onMenuShareQZone(getShareOption('qqzone'));

            // 分享至渠道加上追踪参数
            // _ig 渠道统计，猜测大多都是微信朋友圈
            function getShareOption(branch) {
                var path, 
                    params,
                    aEle = document.createElement('a');
                
                aEle.href     = config['link'];
                path          = aEle.origin + aEle.pathname;
                params        = getUrlParams(aEle.search.substr(1));
                params['_ig'] = branch;
 
                aEle = null;
                return {
                    title  : config['title'],
                    link   : path + '?' + $.param(params),
                    imgUrl : config['imgUrl'],
                    desc   : config['desc'],
                    success: function(){
                        tracker({'shareTo': branch});
                    }
                }
            }
        },
        /**
         * @define 分享文案修改
         * @parame share Object
         *
         * {shareTitle, shareDesc, shareLink, shareImgSrc}
         *
         * #for example:
         *  attached('shareTitle')
         *  attached('shareTitle', '让in变的更好')
         */
        changeShare: function (share) {
            this.browser.isInApp && this.inWebviewShare(share);
            this.browser.isWeixin && this.wxWebViewShare(share);
        },
        /**
         * 当前版本是否小于给定版本号
         * 
         * @param  所比较目标版本号
         * @return {Boolean}
         */
        isLessThanVersion: function (target) {
            var browser = this.browser;
            var version = this.inWebview.version;

            // 毫无比较性
            if (!browser.isInApp) {
                console.warn('not in app webview');
                return false;
            }

            // 参数出错
            if (typeof target != 'string') {
                console.warn('arg not string');
                return false;
            }

            var currentSplit = version.split('.');
            var targetSplit  = target.split('.');
            var loopLength = Math.min(currentSplit.length, targetSplit.length);

            for ( var i = 0; i < loopLength; i++ ) {
                if ( currentSplit[i] !== targetSplit[i] ) {
                    return Number(currentSplit[i]) < Number(targetSplit[i]);
                }
            }

            return version.length < target.length;
        },

        /**
         * @define 协议格式化
         * @parame String|Object
         * @return 字符串
         *
         * #for example:
         *  app.formatString('in://camera')
         */
        formatString: function (schemes) {
            schemes = format(schemes);
            
            if (this.browser.isIOS) return schemes['iosMessage'];
            if (this.browser.isAndroid) return schemes['androidMessage'];

            console.error('The schemes does not support this model');
            return defaultSchemes;
        },
        /**
         * @define 协议格式化
         * @parame String|Object
         * @return 字符串
         *
         * #for example:
         *  app.formatObject('in://camera')
         */
        formatObject: function (schemes) {
            return format(schemes);
        },
        /**
         * @define 调起协议，跟客户端沟通
         * @parame String|Object
         *
         * #for example:
         *  app.callApp()
         */
        callApp: function (schemes) {
            if (!this.browser.isInApp) {
                console.log('App external cannot be used schemes');
                return null;
            }

            if (!$.isFunction(window.callApp)) {
                console.log('No Loaded jsbridge');
                return null;
            }

            window.callApp(format(schemes));
        },
        /**
         * @define 唤醒in，并且打开指定位置
         * 此接口的目的是唤醒app，何为唤醒，是第三方渠道里，打开in，进入in里
         * 错误的思维: <del>in内部禁止重复打开webview, 其他协议通过！</del>
         * 如果要在in app内部，唤醒页面接口，请使用app.callApp函数。
         * 
         * 应用场景：(分享页使用)
         * #for example:
         *  app.openInApp()
         */
        openInApp: function () {
            var browser = this.browser,
                launchScheme = context.launchScheme,
                launchWeixin = context.launchWeixin,
                launch3rdApp = context.launch3rdApp,
                UA = window.navigator.userAgent.toLowerCase(),
                iframe;

            // is not mobile
            if (!browser.isMobile && browser.isInApp) {
                return;
            }

            // 域名判断hack，兼容判断
            // 客户端只会给in66域名添加_s、_token、_version
            /**
             * 问题3:
             * 禁止测试域名唤醒app
             * 原因：不能判断是否在in内！
             * 产生原由：客户端只会给in66域名添加_s、_token、_version
             */
            if (!domainRegex.test(location.host)) {
                return;
            }

            if (launchScheme == undefined || launchScheme == '') {
                /**
                 * location.origin + location.pathname 组合方式，少了location.search
                 * location.href 如果get里, _s:android, 那么ios表现是怎样？
                 */
                launchScheme = 'in://webview?url=' + encodeURIComponent(location.href);
            }

            /**
             * 唤醒具体操作1:
             * 大众点评使用方法：需要微信白名单机制
             */
            if (browser.isAndroid) {
                div = document.createElement('div');
                div.style.visibility = 'hidden';
                div.innerHTML = '<iframe src="'+ launchScheme +'" scrolling="no" width="1" height="1"></iframe>';
                document.body.appendChild(div);
            }   
            if (browser.isIOS) {
                setTimeout(function() {
                    window.location.href = launchScheme;
                }, 50);
            }
             
            /**
             * 唤醒具体操作2:
             * 使用微信SDK方法：同样需要白名单机制
             */

            /**
             * 唤醒具体操作3:
             * @晓风大神方法
             */
            // if (UA.indexOf('qq/') > -1 || ( UA.indexOf('safari') > -1 && UA.indexOf('os 9_') > -1 )) {
            //     location.href = launchScheme;
            // } else {
            //     iframe = document.createElement('iframe');
            //     iframe.src = launchScheme;
            //     iframe.style.display = 'none';
            //     document.body.appendChild(iframe);
            // }

            // 1、超时跳转失败则认为未安装APP
            // 2、微信阻止跳转
            // window.setTimeout(function() {
            //     document.body.removeChild(iframe);
            //     // 唤醒失败回调！
            //     // 可以做什么呢？
            //     // 弹窗啊，产品不是很喜欢么！
            //     // 弹死用户
            //     $.isFunction(defeatCallback) && defeatCallback();
            // }, 500);
        }
    }

    window.App = App;
})();