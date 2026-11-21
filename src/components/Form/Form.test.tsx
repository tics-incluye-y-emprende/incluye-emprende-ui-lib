import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "./Form";

describe("Form", () => {
  it("renders a native form with its children and attributes", () => {
    render(
      <Form aria-label="Contact" action="/send" method="post" className="extra">
        <input name="email" />
      </Form>,
    );
    const form = screen.getByRole("form", { name: "Contact" });
    expect(form.tagName).toBe("FORM");
    expect(form).toHaveAttribute("action", "/send");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveClass("extra");
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying form element", () => {
    const ref = createRef<HTMLFormElement>();
    render(<Form ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });

  it("calls onSubmit when submitted", async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Send</button>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
