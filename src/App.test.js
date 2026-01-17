import { render, screen } from '@testing-library/react';
import App from './App';

test('renders QR Scanner heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/QR Scanner/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders Parsec 6.0 description', () => {
  render(<App />);
  const descriptionElement = screen.getByText(/Parsec 6.0/i);
  expect(descriptionElement).toBeInTheDocument();
});
