import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { VideoSearchComponent } from './features/oshi/video-search/video-search.component';
import { CalendarComponent } from './features/oshi/calendar/calendar.component';
import { TodoComponent } from './features/life/todo/todo.component';
import { BudgetBookComponent } from './features/life/budget-book/budget-book.component';
import { AppIdeaComponent } from './features/life/app-idea/app-idea.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    VideoSearchComponent,
    CalendarComponent,
    TodoComponent,
    BudgetBookComponent,
    AppIdeaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
