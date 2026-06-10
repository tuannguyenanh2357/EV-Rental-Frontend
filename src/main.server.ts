import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

export default function bootstrap(context: any) {
  return bootstrapApplication(AppComponent, appConfig, context);
}
