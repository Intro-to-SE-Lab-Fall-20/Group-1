import React from 'react';
import { queryByAttribute, queryByTestId, render } from '@testing-library/react';
import App from '../App.js';
import { assert, expect } from "chai";

test('[APP] Main Page Successfully Renders', () => {
  const { getByText } = render(<App />); 
  const Title = getByText(/EC Client/i);
  const UsernameEntry = getByText(/Username:/i);
  const PasswordEntry = getByText(/Password:/i);

  assert.isNotNull(Title);
  assert.isNotNull(UsernameEntry);
  assert.isNotNull(PasswordEntry);
});