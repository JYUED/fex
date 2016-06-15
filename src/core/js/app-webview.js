$(function(){

    function gotoWebview( content ) {
        if ( isFromApp && isFromApp() ) {
            var $this = $(content).length && $(content) || $(this);
            var msg = $this.data('webview');
            if ( msg ) {
                msg = msg.replace(/'/g, '"');
                msg = JSON.parse(msg);
                callApp && callApp( msg );
            }
        }
    }
    function gotoDownlaod( content ){
        if ( isFromApp && !isFromApp() ) {
            var $this = $(content).length && $(content) || $(this);
            var appUrl = $this.data('app');
            if ( !appUrl ) { return; }
            $this.attr({ href: appUrl });
        }
    }

    function gotoTxappcenter( content ) {
        if ( isWeChatApp && isWeChatApp() ) {
            var $this = $(content).length && $(content) || $(this);
            var appUrl = $this.data('txappcenter');
            if ( !appUrl ) { return; }
            $this.attr({ href: appUrl });
        }
    }

    // 桥接到IN页面，或下载IN app，或跳转到腾讯应用宝
    $('body').on('click', '[data-webview]', function(){
        gotoWebview(this);
    });

    $('[data-app]').each(function(){
        gotoDownlaod(this);
    });
    $('[data-txappcenter]').each(function(){
        gotoTxappcenter(this);
    });

});