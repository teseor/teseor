import { Button } from "@teseor/react";

const ARROW_LEFT = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ARROW_RIGHT = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function App() {
  return (
    <main>
      <header>
        <h1>Teseor preview</h1>
        <p>
          Each demo shows the same Button rendered two ways: raw HTML using <code>t-button</code>{" "}
          plus <code>data-*</code> attributes (left), and the <code>@teseor/react</code> wrapper
          (right). The two panes should render identically — that's the point.
        </p>
      </header>

      <section>
        <h2>Variants</h2>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button type="button" className="t-button" data-variant="solid" data-intent="primary">
                Solid
              </button>
              <button
                type="button"
                className="t-button"
                data-variant="outline"
                data-intent="primary"
              >
                Outline
              </button>
              <button type="button" className="t-button" data-variant="ghost" data-intent="primary">
                Ghost
              </button>
              <button type="button" className="t-button" data-variant="link" data-intent="primary">
                Link
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary">
                Solid
              </Button>
              <Button variant="outline" intent="primary">
                Outline
              </Button>
              <Button variant="ghost" intent="primary">
                Ghost
              </Button>
              <Button variant="link" intent="primary">
                Link
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Intents</h2>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button type="button" className="t-button" data-variant="solid" data-intent="primary">
                Primary
              </button>
              <button type="button" className="t-button" data-variant="solid" data-intent="neutral">
                Neutral
              </button>
              <button type="button" className="t-button" data-variant="solid" data-intent="success">
                Success
              </button>
              <button type="button" className="t-button" data-variant="solid" data-intent="warning">
                Warning
              </button>
              <button type="button" className="t-button" data-variant="solid" data-intent="danger">
                Danger
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary">
                Primary
              </Button>
              <Button variant="solid" intent="neutral">
                Neutral
              </Button>
              <Button variant="solid" intent="success">
                Success
              </Button>
              <Button variant="solid" intent="warning">
                Warning
              </Button>
              <Button variant="solid" intent="danger">
                Danger
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Sizes</h2>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-size="sm"
              >
                Small
              </button>
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-size="md"
              >
                Medium
              </button>
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-size="lg"
              >
                Large
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary" size="sm">
                Small
              </Button>
              <Button variant="solid" intent="primary" size="md">
                Medium
              </Button>
              <Button variant="solid" intent="primary" size="lg">
                Large
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>States</h2>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button type="button" className="t-button" data-variant="solid" data-intent="primary">
                Default
              </button>
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                disabled
              >
                Disabled
              </button>
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-loading="true"
                aria-busy="true"
                disabled
              >
                <span data-button-label="">Loading</span>
                <span data-button-spinner="" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary">
                Default
              </Button>
              <Button variant="solid" intent="primary" disabled>
                Disabled
              </Button>
              <Button variant="solid" intent="primary" loading>
                Loading
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Icon slots</h2>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button type="button" className="t-button" data-variant="solid" data-intent="primary">
                <span data-button-icon="" data-position="start">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span data-button-label="">Back</span>
                <span data-button-spinner="" aria-hidden="true" />
              </button>
              <button type="button" className="t-button" data-variant="solid" data-intent="primary">
                <span data-button-label="">Next</span>
                <span data-button-icon="" data-position="end">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span data-button-spinner="" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary" iconStart={ARROW_LEFT}>
                Back
              </Button>
              <Button variant="solid" intent="primary" iconEnd={ARROW_RIGHT}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Block — responsive</h2>
        <p>
          <code>block</code> stretches the button to the inline-size of its container. Pass an
          object to opt-in per breakpoint, e.g. <code>{`{ base: true, md: false }`}</code>.
        </p>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-block="true"
              >
                Always block
              </button>
            </div>
            <div className="preview-row">
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="neutral"
                data-block="true"
                data-block-md="false"
              >
                Block on mobile, auto from md
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary" block>
                Always block
              </Button>
            </div>
            <div className="preview-row">
              <Button variant="solid" intent="neutral" block={{ base: true, md: false }}>
                Block on mobile, auto from md
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Size — responsive</h2>
        <p>
          Pass <code>size</code> as a value for fixed sizing, or as an object{" "}
          <code>{`{ base, md, lg, xl, "2xl" }`}</code> to shift across breakpoints.
        </p>
        <div className="preview-grid">
          <div className="preview-pane">
            <h3>HTML + CSS</h3>
            <div className="preview-row">
              <button
                type="button"
                className="t-button"
                data-variant="solid"
                data-intent="primary"
                data-size="sm"
                data-size-md="md"
                data-size-lg="lg"
              >
                Grows with viewport
              </button>
            </div>
          </div>
          <div className="preview-pane">
            <h3>React wrapper</h3>
            <div className="preview-row">
              <Button variant="solid" intent="primary" size={{ base: "sm", md: "md", lg: "lg" }}>
                Grows with viewport
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
