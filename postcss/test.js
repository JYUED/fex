var postcss = require('postcss');
var webpcss = require('webpcss');
var r = postcss([webpcss.default])
    .process('.fulishe{width:10rem;background-image:url(../images/chenggou-bg.png)} .fulishe2{background-image:url(../images/homepage.jpg)}')
    .then(function(r){console.log(r.css)}, function(err) {});

