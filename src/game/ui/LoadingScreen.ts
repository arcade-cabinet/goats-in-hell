/**
 * Babylon.js GUI loading screen — procedural hellish goat + progress bar.
 * Shown while 3D models, textures, and audio assets load.
 */
import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  StackPanel,
  Control,
} from '@babylonjs/gui';
import {Scene} from '@babylonjs/core';

export class LoadingScreen {
  private gui: AdvancedDynamicTexture;
  private progressBar: Rectangle;
  private progressFill: Rectangle;
  private labelText: TextBlock;
  private percentText: TextBlock;
  private goatArt: TextBlock;

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('Loading', true, scene);

    // Full-screen dark background
    const bg = new Rectangle('loadBg');
    bg.width = '100%';
    bg.height = '100%';
    bg.background = '#0a0204';
    bg.color = 'transparent';
    bg.thickness = 0;
    this.gui.addControl(bg);

    // Center panel
    const panel = new StackPanel('loadPanel');
    panel.width = '500px';
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    bg.addControl(panel);

    // Procedural goat ASCII art — hellish goat skull
    this.goatArt = new TextBlock('goatArt');
    this.goatArt.text = [
      '        ╱╲     ╱╲',
      '       ╱  ╲   ╱  ╲',
      '      ╱    ╲_╱    ╲',
      '     │  ◈        ◈  │',
      '     │       ▼       │',
      '      ╲    ┌───┐    ╱',
      '       ╲   │ ▲ │   ╱',
      '        ╲  └───┘  ╱',
      '         ╲_______╱',
      '          │ ║║║ │',
      '          │ ║║║ │',
      '         ╱│     │╲',
      '        ╱ └─────┘ ╲',
    ].join('\n');
    this.goatArt.color = '#cc2200';
    this.goatArt.fontSize = 16;
    this.goatArt.fontFamily = 'monospace';
    this.goatArt.height = '260px';
    this.goatArt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.goatArt.shadowColor = '#ff4400';
    this.goatArt.shadowBlur = 8;
    panel.addControl(this.goatArt);

    // Title
    const title = new TextBlock('loadTitle');
    title.text = 'DESCENDING INTO HELL...';
    title.color = '#ff3300';
    title.fontSize = 28;
    title.fontFamily = 'monospace';
    title.height = '50px';
    title.shadowColor = '#ff0000';
    title.shadowBlur = 12;
    panel.addControl(title);

    // Spacer
    const spacer = new Rectangle('spacer');
    spacer.height = '20px';
    spacer.background = 'transparent';
    spacer.color = 'transparent';
    spacer.thickness = 0;
    panel.addControl(spacer);

    // Progress bar container
    this.progressBar = new Rectangle('progressBar');
    this.progressBar.width = '400px';
    this.progressBar.height = '24px';
    this.progressBar.background = '#1a0508';
    this.progressBar.color = '#660000';
    this.progressBar.thickness = 2;
    this.progressBar.cornerRadius = 4;
    panel.addControl(this.progressBar);

    // Progress fill
    this.progressFill = new Rectangle('progressFill');
    this.progressFill.width = '0%';
    this.progressFill.height = '100%';
    this.progressFill.background = '#cc2200';
    this.progressFill.color = 'transparent';
    this.progressFill.thickness = 0;
    this.progressFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.progressFill.shadowColor = '#ff4400';
    this.progressFill.shadowBlur = 6;
    this.progressBar.addControl(this.progressFill);

    // Percent text
    this.percentText = new TextBlock('percentText');
    this.percentText.text = '0%';
    this.percentText.color = '#ffffff';
    this.percentText.fontSize = 14;
    this.percentText.fontFamily = 'monospace';
    this.progressBar.addControl(this.percentText);

    // Spacer
    const spacer2 = new Rectangle('spacer2');
    spacer2.height = '12px';
    spacer2.background = 'transparent';
    spacer2.color = 'transparent';
    spacer2.thickness = 0;
    panel.addControl(spacer2);

    // Label text (what's currently loading)
    this.labelText = new TextBlock('loadLabel');
    this.labelText.text = 'Initializing...';
    this.labelText.color = '#884422';
    this.labelText.fontSize = 16;
    this.labelText.fontFamily = 'monospace';
    this.labelText.height = '30px';
    panel.addControl(this.labelText);
  }

  update(progress: number, label: string): void {
    const pct = Math.min(Math.max(progress, 0), 1);
    this.progressFill.width = `${Math.round(pct * 100)}%`;
    this.percentText.text = `${Math.round(pct * 100)}%`;
    this.labelText.text = label;

    // Pulse the goat glow intensity
    const time = Date.now() * 0.003;
    const pulse = 4 + Math.sin(time) * 4;
    this.goatArt.shadowBlur = pulse;
  }

  dispose(): void {
    this.gui.dispose();
  }
}
