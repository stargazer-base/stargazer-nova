import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// コンポーネントのインポート
import { VideoSearchComponent } from './features/oshi/video-search/video-search.component';
import { CalendarComponent } from './features/oshi/calendar/calendar.component';
import { TodoComponent } from './features/life/todo/todo.component';
import { BudgetBookComponent } from './features/life/budget-book/budget-book.component';
import { AppIdeaComponent } from './features/life/app-idea/app-idea.component';

const routes: Routes = [
  { path: 'video-search', component: VideoSearchComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'todo', component: TodoComponent },
  { path: 'budget-book', component: BudgetBookComponent },
  { path: 'app-idea', component: AppIdeaComponent },
  { path: '', redirectTo: '/video-search', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
