import React from 'react';
import { render } from '@testing-library/react';
import App from '../App.js';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

test('[ENDPOINT] Server Health', function() {
  var healthEndpointStatusCode = fetch('http://3.133.110.55:8000/health').then(
    function (result) {
      return result.status;
    }
  )

  return expect(healthEndpointStatusCode).to.eventually.equal(200);
})

test('[ENDPOINT] Server Signin', function() {
  var signinEndpointResult = fetch('http://3.133.110.55:8000/signIn', {
    method: 'post',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      'username': 'test',
      'passwordHash': 'test'
    })
  }).then (function (result) {
    return result.status;
  })

  return expect(signinEndpointResult).to.eventually.equal(200);
})

test('[ENDPOINT] Server GetNoteText', function() {
  var signinEndpointResult = fetch('http://3.133.110.55:8000/getNoteText', {
    method: 'post',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      'username': 'test',
      'noteName': 'test',
      'token': 'test'
    })
  }).then (function (result) {
    return result.status;
  })

  return expect(signinEndpointResult).to.eventually.equal(401);
})

test('[ENDPOINT] Server GetNoteNames', function() {
  var signinEndpointResult = fetch('http://3.133.110.55:8000/getNoteText', {
    method: 'post',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      'username': 'test',
      'noteName': 'test',
      'token': 'test'
    })
  }).then (function (result) {
    return result.status;
  })

  return expect(signinEndpointResult).to.eventually.equal(401);
})

test('[ENDPOINT] Server UpdateNote', function() {
  var signinEndpointResult = fetch('http://3.133.110.55:8000/updateNote', {
    method: 'post',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      'username': 'test',
      'noteName': 'test',
      'noteText': 'test',
      'token': 'test'
    })
  }).then (function (result) {
    return result.status;
  })

  return expect(signinEndpointResult).to.eventually.equal(401);
})

test('[ENDPOINT] Server AddNote', function() {
  var signinEndpointResult = fetch('http://3.133.110.55:8000/addNote', {
    method: 'post',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      'username': 'test',
      'noteName': 'test',
      'noteText': 'test',
      'token': 'test'
    })
  }).then (function (result) {
    return result.status;
  })

  return expect(signinEndpointResult).to.eventually.equal(401);
})

// Disabled until Sprint 5
// test('[ENDPOINT] Server AddUser', function() {
//   var signinEndpointResult = fetch('http://3.133.110.55:8000/addUser', {
//     method: 'post',
//     headers: {'Content-Type':'application/json'},
//     body: JSON.stringify({
//       'username': 'testyMcTestFace',
//       'passwordHash': 'superdupersecretpasshashlol'
//     })
//   }).then (function (result) {
//     return result;
//   })

//   return expect(signinEndpointResult).to.eventually.equal(200);
// })