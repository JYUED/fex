var Modernizr = require('Modernizr');
var test = require('./test1.js');
var $ = require('zepto');
console.log(test(1));
console.log($('.fulishe'));
var test3 = 4;
console.log(test3);
Modernizr.on('webp', function(result) {
  if (result) {
    alert(1);
  } else {
    alert(2);
  }
});
