import type { Metadata } from 'next';
import { CadClient } from './CadClient';

export const metadata: Metadata = {
  title: 'Easy CAD',
  description: '2D drafting — draw, edit, and export DXF/SVG with an AutoCAD-style command line.',
};

export default function CadPage() {
  return <CadClient />;
}
