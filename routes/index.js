var express = require('express');
var router = express.Router();

var auth = require('./auth.js');
var sources = require('./sources.js');
var admin = require('./admin.js');
var leagues = require('./leagues.js');
// var user = require('./users.js');

/*
 * Routes that can be accessed by any one
 */
// router.post('/login', auth.login);

/*
 * Routes that can be accessed only by autheticated users
 */
router.get('/api/v1/sources', sources.getAll);
router.get('/api/v1/leagues', leagues.getAll);
// router.post('/api/v1/product/', products.create);
// router.put('/api/v1/product/:id', products.update);
// router.delete('/api/v1/product/:id', products.delete);
//

// /*
//  * Routes that can be accessed only by authenticated & authorized users
//  */
// router.get('/api/v1/admin/users', user.getAll);
// router.get('/api/v1/admin/user/:id', user.getOne);
router.post('/api/v1/admin/user/', admin.createUser);
// router.put('/api/v1/admin/user/:id', user.update);
// router.delete('/api/v1/admin/user/:id', user.delete);



module.exports = router;
