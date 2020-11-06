import React from 'react';
import { render } from '@testing-library/react';
import App from '../App.js';

test('renders ec app selection page', () => {
  const { getByText } = render(<App />); 
  const Title = getByText(/EC Apps/i);
  const ECEmailClientButton = getByText(/EC > Gmail/i);
  const ECNotepadButton = getByText(/I love notes!/i);

  expect(Title).toBeInTheDocument();
  expect(ECEmailClientButton).toBeInTheDocument();
  expect(ECNotepadButton).toBeInTheDocument();
});