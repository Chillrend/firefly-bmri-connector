const basicAuth = require('basic-auth');

const auth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        // User is already authenticated, proceed to the next middleware/route
        return next();
    }

    const user = basicAuth(req);
    const username = process.env.USER;
    const password = process.env.PASSWORD;

    if (user && user.name === username && user.pass === password) {
        // Set session as authenticated
        req.session.authenticated = true;
        return next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        return res.status(401).send('Authentication required.');
    }
}

module.exports = auth;