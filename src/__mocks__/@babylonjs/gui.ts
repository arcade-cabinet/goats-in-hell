// Mock for @babylonjs/gui — provides minimal stubs for unit tests

export class AdvancedDynamicTexture {
  static CreateFullscreenUI() {
    return new AdvancedDynamicTexture();
  }
  addControl() {}
  removeControl() {}
  dispose() {}
}

export class TextBlock {
  text = '';
  color = '';
  fontSize = 0;
}

export class Rectangle {
  addControl() {}
}

export class StackPanel {
  addControl() {}
}

export class Control {}
export class Image {}
export class Ellipse {}
