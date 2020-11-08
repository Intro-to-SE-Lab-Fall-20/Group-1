import React from 'react';
import { queryByAttribute, queryByTestId, render } from '@testing-library/react';
import App from '../App.js';
import LoginPage from '../pages/LoginPage.js';
import '@testing-library/jest-dom/extend-expect';
//import { expect } from 'chai';
import InboxPageComponent from '../components/InboxPageComponent.js';

test('[APP] Main Page Successfully Renders', () => {
  const { getByText } = render(<App />); 
  const Title = getByText(/EC Apps/i);
  const ECEmailClientButton = getByText(/EC > Gmail/i);
  const ECNotepadButton = getByText(/I love notes!/i);

  expect(Title).toBeInTheDocument();
  expect(ECEmailClientButton).toBeInTheDocument();
  expect(ECNotepadButton).toBeInTheDocument();
});