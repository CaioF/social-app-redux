const fs       = require('fs').promises;
const path     = require('path');
const { walk } = require('walk');

class Instance {
  
  constructor(handlebars) {
    if (!(this instanceof Instance))
      return new Instance(handlebars);

    this.handlebars = handlebars || require('handlebars').create();
    this.cache = {};

    this.__express = middleware.bind(this); 
  }
  
  registerPartial() {
    this.handlebars.registerPartial.apply(this.handlebars, arguments);
  }
  
  async registerPartials(directory, done = () => null) {
    let handlebars = this.handlebars;

    let register = (filepath, done) => {
      if (!/\.(html|hbs)$/.test(filepath))
        return done(null);

      fs.readFile(filepath, 'utf8').then(data => {
        let ext = path.extname(filepath);
        let templateName = path.relative(directory, filepath)
          .slice(0, -(ext.length)).replace(/[ -]/g, '_')
          .replace(/\\/g, '/')
        handlebars.registerPartial(templateName, data);
        done();
      }).catch(err => done(err));
    };

    walk(directory).on('file', (root, {name}, next) => register(path.join(root, name), next)).on('end', done);

  }
  
  registerHelper(name, fn) {
    this.handlebars.registerHelper(name, async () => await fn());
  }
  
  localsAsTemplateData(app) {
    // Set a flag to indicate we should pass locals as data
    this.__localsAsData = true;

    app.render = (render => {
      return (view, options, callback) => {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }

        // Mix response.locals (options._locals) with app.locals (this.locals)
        options._locals = options._locals || {};
        for (let key in this.locals)
          options._locals[key] = this.locals[key];
        return render.call(this, view, options, callback);
      };
    })(app.render);
  }

}

// express 3.x template engine compliance
async function middleware(filename, options, cb) {
  let self = this;
  let cache = self.cache;
  let handlebars = self.handlebars;

  let extension = path.extname(filename);

  let handlebarsOpts = (self.__localsAsData) ? { data: options._locals } : undefined;

  let render_file = async (locals, cb) => {
    // cached?
    let template = cache[filename];
    if (template) {
      try {
        let res = template(locals, handlebarsOpts)
        cb(null, res)
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }

      return
    }

    fs.readFile(filename, 'utf8').then(async str => {
      let template = handlebars.compile(str);
      if (locals.cache) cache[filename] = template;
      try {
        let res = template(locals, handlebarsOpts);
        cb(null, res);
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }
    }).catch(err => cb(err));
  }

  // render with a layout
  let render_with_layout = async (filename, template, locals, cb) => {
    render_file(locals, (err, str) => {
      if (err)
        return cb(err);
      locals.body = str;

      try {
        let res = template(locals, handlebarsOpts)
        self.async.done(values => {
          Object.keys(values).forEach(id => res = res.replace(id, values[id]))

          cb(null, res)
        })
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }
    });
  }

  let layout = options.layout;

  if (layout === undefined && options.settings && options.settings['view options'])
    layout = options.settings['view options'].layout;

  if (layout !== undefined && !layout)
    return render_file(options, cb);

  let view_dirs = options.settings.views;

  let layout_filename = [].concat(view_dirs).map(view_dir => {
    let view_path = path.join(view_dir, layout || 'layout');

    if (!path.extname(view_path))
      view_path += extension;

    return view_path;
  });
  let elem;
  for (elem in layout_filename) if (cache[elem]) return render_with_layout(elem, cache[elem], options, cb)

  let prependFilenameToError = (filename, err) => {
    // prepend to the message
    if (typeof err.message === 'string')
      err.message = filename + ': ' + err.message

    return err
  }

  let cacheAndCompile = (filename, str) => {
    let layout_template = handlebars.compile(str);
    if (options.cache)
      cache[filename] = layout_template;

    render_with_layout(filename, layout_template, options, cb)
  }

  let tryReadFileAndCache = templates => {
    let template = templates.shift();

    fs.readFile(template, 'utf8').then(str => 
      cacheAndCompile(template, str)
    ).catch(err => {
      if (layout && templates.length === 0)
        return cb(err);
      if (templates.length > 0)
        return tryReadFileAndCache(templates);
      return render_file(options, cb);
    });
  }

  tryReadFileAndCache(layout_filename);
}

module.exports = new Instance();
module.exports.create = handlebars => new Instance(handlebars);