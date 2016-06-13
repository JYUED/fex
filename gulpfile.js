var config        = require('./config.json');
var $releaseDir   = config.release.dist,
    $devDir       = './src',
    sysFolder     = ['core', 'layout', 'partials','css', 'js', 'images', 'tpl', 'rev-manifest.json'],
    cdn           = config.release.cdn;

var $c,
     _ = require('lodash');
var argv            = process.argv;
var fs              = require('fs'),
    path            = require('path'),
    jsFiles         = require('./gulpfile/jsFiles'),
    Component       = require('./gulpfile/Component'),

    gulp            = require('gulp'),
    lr              = require('tiny-lr'),
    server          = lr(),
    del             = require('del'),
    livereload      = require('gulp-livereload'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    ps              = gulpLoadPlugins(),
    browserify      = require('browserify'),
    through2        = require('through2'),
    generator       = require('./generator/generator'),
    cssnano         = require('cssnano'),
    autoprefixer    = require('autoprefixer'),
    webpcss         = require('webpcss');

var includePaths = require('bourbon').includePaths;
includePaths.push(path.join(__dirname, 'src/core/scss'));
includePaths.push(path.join(__dirname, 'src/core'));
includePaths.push(path.join(__dirname, 'src/lib'));

var cssProcessors = [
    autoprefixer({browsers: ['last 2 version']}),
    webpcss.default,
    cssnano(),
];

var base64Extensions = ['jpg', 'webp', 'svg', 'png', /\.jpg#datauri$/i];

var jsSrc = function($c) {
    return [ 
        $c._jsPath + '/*.js', 
        '!' + $c._jsPath + '/min.js'
    ];
}
 
gulp.task('mockComponent', function(){
    var err = true;
    if (argv[3] && argv[3].indexOf("--dir=") != -1) {
        var name = argv[3].replace("--dir=", ""); 
        if (name) {
            $c = new Component(name);
            console.log($c);
            err = false;
        }
    } 

    if (err) this.emit('error', new Error("no component"));
})

//=== 开发环境 ===
gulp.task('dev-css',['mockComponent'], function() {
    return gulp.src($c._dir + '/css/*.scss')
	           .pipe(ps.plumber())
               .pipe(ps.sass({includePaths: includePaths}))
               .pipe(ps.postcss(cssProcessors))
               .pipe(ps.concat('min.css'))
               .pipe(gulp.dest($c._dir + '/css'))
               .pipe(ps.notify($c._dir + '/css/min.css 压缩完毕！'));
});

gulp.task('dev-js', ['mockComponent'], function() {
    return gulp.src(jsSrc($c))
               .pipe(ps.plumber())
               .pipe(ps.eslint())
               .pipe(ps.eslint.format())
               .pipe(through2.obj(function(file, enc, next) {
                    browserify(file.path)
                    // .transform("babelify", {presets: ["es2015"]})
                    .bundle(function(err, res) {
                        err && console.log(err.stack);
                        file.contents = res;
                        next(null, file);
                    });
               }))
               
               .pipe(ps.concat('min.js', {newLine: ';'}))
               .pipe(ps.uglify())
               .pipe(gulp.dest($c._dir + '/js'))
               .pipe(ps.notify($c._dir + '/js/min.js 压缩完毕！'));
});

//开启本地 Web 服务器功能
gulp.task('dev-server', function() {
    return gulp.src('./src')
               .pipe(ps.webserver({
                    host:             config.dev.host,
                    port:             config.dev.port,
                    livereload:       config.dev.livereload,
                    directoryListing: true 
    }));
});
//=== 开发环境 END ===
// release
gulp.task('release-server', function() {
    gulp.src('./public')
        .pipe(ps.webserver({
            host:             config.release.host,
            port:             config.release.port,
            livereload:       false,
            directoryListing: true 
   }));

});


var component_images = function(component) {
    return gulp.src(component._dir + '/images/*')
               .pipe(ps.rev())                                            
               .pipe(gulp.dest(component._releaseDir + '/images'))
               .pipe(ps.rev.manifest(component._manifestPath, { base: component._dir, merge: true }))
               .pipe(gulp.dest(component._dir))
               .pipe(ps.notify(component._dir + '图片处理完毕！'));
};

var component_css = function(component) {
    var manifest = gulp.src(component._manifestPath);
    return gulp.src(component._dir + '/css/*.scss')
		.pipe(ps.plumber())
        .pipe(ps.sass({includePaths: includePaths}))
        .pipe(ps.postcss(cssProcessors))
        .pipe(ps.revReplace({manifest: manifest}))
        .pipe(ps.base64({
            baseDir: 'public',
            extensions: base64Extensions,
            exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
            maxImageSize: 5*1024, // bytes,
            deleteAfterEncoding: false,
            debug: false,
        }))
        .pipe(ps.concat('min.css'))
        .pipe(ps.rev())                                            
        .pipe(ps.cdnify({ base: cdn }))
        .pipe(gulp.dest(component._releaseDir + '/css'))
        .pipe(ps.rev.manifest(component._manifestPath, { base: component._dir, merge: true }))
        .pipe(gulp.dest(component._dir))
        .pipe(ps.notify(component._releaseDir + ' min.css 压缩完毕！'));
}

function component_js(component) {
    var manifest = gulp.src(component._manifestPath);
    return gulp.src(jsSrc(component))
               .pipe(ps.plumber())
               .pipe(through2.obj(function(file, enc, next) {
                    browserify(file.path)
                    .bundle(function(err, res) {
                        err && console.log(err.stack);
                        file.contents = res;
                        next(null, file);
                    });
               }))
               .pipe(ps.concat('min.js', {newLine: ';'}))
               .pipe(ps.uglify())
               .pipe(ps.rev())                                            
               .pipe(gulp.dest(component._releaseDir + '/js'))
               .pipe(ps.rev.manifest(component._manifestPath, { base: component._dir, merge: true }))
               .pipe(gulp.dest(component._dir))
               .pipe(ps.notify(component._releaseDir + ' min.js 压缩完毕！'));
}

function component_html(component) {
    var manifest = gulp.src(component._manifestPath);
    return  gulp.src(component._dir + '/*/*.html')
		       .pipe(ps.plumber())
               .pipe(ps.base64({
                   baseDir: 'public',
                   extensions: base64Extensions,
                   exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
                   maxImageSize: 5*1024, // bytes,
                   deleteAfterEncoding: false,
                   debug: true
               }))
              .pipe(ps.revReplace({manifest: manifest}))
              .pipe(ps.cdnify({ base: cdn }))
              .pipe(ps.htmlmin({collapseWhitespace: true}))
              .pipe(gulp.dest(component._releaseDir))
              .pipe(ps.notify(component._releaseDir + ' html 压缩完毕！'));
}

gulp.task('webp', ['mockComponent'], function () {
    return gulp.src($c._imagesPath + '/*.{png,jpg,jpeg}')
               .pipe(ps.webp())
               .pipe(gulp.dest($c._imagesPath));
});

gulp.task('images', ['mockComponent', 'webp'], function() {
    return component_images($c);
}); 

gulp.task('css', ['images'], function() {
    return component_css($c);
}); 

gulp.task('js', ['css'], function() {
    return component_js($c);
});

//html
gulp.task('html', ['js'], function() {
    return component_html($c);
});

//watch
gulp.task('watch', ['mockComponent'] ,function () {

    server.listen(35729, function (err) {
        if (err){
            return console.log(err);
        }
  
    });

    gulp.watch($c._dir + '/css/*.scss', function (e) {
        gulp.run('dev-css');
        server.changed({
            body: {
                files: [e.path]
            }
        });
          
    });

    gulp.watch($c._dir + '/js/!(min.js)', function (e) {
        gulp.run('dev-js');
        server.changed({
            body: {
                files: [e.path]
            }
        });
          
    });
});

gulp.task('component',['html']);
gulp.task('dev', ['dev-css', 'dev-js']);

var exec = require('child_process').exec;
gulp.task('releaseComponent', ['component'], function(cb){
    var readDir = fs.readdirSync($c._dir);
    if (readDir) {
        var components = _.pullAll(readDir, sysFolder);
        _(components).forEach(function(co){

            subComponent = new Component([$c._name, co].join('/'));
            exec('gulp component --dir=' + subComponent._name, function(err) {
                if (err) return cb(err); 
                // cb(); 
            });
        });
    }
});

 gulp.task('releaseClean', ['mockComponent'], function(){
    del([$c._releaseDir + '/**', $c._dir + '/**/rev-manifest.json']).then( function(paths){
         console.log('Deleted files and folders:\n', paths.join('\n'));
    });
 })

gulp.task('generateComponent', ['mockComponent'], function(){
    generator('generator', '../' + $c._dir, function(err) {
        if (err) { console.log(err); }
    });
})


