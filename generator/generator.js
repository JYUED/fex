var Metalsmith  = require('metalsmith');
var Handlebars = require('handlebars')
var async = require('async')
var render = require('consolidate').handlebars.render
var path = require('path')

Handlebars.registerHelper('if_eq', function (a, b, opts) {
   return a === b
       ? opts.fn(this)
       : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq', function (a, b, opts) {
  return a === b
      ? opts.inverse(this)
      : opts.fn(this)
})

module.exports = function generate(src, dest, done) {
    var metalsmith = Metalsmith(path.join(__dirname));
    var data = Object.assign(metalsmith.metadata(), {
         noEscape: true,
        })

    metalsmith
        .use(renderTemplateFiles)
        .clean(false)
        .source(path.join('templates'))
        .destination(dest)
        .build(function (err) {
            done(err)
        })

}

function renderTemplateFiles (files, metalsmith, done) {
    var keys = Object.keys(files)
        var metalsmithMetadata = metalsmith.metadata()
        async.each(keys, function (file, next) {
            var str = files[file].contents.toString()
            // do not attempt to render files that do not have mustaches
            if (!/{{([^{}]+)}}/g.test(str)) {
                return next()
            }
        render(str, metalsmithMetadata, function (err, res) {
            if (err) return next(err)
            files[file].contents = new Buffer(res)
            next()
        })
        }, done)
}


