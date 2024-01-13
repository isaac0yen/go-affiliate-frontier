const express = require('express');
const app = require('../app');
const server = require('../bin/www');

module.exports = (req, res) => {
  const { method, url } = req;
  if (req.method === 'GET') {
    server();
    res.status(200).send('Server is running');
  } else {
    res.status(405).send('Method not allowed');
  }
};
