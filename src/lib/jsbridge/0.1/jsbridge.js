//
//  TGJSBridge.js
//  TGJSBridge
//
//  Created by Chao Shen on 12-3-1.
//  Copyright (c) 2012年 Hangzhou Jiuyan Technology Co., Ltd. All rights reserved.
//

(function(context){
    function bridgeCall(src,callback) {
		iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = src;
		var cleanFn = function(state){
		   console.log(state) 
		    try {
		        iframe.parentNode.removeChild(iframe);
		    } catch (error) {}
		    if(callback) callback();
		};
        iframe.onload = cleanFn;
		document.documentElement.appendChild(iframe);
	}
	
    function JSBridge()
    {
        this.callbackDict = {};
        this.notificationIdCount = 0;
        this.notificationDict = {};
        
        var that = this;
        context.document.addEventListener('DOMContentLoaded',function(){
            bridgeCall('jsbridge://NotificationReady',that.trigger('jsBridgeReady',{}));
        },false);
    }

    JSBridge.prototype = {
        constructor: JSBridge,
        //js向oc发送消息
        postNotification: function(name, userInfo){
            this.notificationIdCount++;
            
            this.notificationDict[this.notificationIdCount] = {name:name, userInfo:userInfo};

            bridgeCall('jsbridge://PostNotificationWithId-' + this.notificationIdCount);
        },
        //oc获取消息数据
        popNotificationObject: function(notificationId){
            var result = JSON.stringify(this.notificationDict[notificationId]);
            delete this.notificationDict[notificationId];
            return result;
        },
        //oc向js发送消息
        trigger: function(name, userInfo) {
            if(this.callbackDict[name]){
                var callList = this.callbackDict[name];
                
                for(var i=0,len=callList.length;i<len;i++){
                    callList[i](userInfo);
                }
            }
        },
        //绑定消息
        bind: function(name, callback){
            if(!this.callbackDict[name]){
                //创建对应数组
                this.callbackDict[name] = [];
            }
            this.callbackDict[name].push(callback);
        },
        //解除绑定
        unbind: function(name, callback){
            //如果只提供消息名，则删除整个对应的数组
            if(arguments.length == 1){
                delete this.callbackDict[name];
            } else if(arguments.length > 1) {
                //搜索相应的callback，并删除
                if(this.callbackDict[name]){
                    var callList = this.callbackDict[name];
                    
                    for(var i=0,len=callList.length;i<len;i++){
                        if(callList[i] == callback){
                            callList.splice(i,1);
                            break;
                        }
                    }
                }
                //如果数组为空，则删除
                if(this.callbackDict[name].length == 0){
                    delete this.callbackDict[name];
                }
            }
            
        }
        
    };
	
	 function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    };
	
	var source = getQueryString('_source') || getQueryString('_s') || '';
	
	if(source && (source !=='android')){
		context.jsBridge = new JSBridge();
	}
	

	
    
})(window);
