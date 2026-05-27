class SvgIcon extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && oldValue !== newValue) {
      this.loadSvg(newValue);
    }
  }

  async loadSvg(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load SVG');

      const svgText = await response.text();
      this.innerHTML = svgText;

      const svg = this.querySelector('svg');
      if (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
      }
    } catch (err) {
      console.error(err);
    }
  }
}

customElements.define('svg-icon', SvgIcon);
