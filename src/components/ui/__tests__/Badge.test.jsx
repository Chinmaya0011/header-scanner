import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "../Badge";

describe("Badge Component", () => {
  it("renders children content correctly", () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  it("applies default info variant classes", () => {
    render(<Badge>Info Badge</Badge>);
    const badgeElement = screen.getByText("Info Badge");
    expect(badgeElement).toHaveClass("border-border");
    expect(badgeElement).toHaveClass("bg-surface");
    expect(badgeElement).toHaveClass("text-text-dim");
  });

  it("applies correct variant classes", () => {
    const { rerender } = render(<Badge variant="success">Success Badge</Badge>);
    let badgeElement = screen.getByText("Success Badge");
    expect(badgeElement).toHaveClass("border-success/30");
    expect(badgeElement).toHaveClass("text-success");

    rerender(<Badge variant="warning">Warning Badge</Badge>);
    badgeElement = screen.getByText("Warning Badge");
    expect(badgeElement).toHaveClass("border-warning/30");
    expect(badgeElement).toHaveClass("text-warning");

    rerender(<Badge variant="danger">Danger Badge</Badge>);
    badgeElement = screen.getByText("Danger Badge");
    expect(badgeElement).toHaveClass("border-danger/30");
    expect(badgeElement).toHaveClass("text-danger");

    rerender(<Badge variant="accent">Accent Badge</Badge>);
    badgeElement = screen.getByText("Accent Badge");
    expect(badgeElement).toHaveClass("border-accent/30");
    expect(badgeElement).toHaveClass("text-accent");
  });

  it("applies custom className alongside base classes", () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badgeElement = screen.getByText("Custom Badge");
    expect(badgeElement).toHaveClass("custom-class");
    expect(badgeElement).toHaveClass("inline-flex");
  });

  it("passes additional props to the container", () => {
    render(<Badge data-testid="test-badge">Props Badge</Badge>);
    expect(screen.getByTestId("test-badge")).toBeInTheDocument();
  });
});
