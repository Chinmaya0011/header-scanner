import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";

// Mock lucide-react icons if needed, but they are simple SVGs
jest.mock("lucide-react", () => ({
  Loader2: (props) => <svg data-testid="loader" {...props} />,
}));

describe("Button Component", () => {
  it("renders children content correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("shows loader and is disabled when loading is true", () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeDisabled();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders custom icon when provided and not loading", () => {
    const MockIcon = (props) => <span data-testid="custom-icon" {...props}>Icon</span>;
    render(<Button icon={MockIcon}>With Icon</Button>);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("loader")).not.inTheDocument;
  });

  it("applies correct variant and size classes", () => {
    const { rerender } = render(<Button variant="primary" size="md">Btn</Button>);
    let button = screen.getByRole("button", { name: /btn/i });
    expect(button).toHaveClass("bg-accent");
    expect(button).toHaveClass("px-4.5");

    rerender(<Button variant="danger" size="sm">Btn</Button>);
    button = screen.getByRole("button", { name: /btn/i });
    expect(button).toHaveClass("bg-danger/10");
    expect(button).toHaveClass("px-3");
  });
});
