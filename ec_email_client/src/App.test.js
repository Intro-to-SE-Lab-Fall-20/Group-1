import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

test('derp', function() {
  var healthEndpoint = fetch('http://3.133.110.55:8000/health').then(
    function (result) {
      return result.status;
    }
  )

  return expect(healthEndpoint).to.eventually.equal(200);
})


// test('renders ec app selection page', () => {
//   const { getByText } = render(<App />); 
//   const Title = getByText(/EC Apps/i);
//   const ECEmailClientButton = getByText(/EC > Gmail/i);
//   const ECNotepadButton = getByText(/I love notes!/i);

//   expect(Title).toBeInTheDocument();
//   expect(ECEmailClientButton).toBeInTheDocument();
//   expect(ECNotepadButton).toBeInTheDocument();
// });