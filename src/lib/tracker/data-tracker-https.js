/** begin ---data-tracker.js---*/
/** 依赖jquery.js或者zepto.js
    注意：
    1.由于注册的统计事件都代理在body上，故外部使用时不要在事件中阻止冒泡，否则可能引起统计代码不执行；
    2.一般无需修改配置即可正常使用，修改监听事件类型时，有跳转链接时最好不使用tap（tap无法阻止默认跳转），若想取消移动端点击事件的300ms延时，建议外部引入fastclick.js；
    3.修改超时等待时最好大于100ms，避免超时时间太少而使统计失效；
    4.兼容google统计的两种写法。ga.js和analytics.js，但新版本的统计支持回调，可以缩短页面跳转等待时间；
    5.google统计与自己服务器的统计需要埋不一样的点（默认为data-seed和data-jyseed）。

    版本:v1.0，支持4个配置项
    @author:xiaofeng 2014.11.25
    
    update:2014.12.1 v1.1
    1. 增加手动添加统计的方法，addGa与addTj；
    2. 修改两个统计同时添加时google统计回调过早执行可能阻止掉自己服务器统计的bug
    update:2014.12.8 v1.2
    1. 增加自己服务器的统计回调功能
    update:2015.2.6 v1.3
    1. 修改div元素在手机上无法统计的bug
    update:2015.5.4 v1.4
    1. 添加埋一个点，两种都统计的功能，埋点方式同google统计
    2. 添加addAll方法，添加两种统计，不用分开写了，参数和addGa()相同

*/

(function() {

    function Tracker(config) {
        config = config || {};

        //监听事件类型（用tap将无法阻止默认）
        var eventType = this.eventType = config.eventType || "click";
        //跳转超时等待时间
        var jumpDelay = this.jumpDelay = config.jumpDelay || 300;
        //google统计埋点名称
        var seedName = this.seedName = config.seedName || "data-seed";
        //自己服务器统计埋点名称
        var jySeedName = this.jySeedName = config.jySeedName || "data-jyseed";
        // google和自己服务器的统计埋点名称
        var allSeedName = this.allSeedName = config.allSeedName || "data-allseed";
        //
        var res = location.protocol;
        $("head").append('<style> div[' + seedName +'],div[' + jySeedName + '],div[' + allSeedName + '] { cursor: pointer; } </style>');

        function trackEventHandler(e){
            // console.log(this==e.target);
            var $this = $(this);

            var href = $this.attr("href");
            var tar = $this.attr("target");
            var gaparam = $this.attr(seedName);
            var jyurl = $this.attr(jySeedName);

            var allGaparam = $this.attr(allSeedName);
            if(allGaparam){
                gaparam = allGaparam;
                jyurl = res + "//stats1.jiuyan.info/itugo_deleven.html?action=" + allGaparam;
            }
            
            var alreadyCalled = false;
            var needJump = false;

            var jyFinished = false;
            var gaFinished = false;

            if (gaparam) {
                var parArray = gaparam.split("*");
                parArray[0] = parArray[0] || "";
                parArray[1] = parArray[1] || "";
                parArray[2] = parArray[2] || "";

                if (typeof ga !== "undefined") {
                    ga('send', 'event', parArray[0], parArray[1], parArray[2], {
                        'hitCallback': function() {
                            //若同时加了自己服务器的统计，则不执行谷歌统计的回调，防止页面过早跳转，自己服务器的统计被cancle。(x)
                            gaFinished = true;
                            if(needJump && !alreadyCalled){
                                if(jyurl){
                                    if(jyFinished){
                                        alreadyCalled = true;
                                        window.location.href = href;
                                    }
                                }else{
                                    alreadyCalled = true;
                                    window.location.href = href;
                                } 
                            } 
                        }
                    });

                    // gtm
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        'event' : parArray[1]
                    });
                } else {
                    (typeof _gaq !== "undefined") && _gaq.push(['_trackEvent', parArray[0], parArray[1], parArray[2]]);
                }

                // 百度统计
                if(typeof _hmt !== 'undefined'){
                    _hmt.push(['_trackEvent', parArray[0], parArray[1], parArray[2] ]);
                }
            }

            if (jyurl) {
                // var tjurl;
                // if(jyurl.indexOf("?") == -1){
                //     tjurl = jyurl + "?jsonpCallback=?";
                // }else{
                //     tjurl = jyurl + "&jsonpCallback=?";
                // }
                // $.getJSON(tjurl, function(data) {
                //     jyFinished = true;
                //     if(needJump && !alreadyCalled){
                //         if(gaparam){
                //             if(gaFinished){
                //                 alreadyCalled = true;
                //                 window.location.href = href;
                //             }
                //         }else{
                //             alreadyCalled = true;
                //             window.location.href = href;
                //         } 
                //     } 
                // });
                
                
                // attach token as parameter
                var param = {};
                if (typeof InAppUtils != 'undefined') {
                    param._token = InAppUtils.getToken();
                }
                $.ajax({
                    url:jyurl,
                    dataType: 'jsonp',
                    jsonp: 'jsonpCallback',
                    data: param,
                    success:function(data){
                        jyFinished = true;
                        if(needJump && !alreadyCalled){
                            if(gaparam){
                                if(gaFinished){
                                    alreadyCalled = true;
                                    window.location.href = href;
                                }
                            }else{
                                alreadyCalled = true;
                                window.location.href = href;
                            } 
                        } 
                    }
                });
            }

            // 延时跳转页面
            if (href && href.indexOf("javascript:") == -1 && tar !== "_blank") {
                needJump = true;
                setTimeout(function() {
                    if (!alreadyCalled){
                        alreadyCalled = true;
                        window.location.href = href;
                    } 
                }, jumpDelay);

                e.preventDefault();
            }
        }
        //google统计与自己服务器的统计追踪
        $("body").on(eventType, "[" + seedName + "],[" + jySeedName + "],[" + allSeedName + "]", trackEventHandler);
    }

    Tracker.prototype.destory = function() {
        $("body").off(this.eventType, "[" + this.seedName + "],[" + this.jySeedName + "],[" + this.allSeedName + "]", trackEventHandler);
    }

    

    Tracker.config = function(config) {
        tracker.destory();
        tracker = new Tracker(config);
    };

    //手动添加谷歌统计,callback为统计成功后的回调
    Tracker.addGa = function(seed,callback){

        var parArray = seed.split("*");
        parArray[0] = parArray[0] || "";
        parArray[1] = parArray[1] || "";
        parArray[2] = parArray[2] || "";

        var isCalled = false;
        if (typeof ga !== "undefined") {
            ga('send', 'event', parArray[0], parArray[1], parArray[2], {
                'hitCallback': function() {
                    if(!isCalled){
                        isCalled = true;
                        callback && callback();  
                    }
                }
            });

            // gtm
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event' : parArray[1]
            });
        } else {
            (typeof _gaq !== "undefined") && _gaq.push(['_trackEvent', parArray[0], parArray[1], parArray[2]]);
        }
        setTimeout(function() {
            if(!isCalled){
                isCalled = true;
                callback && callback();  
            } 
        }, tracker.jumpDelay);
    };

    //手动添加自己服务器的统计
    Tracker.addTj = function(jyurl,callback){
        if(jyurl){
            var isCalled = false;

            // var tjurl;
            // if(jyurl.indexOf("?") == -1){
            //     tjurl = jyurl + "?jsonpCallback=?";
            // }else{
            //     tjurl = jyurl + "&jsonpCallback=?";
            // }
            // $.getJSON(tjurl, function(data) {
            //     if(!isCalled){
            //         isCalled = true;
            //         callback && callback();
            //     }
            // });

            $.ajax({
                url:jyurl,
                dataType: 'jsonp',
                jsonp: 'jsonpCallback',
                success:function(data){
                    if(!isCalled){
                        isCalled = true;
                        callback && callback();
                    }
                }
            });

            setTimeout(function() {
                if(!isCalled){
                    isCalled = true;
                    callback && callback();  
                } 
            }, tracker.jumpDelay);
        }
    };

    //  手动添加两个统计
    Tracker.addAll = function(seed, callback){
        if(!seed) return;

        var jyFinished = false;
        var gaFinished = false;
        var isCalled = false;
        var res = location.protocol;
        // ga
        var parArray = seed.split("*");
        parArray[0] = parArray[0] || "";
        parArray[1] = parArray[1] || "";
        parArray[2] = parArray[2] || "";

        if (typeof ga !== "undefined") {
            ga('send', 'event', parArray[0], parArray[1], parArray[2], {
                'hitCallback': function() {
                    gaFinished = true;
                    if(!isCalled && jyFinished){
                        isCalled = true;
                        callback && callback();  
                    }
                }
            });

            // gtm
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event' : parArray[1]
            });

        } else {
            (typeof _gaq !== "undefined") && _gaq.push(['_trackEvent', parArray[0], parArray[1], parArray[2]]);
        }

        // 百度统计
        if(typeof _hmt !== 'undefined'){
            _hmt.push(['_trackEvent', parArray[0], parArray[1], parArray[2] ]);
        }

        // tj
        
        // attach token as parameter
        var param = {};
        if (typeof InAppUtils != 'undefined') {
            param._token = InAppUtils.getToken();
        }

        var jyurl = res + "//stats1.jiuyan.info/itugo_deleven.html?action=" + seed;
        console.log(jyurl);
        $.ajax({
            url:jyurl,
            dataType: 'jsonp',
            jsonp: 'jsonpCallback',
            data: param,
            success:function(data){
                jyFinished = true;
                if(!isCalled && gaFinished){
                    isCalled = true;
                    callback && callback();
                }
            }
        });

        // 超时
        setTimeout(function() {
            if(!isCalled){
                isCalled = true;
                callback && callback();  
            } 
        }, tracker.jumpDelay);
    }

    window.Tracker = Tracker;

    var tracker = {};
    $(document).ready(function() {
        tracker = new Tracker();
    });

}());

/** end ---data-tracker.js---*/
