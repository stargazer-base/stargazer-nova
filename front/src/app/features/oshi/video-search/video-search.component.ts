import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // ★追加

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  oshiName: string;
  tags: string[];
  duration: string;
  publishedAt: string;
  isSelected?: boolean;
}

@Component({
  selector: 'app-video-search',
  templateUrl: './video-search.component.html',
  styleUrls: ['./video-search.component.css'],
})
export class VideoSearchComponent implements OnInit {
  isEditMode = false;
  videos: Video[] = [];
  currentPage = 1;
  totalPages = 1;
  currentType = 'title'; // ページ切り替え時に検索条件を維持するため
  currentKeyword = ''; // ページ切り替え時に検索条件を維持するため
  selectedVideoIds = new Set<string>(); //選択されたIDを記憶する箱を用意

  // HttpClientをコンストラクタで受け取る
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // 画面が開いた時にAPIからデータを取得する
    this.searchVideos();
  }

  // バックエンドのAPIを叩いて動画を取得するメソッド
  searchVideos(
    type: string = this.currentType,
    keyword: string = this.currentKeyword,
    page: number = 1,
  ) {
    // 検索条件を保存
    this.currentType = type;
    this.currentKeyword = keyword;

    // URLに page と limit を追加
    const apiUrl = `http://localhost:3000/api/videos?type=${type}&keyword=${keyword}&page=${page}&limit=40`;

    // 受け取るデータが配列からオブジェクト（{ videos: [...], totalPages: ... }）に変わるので any で受ける
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.videos = response.videos.map((video: any) => ({
          ...video,
          // 記憶箱の中にIDが含まれていれば true にする！
          isSelected: this.selectedVideoIds.has(video.id),
        }));
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
      },
      error: (err) => console.error('動画データの取得に失敗しました', err),
    });
  }

  // ページ切り替えメソッド
  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      // スクロールを一番上に戻す（UX向上）
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.searchVideos(this.currentType, this.currentKeyword, newPage);
    }
  }

  toggleMode(mode: 'search' | 'edit') {
    this.isEditMode = mode === 'edit';
    if (!this.isEditMode) {
      this.selectedVideoIds.clear(); // 記憶箱を空にする
      this.videos.forEach((v) => (v.isSelected = false));
    }
  }

  onVideoClick(event: Event, video: Video) {
    if (this.isEditMode) {
      event.preventDefault();
      video.isSelected = !video.isSelected;

      // 選ばれたら箱に入れ、外されたら箱から出す
      if (video.isSelected) {
        this.selectedVideoIds.add(video.id);
      } else {
        this.selectedVideoIds.delete(video.id);
      }
    }
  }
}
