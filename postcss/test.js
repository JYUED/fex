var postcss = require('postcss');
var webpcss = require('webpcss');
var r = postcss([webpcss.default])
    .process('@charset "UTF-8";'
            + '.test1{_width:10rem;background-image:url(../images/chenggou-bg.png)}'
            + '.test2{background-image:url(../images/homepage.jpg)}'
            )
   
// console.log(r);
// console.log(r.result);
// console.log(r.result.root);
// console.log(r.result.root.last);
// console.log(r.result.root.first);

var root = r.result.root;
var rule = root.nodes[1];
// console.log(rule);

// const decl2 = postcss.decl({ prop: 'background-color', value: 'white'  });
// new rule
// const newRule = postcss.parse('.test3{}').first;

//append
// const decl1 = postcss.decl({ prop: 'color', value: 'black'  });
// newRule.append(decl1);


//cloneBefore
// var cloneDecl = decl1.cloneBefore({ prop: '-webkit-' + decl1.prop  });
// // console.log(cloneDecl);
// //moveTo
// var toParent = root.nodes[2]
// // console.log(toParent);
// cloneDecl.moveTo(toParent);

// root.append(newRule);

// r.then(function(r){console.log(r.css)}, function(err) {});


