export interface StatDelta {
  readonly value: string | number;
  readonly direction: 'up' | 'down';
}

export interface StatModel {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly delta?: StatDelta;
}
