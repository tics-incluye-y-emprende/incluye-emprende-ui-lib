import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies default variant and size classes', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ie-button', 'ie-button--primary', 'ie-button--md');
    expect(button).not.toHaveClass('ie-button--full-width');
  });

  it('applies variant, size and fullWidth classes', () => {
    render(
      <Button variant="secondary" size="lg" fullWidth>
        Custom
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass(
      'ie-button--secondary',
      'ie-button--lg',
      'ie-button--full-width',
    );
  });

  it('merges a custom className', () => {
    render(<Button className="extra">Styled</Button>);
    expect(screen.getByRole('button')).toHaveClass('ie-button', 'extra');
  });

  it('defaults to type="button" so it does not submit forms', () => {
    render(<Button>Safe</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
