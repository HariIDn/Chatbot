var express = require('express');
var router = express.Router();
// var path = require('path'); // Anda tidak lagi memerlukan 'path' di sini untuk res.render

/* GET home page. */
router.get('/', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('landingpage', { title: 'Home' }); // Anda bisa (opsional) mengirim data seperti title
});

/* GET Chatbot. */
router.get('/chatbot', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('chatbot', { title: 'Chatbot' }); // Anda bisa (opsional) mengirim data seperti title
});

/* GET Dashboard Admin. */
router.get('/admin', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('dashboard_admin', { title: 'Dashboard Admin' }); // Anda bisa (opsional) mengirim data seperti title
});

/* GET Dashboard Dontor. */
router.get('/doctor', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('dashboard_doctor', { title: 'Dashboard Dokter' }); // Anda bisa (opsional) mengirim data seperti title
});

/* GET Form. */
router.get('/reservation', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('reservation', { title: 'Form' }); // Anda bisa (opsional) mengirim data seperti title
});

/* GET Form. */
router.get('/login', function (req, res, next) {
  // Gunakan res.render untuk memanfaatkan view engine (EJS) yang sudah di-setup
  // Express akan otomatis mencari 'views/index.html'
  res.render('login', { title: 'Login' }); // Anda bisa (opsional) mengirim data seperti title
});

module.exports = router;