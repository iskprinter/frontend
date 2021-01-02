import { HttpTestingController } from '@angular/common/http/testing';

export async function blockUntilRequestReceived(httpMock: HttpTestingController): Promise<void> {
  const INTERVAL = 100; // ms
  while ((httpMock as any).open.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, INTERVAL));
  }
}
