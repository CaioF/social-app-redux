let searchIgnore = (value, ignores) => ignores.some(search => search.test(value))
module.exports = (ignoreHosts = [], ignoreRoutes = [], redirectCode = 302) =>
  async (req, res, next) => {
    const isNotSecure = (!req.get('x-forwarded-port') && req.protocol !== 'https') ||
      parseInt(req.get('x-forwarded-port'), 10) !== 443 &&
        (parseInt(req.get('x-forwarded-port'), 10) === parseInt(req.get('x-forwarded-port'), 10))

    if (isNotSecure && !searchIgnore(req.get('host'), ignoreHosts) &&
      !searchIgnore(req.path, ignoreRoutes))
      return res.redirect(redirectCode, 'https://' + req.get('host') + req.url)

    next()
}