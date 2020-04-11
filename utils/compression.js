const accepts      = require('accepts');
const { Buffer }   = require('safe-buffer');
const bytes        = require('bytes');
const compressible = require('compressible');
const onHeaders    = require('on-headers');
const vary         = require('vary');
const zlib         = require('zlib');

const cacheControlNoTransformRegExp = /(?:^|,)\s*?no-transform\s*?(?:,|$)/

const addListeners    = (stream, on, listeners) => listeners.forEach(elem => on.apply(stream, elem))
const chunkLength     = (chunk, encoding)       => !chunk ? 0 : (!Buffer.isBuffer(chunk) ? Buffer.byteLength(chunk, encoding) : chunk.length);
const shouldCompress  = (req, res)              => (!res.getHeader('Content-Type') || !compressible(res.getHeader('Content-Type'))) ? false : true
const shouldTransform = (req, res)              => !res.getHeader('Cache-Control') || !cacheControlNoTransformRegExp.test(res.getHeader('Cache-Control'))
const toBuffer        = (chunk, encoding)       => !Buffer.isBuffer(chunk) ? Buffer.from(chunk, encoding) : chunk

function compression (opts = {}) {
  // options
  let filter = opts.filter || shouldCompress
  let threshold = bytes.parse(opts.threshold) || 1024

  return async function compression (req, res, next) {
    let ended = false
    let length
    let listeners = []
    let stream

    let _end = res.end
    let _on = res.on
    let _write = res.write

    res.flush = () => stream && stream.flush()

    res.write = function (chunk, encoding) {
      if (ended)
        return false
      if (!this._header)
        this._implicitHeader()

      return stream
        ? stream.write(toBuffer(chunk, encoding))
        : _write.call(this, chunk, encoding)
    }

    res.end = function (chunk, encoding) {
      if (ended)
        return false

      if (!this._header) {
        if (!this.getHeader('Content-Length'))
          length = chunkLength(chunk, encoding)
        this._implicitHeader()
      }

      if (!stream)
        return _end.call(this, chunk, encoding)

      // mark ended
      ended = true

      // write Buffer for Node.js 0.8
      return chunk
        ? stream.end(toBuffer(chunk, encoding))
        : stream.end()
    }

    res.on = (type, listener) => {
      if (!listeners || type !== 'drain')
        return _on.call(this, type, listener)

      if (stream)
        return stream.on(type, listener)

      // buffer listeners for future stream
      listeners.push([type, listener])

      return this
    }

    let nocompress = msg => {
      addListeners(res, _on, listeners)
      listeners = null
    }

    onHeaders(res, () => {
      if (!filter(req, res)) {
        nocompress('filtered')
        return
      }

      if (!shouldTransform(req, res)) {
        nocompress('no transform')
        return
      }

      // vary
      vary(res, 'Accept-Encoding')

      // content-length below threshold
      if (Number(res.getHeader('Content-Length')) < threshold || length < threshold) {
        nocompress('size below threshold')
        return
      }

      let encoding = res.getHeader('Content-Encoding') || 'identity'

      // already encoded
      if (encoding !== 'identity') {
        nocompress('already encoded')
        return
      }

      // head
      if (req.method === 'HEAD') {
        nocompress('HEAD request')
        return
      }

      // compression method
      let accept = accepts(req)
      let method = accept.encoding(['gzip', 'deflate', 'identity'])

      // we really don't prefer deflate
      if (method === 'deflate' && accept.encoding(['gzip']))
        method = accept.encoding(['gzip', 'identity'])

      // negotiation failed
      if (!method || method === 'identity') {
        nocompress('not acceptable')
        return
      }

      stream = method === 'gzip'
        ? zlib.createGzip(opts)
        : zlib.createDeflate(opts)

      // add buffered listeners to stream
      addListeners(stream, stream.on, listeners)

      // header fields
      res.setHeader('Content-Encoding', method)
      res.removeHeader('Content-Length')

      // compression
      stream.on('data', chunk => (_write.call(res, chunk) === false) && stream.pause())

      stream.on('end', () => _end.call(res))

      _on.call(res, 'drain', () => stream.resume())
    })

    next()
  }
}

module.exports = compression
module.exports.filter = shouldCompress