import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MagneticButton from './MagneticButton';
import { BlueprintProvider } from '../../contexts/BlueprintContext';

describe('MagneticButton', () => {
  it('renders children correctly', () => {
    render(
      <BlueprintProvider>
        <MagneticButton>Click Me</MagneticButton>
      </BlueprintProvider>
    );
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <BlueprintProvider>
        <MagneticButton onClick={handleClick}>Click Me</MagneticButton>
      </BlueprintProvider>
    );
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    const handleClick = vi.fn();
    render(
      <BlueprintProvider>
        <MagneticButton onClick={handleClick}>Click Me</MagneticButton>
      </BlueprintProvider>
    );
    const button = screen.getByText('Click Me');
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(
      <BlueprintProvider>
        <MagneticButton>Click Me</MagneticButton>
      </BlueprintProvider>
    );
    const button = screen.getByText('Click Me');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });
});
