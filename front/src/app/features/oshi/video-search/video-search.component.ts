import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  selectedVideoIds = new Set<string>(); // 選択されたIDを記憶する箱
  newTagsInput: string = ''; // 入力されたタグを保持する変数
  isModalOpen = false;
  selectedVideoUrl: SafeResourceUrl | null = null;

  // HttpClientをコンストラクタで受け取る
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

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
    const apiUrl = `https://stargazer-nova.onrender.com/api/videos?type=${type}&keyword=${keyword}&page=${page}&limit=40`;

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

  // 検索モードで実行ボタン押下時のメソッド
  onSearchSubmit() {
    // 必ず1ページ目から検索し直す
    this.searchVideos(this.currentType, this.currentKeyword, 1);
  }

  // タグ一括付与を実行するメソッド
  applyTags() {
    // エラーチェック（バリデーション）
    if (this.selectedVideoIds.size === 0) {
      alert('動画が選択されていません。');
      return;
    }
    if (!this.newTagsInput.trim()) {
      alert('追加するタグを入力してください。');
      return;
    }

    // 入力された文字列を配列に変換（全角/半角スペースや、カンマ・読点で分割）
    const tagsToAdd = this.newTagsInput
      .split(/[,\s、]+/)
      .filter((tag) => tag.trim() !== '');

    if (tagsToAdd.length === 0) {
      alert('追加するタグを入力してください。');
      return;
    }

    // バックエンドAPIへPOSTリクエストを送信
    const apiUrl = 'https://stargazer-nova.onrender.com/api/videos/tags';
    const payload = {
      videoIds: Array.from(this.selectedVideoIds),
      tags: tagsToAdd,
    };

    this.http.post(apiUrl, payload).subscribe({
      next: (response: any) => {
        // 成功時の処理
        alert(`${this.selectedVideoIds.size}件の動画にタグを追加しました！`);
        this.newTagsInput = ''; // 入力欄をリセット

        this.toggleMode('search'); // 編集モードを終了して通常モードに戻す
        this.searchVideos(); // 画面を最新のDBの状態に更新（タグが反映される）
      },
      error: (err) => {
        console.error('タグの更新に失敗しました', err);
        alert('エラーが発生しました。通信状態を確認してください。');
      },
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

  // モード変更メソッド
  toggleMode(mode: 'search' | 'edit') {
    this.isEditMode = mode === 'edit';
    if (!this.isEditMode) {
      this.selectedVideoIds.clear(); // 記憶箱を空にする
      this.videos.forEach((v) => (v.isSelected = false));
    }
  }

  // 動画押下時のメソッド
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
    } else {
      // 編集モードでない場合は動画モーダルを開く
      this.openVideoModal(video);
    }
  }

  // 動画モーダルを開く処理
  openVideoModal(video: Video) {
    if (this.isModalOpen) return;

    // URLから動画IDだけを抜き出す（例: https://youtube.com/watch?v=abcde -> abcde）
    const videoId = video.url.split('v=')[1];

    // 埋め込み用のURLを作成し、魔法のパラメータ「?autoplay=1」をつける！
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&vq=hd1080`;

    // Angularに「このURLは安全だよ」と教えてあげる
    this.selectedVideoUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    // モーダルを表示する
    this.isModalOpen = true;

    // サムネイルをクリックした勢いで、ブラウザ全体をフルスクリーンにする！
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn('フルスクリーンAPIがブロックされました:', err);
      });
    }
  }

  // 動画モーダルを閉じる処理
  closeModal() {
    this.isModalOpen = false;
    this.selectedVideoUrl = null; // URLを消すことで裏での再生をピタッと止める

    // モーダルを閉じたら、フルスクリーンも自動で解除する
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
