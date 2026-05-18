export class SmokeRollError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmokeRollError";
  }
}

export class ManifestError extends SmokeRollError {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export class ExecutionError extends SmokeRollError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}

