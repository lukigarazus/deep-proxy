export type PathElement = string | number;
export type Path = PathElement[];

export interface ChangeDescription {
  path: Path;
  oldValue: any;
  newValue: any;
}

export interface History {
  push: (value: ChangeDescription) => number;
  previous: () => boolean;
  next: () => boolean;
}
