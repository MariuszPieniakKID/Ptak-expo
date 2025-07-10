import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Test that the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
