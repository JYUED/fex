// 提示信息
$.hintMessage = function(msg, callback, millisecond) {
    var $hintBox = $('.hint-box');
    !$hintBox.length && ($hintBox = $('<div class="hint-box" style="position: fixed; left: 33%; top: 30%;' +
        'padding: 8px; color: #FFF; border-radius: 5px; background-color: rgba(0,0,0,.7); font: 14px/20px sans-serif; z-index: 10000000;"></div>')).appendTo('body');

    setTransform();

    var timeoutId = null;
    var fn = function(msg) {
        clearTimeout(timeoutId);
        $hintBox.text(msg).css({
            'display': 'block'
        });
        timeoutId = setTimeout(function() {
            $hintBox.css({
                'display': 'none'
            });
            callback && callback();
        }, millisecond || 3000);
    };
    fn(msg);

    function setTransform() {
        $hintBox.css({
            'max-width': '80%',
            'white-space': 'nowrap',
            'left': '50%',
            'top': '50%',
            '-webkit-transform': 'translate(-50%, -50%)',
            '-moz-transform': 'translate(-50%, -50%)',
            '-ms-transform': 'translate(-50%, -50%)',
            '-o-transform': 'translate(-50%, -50%)',
            'transform': 'translate(-50%, -50%)'
        });
    }

    // 惰性载入函数(函数第一次定义时初始化，之后只执行fn)
    $.hintMessage = fn;
};
