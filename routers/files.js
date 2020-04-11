const { Router }  = require('express')
const router      = Router()
const path        = require("path");
const UglifyJS    = require("uglify-es");
const sass        = require("node-sass")
const fs          = require("fs").promises
const createError = require('http-errors')
const util        = require('util')

let pageCache = []

const FileType = {
  SCRIPT: 1,
  STYLE: 2
}

const renderSass = util.promisify(sass.render)

const loadFile = async (filePath, fileType, next) => {
  try {
    let data;
    if (pageCache[filePath] == null) {
      data = await fs.readFile(filePath, "utf-8")
      if (fileType == FileType.SCRIPT) data = UglifyJS.minify(data).code
      else if (fileType == FileType.STYLE) {
        let render = await renderSass({
          data,
          outputStyle: "compressed",
          includePaths: [path.join(__dirname, "./../website/lib/styles")]
        })
        data = render.css.toString()
      }
      pageCache[filePath] = data
    } else data = pageCache[filePath]
    return data
  } catch (e) {
    next(createError(404, "File not found!"))
  }
}

router.get("/:page/:file.js", async (request, response, next) =>
  response.attachment(`${request.params.file}.js`)
    .type('js')
    .send(await loadFile(path.join(__dirname, `../webiste/pages/${request.params.page}/${request.params.file}.js`), FileType.SCRIPT, next))
);

router.get("/:page/:file.css", async (request, response, next) =>
  response.attachment(`${request.params.file}.css`)
    .type('css')
    .send(await loadFile(path.join(__dirname, `../webiste/pages/${request.params.page}/${request.params.file}.scss`), FileType.STYLE, next))
);

router.get("/:file.js", async (request, response, next) =>
  response.attachment(`${request.params.file}.js`)
    .type('js')
    .send(await loadFile(path.join(__dirname, `../webiste/lib/scripts/${request.params.file}.js`), FileType.SCRIPT, next))
);

router.get("/:file.css", async (request, response, next) =>
  response.attachment(`${request.params.file}.css`)
    .type('css')
    .send(await loadFile(path.join(__dirname, `../webiste/lib/styles/${request.params.file}.scss`), FileType.STYLE, next))
);

router.get("/:file.woff2", async (request, response, next) =>
  response.sendFile(path.join(__dirname, `../webiste/lib/fonts/${request.params.file}.woff2`))
);

module.exports = router;